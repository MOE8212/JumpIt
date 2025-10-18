// Authentication Manager
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.authModal = document.getElementById('auth-modal');
        this.authForm = document.getElementById('auth-form');
        this.authTitle = document.getElementById('auth-title');
        this.authSubmit = document.getElementById('auth-submit');
        this.switchAuthLink = document.getElementById('switch-auth');
        this.authSwitchText = document.getElementById('auth-switch');
        this.isRegisterMode = false;

        this.init();
    }

    init() {
        console.log('=== INITIALIZING AUTH MANAGER ===');

        console.log('DOM Elements found:');
        console.log('- authModal:', this.authModal);
        console.log('- authForm:', this.authForm);
        console.log('- authTitle:', this.authTitle);
        console.log('- authSubmit:', this.authSubmit);
        console.log('- switchAuthLink:', this.switchAuthLink);
        console.log('- authSwitchText:', this.authSwitchText);

        // Check if user is already logged in (from localStorage)
        const savedUser = localStorage.getItem('jumpit_user');
        console.log('Saved user from localStorage:', savedUser);

        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.isLoggedIn = true;
            console.log('User already logged in:', this.currentUser.username);
        } else {
            console.log('No saved user found');
        }

        // Set up event listeners
        if (this.authForm) {
            console.log('Adding submit event listener to auth form');
            this.authForm.addEventListener('submit', (e) => this.handleAuth(e));
        } else {
            console.error('Auth form not found!');
        }

        if (this.switchAuthLink) {
            console.log('Adding click event listener to switch auth link');
            this.switchAuthLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleAuthMode();
            });
        } else {
            console.error('Switch auth link not found!');
        }

        console.log('AuthManager initialized successfully');
    }

    toggleAuthMode() {
        this.isRegisterMode = !this.isRegisterMode;

        if (this.isRegisterMode) {
            this.authTitle.textContent = 'Registrieren';
            this.authSubmit.textContent = 'Registrieren';
            this.authSwitchText.innerHTML = 'Schon ein Konto? <a href="#" id="switch-auth">Anmelden</a>';
            document.getElementById('email').style.display = 'block';
        } else {
            this.authTitle.textContent = 'Anmelden';
            this.authSubmit.textContent = 'Anmelden';
            this.authSwitchText.innerHTML = 'Noch kein Konto? <a href="#" id="switch-auth">Registrieren</a>';
            document.getElementById('email').style.display = 'none';
        }

        // Re-attach event listener to new link
        const newSwitchLink = document.getElementById('switch-auth');
        if (newSwitchLink) {
            newSwitchLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleAuthMode();
            });
        }
    }

    async handleAuth(e) {
        e.preventDefault();

        console.log('=== AUTH FORM SUBMITTED ===');
        console.log('Is register mode:', this.isRegisterMode);

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const email = document.getElementById('email').value;

        console.log('Username:', username);
        console.log('Password length:', password.length);
        console.log('Email:', email);

        if (this.isRegisterMode) {
            console.log('Calling register...');
            await this.register(username, password, email);
        } else {
            console.log('Calling login...');
            await this.login(username, password);
        }
    }

    async register(username, password, email) {
        console.log('=== REGISTER PROCESS ===');
        console.log('Username:', username);
        console.log('Email:', email);

        // Simple local registration (can be replaced with backend API)
        const user = {
            username: username,
            email: email,
            createdAt: new Date().toISOString()
        };

        console.log('Created user object:', user);

        // Save to localStorage
        localStorage.setItem('jumpit_user', JSON.stringify(user));
        localStorage.setItem('jumpit_password', password); // In production, use proper encryption!

        console.log('User saved to localStorage');
        console.log('LocalStorage jumpit_user:', localStorage.getItem('jumpit_user'));

        this.currentUser = user;
        this.isLoggedIn = true;

        console.log('Current user set:', this.currentUser);
        console.log('isLoggedIn set to:', this.isLoggedIn);

        // Track user login
        if (window.adminPanel) {
            window.adminPanel.trackUserLogin(username);
        }

        // Close modal and start game
        console.log('Closing modal and starting game...');
        this.closeAuthModal();
        this.startGameAfterAuth();
    }

    async login(username, password) {
        console.log('=== LOGIN PROCESS ===');
        console.log('Attempting to login with username:', username);

        // Simple local login (can be replaced with backend API)
        const savedUser = localStorage.getItem('jumpit_user');
        const savedPassword = localStorage.getItem('jumpit_password');

        console.log('Saved user from localStorage:', savedUser);
        console.log('Password match:', savedPassword === password);

        if (savedUser && savedPassword === password) {
            console.log('Login successful!');
            this.currentUser = JSON.parse(savedUser);
            this.isLoggedIn = true;

            console.log('Current user set:', this.currentUser);
            console.log('isLoggedIn set to:', this.isLoggedIn);

            // Track user login
            if (window.adminPanel) {
                window.adminPanel.trackUserLogin(username);
            }

            // Close modal and start game
            console.log('Closing modal and starting game...');
            this.closeAuthModal();
            this.startGameAfterAuth();
        } else {
            console.error('Login failed! Password mismatch or no saved user.');
            alert('Falscher Benutzername oder Passwort!');
        }
    }

    closeAuthModal() {
        if (this.authModal) {
            this.authModal.classList.add('hidden');
            console.log('Auth modal closed');
        }
    }

    openAuthModal() {
        console.log('=== OPENING AUTH MODAL ===');
        console.log('Auth modal element:', this.authModal);

        if (this.authModal) {
            console.log('Modal classes BEFORE:', this.authModal.classList.toString());
            console.log('Modal display style BEFORE:', window.getComputedStyle(this.authModal).display);
            console.log('Modal z-index BEFORE:', window.getComputedStyle(this.authModal).zIndex);

            this.authModal.classList.remove('hidden');

            console.log('Modal classes AFTER:', this.authModal.classList.toString());
            console.log('Modal display style AFTER:', window.getComputedStyle(this.authModal).display);
            console.log('Modal z-index AFTER:', window.getComputedStyle(this.authModal).zIndex);

            // Check if modal is visible in the viewport
            const rect = this.authModal.getBoundingClientRect();
            console.log('Modal position:', {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                visible: rect.width > 0 && rect.height > 0
            });

            console.log('Auth modal opened successfully');
        } else {
            console.error('Auth modal element not found!');
        }
    }

    checkAuthStatus() {
        console.log('Checking auth status...');
        console.log('isLoggedIn:', this.isLoggedIn);

        if (this.isLoggedIn) {
            console.log('User is logged in, starting game...');
            this.startGameAfterAuth();
        } else {
            console.log('User not logged in, showing auth modal...');
            this.openAuthModal();
        }
    }

    logout() {
        console.log('=== USER LOGOUT ===');
        console.log('Logging out user:', this.currentUser?.username);

        // Clear user data
        this.currentUser = null;
        this.isLoggedIn = false;
        localStorage.removeItem('jumpit_user');

        console.log('User logged out successfully');
        console.log('localStorage cleared');

        // Show confirmation
        alert('✅ Du wurdest erfolgreich abgemeldet!');
    }

    startGameAfterAuth() {
        console.log('=== STARTING GAME AFTER AUTH ===');
        console.log('Looking for startGame function...');
        console.log('typeof startGame:', typeof startGame);
        console.log('window.startGame:', typeof window.startGame);

        // Call the global startGame function
        if (typeof startGame === 'function') {
            console.log('startGame function found, calling it...');
            startGame();
            console.log('startGame function called');
        } else {
            console.error('startGame function not found!');
            console.log('Available functions:', Object.keys(window).filter(key => typeof window[key] === 'function'));
        }
    }

    logout() {
        this.currentUser = null;
        this.isLoggedIn = false;
        localStorage.removeItem('jumpit_user');
        console.log('User logged out');
    }

    submitScore(score, coins, time) {
        console.log('=== SUBMIT SCORE ===');
        console.log('User logged in:', this.isLoggedIn);
        console.log('Current user:', this.currentUser);

        if (!this.isLoggedIn) {
            console.log('Cannot submit score - user not logged in');
            return;
        }

        console.log('Submitting score to leaderboard:');
        console.log('- Username:', this.currentUser.username);
        console.log('- Score:', score);
        console.log('- Coins:', coins);
        console.log('- Time:', time);

        // Get existing leaderboard from localStorage
        let leaderboard = JSON.parse(localStorage.getItem('jumpit_leaderboard') || '[]');
        console.log('Current leaderboard before adding:', leaderboard);

        // Add new score
        const newEntry = {
            username: this.currentUser.username,
            score: score,
            coins: coins,
            time: time,
            timestamp: new Date().toISOString()
        };

        console.log('Adding new entry:', newEntry);
        leaderboard.push(newEntry);

        // Sort by score (highest first)
        leaderboard.sort((a, b) => b.score - a.score);
        console.log('Leaderboard after sorting:', leaderboard);

        // Keep only top 10
        leaderboard = leaderboard.slice(0, 10);
        console.log('Leaderboard after keeping top 10:', leaderboard);

        // Save back to localStorage
        localStorage.setItem('jumpit_leaderboard', JSON.stringify(leaderboard));
        console.log('Score submitted successfully!');
        console.log('Final leaderboard saved to localStorage');
    }

    getLeaderboard() {
        const leaderboard = JSON.parse(localStorage.getItem('jumpit_leaderboard') || '[]');
        console.log('Getting leaderboard from localStorage:', leaderboard);
        return leaderboard;
    }

    // Debug function to clear leaderboard
    clearLeaderboard() {
        localStorage.removeItem('jumpit_leaderboard');
        console.log('Leaderboard cleared!');
    }
}

