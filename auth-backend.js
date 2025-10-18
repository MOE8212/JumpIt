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
    console.log('=== REGISTER PROCESS (BACKEND) ===');

    try {
      const response = await window.apiClient.register(username, password, email);

      this.currentUser = response.user;
      this.isLoggedIn = true;

      // Speichere User-Info für Offline-Fallback
      localStorage.setItem('jumpit_user', JSON.stringify(response.user));

      console.log('Registration successful:', this.currentUser);

      // Track login
      if (window.adminPanel) {
        window.adminPanel.trackUserLogin(username);
      }

      this.closeAuthModal();
      this.startGameAfterAuth();
    } catch (error) {
      throw new Error('Registrierung fehlgeschlagen: ' + error.message);
    }
  }

  async login(username, password) {
    console.log('=== LOGIN PROCESS (BACKEND) ===');

    try {
      const response = await window.apiClient.login(username, password);

      this.currentUser = response.user;
      this.isLoggedIn = true;

      // Speichere User-Info für Offline-Fallback
      localStorage.setItem('jumpit_user', JSON.stringify(response.user));

      console.log('Login successful:', this.currentUser);

      // Track login
      if (window.adminPanel) {
        window.adminPanel.trackUserLogin(username);
      }

      this.closeAuthModal();
      this.startGameAfterAuth();
    } catch (error) {
      throw new Error('Login fehlgeschlagen: ' + error.message);
    }
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
    console.log('=== SUBMIT SCORE (BACKEND) ===');
    console.log('Score:', score, 'Coins:', coins, 'Time:', time);

    if (!this.isLoggedIn) {
      console.log('Cannot submit score - user not logged in');
      return;
    }

    try {
      await window.apiClient.submitScore(score, coins, time);
      console.log('✅ Score submitted successfully!');

      // Track session lokal (für Statistiken)
      if (window.adminPanel) {
        window.adminPanel.trackGameSessionWithScore(
          this.currentUser.username,
          score,
          coins,
          time
        );
      }
    } catch (error) {
      console.error('Failed to submit score:', error);
      alert('⚠️ Score konnte nicht gespeichert werden');
    }
  }

  async getLeaderboard() {
    try {
      const response = await window.apiClient.getLeaderboard(10);
      return response.leaderboard || [];
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      return [];
    }
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

