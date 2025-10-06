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
                [username, email, hashedPassword], function(err) {
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
            [req.user.userId, score, coins, time], function(err) {
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




