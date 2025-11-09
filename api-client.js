// API Client für Backend-Kommunikation
class APIClient {
  constructor() {
    // Für Entwicklung: localhost
    // Für Production: Backend-URL
    this.baseURL = this.getBaseURL();
    this.token = localStorage.getItem('jumpit_token') || null;
    this.adminPassword = 'admin123'; // Wird aus localStorage/Session geladen
    this.offlineMode = false;
    this.backendAvailable = false;

    // console.log('🔌 API Client initialized:', this.baseURL);
    this.checkBackendAvailability();
  }

  getBaseURL() {
    // Prüfe ob wir in Development oder Production sind
    const hostname = window.location.hostname;

    // Erlaube manuelles Überschreiben der Backend-URL via localStorage
    const customBackendURL = localStorage.getItem('jumpit_backend_url');
    if (customBackendURL) {
      // console.log('📍 Using custom backend URL:', customBackendURL);
      return customBackendURL;
    }

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001/api';
    } else {
      // Production: GitHub Pages - Offline-Modus
      // console.log('⚠️ Production mode - Backend offline, using localStorage');
      this.offlineMode = true;
      return null;
    }
  }

  async checkBackendAvailability() {
    try {
      const health = await this.healthCheck();
      if (health.status === 'OK') {
        this.backendAvailable = true;
        this.offlineMode = false;
        // console.log('✅ Backend connected:', health.timestamp);
      }
    } catch (error) {
      // console.warn('⚠️ Backend nicht erreichbar - Fallback auf localStorage');
      this.offlineMode = true;
      this.backendAvailable = false;
    }
  }

  // Helper: Headers für API-Requests
  getHeaders(includeAuth = false, includeAdmin = false) {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (includeAdmin) {
      headers['X-Admin-Password'] = this.adminPassword;
    }

    return headers;
  }

  // Helper: API Request
  async request(endpoint, options = {}) {
    // Falls Offline-Modus oder Backend nicht erreichbar, werfe Fehler
    if (this.offlineMode || !this.baseURL) {
      throw new Error('Backend nicht erreichbar - Offline-Modus aktiv');
    }

    const url = `${this.baseURL}${endpoint}`;

    try {
      // console.log(`🌐 API Request: ${options.method || 'GET'} ${endpoint}`);

      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(options.auth, options.admin),
          ...options.headers
        }
      });

      const data = await response.json();

      if (!response.ok) {
        // console.error('❌ API Error:', data);
        throw new Error(data.error || 'API Request failed');
      }

      // console.log('✅ API Success:', endpoint);
      return data;
    } catch (error) {
      // console.error('❌ API Request failed:', error);
      // Bei Netzwerkfehler -> Offline-Modus aktivieren
      this.offlineMode = true;
      this.backendAvailable = false;
      throw error;
    }
  }

  // ==================== AUTH APIs ====================

  async register(username, password, email) {
    const data = await this.request('/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, email })
    });

    // Speichere Token
    this.token = data.token;
    localStorage.setItem('jumpit_token', data.token);

    return data;
  }

  async login(username, password) {
    const data = await this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    // Speichere Token
    this.token = data.token;
    localStorage.setItem('jumpit_token', data.token);

    return data;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('jumpit_token');
  }

  // ==================== SCORE APIs ====================

  async submitScore(score, coins, time) {
    return await this.request('/scores', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ score, coins, time })
    });
  }

  async getLeaderboard(limit = 10) {
    return await this.request(`/leaderboard?limit=${limit}`);
  }

  async getUserBestScore() {
    return await this.request('/user/best-score', {
      auth: true
    });
  }

  // ==================== ADMIN APIs ====================

  async getAdminUsers() {
    return await this.request('/admin/users', {
      admin: true
    });
  }

  async updateUser(userId, userData) {
    return await this.request(`/admin/users/${userId}`, {
      method: 'PUT',
      admin: true,
      body: JSON.stringify(userData)
    });
  }

  async deleteUser(userId) {
    return await this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
      admin: true
    });
  }

  async getAdminSessions(limit = 50) {
    return await this.request(`/admin/sessions?limit=${limit}`, {
      admin: true
    });
  }

  async updateSession(sessionId, sessionData) {
    return await this.request(`/admin/sessions/${sessionId}`, {
      method: 'PUT',
      admin: true,
      body: JSON.stringify(sessionData)
    });
  }

  async deleteSession(sessionId) {
    return await this.request(`/admin/sessions/${sessionId}`, {
      method: 'DELETE',
      admin: true
    });
  }

  async getAdminStats() {
    return await this.request('/admin/stats', {
      admin: true
    });
  }

  // ==================== HEALTH CHECK ====================

  async healthCheck() {
    try {
      return await this.request('/health');
    } catch (error) {
      // console.error('⚠️ Backend nicht erreichbar!', error);
      return { status: 'offline' };
    }
  }

  // ==================== HELPERS ====================

  isAuthenticated() {
    return !!this.token;
  }

  setAdminPassword(password) {
    this.adminPassword = password;
  }
}

// Globale API-Client Instanz
window.apiClient = new APIClient();

// Health Check beim Laden
window.addEventListener('load', async () => {
  const health = await window.apiClient.healthCheck();
  if (health.status === 'OK') {
    // console.log('✅ Backend connected:', health.timestamp);
  } else {
    // console.warn('⚠️ Backend offline - Fallback auf localStorage');
  }
});


