// Authentication Manager mit Backend-Integration
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

  async init() {
    console.log('=== INITIALIZING AUTH MANAGER (BACKEND MODE) ===');

    // Prüfe ob Token vorhanden ist
    if (window.apiClient && window.apiClient.isAuthenticated()) {
      console.log('Token found, verifying...');
      // TODO: Token verification endpoint am Backend
      // Für jetzt: Lade User-Daten aus token oder speichere minimal
      const savedUser = localStorage.getItem('jumpit_user');
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
        this.isLoggedIn = true;
        console.log('User restored from localStorage:', this.currentUser.username);
      }
    }

    // Set up event listeners
    if (this.authForm) {
      this.authForm.addEventListener('submit', (e) => this.handleAuth(e));
    }

    if (this.switchAuthLink) {
      this.switchAuthLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleAuthMode();
      });
    }
  }

  toggleAuthMode() {
    this.isRegisterMode = !this.isRegisterMode;

    const emailInput = document.getElementById('email');

    if (this.isRegisterMode) {
      this.authTitle.textContent = 'Registrieren';
      this.authSubmit.textContent = 'Registrieren';
      this.authSwitchText.innerHTML = 'Bereits registriert? <a href="#" id="switch-auth">Anmelden</a>';
      if (emailInput) emailInput.style.display = 'block';
    } else {
      this.authTitle.textContent = 'Anmelden';
      this.authSubmit.textContent = 'Anmelden';
      this.authSwitchText.innerHTML = 'Noch kein Konto? <a href="#" id="switch-auth">Registrieren</a>';
      if (emailInput) emailInput.style.display = 'none';
    }

    // Re-attach event listener
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

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const email = document.getElementById('email')?.value || '';

    try {
      if (this.isRegisterMode) {
        await this.register(username, password, email);
      } else {
        await this.login(username, password);
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert('⚠️ ' + error.message);
    }
  }

  async register(username, password, email) {
    console.log('=== REGISTER PROCESS ===');

    try {
      // Versuche Backend-Registrierung
      const response = await window.apiClient.register(username, password, email);

      this.currentUser = response.user;
      this.isLoggedIn = true;

      // Speichere User-Info für Offline-Fallback
      localStorage.setItem('jumpit_user', JSON.stringify(response.user));

      console.log('✅ Registration successful (Backend):', this.currentUser);

      // Track login
      if (window.adminPanel) {
        window.adminPanel.trackUserLogin(username);
      }

      this.closeAuthModal();
      this.startGameAfterAuth();
    } catch (error) {
      // Fallback: Offline-Registrierung mit localStorage
      console.warn('⚠️ Backend unavailable, using localStorage fallback');
      return this.registerOffline(username, password, email);
    }
  }

  registerOffline(username, password, email) {
    console.log('=== OFFLINE REGISTER ===');

    // Prüfe ob User bereits existiert
    const allUsers = this.getAllUsersOffline();
    if (allUsers[username]) {
      throw new Error('Benutzername bereits vergeben');
    }

    // Erstelle neuen User
    const newUser = {
      id: Date.now(),
      username: username,
      email: email || '',
      created_at: new Date().toISOString()
    };

    // Speichere User
    allUsers[username] = {
      password: password, // In Production sollte das gehasht sein!
      email: email || '',
      created_at: newUser.created_at
    };
    localStorage.setItem('jumpit_users_offline', JSON.stringify(allUsers));

    this.currentUser = newUser;
    this.isLoggedIn = true;
    localStorage.setItem('jumpit_user', JSON.stringify(newUser));

    console.log('✅ Offline registration successful:', username);

    // Track login
    if (window.adminPanel) {
      window.adminPanel.trackUserLogin(username);
    }

    this.closeAuthModal();
    this.startGameAfterAuth();
  }

  getAllUsersOffline() {
    const saved = localStorage.getItem('jumpit_users_offline');
    return saved ? JSON.parse(saved) : {};
  }

  async login(username, password) {
    console.log('=== LOGIN PROCESS ===');

    try {
      // Versuche Backend-Login
      const response = await window.apiClient.login(username, password);

      this.currentUser = response.user;
      this.isLoggedIn = true;

      // Speichere User-Info für Offline-Fallback
      localStorage.setItem('jumpit_user', JSON.stringify(response.user));

      console.log('✅ Login successful (Backend):', this.currentUser);

      // Track login
      if (window.adminPanel) {
        window.adminPanel.trackUserLogin(username);
      }

      this.closeAuthModal();
      this.startGameAfterAuth();
    } catch (error) {
      // Fallback: Offline-Login mit localStorage
      console.warn('⚠️ Backend unavailable, using localStorage fallback');
      return this.loginOffline(username, password);
    }
  }

  loginOffline(username, password) {
    console.log('=== OFFLINE LOGIN ===');

    const allUsers = this.getAllUsersOffline();
    const user = allUsers[username];

    if (!user) {
      throw new Error('Benutzername nicht gefunden');
    }

    if (user.password !== password) {
      throw new Error('Falsches Passwort');
    }

    // Login erfolgreich
    const loggedInUser = {
      id: Date.now(),
      username: username,
      email: user.email || '',
      created_at: user.created_at || new Date().toISOString()
    };

    this.currentUser = loggedInUser;
    this.isLoggedIn = true;
    localStorage.setItem('jumpit_user', JSON.stringify(loggedInUser));

    console.log('✅ Offline login successful:', username);

    // Track login
    if (window.adminPanel) {
      window.adminPanel.trackUserLogin(username);
    }

    this.closeAuthModal();
    this.startGameAfterAuth();
  }

  closeAuthModal() {
    if (this.authModal) {
      this.authModal.classList.add('hidden');
    }
  }

  openAuthModal() {
    if (this.authModal) {
      this.authModal.classList.remove('hidden');
    }
  }

  checkAuthStatus() {
    console.log('Checking auth status...');

    if (this.isLoggedIn) {
      console.log('User is logged in, starting game...');
      this.startGameAfterAuth();
    } else {
      console.log('User not logged in, showing auth modal...');
      this.openAuthModal();
    }
  }

  logout() {
    console.log('=== USER LOGOUT (BACKEND) ===');

    this.currentUser = null;
    this.isLoggedIn = false;

    // Backend logout
    if (window.apiClient) {
      window.apiClient.logout();
    }

    localStorage.removeItem('jumpit_user');

    alert('✅ Du wurdest erfolgreich abgemeldet!');
  }

  startGameAfterAuth() {
    console.log('=== STARTING GAME AFTER AUTH ===');

    if (typeof startGame === 'function') {
      startGame();
    } else {
      console.error('startGame function not found!');
    }
  }

  async submitScore(score, coins, time) {
    console.log('=== SUBMIT SCORE ===');
    console.log('Score:', score, 'Coins:', coins, 'Time:', time);

    if (!this.isLoggedIn) {
      console.log('Cannot submit score - user not logged in');
      return;
    }

    try {
      // Versuche Backend-Submit
      await window.apiClient.submitScore(score, coins, time);
      console.log('✅ Score submitted to backend!');
    } catch (error) {
      // Fallback: Offline-Speicherung
      console.warn('⚠️ Backend unavailable, saving score locally');
      this.submitScoreOffline(score, coins, time);
    }

    // Track session lokal (immer, für Statistiken)
    if (window.adminPanel) {
      window.adminPanel.trackGameSessionWithScore(
        this.currentUser.username,
        score,
        coins,
        time
      );
    }
  }

  submitScoreOffline(score, coins, time) {
    console.log('=== OFFLINE SCORE SUBMIT ===');

    const scores = this.getScoresOffline();
    scores.push({
      username: this.currentUser.username,
      score: score,
      coins: coins,
      time: time,
      created_at: new Date().toISOString()
    });

    localStorage.setItem('jumpit_scores_offline', JSON.stringify(scores));
    console.log('✅ Score saved locally');
  }

  getScoresOffline() {
    const saved = localStorage.getItem('jumpit_scores_offline');
    return saved ? JSON.parse(saved) : [];
  }

  async getLeaderboard() {
    try {
      const response = await window.apiClient.getLeaderboard(10);
      return response.leaderboard || [];
    } catch (error) {
      console.warn('⚠️ Backend unavailable, loading local leaderboard');
      return this.getLeaderboardOffline();
    }
  }

  getLeaderboardOffline() {
    const scores = this.getScoresOffline();

    // Gruppiere nach Username und nimm besten Score
    const bestScores = {};
    scores.forEach(entry => {
      if (!bestScores[entry.username] || entry.score > bestScores[entry.username].score) {
        bestScores[entry.username] = entry;
      }
    });

    // Konvertiere zu Array und sortiere
    const leaderboard = Object.values(bestScores)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    console.log('📊 Offline leaderboard:', leaderboard.length, 'entries');
    return leaderboard;
  }

  // Legacy-Kompatibilität für localStorage-basierte Funktionen
  getAllUsers() {
    // Wird nicht mehr genutzt - Daten kommen vom Backend
    return {};
  }

  saveUserToAllUsers() {
    // Wird nicht mehr genutzt - Daten im Backend
  }
}

// Create global auth manager instance
window.authManager = new AuthManager();

