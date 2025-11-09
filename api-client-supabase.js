// Supabase API Client für JumpIt
class SupabaseApiClient {
  constructor() {
    this.supabase = window.supabaseClient;
    this.currentUser = null;
    this.session = null;
    this.isOfflineMode = false;
    
    // 🔧 OFFLINE MODE CONFIG
    // Set to true to enable offline fallback (localStorage-based)
    // Set to false to require Supabase connection (recommended)
    this.OFFLINE_MODE_ENABLED = false;

    // // console.log('🔌 Supabase API Client initialized');
    // // console.log('📱 Offline mode:', this.OFFLINE_MODE_ENABLED ? 'ENABLED' : 'DISABLED');

    // Check initial session
    this.checkSession();
  }

  async checkSession() {
    // // console.log('🔍 [DEBUG] checkSession() started');
    // // console.log('🔍 [DEBUG] Supabase client:', this.supabase);
    
    try {
      // // console.log('🔍 [DEBUG] Calling getSession()...');
      const startTime = Date.now();
      const { data: { session }, error } = await this.supabase.auth.getSession();
      const duration = Date.now() - startTime;
      
      // // console.log(`🔍 [DEBUG] getSession() completed in ${duration}ms`);
      // // console.log('🔍 [DEBUG] Session data:', session);
      // // console.log('🔍 [DEBUG] Error:', error);
      
      if (error) {
        throw error;
      }
      
      if (session) {
        this.session = session;
        this.currentUser = session.user;
        // // console.log('✅ Session restored:', this.currentUser.email);
      } else {
        // // console.log('ℹ️ No active session found');
      }
      this.isOfflineMode = false;
    } catch (error) {
      // // console.error('❌ [DEBUG] checkSession() error:', error);
      // // console.error('❌ [DEBUG] Error type:', error.constructor.name);
      // // console.error('❌ [DEBUG] Error message:', error.message);
      // // console.error('❌ [DEBUG] Error stack:', error.stack);
      
      // Only use offline mode if explicitly enabled
      if (this.OFFLINE_MODE_ENABLED) {
        // // console.warn('⚠️ Supabase not reachable, using offline mode:', error.message);
        this.isOfflineMode = true;
        
        // Try to restore from localStorage
        const savedUser = localStorage.getItem('jumpit_user_offline');
        if (savedUser) {
          this.currentUser = JSON.parse(savedUser);
          // // console.log('📱 Offline user restored:', this.currentUser.username);
        }
      } else {
        // // console.error('❌ Supabase nicht erreichbar. Bitte prüfen Sie Ihre Internetverbindung.');
        // Don't switch to offline mode - throw error instead
      }
    }
  }

  // ==================== AUTH APIs ====================

