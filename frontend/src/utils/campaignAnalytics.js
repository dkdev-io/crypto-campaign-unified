/**
 * Campaign Analytics Tracking System
 * Lightweight, privacy-compliant analytics for contribution campaigns
 * 
 * Features:
 * - Anonymous visitor ID generation and management
 * - Session tracking with page interactions
 * - Referrer detection and traffic source classification
 * - Privacy-compliant geolocation
 * - Form interaction and conversion tracking
 * - GDPR/CCPA compliance with opt-out
 */

class CampaignAnalytics {
  constructor(config = {}) {
    this.config = {
      // API Configuration
      supabaseUrl: config.supabaseUrl || process.env.REACT_APP_SUPABASE_URL,
      supabaseKey: config.supabaseKey || process.env.REACT_APP_SUPABASE_ANON_KEY,
      apiEndpoint: config.apiEndpoint || '/api/analytics',
      
      // Tracking Configuration
      sessionTimeout: config.sessionTimeout || 30, // minutes
      heartbeatInterval: config.heartbeatInterval || 30000, // 30 seconds
      batchSize: config.batchSize || 10,
      batchTimeout: config.batchTimeout || 5000, // 5 seconds
      
      // Privacy Configuration
      respectDNT: config.respectDNT !== false, // Default to true
      cookieConsent: config.cookieConsent || 'optional', // required, optional, disabled
      dataRetention: config.dataRetention || 365, // days
      
      // Feature flags
      enableGeolocation: config.enableGeolocation !== false,
      enableScrollTracking: config.enableScrollTracking !== false,
      enableClickTracking: config.enableClickTracking !== false,
      
      // Debug mode
      debug: config.debug || false
    };

    // Internal state
    this.visitorId = null;
    this.sessionId = null;
    this.sessionStart = null;
    this.lastActivity = null;
    this.pageLoadTime = Date.now();
    this.events = [];
    this.location = null;
    this.consentGiven = null;
    
    // Tracking state
    this.maxScrollDepth = 0;
    this.clickCount = 0;
    this.formInteractions = new Set();
    this.heartbeatTimer = null;
    this.batchTimer = null;
    
    // Initialize if consent allows
    this.init();
  }

  /**
   * Initialize the analytics system
   */
  async init() {
    try {
      // Check Do Not Track header
      if (this.config.respectDNT && navigator.doNotTrack === '1') {
        this.log('Analytics disabled: Do Not Track enabled');
        return;
      }

      // Check/request consent
      await this.checkConsent();
      if (!this.consentGiven) {
        this.log('Analytics disabled: No consent given');
        return;
      }

      // Initialize core components
      await this.initializeVisitor();
      await this.initializeSession();
      await this.detectLocation();
      
      // Set up tracking
      this.setupEventListeners();
      this.startHeartbeat();
      this.trackPageView();
      
      this.log('Analytics initialized successfully');
    } catch (error) {
      this.log('Analytics initialization failed:', error);
    }
  }

  /**
   * Check and manage user consent for tracking
   */
  async checkConsent() {
    const storedConsent = localStorage.getItem('analytics_consent');
    const consentTime = localStorage.getItem('analytics_consent_time');
    
    // Check if consent is still valid (1 year)
    if (storedConsent && consentTime) {
      const consentAge = Date.now() - parseInt(consentTime);
      if (consentAge < 365 * 24 * 60 * 60 * 1000) {
        this.consentGiven = storedConsent === 'granted';
        return;
      }
    }

    // Handle different consent modes
    switch (this.config.cookieConsent) {
      case 'required':
        this.consentGiven = await this.requestConsent();
        break;
      case 'optional':
        this.consentGiven = storedConsent !== 'denied';
        break;
      case 'disabled':
        this.consentGiven = true;
        break;
    }

    if (this.consentGiven !== null) {
      localStorage.setItem('analytics_consent', this.consentGiven ? 'granted' : 'denied');
      localStorage.setItem('analytics_consent_time', Date.now().toString());
    }
  }

