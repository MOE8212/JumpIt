// Admin Panel mit Supabase-Integration & Edit-Funktionalität
class AdminPanel {
  constructor() {
    this.isAdmin = false;
    this.adminPassword = 'admin123';
    this.init();
  }

  init() {
    console.log('Admin panel initialized (SUPABASE MODE)');
    this.isAdmin = true; // Für Demo - in Production richtig prüfen
    this.setupEventListeners();
    this.trackPageView();
  }

  setupEventListeners() {
    // Close admin panel
    const closeAdminBtn = document.getElementById('close-admin');
    if (closeAdminBtn) {
      closeAdminBtn.addEventListener('click', () => {
        this.hideAdminPanel();
      });
    }
  }

  trackPageView() {
    // Lokale Page View Statistik
    const pageViews = this.getPageViews();
    pageViews.count++;
    pageViews.lastVisit = new Date().toISOString();
    localStorage.setItem('jumpit_page_views', JSON.stringify(pageViews));
  }

  getPageViews() {
    const saved = localStorage.getItem('jumpit_page_views');
    return saved ? JSON.parse(saved) : { count: 0, lastVisit: null };
  }

  trackUserLogin(username) {
    // Lokal tracken für Offline-Statistiken
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
  }

  trackGameSession(username) {
    // Legacy - wird nicht mehr genutzt
    console.log('trackGameSession called (legacy)');
  }

  trackGameSessionWithScore(username, score, coins, time) {
    // Supabase handled das bereits
    console.log('trackGameSessionWithScore called (handled by Supabase)');
  }

  getUserStats() {
    const saved = localStorage.getItem('jumpit_user_stats');
    return saved ? JSON.parse(saved) : {};
  }

  async showAdminPanel() {
    if (!this.isAdmin) {
      alert('Zugriff verweigert!');
      return;
    }

    const modal = document.getElementById('admin-modal');
    if (modal) {
      await this.updateAdminStats();
      modal.classList.remove('hidden');
      console.log('Admin panel shown');
    }
  }