  async register(username, email, password) {
    // // console.log('🔍 [DEBUG] register() called');
    // // console.log('🔍 [DEBUG] Username:', username);
    // // console.log('🔍 [DEBUG] Email:', email);
    // // console.log('🔍 [DEBUG] isOfflineMode:', this.isOfflineMode);
    // // console.log('🔍 [DEBUG] OFFLINE_MODE_ENABLED:', this.OFFLINE_MODE_ENABLED);
    
    // Offline Fallback (only if enabled)
    if (this.isOfflineMode && this.OFFLINE_MODE_ENABLED) {
      // // console.log('⚠️ [DEBUG] Using offline fallback');
      return this._registerOffline(username, email, password);
    }

    try {
      // // console.log('🔍 [DEBUG] Calling Supabase signUp()...');
      const startTime = Date.now();
      
      // 1. Erstelle Auth User (Supabase Auth)
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            username: username
          }
        }
      });
      
      const duration = Date.now() - startTime;
      // // console.log(`🔍 [DEBUG] signUp() completed in ${duration}ms`);
      // // console.log('🔍 [DEBUG] Auth data:', authData);
      // // console.log('🔍 [DEBUG] Auth error:', authError);

      if (authError) {
        // // console.error('❌ [DEBUG] Supabase signUp error:', authError);
        /* // console.error('❌ [DEBUG] Error details:', {
          message: authError.message,
          status: authError.status,
          code: authError.code,
          name: authError.name,
          details: authError
        }); */
        throw authError;
      }

      if (!authData.user) {
        throw new Error('User creation failed');
      }

      // 2. Erstelle User in DB mit korrekter UUID
      try {
        const { data: userData, error: dbError } = await this.supabase
          .from('users')
          .insert([
            {
              id: authData.user.id, // UUID von Supabase Auth
              username: username,
              email: email
            }
          ])
          .select()
          .single();

        if (dbError) {
          // // console.warn('⚠️ DB insert warning:', dbError.message);
          // User existiert schon in DB - das ist okay
        }
      } catch (dbErr) {
        // // console.warn('⚠️ DB insert failed (user might already exist):', dbErr);
        // Nicht kritisch - Auth User wurde erstellt
      }

      this.session = authData.session;
      this.currentUser = authData.user;

      // // console.log('✅ Registration successful:', username);

      return {
        user: {
          id: authData.user.id,
          username: username,
          email: email
        },
        session: authData.session
      };
    } catch (error) {
      // // console.error('Registration error:', error);
      
      // Benutzerfreundliche Fehlermeldungen
      let userMessage = 'Registrierung fehlgeschlagen';
      
      if (error.message) {
        if (error.message.includes('User already registered')) {
          userMessage = 'Diese E-Mail-Adresse ist bereits registriert!';
        } else if (error.message.includes('Password')) {
          userMessage = 'Passwort muss mindestens 6 Zeichen lang sein!';
        } else if (error.message.includes('Email')) {
          userMessage = 'Ungültige E-Mail-Adresse!';
        } else if (error.status === 422) {
          userMessage = 'Ungültige Daten. Bitte prüfen Sie Ihre Eingaben:\n- E-Mail muss gültig sein\n- Passwort mindestens 6 Zeichen';
        } else {
          userMessage = error.message;
        }
      }
      
      // Fallback to offline mode if network error (only if enabled)
      if (this.OFFLINE_MODE_ENABLED && (error.message.includes('fetch') || error.message.includes('NetworkError'))) {
        // // console.warn('⚠️ Network error detected, switching to offline mode');
        this.isOfflineMode = true;
        return this._registerOffline(username, email, password);
      }
      
      throw new Error(userMessage);
    }
  }

  _registerOffline(username, email, password) {
    // // console.log('📱 OFFLINE REGISTRATION:', username);
    
    const user = {
      id: 'offline-' + Date.now(),
      username: username,
      email: email,
      createdAt: new Date().toISOString()
    };

    // Save to localStorage
    localStorage.setItem('jumpit_user_offline', JSON.stringify(user));
    localStorage.setItem('jumpit_password_offline', password);
    
    // Save to all users list
    const allUsers = this._getAllUsersOffline();
    allUsers[username] = {
      password: password,
      email: email,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem('jumpit_all_users_offline', JSON.stringify(allUsers));

    this.currentUser = user;

    alert('📱 Du bist im Offline-Modus! Deine Daten werden nur lokal gespeichert.');

    return {
      user: user,
      session: { offline: true }
    };
  }

  _getAllUsersOffline() {
    const saved = localStorage.getItem('jumpit_all_users_offline');
    return saved ? JSON.parse(saved) : {};
  }

  async login(email, password) {
    // // console.log('🔍 [DEBUG] login() called with email:', email);
    
    // Offline Fallback (only if enabled)
    if (this.isOfflineMode && this.OFFLINE_MODE_ENABLED) {
      return this._loginOffline(email, password);
    }

    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) {
        // // console.error('🔍 [DEBUG] Login error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
        throw error;
      }

      this.session = data.session;
      this.currentUser = data.user;

      // // console.log('✅ Login successful:', email);

      return {
        user: {
          id: data.user.id,
          username: data.user.user_metadata?.username || email.split('@')[0],
          email: data.user.email
        },
        session: data.session
      };
    } catch (error) {
      // // console.error('❌ Login error:', error);
      
      // Provide better error messages
      let errorMessage = 'Login fehlgeschlagen';
      
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Ungültige Anmeldedaten.\n\n' +
                      'Mögliche Ursachen:\n' +
                      '• Falsches Passwort\n' +
                      '• E-Mail nicht bestätigt (prüfen Sie Ihren Posteingang)\n' +
                      '• User existiert nicht mit dieser E-Mail\n\n' +
                      'Tipp: Verwenden Sie die echte E-Mail-Adresse, mit der Sie sich registriert haben.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'E-Mail nicht bestätigt!\n\nBitte prüfen Sie Ihren Posteingang und bestätigen Sie Ihre E-Mail-Adresse.';
      } else if (this.OFFLINE_MODE_ENABLED && (error.message.includes('fetch') || error.message.includes('NetworkError'))) {
        // // console.warn('⚠️ Network error detected, switching to offline mode');
        this.isOfflineMode = true;
        return this._loginOffline(email, password);
      }
      
      throw new Error(errorMessage);
    }
  }

  _loginOffline(usernameOrEmail, password) {
    // // console.log('📱 OFFLINE LOGIN:', usernameOrEmail);

    // Try to find user
    const allUsers = this._getAllUsersOffline();
    const username = usernameOrEmail.split('@')[0]; // Extract username from email

    // Check all users
    for (const [savedUsername, userData] of Object.entries(allUsers)) {
      if (savedUsername === username || savedUsername === usernameOrEmail) {
        if (userData.password === password) {
          const user = {
            id: 'offline-' + Date.now(),
            username: savedUsername,
            email: userData.email || savedUsername + '@offline.local'
          };

          localStorage.setItem('jumpit_user_offline', JSON.stringify(user));
          this.currentUser = user;

          alert('📱 Du bist im Offline-Modus! Deine Daten werden nur lokal gespeichert.');

          return {
            user: user,
            session: { offline: true }
          };
        }
      }
    }

    throw new Error('Falscher Benutzername oder Passwort (Offline-Modus)');
  }

  async logout() {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      // // console.error('Logout error:', error);
    }
    this.session = null;
    this.currentUser = null;
    // // console.log('✅ Logged out');
  }

  isAuthenticated() {
    return !!this.session || !!this.currentUser;
  }

  setAdminPassword(password) {
    this.adminPassword = password;
    localStorage.setItem('jumpit_admin_password', password);
    // // console.log('✅ Admin password set');
  }

  clearAdminPassword() {
    this.adminPassword = null;
    localStorage.removeItem('jumpit_admin_password');
  }

  // ==================== SCORE APIs ====================

  async submitScore(score, coins, time) {
    // // console.log('🔍 [API] submitScore called:', { score, coins, time });
    // // console.log('🔍 [API] isAuthenticated:', this.isAuthenticated());
    // // console.log('🔍 [API] currentUser:', this.currentUser);
    // // console.log('🔍 [API] isOfflineMode:', this.isOfflineMode);
    // // console.log('🔍 [API] navigator.onLine:', navigator.onLine);

    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    // Offline Fallback (only if enabled)
    if (this.isOfflineMode && this.OFFLINE_MODE_ENABLED) {
      return this._submitScoreOffline(score, coins, time);
    }

    try {
      // Get username for the score entry
      const username = this.currentUser.user_metadata?.username || 
                      this.currentUser.email?.split('@')[0] || 
                      'Unknown';

      // // console.log('🔍 [API] Inserting score into Supabase...');
      // // console.log('🔍 [API] Data:', {
        user_id: this.currentUser.id,
        username: username,
        score: score,
        coins: coins,
        time: time
      });

      const startTime = Date.now();
      const { data, error } = await this.supabase
        .from('scores')
        .insert([
          {
            user_id: this.currentUser.id,
            username: username,  // Store username for faster queries
            score: score,
            coins: coins,
            time: time
          }
        ])
        .select()
        .single();
      
      const duration = Date.now() - startTime;
      // // console.log(`🔍 [API] Insert completed in ${duration}ms`);

      if (error) {
        // // console.error('❌ [API] Supabase insert error:', error);
        // // console.error('❌ [API] Error details:', {
          message: error.message,
          code: error.code,
          hint: error.hint,
          details: error.details,
          status: error.status
        });
        throw error;
      }

      // // console.log('✅ [API] Score submitted successfully:', score);
      // // console.log('✅ [API] Response data:', data);
      return data;
    } catch (error) {
      // // console.error('❌ [API] Submit score error:', error);
      // // console.error('❌ [API] Error type:', error.constructor.name);
      // // console.error('❌ [API] Error message:', error.message);
      // // console.error('❌ [API] Error stack:', error.stack);
      
      // Check if it's a network error
      const isNetworkError = error.message.includes('fetch') || 
                            error.message.includes('NetworkError') ||
                            error.message.includes('Failed to fetch') ||
                            error.message.includes('timeout') ||
                            !navigator.onLine;
      
      // // console.log('🔍 [API] Is network error?', isNetworkError);

      // Fallback to offline (only if enabled)
      if (this.OFFLINE_MODE_ENABLED && isNetworkError) {
        // // console.warn('⚠️ [API] Switching to offline mode due to network error');
        this.isOfflineMode = true;
        return this._submitScoreOffline(score, coins, time);
      }
      
      // Provide more specific error message
      let errorMessage = 'Score konnte nicht gespeichert werden';
      
      if (isNetworkError) {
        errorMessage += ' (Netzwerkfehler - keine Verbindung zu Supabase)';
      } else if (error.code) {
        errorMessage += ` (DB-Fehler: ${error.code})`;
      } else {
        errorMessage += ` (${error.message})`;
      }
      
      throw new Error(errorMessage);
    }
  }

  _submitScoreOffline(score, coins, time) {
    // // console.log('📱 OFFLINE SCORE SUBMIT:', score);

    let leaderboard = JSON.parse(localStorage.getItem('jumpit_leaderboard_offline') || '[]');
    
    const newEntry = {
      username: this.currentUser.username,
      score: score,
      coins: coins,
      time: time,
      timestamp: new Date().toISOString()
    };

    leaderboard.push(newEntry);
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 100); // Keep top 100

    localStorage.setItem('jumpit_leaderboard_offline', JSON.stringify(leaderboard));
    
    return newEntry;
  }

  async getLeaderboard(limit = 10) {
    // Offline Fallback (only if enabled)
    if (this.isOfflineMode && this.OFFLINE_MODE_ENABLED) {
      return this._getLeaderboardOffline(limit);
    }

    try {
      // Use Supabase RPC function to get best score per user
      // This is much more efficient than loading all scores and grouping client-side
      const { data, error } = await this.supabase.rpc('get_leaderboard', { 
        score_limit: limit 
      });

      if (error) {
        // Fallback: If RPC function doesn't exist, use simple query with client-side grouping
        // // console.log('⚠️ RPC function not found, using fallback method');
        return await this._getLeaderboardFallback(limit);
      }

      // // console.log('📊 Leaderboard loaded via RPC:', data.length, 'unique users');
      
      const result = data.map(entry => ({
        username: entry.username,
        score: entry.best_score,
        coins: entry.coins,
        time: entry.time_seconds || entry.time,
        created_at: entry.created_at
      }));

      return { leaderboard: result };
    } catch (error) {
      // // console.error('Leaderboard error:', error);
      // Fallback to offline (only if enabled)
      if (this.OFFLINE_MODE_ENABLED && (error.message.includes('fetch') || error.message.includes('NetworkError'))) {
        this.isOfflineMode = true;
        return this._getLeaderboardOffline(limit);
      }
      return { leaderboard: [] };
    }
  }

  async _getLeaderboardFallback(limit = 10) {
    // Fallback method: Load ALL scores and group client-side
    try {
      const { data, error } = await this.supabase
        .from('scores')
        .select('username, score, coins, time, created_at')
        .order('score', { ascending: false })
        .limit(2000); // Load many scores to ensure we get all users

      if (error) throw error;

      // // console.log('📊 Fallback: Loaded', data.length, 'scores');

      // Group by username and get best score for each user
      const leaderboard = {};
      data.forEach(entry => {
        // Skip entries without valid username
        if (!entry.username || entry.username === 'Unknown' || entry.username.trim() === '') {
          return;
        }
        
        const username = entry.username;
        if (!leaderboard[username] || entry.score > leaderboard[username].score) {
          leaderboard[username] = {
            username: username,
            score: entry.score,
            coins: entry.coins,
            time: entry.time,
            created_at: entry.created_at
          };
        }
      });

      const result = Object.values(leaderboard)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // // console.log('📊 Fallback: Grouped to', result.length, 'unique users');
      return { leaderboard: result };
    } catch (error) {
      // // console.error('Fallback leaderboard error:', error);
      return { leaderboard: [] };
    }
  }

  _getLeaderboardOffline(limit = 10) {
    // // console.log('📱 OFFLINE LEADERBOARD');
    
    const leaderboard = JSON.parse(localStorage.getItem('jumpit_leaderboard_offline') || '[]');
    
    // Group by username and get best score
    const bestScores = {};
    leaderboard.forEach(entry => {
      if (!bestScores[entry.username] || entry.score > bestScores[entry.username].score) {
        bestScores[entry.username] = entry;
      }
    });

    const result = Object.values(bestScores)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return { leaderboard: result };
  }

  async getUserBestScore() {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    try {
      const { data, error } = await this.supabase
        .from('scores')
        .select('score')
        .eq('user_id', this.currentUser.id)
        .order('score', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

      return { bestScore: data?.score || 0 };
    } catch (error) {
      // // console.error('Get best score error:', error);
      return { bestScore: 0 };
    }
  }

  // ==================== ADMIN APIs ====================

  async getAdminUsers() {
    try {
      // Get users with their game count and best score
      const { data: users, error: usersError } = await this.supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Enrich with game stats
      const enrichedUsers = await Promise.all(users.map(async (user) => {
        const { data: scores } = await this.supabase
          .from('scores')
          .select('score')
          .eq('user_id', user.id);

        return {
          ...user,
          game_count: scores?.length || 0,
          best_score: scores?.length ? Math.max(...scores.map(s => s.score)) : 0
        };
      }));

      return { users: enrichedUsers };
    } catch (error) {
      // // console.error('Get admin users error:', error);
      throw error;
    }
  }

  async updateUser(userId, userData) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .update(userData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // // console.log('✅ User updated:', userId);
      return data;
    } catch (error) {
      // // console.error('Update user error:', error);
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      // Delete user (cascade will delete scores)
      const { error } = await this.supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      // // console.log('✅ User deleted:', userId);
      return { success: true };
    } catch (error) {
      // // console.error('Delete user error:', error);
      throw error;
    }
  }

  async getAdminSessions(limit = 50) {
    try {
      const { data, error } = await this.supabase
        .from('scores')
        .select('id, user_id, score, coins, time, created_at, users(username)')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Transform data to include username at top level
      const sessions = data.map(session => ({
        id: session.id,
        user_id: session.user_id,
        username: session.users?.username || 'Unknown',
        score: session.score,
        coins: session.coins,
        time: session.time,
        created_at: session.created_at
      }));

      return { sessions };
    } catch (error) {
      // // console.error('Get admin sessions error:', error);
      throw error;
    }
  }

  async updateSession(sessionId, sessionData) {
    try {
      const { data, error } = await this.supabase
        .from('scores')
        .update(sessionData)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;

      // // console.log('✅ Session updated:', sessionId);
      return data;
    } catch (error) {
      // // console.error('Update session error:', error);
      throw error;
    }
  }

  async deleteSession(sessionId) {
    try {
      const { error } = await this.supabase
        .from('scores')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      // // console.log('✅ Session deleted:', sessionId);
      return { success: true };
    } catch (error) {
      // // console.error('Delete session error:', error);
      throw error;
    }
  }

  async getAdminStats() {
    try {
      const { data, error } = await this.supabase
        .from('admin_stats')
        .select('*')
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      // // console.error('Get admin stats error:', error);
      return {
        totalUsers: 0,
        totalGames: 0,
        avgScore: 0,
        topPlayer: 'N/A'
      };
    }
  }

  // ==================== HEALTH CHECK ====================

  async healthCheck() {
    try {
      const { error } = await this.supabase
        .from('users')
        .select('count')
        .limit(1);

      if (error) throw error;

      return {
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Supabase'
      };
    } catch (error) {
      return {
        status: 'offline',
        error: error.message
      };
    }
  }
}

// Globale Instanz erstellen
window.apiClient = new SupabaseApiClient();

// Health Check beim Laden
window.addEventListener('load', async () => {
  const health = await window.apiClient.healthCheck();
  if (health.status === 'OK') {
    // // console.log('✅ Supabase connected:', health.timestamp);
  } else {
    // // console.error('❌ Supabase connection failed:', health.error);
  }
});