  /**
   * Request user consent with a privacy-friendly banner
   */
  async requestConsent() {
    return new Promise((resolve) => {
      // Check if banner already exists
      if (document.getElementById('analytics-consent-banner')) {
        return;
      }

      const banner = document.createElement('div');
      banner.id = 'analytics-consent-banner';
      banner.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background: #1f2937;
        color: white;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        max-width: 600px;
        margin: 0 auto;
      `;

      banner.innerHTML = `
        <div style="margin-bottom: 12px;">
          <strong>Help us improve your experience</strong>
        </div>
        <div style="margin-bottom: 12px; opacity: 0.9;">
          We use anonymous analytics to understand how our contribution forms are used. 
          No personal information is collected.
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button id="consent-accept" style="
            background: #10b981; border: none; color: white; padding: 8px 16px;
            border-radius: 4px; cursor: pointer; font-size: 14px;
          ">Accept</button>
          <button id="consent-decline" style="
            background: #6b7280; border: none; color: white; padding: 8px 16px;
            border-radius: 4px; cursor: pointer; font-size: 14px;
          ">Decline</button>
          <button id="consent-learn-more" style="
            background: transparent; border: 1px solid #6b7280; color: white; 
            padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px;
          ">Learn More</button>
        </div>
      `;

      document.body.appendChild(banner);

      // Event handlers
      document.getElementById('consent-accept').onclick = () => {
        banner.remove();
        resolve(true);
      };

      document.getElementById('consent-decline').onclick = () => {
        banner.remove();
        resolve(false);
      };

      document.getElementById('consent-learn-more').onclick = () => {
        this.showPrivacyInfo();
      };

      // Auto-decline after 30 seconds of no interaction
      setTimeout(() => {
        if (document.getElementById('analytics-consent-banner')) {
          banner.remove();
          resolve(false);
        }
      }, 30000);
    });
  }

  /**
   * Show detailed privacy information
   */
  showPrivacyInfo() {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.7); z-index: 10001;
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
    `;

    modal.innerHTML = `
      <div style="
        background: white; padding: 24px; border-radius: 8px;
        max-width: 600px; max-height: 80vh; overflow-y: auto;
      ">
        <h2 style="margin-top: 0;">Privacy-First Analytics</h2>
        <h3>What we collect:</h3>
        <ul>
          <li>Anonymous visitor ID (no personal information)</li>
          <li>Page views and time spent on pages</li>
          <li>General location (country/city) via IP address</li>
          <li>Traffic source (how you found us)</li>
          <li>Form interactions and contribution success/failure</li>
        </ul>
        <h3>What we don't collect:</h3>
        <ul>
          <li>Personal information (name, email, address)</li>
          <li>Contribution amounts or wallet addresses</li>
          <li>Cross-site tracking</li>
          <li>Biometric or behavioral fingerprinting</li>
        </ul>
        <h3>Your rights:</h3>
        <ul>
          <li>Opt out anytime by clicking "Decline"</li>
          <li>Data automatically deleted after ${this.config.dataRetention} days</li>
          <li>Contact us to request data deletion</li>
        </ul>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: #10b981; border: none; color: white; padding: 10px 20px;
          border-radius: 4px; cursor: pointer; margin-top: 16px;
        ">Close</button>
      </div>
    `;

    document.body.appendChild(modal);
    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };
  }

  /**
   * Initialize visitor ID using localStorage with fallback
   */
  async initializeVisitor() {
    // Try to get existing visitor ID
    let storedVisitorId = localStorage.getItem('visitor_id');
    let visitorIdTime = localStorage.getItem('visitor_id_time');

    // Check if visitor ID is still valid (2 years)
    if (storedVisitorId && visitorIdTime) {
      const idAge = Date.now() - parseInt(visitorIdTime);
      if (idAge < 2 * 365 * 24 * 60 * 60 * 1000) {
        this.visitorId = storedVisitorId;
        return;
      }
    }

    // Generate new visitor ID
    this.visitorId = this.generateId('visitor');
    localStorage.setItem('visitor_id', this.visitorId);
    localStorage.setItem('visitor_id_time', Date.now().toString());
    
    this.log('New visitor ID generated:', this.visitorId);
  }

  /**
   * Initialize session tracking
   */
  async initializeSession() {
    // Check for existing session (within timeout period)
    const storedSessionId = sessionStorage.getItem('session_id');
    const sessionTime = sessionStorage.getItem('session_time');
    
    if (storedSessionId && sessionTime) {
      const sessionAge = Date.now() - parseInt(sessionTime);
      if (sessionAge < this.config.sessionTimeout * 60 * 1000) {
        this.sessionId = storedSessionId;
        this.sessionStart = new Date(parseInt(sessionTime));
        this.log('Existing session continued:', this.sessionId);
        return;
      }
    }

    // Create new session
    this.sessionId = this.generateId('session');
    this.sessionStart = new Date();
    this.lastActivity = new Date();

    sessionStorage.setItem('session_id', this.sessionId);
    sessionStorage.setItem('session_time', this.sessionStart.getTime().toString());
    
    this.log('New session started:', this.sessionId);
  }

  /**
   * Detect user location using IP geolocation
   */
  async detectLocation() {
    if (!this.config.enableGeolocation) return;

    try {
      // Use multiple fallback services
      const services = [
        'https://api.ipapi.com/api/check?access_key=YOUR_KEY&format=1',
        'https://ipapi.co/json/',
        'https://api.ipify.org?format=json' // IP only fallback
      ];

      for (const service of services) {
        try {
          const response = await fetch(service, { 
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          });
          
          if (response.ok) {
            const data = await response.json();
            
            // Standardize location data
            this.location = {
              country: data.country_code || data.country || null,
              region: data.region || data.region_name || null,
              city: data.city || null,
              timezone: data.timezone || null,
              ip: data.ip || null
            };
            
            this.log('Location detected:', this.location);
            break;
          }
        } catch (serviceError) {
          this.log('Location service failed:', service, serviceError);
          continue;
        }
      }
    } catch (error) {
      this.log('Location detection failed:', error);
    }
  }

  /**
   * Set up event listeners for tracking
   */
  setupEventListeners() {
    // Page interaction tracking
    if (this.config.enableScrollTracking) {
      this.setupScrollTracking();
    }

    if (this.config.enableClickTracking) {
      this.setupClickTracking();
    }

    // Form interaction tracking
    this.setupFormTracking();

    // Page visibility and unload tracking
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('page_hidden');
        this.flushEvents();
      } else {
        this.trackEvent('page_visible');
        this.updateLastActivity();
      }
    });

    window.addEventListener('beforeunload', () => {
      this.trackEvent('page_unload');
      this.flushEvents(true); // Synchronous flush
    });

    // Error tracking
    window.addEventListener('error', (event) => {
      this.trackEvent('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno
      });
    });
  }

  /**
   * Set up scroll depth tracking
   */
  setupScrollTracking() {
    let throttleTimer = null;
    
    const trackScroll = () => {
      if (throttleTimer) return;
      
      throttleTimer = setTimeout(() => {
        const scrollTop = window.pageYOffset;
        const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = Math.round((scrollTop / documentHeight) * 100);
        
        if (scrollPercent > this.maxScrollDepth) {
          this.maxScrollDepth = scrollPercent;
          
          // Track milestone percentages
          if (scrollPercent >= 25 && this.maxScrollDepth < 25) {
            this.trackEvent('scroll_25');
          } else if (scrollPercent >= 50 && this.maxScrollDepth < 50) {
            this.trackEvent('scroll_50');
          } else if (scrollPercent >= 75 && this.maxScrollDepth < 75) {
            this.trackEvent('scroll_75');
          } else if (scrollPercent >= 90 && this.maxScrollDepth < 90) {
            this.trackEvent('scroll_90');
          }
        }
        
        throttleTimer = null;
      }, 250);
    };

    window.addEventListener('scroll', trackScroll, { passive: true });
  }

  /**
   * Set up click tracking
   */
  setupClickTracking() {
    document.addEventListener('click', (event) => {
      this.clickCount++;
      this.updateLastActivity();

      const element = event.target;
      const tagName = element.tagName.toLowerCase();
      
      // Track important clicks
      if (tagName === 'button' || tagName === 'a' || element.onclick) {
        this.trackEvent('click', {
          element: tagName,
          text: element.textContent?.substring(0, 100) || '',
          href: element.href || null,
          id: element.id || null,
          className: element.className || null
        });
      }
    }, { passive: true });
  }

  /**
   * Set up form interaction tracking
   */
  setupFormTracking() {
    // Track form field interactions
    document.addEventListener('focus', (event) => {
      if (event.target.tagName.toLowerCase() === 'input' || 
          event.target.tagName.toLowerCase() === 'textarea' ||
          event.target.tagName.toLowerCase() === 'select') {
        
        const fieldId = event.target.id || event.target.name || 'unknown';
        this.formInteractions.add(fieldId);
        
        this.trackEvent('form_field_focus', {
          field: fieldId,
          type: event.target.type || 'text'
        });
      }
    }, true);

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target;
      this.trackEvent('form_submit', {
        formId: form.id || 'unknown',
        fields: Array.from(this.formInteractions)
      });
    }, true);

    // Track contribution form specific events
    this.setupContributionFormTracking();
  }

  /**
   * Set up contribution form specific tracking
   */
  setupContributionFormTracking() {
    // Track wallet connection attempts
    document.addEventListener('click', (event) => {
      const element = event.target;
      if (element.textContent?.includes('Connect') && 
          element.textContent?.includes('Wallet')) {
        this.trackEvent('wallet_connect_attempt');
      }
    });

    // Track contribution amount changes
    const trackAmountChange = (event) => {
      if (event.target.id?.includes('amount') || 
          event.target.name?.includes('amount')) {
        this.trackEvent('contribution_amount_change', {
          hasValue: !!event.target.value
        });
      }
    };

    document.addEventListener('input', trackAmountChange);
    document.addEventListener('change', trackAmountChange);
  }

  /**
   * Track page view
   */
  trackPageView() {
    const pageData = {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      campaign_id: this.extractCampaignId(),
      ...this.getTrafficSource(),
      load_time: Date.now() - this.pageLoadTime
    };

    this.trackEvent('page_view', pageData);
  }

  /**
   * Track custom event
   */
  trackEvent(eventType, eventData = {}) {
    if (!this.consentGiven || !this.sessionId) return;

    const event = {
      id: this.generateId('event'),
      visitor_id: this.visitorId,
      session_id: this.sessionId,
      campaign_id: this.extractCampaignId(),
      event_type: eventType,
      event_data: eventData,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      location: this.location
    };

    this.events.push(event);
    this.log('Event tracked:', eventType, eventData);

    // Trigger batch send if needed
    if (this.events.length >= this.config.batchSize) {
      this.flushEvents();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.flushEvents();
      }, this.config.batchTimeout);
    }

    this.updateLastActivity();
  }

  /**
   * Track conversion event with detailed data
   */
  trackConversion(conversionData) {
    this.trackEvent('conversion', {
      ...conversionData,
      session_duration: Date.now() - this.sessionStart.getTime(),
      page_views: this.events.filter(e => e.event_type === 'page_view').length,
      form_interactions: Array.from(this.formInteractions),
      max_scroll_depth: this.maxScrollDepth,
      click_count: this.clickCount
    });

    // Immediately flush conversion events
    this.flushEvents();
  }

  /**
   * Extract campaign ID from URL
   */
  extractCampaignId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('campaign') || 
           urlParams.get('campaign_id') || 
           window.location.pathname.match(/\/campaign\/([^\/]+)/)?.[1] || 
           null;
  }

  /**
   * Analyze traffic source from referrer and URL parameters
   */
  getTrafficSource() {
    const urlParams = new URLSearchParams(window.location.search);
    const referrer = document.referrer;

    // UTM parameters take precedence
    if (urlParams.get('utm_source')) {
      return {
        traffic_source: urlParams.get('utm_source'),
        traffic_medium: urlParams.get('utm_medium') || 'unknown',
        traffic_campaign: urlParams.get('utm_campaign'),
        traffic_content: urlParams.get('utm_content'),
        traffic_term: urlParams.get('utm_term')
      };
    }

    // Analyze referrer
    if (!referrer) {
      return {
        traffic_source: 'direct',
        traffic_medium: 'direct'
      };
    }

    const referrerDomain = new URL(referrer).hostname.toLowerCase();
    
    // Social media sources
    const socialSources = {
      'facebook.com': { source: 'facebook', medium: 'social' },
      'twitter.com': { source: 'twitter', medium: 'social' },
      'linkedin.com': { source: 'linkedin', medium: 'social' },
      'instagram.com': { source: 'instagram', medium: 'social' },
      'youtube.com': { source: 'youtube', medium: 'social' },
      'tiktok.com': { source: 'tiktok', medium: 'social' },
      'reddit.com': { source: 'reddit', medium: 'social' }
    };

    // Search engines
    const searchSources = {
      'google.com': { source: 'google', medium: 'organic' },
      'bing.com': { source: 'bing', medium: 'organic' },
      'yahoo.com': { source: 'yahoo', medium: 'organic' },
      'duckduckgo.com': { source: 'duckduckgo', medium: 'organic' },
      'baidu.com': { source: 'baidu', medium: 'organic' }
    };

    // Check social media
    for (const [domain, source] of Object.entries(socialSources)) {
      if (referrerDomain.includes(domain)) {
        return {
          traffic_source: source.source,
          traffic_medium: source.medium
        };
      }
    }

    // Check search engines
    for (const [domain, source] of Object.entries(searchSources)) {
      if (referrerDomain.includes(domain)) {
        return {
          traffic_source: source.source,
          traffic_medium: source.medium
        };
      }
    }

    // Default to referral
    return {
      traffic_source: referrerDomain,
      traffic_medium: 'referral'
    };
  }

  /**
   * Send events to backend
   */
  async flushEvents(synchronous = false) {
    if (!this.events.length || !this.consentGiven) return;

    const eventsToSend = [...this.events];
    this.events = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    try {
      const payload = {
        events: eventsToSend,
        session_summary: {
          visitor_id: this.visitorId,
          session_id: this.sessionId,
          session_start: this.sessionStart?.toISOString(),
          session_duration: this.sessionStart ? Date.now() - this.sessionStart.getTime() : 0,
          page_count: eventsToSend.filter(e => e.event_type === 'page_view').length,
          max_scroll_depth: this.maxScrollDepth,
          click_count: this.clickCount,
          form_interactions: Array.from(this.formInteractions)
        }
      };

      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      };

      if (synchronous && navigator.sendBeacon) {
        // Use sendBeacon for synchronous requests (page unload)
        navigator.sendBeacon(
          `${this.config.supabaseUrl}${this.config.apiEndpoint}`,
          JSON.stringify(payload)
        );
      } else {
        // Regular async request
        const response = await fetch(
          `${this.config.supabaseUrl}${this.config.apiEndpoint}`,
          requestOptions
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      this.log('Events sent successfully:', eventsToSend.length);
    } catch (error) {
      this.log('Failed to send events:', error);
      // Re-add events to queue for retry
      this.events.unshift(...eventsToSend);
    }
  }

  /**
   * Start heartbeat to track session activity
   */
  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      // Check if session has timed out
      const inactiveTime = Date.now() - this.lastActivity.getTime();
      if (inactiveTime > this.config.sessionTimeout * 60 * 1000) {
        this.trackEvent('session_timeout');
        this.flushEvents();
        this.stopHeartbeat();
        return;
      }

      // Send heartbeat
      this.trackEvent('heartbeat', {
        session_duration: Date.now() - this.sessionStart.getTime(),
        inactive_time: inactiveTime
      });
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat timer
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Update last activity timestamp
   */
  updateLastActivity() {
    this.lastActivity = new Date();
  }

  /**
   * Generate unique ID with prefix
   */
  generateId(prefix = 'id') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Enable or disable tracking
   */
  setTrackingEnabled(enabled) {
    this.consentGiven = enabled;
    localStorage.setItem('analytics_consent', enabled ? 'granted' : 'denied');
    localStorage.setItem('analytics_consent_time', Date.now().toString());

    if (!enabled) {
      this.stopHeartbeat();
      this.events = [];
      this.log('Tracking disabled by user');
    } else {
      this.init();
      this.log('Tracking enabled by user');
    }
  }

  /**
   * Get tracking status
   */
  getTrackingStatus() {
    return {
      enabled: this.consentGiven,
      visitorId: this.visitorId,
      sessionId: this.sessionId,
      sessionStart: this.sessionStart,
      location: this.location,
      pendingEvents: this.events.length
    };
  }

  /**
   * Clear all stored data (GDPR right to be forgotten)
   */
  clearAllData() {
    // Clear localStorage
    localStorage.removeItem('visitor_id');
    localStorage.removeItem('visitor_id_time');
    localStorage.removeItem('analytics_consent');
    localStorage.removeItem('analytics_consent_time');

    // Clear sessionStorage
    sessionStorage.removeItem('session_id');
    sessionStorage.removeItem('session_time');

    // Clear instance data
    this.visitorId = null;
    this.sessionId = null;
    this.sessionStart = null;
    this.events = [];
    this.consentGiven = false;

    this.stopHeartbeat();
    this.log('All analytics data cleared');
  }

  /**
   * Debug logging
   */
  log(...args) {
    if (this.config.debug) {
      console.log('[CampaignAnalytics]', ...args);
    }
  }
}

// Create global instance
let analytics = null;

// Initialize analytics when DOM is ready
if (typeof document !== 'undefined') {
  const initAnalytics = () => {
    if (!analytics) {
      analytics = new CampaignAnalytics({
        debug: process.env.NODE_ENV === 'development'
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnalytics);
  } else {
    initAnalytics();
  }
}

// Export for module usage
export default CampaignAnalytics;
export { analytics };

// Expose global functions for easy integration
if (typeof window !== 'undefined') {
  window.trackEvent = (eventType, eventData) => {
    analytics?.trackEvent(eventType, eventData);
  };
  
  window.trackConversion = (conversionData) => {
    analytics?.trackConversion(conversionData);
  };
  
  window.setAnalyticsConsent = (enabled) => {
    analytics?.setTrackingEnabled(enabled);
  };
  
  window.getAnalyticsStatus = () => {
    return analytics?.getTrackingStatus();
  };
}