const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const db = new sqlite3.Database('./game.db');

// Create tables
db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Scores table
    db.run(`CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        score INTEGER NOT NULL,
        coins INTEGER NOT NULL,
        time INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};

// Routes

// Register
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Check if user already exists
        db.get('SELECT id FROM users WHERE username = ?', [username], async (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (row) {
                return res.status(400).json({ error: 'Username already exists' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user
            db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                [username, email, hashedPassword], function (err) {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to create user' });
                    }

                    // Generate JWT token
                    const token = jwt.sign({ userId: this.lastID, username }, JWT_SECRET);

                    res.json({
                        message: 'User created successfully',
                        token,
                        user: { id: this.lastID, username, email }
                    });
                });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Find user
        db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (!user) {
                return res.status(400).json({ error: 'Invalid credentials' });
            }

            // Check password
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(400).json({ error: 'Invalid credentials' });
            }

            // Generate JWT token
            const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET);

            res.json({
                message: 'Login successful',
                token,
                user: { id: user.id, username: user.username, email: user.email }
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Submit score
app.post('/api/scores', authenticateToken, (req, res) => {
    try {
        const { score, coins, time } = req.body;

        if (typeof score !== 'number' || typeof coins !== 'number' || typeof time !== 'number') {
            return res.status(400).json({ error: 'Invalid score data' });
        }

        // Insert score
        db.run('INSERT INTO scores (user_id, score, coins, time) VALUES (?, ?, ?, ?)',
            [req.user.userId, score, coins, time], function (err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to save score' });
                }

                res.json({
                    message: 'Score saved successfully',
                    scoreId: this.lastID
                });
            });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get leaderboard
app.get('/api/leaderboard', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        // Get top scores with user information
        db.all(`
            SELECT u.username, s.score, s.coins, s.time, s.created_at
            FROM scores s
            JOIN users u ON s.user_id = u.id
            ORDER BY s.score DESC
            LIMIT ?
        `, [limit], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            res.json({ leaderboard: rows });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user's best score
app.get('/api/user/best-score', authenticateToken, (req, res) => {
    try {
        db.get(`
            SELECT score, coins, time, created_at
            FROM scores
            WHERE user_id = ?
            ORDER BY score DESC
            LIMIT 1
        `, [req.user.userId], (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            res.json({ bestScore: row || null });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ==================== ADMIN APIs ====================
// Admin password check
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const authenticateAdmin = (req, res, next) => {
    const adminPassword = req.headers['x-admin-password'];

    if (adminPassword !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: 'Unauthorized - Invalid admin password' });
    }

    next();
};

// Get all users (Admin only)
app.get('/api/admin/users', authenticateAdmin, (req, res) => {
    try {
        db.all(`
            SELECT u.id, u.username, u.email, u.password, u.created_at,
                   COUNT(DISTINCT s.id) as game_count,
                   MAX(s.score) as best_score
            FROM users u
            LEFT JOIN scores s ON u.id = s.user_id
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `, [], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            res.json({ users: rows });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user (Admin only)
app.put('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const { username, email, password } = req.body;

        let query = 'UPDATE users SET ';
        let params = [];
        let updates = [];

        if (username) {
            updates.push('username = ?');
            params.push(username);
        }
        if (email !== undefined) {
            updates.push('email = ?');
            params.push(email);
        }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push('password = ?');
            params.push(hashedPassword);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        query += updates.join(', ') + ' WHERE id = ?';
        params.push(userId);

        db.run(query, params, function (err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to update user' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({ message: 'User updated successfully' });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete user (Admin only)
app.delete('/api/admin/users/:id', authenticateAdmin, (req, res) => {
    try {
        const userId = req.params.id;

        // First delete all scores for this user
        db.run('DELETE FROM scores WHERE user_id = ?', [userId], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to delete user scores' });
            }

            // Then delete the user
            db.run('DELETE FROM users WHERE id = ?', [userId], function (err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to delete user' });
                }

                if (this.changes === 0) {
                    return res.status(404).json({ error: 'User not found' });
                }

                res.json({ message: 'User deleted successfully' });
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all game sessions (Admin only)
app.get('/api/admin/sessions', authenticateAdmin, (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;

        db.all(`
            SELECT s.id, s.score, s.coins, s.time, s.created_at,
                   u.username, u.email
            FROM scores s
            JOIN users u ON s.user_id = u.id
            ORDER BY s.created_at DESC
            LIMIT ?
        `, [limit], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            res.json({ sessions: rows });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update game session (Admin only)
app.put('/api/admin/sessions/:id', authenticateAdmin, (req, res) => {
    try {
        const sessionId = req.params.id;
        const { score, coins, time } = req.body;

        let query = 'UPDATE scores SET ';
        let params = [];
        let updates = [];

        if (typeof score === 'number') {
            updates.push('score = ?');
            params.push(score);
        }
        if (typeof coins === 'number') {
            updates.push('coins = ?');
            params.push(coins);
        }
        if (typeof time === 'number') {
            updates.push('time = ?');
            params.push(time);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        query += updates.join(', ') + ' WHERE id = ?';
        params.push(sessionId);

        db.run(query, params, function (err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to update session' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Session not found' });
            }

            res.json({ message: 'Session updated successfully' });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete game session (Admin only)
app.delete('/api/admin/sessions/:id', authenticateAdmin, (req, res) => {
    try {
        const sessionId = req.params.id;

        db.run('DELETE FROM scores WHERE id = ?', [sessionId], function (err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to delete session' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Session not found' });
            }

            res.json({ message: 'Session deleted successfully' });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get admin statistics
app.get('/api/admin/stats', authenticateAdmin, (req, res) => {
    try {
        const stats = {};

        // Get total users
        db.get('SELECT COUNT(*) as total FROM users', [], (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            stats.totalUsers = row.total;

            // Get total games played
            db.get('SELECT COUNT(*) as total FROM scores', [], (err, row) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                stats.totalGames = row.total;

                // Get highest score
                db.get('SELECT MAX(score) as highest FROM scores', [], (err, row) => {
                    if (err) {
                        return res.status(500).json({ error: 'Database error' });
                    }
                    stats.highestScore = row.highest || 0;

                    res.json(stats);
                });
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`JumpIt Backend running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});