// Create global auth manager instance
window.authManager = new AuthManager();

// Admin Panel System
class AdminPanel {
    constructor() {
        this.isAdmin = false;
        this.adminPassword = 'admin123'; // In production, use proper authentication
        this.init();
    }

    init() {
        console.log('Admin panel initialized');

        // Check if user is admin (for demo purposes, everyone can access)
        this.isAdmin = true;

        // Set up event listeners
        this.setupEventListeners();

        // Track page views
        this.trackPageView();
    }

    setupEventListeners() {
        // Secret Admin button event listener (top left corner)
        const secretAdminBtn = document.getElementById('secret-admin-btn');
        if (secretAdminBtn) {
            secretAdminBtn.addEventListener('click', () => {
                console.log('Secret admin button clicked');
                this.showAdminPasswordModal();
            });
        }

        // Admin password form
        const adminPasswordForm = document.getElementById('admin-password-form');
        if (adminPasswordForm) {
            adminPasswordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const password = document.getElementById('admin-password').value;
                if (password === this.adminPassword) {
                    this.hideAdminPasswordModal();
                    this.showAdminPanel();
                } else {
                    alert('❌ Falsches Passwort!');
                    document.getElementById('admin-password').value = '';
                }
            });
        }

        // Cancel admin login
        const cancelAdminBtn = document.getElementById('cancel-admin');
        if (cancelAdminBtn) {
            cancelAdminBtn.addEventListener('click', () => {
                this.hideAdminPasswordModal();
                document.getElementById('admin-password').value = '';
            });
        }

        // Info button event listener
        const infoBtn = document.getElementById('home-info-btn');
        if (infoBtn) {
            infoBtn.addEventListener('click', () => {
                console.log('Info button clicked');
                this.showInfoModal();
            });
        }

        // Close info modal
        const closeInfoBtn = document.getElementById('close-info');
        if (closeInfoBtn) {
            closeInfoBtn.addEventListener('click', () => {
                this.hideInfoModal();
            });
        }

        // Close admin panel
        const closeAdminBtn = document.getElementById('close-admin');
        if (closeAdminBtn) {
            closeAdminBtn.addEventListener('click', () => {
                this.hideAdminPanel();
            });
        }
    }

    showAdminPasswordModal() {
        const modal = document.getElementById('admin-password-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hideAdminPasswordModal() {
        const modal = document.getElementById('admin-password-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    showInfoModal() {
        console.log('=== SHOWING INFO MODAL ===');
        const modal = document.getElementById('info-modal');
        const homeScreen = document.getElementById('home-screen');

        if (modal) {
            console.log('Info modal found, removing hidden class');
            modal.classList.remove('hidden');

            // Also hide home screen so info is visible
            if (homeScreen) {
                homeScreen.style.display = 'none';
            }
        } else {
            console.error('Info modal not found!');
        }
    }

    hideInfoModal() {
        console.log('=== HIDING INFO MODAL ===');
        const modal = document.getElementById('info-modal');
        const homeScreen = document.getElementById('home-screen');

        if (modal) {
            console.log('Hiding info modal');
            modal.classList.add('hidden');

            // Show home screen again
            if (homeScreen) {
                homeScreen.style.display = 'flex';
            }
        }
    }

    trackPageView() {
        const pageViews = this.getPageViews();
        pageViews.count++;
        pageViews.lastVisit = new Date().toISOString();
        localStorage.setItem('jumpit_page_views', JSON.stringify(pageViews));
        console.log('Page view tracked:', pageViews.count);
    }

    getPageViews() {
        const saved = localStorage.getItem('jumpit_page_views');
        return saved ? JSON.parse(saved) : { count: 0, lastVisit: null };
    }

    trackUserLogin(username) {
        const userStats = this.getUserStats();
        if (!userStats[username]) {
            userStats[username] = {
                loginCount: 0,
                gameCount: 0,
                firstLogin: new Date().toISOString(),
                lastLogin: null
            };
        }

        userStats[username].loginCount++;
        userStats[username].lastLogin = new Date().toISOString();
        localStorage.setItem('jumpit_user_stats', JSON.stringify(userStats));
        console.log('User login tracked for:', username);
    }

    trackGameSession(username) {
        const userStats = this.getUserStats();
        if (!userStats[username]) {
            userStats[username] = {
                loginCount: 0,
                gameCount: 0,
                firstLogin: new Date().toISOString(),
                lastLogin: null
            };
        }

        userStats[username].gameCount++;
        localStorage.setItem('jumpit_user_stats', JSON.stringify(userStats));

        // Track game session
        const gameSessions = this.getGameSessions();
        gameSessions.push({
            username: username,
            timestamp: new Date().toISOString(),
            sessionId: Date.now()
        });

        // Keep only last 50 sessions
        if (gameSessions.length > 50) {
            gameSessions.splice(0, gameSessions.length - 50);
        }

        localStorage.setItem('jumpit_game_sessions', JSON.stringify(gameSessions));
        console.log('Game session tracked for:', username);
    }

    getUserStats() {
        const saved = localStorage.getItem('jumpit_user_stats');
        return saved ? JSON.parse(saved) : {};
    }

    getGameSessions() {
        const saved = localStorage.getItem('jumpit_game_sessions');
        return saved ? JSON.parse(saved) : [];
    }

    showAdminPanel() {
        if (!this.isAdmin) {
            alert('Zugriff verweigert!');
            return;
        }

        const modal = document.getElementById('admin-modal');
        if (modal) {
            this.updateAdminStats();
            modal.classList.remove('hidden');
            console.log('Admin panel shown');
        }
    }

    hideAdminPanel() {
        const modal = document.getElementById('admin-modal');
        if (modal) {
            modal.classList.add('hidden');
            console.log('Admin panel hidden');
        }
    }

    updateAdminStats() {
        // Update general stats
        const pageViews = this.getPageViews();
        const userStats = this.getUserStats();
        const gameSessions = this.getGameSessions();

        document.getElementById('total-page-views').textContent = pageViews.count;
        document.getElementById('total-users').textContent = Object.keys(userStats).length;
        document.getElementById('total-games-played').textContent = gameSessions.length;

        // Update users list
        this.updateUsersList(userStats);

        // Update game sessions list
        this.updateGameSessionsList(gameSessions);
    }

    updateUsersList(userStats) {
        const usersList = document.getElementById('users-list');
        if (!usersList) return;

        usersList.innerHTML = '';

        const sortedUsers = Object.entries(userStats)
            .sort(([, a], [, b]) => b.loginCount - a.loginCount);

        sortedUsers.forEach(([username, stats]) => {
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            userItem.innerHTML = `
                <div class="user-name">${username}</div>
                <div class="user-stats">
                    ${stats.loginCount}x eingeloggt | ${stats.gameCount} Spiele
                </div>
            `;
            usersList.appendChild(userItem);
        });

        if (sortedUsers.length === 0) {
            usersList.innerHTML = '<p style="color: #ccc; text-align: center;">Keine Benutzer gefunden</p>';
        }
    }

    updateGameSessionsList(gameSessions) {
        const sessionsList = document.getElementById('game-sessions-list');
        if (!sessionsList) return;

        sessionsList.innerHTML = '';

        // Show last 20 sessions
        const recentSessions = gameSessions.slice(-20).reverse();

        recentSessions.forEach(session => {
            const sessionItem = document.createElement('div');
            sessionItem.className = 'session-item';

            const date = new Date(session.timestamp);
            const timeString = date.toLocaleString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            sessionItem.innerHTML = `
                <div class="session-info">${session.username}</div>
                <div class="session-stats">${timeString}</div>
            `;
            sessionsList.appendChild(sessionItem);
        });

        if (recentSessions.length === 0) {
            sessionsList.innerHTML = '<p style="color: #ccc; text-align: center;">Keine Spiel-Sessions gefunden</p>';
        }
    }
}

// Leaderboard display
function showLeaderboard() {
    console.log('=== SHOWING LEADERBOARD ===');
    const modal = document.getElementById('leaderboard-modal');
    const list = document.getElementById('leaderboard-list');

    console.log('Modal element:', modal);
    console.log('List element:', list);

    if (!modal || !list) {
        console.error('Leaderboard elements not found');
        return;
    }

    // Get leaderboard data
    const leaderboard = window.authManager.getLeaderboard();
    console.log('Leaderboard data:', leaderboard);

    // Filter to show only best score per user
    const bestScores = {};
    leaderboard.forEach(entry => {
        const username = entry.username;
        if (!bestScores[username] || entry.score > bestScores[username].score) {
            bestScores[username] = entry;
        }
    });

    // Convert back to array and sort by score
    const uniqueLeaderboard = Object.values(bestScores).sort((a, b) => b.score - a.score);
    console.log('Filtered leaderboard (best scores only):', uniqueLeaderboard);

    // Clear existing content
    list.innerHTML = '';

    if (uniqueLeaderboard.length === 0) {
        console.log('No leaderboard entries found');
        list.innerHTML = '<p>Noch keine Einträge vorhanden.</p>';
    } else {
        console.log('Creating leaderboard table with', uniqueLeaderboard.length, 'unique entries');

        // Create leaderboard table
        const table = document.createElement('table');
        table.className = 'leaderboard-table';

        // Header
        const header = document.createElement('tr');
        header.innerHTML = '<th>Rang</th><th>Spieler</th><th>Punkte</th>';
        table.appendChild(header);

        // Entries
        uniqueLeaderboard.forEach((entry, index) => {
            console.log('Adding leaderboard entry:', entry);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${entry.username}</td>
                <td>${entry.score}</td>
            `;
            table.appendChild(row);
        });

        list.appendChild(table);
    }

    // Show modal
    console.log('Showing leaderboard modal');
    console.log('Modal classes BEFORE:', modal.classList.toString());
    console.log('Modal display BEFORE:', window.getComputedStyle(modal).display);
    console.log('Modal z-index BEFORE:', window.getComputedStyle(modal).zIndex);

    modal.classList.remove('hidden');

    console.log('Modal classes AFTER:', modal.classList.toString());
    console.log('Modal display AFTER:', window.getComputedStyle(modal).display);
    console.log('Modal z-index AFTER:', window.getComputedStyle(modal).zIndex);

    // Check if modal is visible in the viewport
    const rect = modal.getBoundingClientRect();
    console.log('Modal position:', {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        visible: rect.width > 0 && rect.height > 0
    });
}

// Initialize everything after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global admin panel instance (after DOM is ready)
    window.adminPanel = new AdminPanel();
    console.log('✅ AdminPanel initialized after DOM loaded');

    // Close leaderboard
    const closeLeaderboardBtn = document.getElementById('close-leaderboard');
    if (closeLeaderboardBtn) {
        closeLeaderboardBtn.addEventListener('click', () => {
            const modal = document.getElementById('leaderboard-modal');
            if (modal) {
                modal.classList.add('hidden');
            }
        });
    }

    const leaderboardBtn = document.getElementById('leaderboard-btn');
    if (leaderboardBtn) {
        leaderboardBtn.addEventListener('click', showLeaderboard);
    }
});

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
