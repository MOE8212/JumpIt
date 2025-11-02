// Authentication Manager mit Supabase-Integration
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
    console.log('=== INITIALIZING AUTH MANAGER (SUPABASE MODE) ===');

    // Prüfe ob User eingeloggt ist
    if (window.apiClient && window.apiClient.isAuthenticated()) {
      this.currentUser = {
        id: window.apiClient.currentUser.id,
        username: window.apiClient.currentUser.user_metadata?.username ||
          window.apiClient.currentUser.email.split('@')[0],
        email: window.apiClient.currentUser.email
      };
      this.isLoggedIn = true;
      console.log('User restored from session:', this.currentUser.username);
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

    // Auth state change listener
    window.apiClient.supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_IN' && session) {
        this.currentUser = {
          id: session.user.id,
          username: session.user.user_metadata?.username ||
            session.user.email.split('@')[0],
          email: session.user.email
        };
        this.isLoggedIn = true;
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        this.isLoggedIn = false;
      }
    });
  }

  toggleAuthMode() {
    this.isRegisterMode = !this.isRegisterMode;

    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');

    if (this.isRegisterMode) {
      this.authTitle.textContent = 'Registrieren';
      this.authSubmit.textContent = 'Registrieren';
      this.authSwitchText.innerHTML = 'Bereits registriert? <a href="#" id="switch-auth">Anmelden</a>';
      if (usernameInput) usernameInput.placeholder = 'Benutzername';
      // Email ist immer sichtbar für Supabase
    } else {
      this.authTitle.textContent = 'Anmelden';
      this.authSubmit.textContent = 'Anmelden';
      this.authSwitchText.innerHTML = 'Noch kein Konto? <a href="#" id="switch-auth">Registrieren</a>';
      if (usernameInput) usernameInput.placeholder = 'Benutzername';
      // Email ist immer sichtbar für Supabase
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

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const emailInput = document.getElementById('email');
    const email = emailInput ? emailInput.value.trim() : '';

    try {
      if (this.isRegisterMode) {
        // Bei Registrierung brauchen wir Email
        if (!email) {
          alert('⚠️ Bitte E-Mail-Adresse eingeben');
          return;
        }
        if (!username) {
          alert('⚠️ Bitte Benutzernamen eingeben');
          return;
        }
        await this.register(username, email, password);
      } else {
        // Bei Login brauchen wir Email (Supabase-Pflicht!)
        if (!email) {
          alert('⚠️ Bitte E-Mail-Adresse eingeben\n\nTipp: Verwenden Sie die E-Mail, mit der Sie sich registriert haben.');
          return;
        }
        await this.login(username, password, email);
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert('⚠️ ' + error.message);
    }
  }

  async register(username, email, password) {
    console.log('=== REGISTER PROCESS (SUPABASE) ===');

    try {
      const response = await window.apiClient.register(username, email, password);

      this.currentUser = response.user;
      this.isLoggedIn = true;

      console.log('✅ Registration successful:', this.currentUser);

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

  async login(username, password, email) {
    console.log('=== LOGIN PROCESS (SUPABASE) ===');
    console.log('🔍 Login attempt with email:', email);

    try {
      // Supabase benötigt IMMER die echte Email für Login
      if (!email || !email.includes('@')) {
        throw new Error('Bitte geben Sie Ihre E-Mail-Adresse ein.\n\nTipp: Verwenden Sie die E-Mail, mit der Sie sich registriert haben (z.B. michael-eckert@gmx.at).');
      }

      const response = await window.apiClient.login(email, password);

      this.currentUser = response.user;
      this.isLoggedIn = true;

      console.log('✅ Login successful:', this.currentUser);

      // Track login
      if (window.adminPanel) {
        window.adminPanel.trackUserLogin(this.currentUser.username);
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

  async logout() {
    console.log('=== USER LOGOUT (SUPABASE) ===');

    await window.apiClient.logout();

    this.currentUser = null;
    this.isLoggedIn = false;

    alert('✅ Du wurdest erfolgreich abgemeldet!');

    // Reload page
    window.location.reload();
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
    console.log('=== SUBMIT SCORE (SUPABASE) ===');
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
      console.error('❌ Failed to submit score:', error);
      console.error('Error details:', error.message, error.code, error.details);
      alert('⚠️ Score konnte nicht gespeichert werden: ' + (error.message || 'Unbekannter Fehler'));
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
}

// Create global auth manager instance
window.authManager = new AuthManager();

// Leaderboard anzeigen (Supabase-Version)
async function showLeaderboard() {
  console.log('=== SHOWING LEADERBOARD (SUPABASE) ===');
  const modal = document.getElementById('leaderboard-modal');
  const list = document.getElementById('leaderboard-list');

  if (!modal || !list) {
    console.error('Leaderboard elements not found');
    return;
  }

  try {
    // Lade Leaderboard von Supabase
    const leaderboard = await window.authManager.getLeaderboard();

    list.innerHTML = '';

    if (leaderboard.length === 0) {
      list.innerHTML = '<p>Noch keine Einträge vorhanden.</p>';
    } else {
      const table = document.createElement('table');
      table.className = 'leaderboard-table';

      // Header
      const header = document.createElement('tr');
      header.innerHTML = '<th>Rang</th><th>Spieler</th><th>Punkte</th>';
      table.appendChild(header);

      // Entries
      leaderboard.forEach((entry, index) => {
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

    modal.classList.remove('hidden');
  } catch (error) {
    console.error('Failed to load leaderboard:', error);
    list.innerHTML = '<p style="color: red;">⚠️ Fehler beim Laden der Rangliste</p>';
    modal.classList.remove('hidden');
  }
}

