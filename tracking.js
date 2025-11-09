// =====================================================
// JumpIt - Traffic Tracking System (DSGVO-konform)
// =====================================================
// Anonymes Tracking ohne personenbezogene Daten
// Kein Cookie-Banner nötig (§25 TTDSG)
// =====================================================

class TrafficTracker {
    constructor() {
        // In-Memory Fallback wenn Storage blockiert ist
        this.memoryStorage = {
            sessionId: null,
            sessionStart: null
        };
        this.storageAvailable = this.checkStorageAvailability();
        this.sessionId = this.getOrCreateSessionId();
        this.init();
    }

    init() {
        // Track page view beim Laden
        this.trackPageView();
        
        // Track beim Verlassen (für Session-Dauer)
        window.addEventListener('beforeunload', () => {
            this.trackSessionEnd();
        });

        // Track Visibility Changes (Tab wechseln, etc.)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackSessionEnd();
            }
        });
    }

    // ==================== STORAGE AVAILABILITY CHECK ====================
    
    checkStorageAvailability() {
        try {
            const test = '__storage_test__';
            sessionStorage.setItem(test, test);
            sessionStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('⚠️ sessionStorage not available (Tracking Prevention?), using in-memory fallback');
            return false;
        }
    }

    // ==================== SESSION MANAGEMENT (Storage-Safe) ====================
    
    getOrCreateSessionId() {
        let sessionId = null;
        
        // Versuche aus sessionStorage zu lesen
        if (this.storageAvailable) {
            try {
                sessionId = sessionStorage.getItem('jumpit_session_id');
            } catch (e) {
                console.warn('⚠️ Could not read from sessionStorage:', e.message);
            }
        }
        
        // Fallback: Memory Storage
        if (!sessionId && this.memoryStorage.sessionId) {
            sessionId = this.memoryStorage.sessionId;
        }
        
        // Wenn immer noch keine Session ID: Neue generieren
        if (!sessionId) {
            sessionId = this.generateSessionId();
            const now = Date.now().toString();
            
            // Speichere in sessionStorage (wenn verfügbar)
            if (this.storageAvailable) {
                try {
                    sessionStorage.setItem('jumpit_session_id', sessionId);
                    sessionStorage.setItem('jumpit_session_start', now);
                } catch (e) {
                    console.warn('⚠️ Could not write to sessionStorage:', e.message);
                }
            }
            
            // Immer auch in Memory speichern
            this.memoryStorage.sessionId = sessionId;
            this.memoryStorage.sessionStart = now;
        }
        
        return sessionId;
    }

    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    }

    getSessionDuration() {
        let startTime = Date.now();
        
        // Versuche aus sessionStorage zu lesen
        if (this.storageAvailable) {
            try {
                const stored = sessionStorage.getItem('jumpit_session_start');
                if (stored) startTime = parseInt(stored);
            } catch (e) {
                // Ignorieren
            }
        }
        
        // Fallback: Memory
        if (this.memoryStorage.sessionStart) {
            startTime = parseInt(this.memoryStorage.sessionStart);
        }
        
        return Math.floor((Date.now() - startTime) / 1000); // Sekunden
    }

    // ==================== DEVICE & BROWSER INFO ====================
    
    getDeviceInfo() {
        const ua = navigator.userAgent;
        let deviceType = 'Desktop';
        
        if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
            if (/iPad|Tablet/i.test(ua)) {
                deviceType = 'Tablet';
            } else {
                deviceType = 'Mobile';
            }
        }
        
        return {
            type: deviceType,
            screen: `${window.screen.width}x${window.screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            language: navigator.language || 'unknown'
        };
    }

    getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        
        if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
        else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) browser = 'Opera';
        else if (ua.indexOf('Trident') > -1) browser = 'Internet Explorer';
        else if (ua.indexOf('Edge') > -1) browser = 'Edge';
        else if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
        else if (ua.indexOf('Safari') > -1) browser = 'Safari';
        
        return browser;
    }

    // ==================== PAGE VIEW TRACKING ====================
    
    async trackPageView() {
        const trackingData = {
            session_id: this.sessionId,
            page_url: window.location.pathname,
            page_title: document.title,
            referrer: document.referrer || 'direct',
            device_type: this.getDeviceInfo().type,
            device_screen: this.getDeviceInfo().screen,
            browser: this.getBrowserInfo(),
            language: this.getDeviceInfo().language,
            timestamp: new Date().toISOString()
        };

        // Sende zu Supabase
        try {
            if (window.apiClient && window.apiClient.trackPageView) {
                await window.apiClient.trackPageView(trackingData);
                console.log('✅ Page view tracked:', trackingData);
            } else {
                console.warn('⚠️ apiClient not available, saving to localStorage');
                // Fallback: localStorage
                this.saveToLocalStorage('pageview', trackingData);
            }
        } catch (error) {
            console.error('❌ Failed to track page view:', error);
            console.error('Error details:', error.message);
            this.saveToLocalStorage('pageview', trackingData);
        }
    }

    // ==================== SESSION END TRACKING ====================
    
    async trackSessionEnd() {
        const sessionDuration = this.getSessionDuration();
        
        const sessionData = {
            session_id: this.sessionId,
            duration_seconds: sessionDuration,
            timestamp: new Date().toISOString()
        };

        try {
            if (window.apiClient && window.apiClient.trackSessionEnd) {
                // Beacon API für zuverlässiges Tracking beim Verlassen
                await window.apiClient.trackSessionEnd(sessionData);
                // console.log('✅ Session end tracked:', sessionData);
            }
        } catch (error) {
            console.error('⚠️ Failed to track session end:', error);
        }
    }

    // ==================== FALLBACK: LOCALSTORAGE (Storage-Safe) ====================
    
    saveToLocalStorage(type, data) {
        try {
            // Test ob localStorage verfügbar ist
            const test = '__test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            
            // Wenn verfügbar, speichere Daten
            const key = `jumpit_${type}_fallback`;
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            existing.push(data);
            
            // Behalte nur die letzten 100 Einträge
            if (existing.length > 100) {
                existing.shift();
            }
            
            localStorage.setItem(key, JSON.stringify(existing));
            console.log('📦 Saved to localStorage fallback');
        } catch (error) {
            console.warn('⚠️ localStorage not available, data not persisted:', error.message);
            // Kein Problem - Tracking funktioniert trotzdem über Supabase
        }
    }

    // ==================== PUBLIC METHODS ====================
    
    // Track custom events (z.B. Button-Klicks)
    async trackEvent(eventName, eventData = {}) {
        const data = {
            session_id: this.sessionId,
            event_name: eventName,
            event_data: JSON.stringify(eventData),
            timestamp: new Date().toISOString()
        };

        try {
            if (window.apiClient && window.apiClient.trackEvent) {
                await window.apiClient.trackEvent(data);
            }
        } catch (error) {
            console.error('Failed to track event:', error);
        }
    }
}

// ==================== AUTO-INITIALISIERUNG ====================

// Warte bis DOM geladen ist
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.trafficTracker = new TrafficTracker();
    });
} else {
    window.trafficTracker = new TrafficTracker();
}

// Export für manuelle Nutzung
window.TrafficTracker = TrafficTracker;