  hideAdminPanel() {
    const modal = document.getElementById('admin-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  async updateAdminStats() {
    try {
      // Lade Daten von Supabase
      const [usersData, sessionsData, stats] = await Promise.all([
        window.apiClient.getAdminUsers(),
        window.apiClient.getAdminSessions(50),
        window.apiClient.getAdminStats()
      ]);

      // Update Statistiken
      document.getElementById('total-page-views').textContent = this.getPageViews().count;
      document.getElementById('total-users').textContent = stats.total_users || 0;
      document.getElementById('total-games-played').textContent = stats.total_games || 0;

      // Update Listen
      this.updateUsersList(usersData.users);
      this.updateGameSessionsList(sessionsData.sessions);
    } catch (error) {
      console.error('Failed to load admin data:', error);
      alert('⚠️ Konnte Admin-Daten nicht laden: ' + error.message);
    }
  }

  updateUsersList(users) {
    const usersList = document.getElementById('users-list');
    if (!usersList) return;

    usersList.innerHTML = '';

    if (!users || users.length === 0) {
      usersList.innerHTML = '<p style="color: #ccc; text-align: center;">Keine Benutzer gefunden</p>';
      return;
    }

    users.forEach(user => {
      const userItem = document.createElement('div');
      userItem.className = 'user-item';
      userItem.style.position = 'relative';
      userItem.style.padding = '15px';

      userItem.innerHTML = `
                <div class="user-name" style="font-weight: bold; margin-bottom: 8px; font-size: 1.1em;">
                    ${user.username}
                </div>
                <div class="user-stats" style="font-size: 0.9em; line-height: 1.6;">
                    📧 ${user.email || 'Keine E-Mail'}<br>
                    🔑 Passwort: <span style="color: #ff6b6b;">(In Supabase Auth gespeichert)</span><br>
                    📊 ${user.game_count} Spiele | Best Score: ${user.best_score || 0}<br>
                    📅 Erstellt: ${new Date(user.created_at).toLocaleDateString('de-DE')}
                </div>
                <div class="user-actions" style="margin-top: 10px;">
                    <button onclick="window.adminPanel.editUser('${user.id}', '${user.username}', '${user.email || ''}')" 
                            style="padding: 5px 15px; margin-right: 5px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        ✏️ Bearbeiten
                    </button>
                    <button onclick="window.adminPanel.deleteUser('${user.id}', '${user.username}')"
                            style="padding: 5px 15px; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        🗑️ Löschen
                    </button>
                </div>
            `;
      usersList.appendChild(userItem);
    });
  }

  updateGameSessionsList(sessions) {
    const sessionsList = document.getElementById('game-sessions-list');
    if (!sessionsList) return;

    sessionsList.innerHTML = '';

    if (!sessions || sessions.length === 0) {
      sessionsList.innerHTML = '<p style="color: #ccc; text-align: center;">Keine Spiel-Sessions gefunden</p>';
      return;
    }

    sessions.forEach(session => {
      const sessionItem = document.createElement('div');
      sessionItem.className = 'session-item';
      sessionItem.style.position = 'relative';
      sessionItem.style.padding = '15px';

      const date = new Date(session.created_at);
      const timeString = date.toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const gameTimeFormatted = session.time ? this.formatTime(session.time) : '--:--';

      sessionItem.innerHTML = `
                <div class="session-info" style="font-weight: bold; margin-bottom: 5px;">
                    ${session.username}
                </div>
                <div class="session-stats" style="font-size: 0.85em; line-height: 1.6;">
                    📅 ${timeString}<br>
                    🏆 Punkte: <span style="color: #FFD700; font-weight: bold;">${session.score || 0}</span> | 
                    🪙 Münzen: ${session.coins || 0} | 
                    ⏱️ Zeit: ${gameTimeFormatted}
                </div>
                <div class="session-actions" style="margin-top: 8px;">
                    <button onclick="window.adminPanel.editSession(${session.id}, ${session.score}, ${session.coins}, ${session.time})"
                            style="padding: 4px 12px; margin-right: 5px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85em;">
                        ✏️ Bearbeiten
                    </button>
                    <button onclick="window.adminPanel.deleteSession(${session.id})"
                            style="padding: 4px 12px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85em;">
                        🗑️ Löschen
                    </button>
                </div>
            `;
      sessionsList.appendChild(sessionItem);
    });
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // ==================== EDIT-FUNKTIONEN ====================

  async editUser(userId, currentUsername, currentEmail) {
    const newUsername = prompt(`Neuer Benutzername für "${currentUsername}":`, currentUsername);
    if (newUsername === null) return; // Abgebrochen

    const newEmail = prompt(`Neue E-Mail für "${currentUsername}":`, currentEmail);
    if (newEmail === null) return;

    const updateData = {};
    if (newUsername && newUsername !== currentUsername) {
      updateData.username = newUsername;
    }
    if (newEmail !== currentEmail) {
      updateData.email = newEmail;
    }

    if (Object.keys(updateData).length === 0) {
      alert('Keine Änderungen vorgenommen.');
      return;
    }

    try {
      await window.apiClient.updateUser(userId, updateData);
      alert('✅ Benutzer erfolgreich aktualisiert!');
      await this.updateAdminStats(); // Reload
    } catch (error) {
      alert('❌ Fehler beim Aktualisieren: ' + error.message);
    }
  }

  async deleteUser(userId, username) {
    if (!confirm(`Wirklich Benutzer "${username}" und alle seine Daten löschen?`)) {
      return;
    }

    try {
      await window.apiClient.deleteUser(userId);
      alert('✅ Benutzer erfolgreich gelöscht!');
      await this.updateAdminStats(); // Reload
    } catch (error) {
      alert('❌ Fehler beim Löschen: ' + error.message);
    }
  }

  async editSession(sessionId, currentScore, currentCoins, currentTime) {
    const newScore = prompt(`Neue Punktzahl:`, currentScore);
    if (newScore === null) return;

    const newCoins = prompt(`Neue Münzen:`, currentCoins);
    if (newCoins === null) return;

    const newTime = prompt(`Neue Zeit (Sekunden):`, currentTime);
    if (newTime === null) return;

    const updateData = {
      score: parseInt(newScore),
      coins: parseInt(newCoins),
      time: parseInt(newTime)
    };

    try {
      await window.apiClient.updateSession(sessionId, updateData);
      alert('✅ Session erfolgreich aktualisiert!');
      await this.updateAdminStats(); // Reload
    } catch (error) {
      alert('❌ Fehler beim Aktualisieren: ' + error.message);
    }
  }

  async deleteSession(sessionId) {
    if (!confirm(`Wirklich diese Spiel-Session löschen?`)) {
      return;
    }

    try {
      await window.apiClient.deleteSession(sessionId);
      alert('✅ Session erfolgreich gelöscht!');
      await this.updateAdminStats(); // Reload
    } catch (error) {
      alert('❌ Fehler beim Löschen: ' + error.message);
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
    const modal = document.getElementById('info-modal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  hideInfoModal() {
    const modal = document.getElementById('info-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }
}

