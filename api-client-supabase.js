// Supabase API Client für JumpIt
class SupabaseApiClient {
  constructor() {
    this.supabase = window.supabaseClient;
    this.currentUser = null;
    this.session = null;

    console.log('🔌 Supabase API Client initialized');

    // Check initial session
    this.checkSession();
  }

  async checkSession() {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (session) {
      this.session = session;
      this.currentUser = session.user;
      console.log('✅ Session restored:', this.currentUser.email);
    }
  }

  // ==================== AUTH APIs ====================

  async register(username, email, password) {
    try {
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

      if (authError) throw authError;

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
          console.warn('⚠️ DB insert warning:', dbError.message);
          // User existiert schon in DB - das ist okay
        }
      } catch (dbErr) {
        console.warn('⚠️ DB insert failed (user might already exist):', dbErr);
        // Nicht kritisch - Auth User wurde erstellt
      }

      this.session = authData.session;
      this.currentUser = authData.user;

      console.log('✅ Registration successful:', username);

      return {
        user: {
          id: authData.user.id,
          username: username,
          email: email
        },
        session: authData.session
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Registrierung fehlgeschlagen');
    }
  }

  async login(email, password) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) throw error;

      this.session = data.session;
      this.currentUser = data.user;

      console.log('✅ Login successful:', email);

      return {
        user: {
          id: data.user.id,
          username: data.user.user_metadata?.username || email.split('@')[0],
          email: data.user.email
        },
        session: data.session
      };
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login fehlgeschlagen');
    }
  }

  async logout() {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
    }
    this.session = null;
    this.currentUser = null;
    console.log('✅ Logged out');
  }

  isAuthenticated() {
    return !!this.session;
  }

  setAdminPassword(password) {
    this.adminPassword = password;
    localStorage.setItem('jumpit_admin_password', password);
    console.log('✅ Admin password set');
  }

  clearAdminPassword() {
    this.adminPassword = null;
    localStorage.removeItem('jumpit_admin_password');
  }

  // ==================== SCORE APIs ====================

  async submitScore(score, coins, time) {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    try {
      const { data, error } = await this.supabase
        .from('scores')
        .insert([
          {
            user_id: this.currentUser.id,
            score: score,
            coins: coins,
            time: time
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('✅ Score submitted:', score);
      return data;
    } catch (error) {
      console.error('Submit score error:', error);
      throw new Error('Score konnte nicht gespeichert werden');
    }
  }

  async getLeaderboard(limit = 10) {
    try {
      // Get scores with username from users table via JOIN
      const { data, error } = await this.supabase
        .from('scores')
        .select('score, coins, time, created_at, users(username)')
        .order('score', { ascending: false })
        .limit(limit * 3); // Get more to find unique users

      if (error) throw error;

      // Group by username and get best score
      const leaderboard = {};
      data.forEach(entry => {
        const username = entry.users?.username || 'Unknown';
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

      console.log('📊 Leaderboard loaded:', result.length, 'entries');
      return { leaderboard: result };
    } catch (error) {
      console.error('Leaderboard error:', error);
      return { leaderboard: [] };
    }
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
      console.error('Get best score error:', error);
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
      console.error('Get admin users error:', error);
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

      console.log('✅ User updated:', userId);
      return data;
    } catch (error) {
      console.error('Update user error:', error);
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

      console.log('✅ User deleted:', userId);
      return { success: true };
    } catch (error) {
      console.error('Delete user error:', error);
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
      console.error('Get admin sessions error:', error);
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

      console.log('✅ Session updated:', sessionId);
      return data;
    } catch (error) {
      console.error('Update session error:', error);
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

      console.log('✅ Session deleted:', sessionId);
      return { success: true };
    } catch (error) {
      console.error('Delete session error:', error);
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
      console.error('Get admin stats error:', error);
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
    console.log('✅ Supabase connected:', health.timestamp);
  } else {
    console.error('❌ Supabase connection failed:', health.error);
  }
});

