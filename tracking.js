// =====================================================
// JumpIt - Traffic Tracking System (DSGVO-konform)
// =====================================================
// Anonymes Tracking ohne personenbezogene Daten
// Kein Cookie-Banner nötig (§25 TTDSG)
// =====================================================

class TrafficTracker {
    constructor() {
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

    // ==================== SESSION MANAGEMENT ====================
    
    getOrCreateSessionId() {
        let sessionId = sessionStorage.getItem('jumpit_session_id');
        
        if (!sessionId) {
            // Neue Session ID generieren
            sessionId = this.generateSessionId();
            sessionStorage.setItem('jumpit_session_id', sessionId);
            sessionStorage.setItem('jumpit_session_start', Date.now().toString());
        }
        
        return sessionId;
    }

    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    }

    getSessionDuration() {
        const startTime = parseInt(sessionStorage.getItem('jumpit_session_start') || Date.now());
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
                // console.log('✅ Page view tracked:', trackingData);
            } else {
                // Fallback: localStorage
                this.saveToLocalStorage('pageview', trackingData);
            }
        } catch (error) {
            console.error('⚠️ Failed to track page view:', error);
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

    // ==================== FALLBACK: LOCALSTORAGE ====================
    
    saveToLocalStorage(type, data) {
        try {
            const key = `jumpit_${type}_fallback`;
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            existing.push(data);
            
            // Behalte nur die letzten 100 Einträge
            if (existing.length > 100) {
                existing.shift();
            }
            
            localStorage.setItem(key, JSON.stringify(existing));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
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


