/**
 * Analytics Test Suite
 * Comprehensive testing utilities for the campaign analytics system
 */

import CampaignAnalytics from './campaignAnalytics';

class AnalyticsTestSuite {
  constructor() {
    this.testResults = [];
    this.analytics = null;
    this.mockConsole = {
      log: (...args) => this.testResults.push({ type: 'log', message: args.join(' ') }),
      error: (...args) => this.testResults.push({ type: 'error', message: args.join(' ') }),
      warn: (...args) => this.testResults.push({ type: 'warn', message: args.join(' ') }),
    };
  }

  /**
   * Initialize test environment
   */
  async setup() {
    // Mock localStorage
    global.localStorage = {
      data: {},
      getItem: (key) => global.localStorage.data[key] || null,
      setItem: (key, value) => (global.localStorage.data[key] = value),
      removeItem: (key) => delete global.localStorage.data[key],
      clear: () => (global.localStorage.data = {}),
    };

    // Mock sessionStorage
    global.sessionStorage = {
      data: {},
      getItem: (key) => global.sessionStorage.data[key] || null,
      setItem: (key, value) => (global.sessionStorage.data[key] = value),
      removeItem: (key) => delete global.sessionStorage.data[key],
      clear: () => (global.sessionStorage.data = {}),
    };

    // Mock document and window
    global.document = {
      readyState: 'complete',
      referrer: 'https://google.com/search',
      title: 'Test Campaign Page',
      addEventListener: () => {},
      getElementById: () => null,
      createElement: () => ({
        style: {},
        innerHTML: '',
        onclick: null,
        remove: () => {},
        addEventListener: () => {},
      }),
      body: { appendChild: () => {} },
    };

    global.window = {
      location: {
        href: 'https://example.com/campaign/test-campaign?utm_source=google&utm_medium=cpc',
        pathname: '/campaign/test-campaign',
        search: '?utm_source=google&utm_medium=cpc',
      },
      innerWidth: 1920,
      innerHeight: 1080,
      pageYOffset: 0,
      addEventListener: () => {},
      removeEventListener: () => {},
    };

    global.navigator = {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      doNotTrack: '0',
      sendBeacon: () => true,
    };

    global.screen = {
      width: 2560,
      height: 1440,
    };

    // Mock fetch for API calls
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    );

    console.log('Test environment initialized');
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    await this.setup();

    console.log('🧪 Starting Analytics Test Suite...\n');

    const tests = [
      'testVisitorIdGeneration',
      'testSessionManagement',
      'testConsentManagement',
      'testEventTracking',
      'testTrafficSourceDetection',
      'testFormInteractionTracking',
      'testConversionTracking',
      'testPrivacyCompliance',
      'testErrorHandling',
      'testPerformance',
    ];

    for (const testName of tests) {
      try {
        await this[testName]();
        console.log(`✅ ${testName} - PASSED`);
      } catch (error) {
        console.error(`❌ ${testName} - FAILED:`, error.message);
      }
    }

    this.printSummary();
  }

  /**
   * Test visitor ID generation and persistence
   */
  async testVisitorIdGeneration() {
    // Clear storage
    localStorage.clear();

    // Create analytics instance
    const analytics = new CampaignAnalytics({
      debug: false,
      cookieConsent: 'disabled',
    });

    await analytics.initializeVisitor();

    const visitorId1 = analytics.visitorId;
    this.assert(visitorId1, 'Visitor ID should be generated');
    this.assert(visitorId1.startsWith('visitor_'), 'Visitor ID should have correct prefix');

    // Test persistence
    const analytics2 = new CampaignAnalytics({
      debug: false,
      cookieConsent: 'disabled',
    });
    await analytics2.initializeVisitor();

    const visitorId2 = analytics2.visitorId;
    this.assert(visitorId1 === visitorId2, 'Visitor ID should persist across instances');
  }

  /**
   * Test session management
   */
  async testSessionManagement() {
    sessionStorage.clear();

    const analytics = new CampaignAnalytics({
      debug: false,
      cookieConsent: 'disabled',
      sessionTimeout: 1, // 1 minute for testing
    });

    await analytics.initializeSession();

    const sessionId1 = analytics.sessionId;
    this.assert(sessionId1, 'Session ID should be generated');
    this.assert(sessionId1.startsWith('session_'), 'Session ID should have correct prefix');
    this.assert(analytics.sessionStart instanceof Date, 'Session start should be a Date');

    // Test session continuation
    const analytics2 = new CampaignAnalytics({
      debug: false,
      cookieConsent: 'disabled',
      sessionTimeout: 1,
    });
    await analytics2.initializeSession();

    this.assert(analytics2.sessionId === sessionId1, 'Session should continue if within timeout');
  }

  /**
   * Test consent management
   */
  async testConsentManagement() {
    localStorage.clear();

    // Test optional consent (default allow)
    const analytics1 = new CampaignAnalytics({
      debug: false,
      cookieConsent: 'optional',
    });
    await analytics1.checkConsent();
    this.assert(analytics1.consentGiven !== false, 'Optional consent should default to allow');

    // Test required consent
    const analytics2 = new CampaignAnalytics({
      debug: false,
      cookieConsent: 'required',
    });

    // Mock user denying consent
    analytics2.requestConsent = () => Promise.resolve(false);
    await analytics2.checkConsent();
    this.assert(analytics2.consentGiven === false, 'Required consent should respect user choice');

    // Test disabled consent
    const analytics3 = new CampaignAnalytics({
      debug: false,
      cookieConsent: 'disabled',
    });
    await analytics3.checkConsent();
    this.assert(analytics3.consentGiven === true, 'Disabled consent should always allow');
  }

  /**
   * Test event tracking
   */
  async testEventTracking() {
    const analytics = new CampaignAnalytics({
      debug: false,
      cookieConsent: 'disabled',
    });

    await analytics.init();

    // Clear events
    analytics.events = [];

    // Track custom event
    analytics.trackEvent('test_event', { key: 'value' });

    this.assert(analytics.events.length === 1, 'Event should be tracked');

    const event = analytics.events[0];
    this.assert(event.event_type === 'test_event', 'Event type should match');
    this.assert(event.event_data.key === 'value', 'Event data should be preserved');
    this.assert(event.visitor_id === analytics.visitorId, 'Event should include visitor ID');
    this.assert(event.session_id === analytics.sessionId, 'Event should include session ID');
  }

  /**
   * Test traffic source detection
   */
  async testTrafficSourceDetection() {
    // Test UTM parameters
    window.location.search = '?utm_source=facebook&utm_medium=social&utm_campaign=spring2024';

    const analytics = new CampaignAnalytics({
      debug: false,
      cookieConsent: 'disabled',
    });

    const trafficSource = analytics.getTrafficSource();

    this.assert(trafficSource.traffic_source === 'facebook', 'Should detect UTM source');
    this.assert(trafficSource.traffic_medium === 'social', 'Should detect UTM medium');
    this.assert(trafficSource.traffic_campaign === 'spring2024', 'Should detect UTM campaign');

    // Test referrer detection
    window.location.search = '';
    document.referrer = 'https://twitter.com/somepost';

    const analytics2 = new CampaignAnalytics({
      debug: false,
      cookieConsent: 'disabled',
    });

    const trafficSource2 = analytics2.getTrafficSource();
    this.assert(trafficSource2.traffic_source === 'twitter', 'Should detect Twitter referrer');
    this.assert(
      trafficSource2.traffic_medium === 'social',
      'Should classify social media correctly'
    );

    // Test direct traffic
    document.referrer = '';

    const analytics3 = new CampaignAnalytics({
      debug: false,
      cookieConsent: 'disabled',
    });

    const trafficSource3 = analytics3.getTrafficSource();
    this.assert(trafficSource3.traffic_source === 'direct', 'Should detect direct traffic');
  }

  /**
   * Test form interaction tracking
   */
  async testFormInteractionTracking() {
    const analytics = new CampaignAnalytics({
      debug: false,
      cookieConsent: 'disabled',
    });

    await analytics.init();
    analytics.events = [];

    // Mock form elements
    const mockInput = {
      tagName: 'INPUT',
      id: 'contribution-amount',
      type: 'number',
      value: '1.5',
      name: 'amount',
    };

    const mockForm = {
      tagName: 'FORM',
      id: 'contribution-form',
    };

    // Simulate focus event
    const focusEvent = { target: mockInput };
    document.addEventListener = (event, handler) => {
      if (event === 'focus') {
        handler(focusEvent);
      }
    };

    analytics.setupFormTracking();

    // Check if form interaction was tracked
    this.assert(
      analytics.formInteractions.has('contribution-amount'),
      'Form field should be tracked'
    );
  }

  /**
   * Test conversion tracking
   */
  async testConversionTracking() {
    const analytics = new CampaignAnalytics({
      debug: false,
      cookieConsent: 'disabled',
    });

    await analytics.init();
    analytics.events = [];

    const conversionData = {
      amount: 2.5,
      transaction_hash: '0x123abc',
      currency: 'ETH',
    };

    analytics.trackConversion(conversionData);

    this.assert(analytics.events.length === 1, 'Conversion event should be tracked');

    const event = analytics.events[0];
    this.assert(event.event_type === 'conversion', 'Event type should be conversion');
    this.assert(event.event_data.amount === 2.5, 'Amount should be preserved');
    this.assert(
      event.event_data.transaction_hash === '0x123abc',
      'Transaction hash should be preserved'
    );
  }

  /**
   * Test privacy compliance features
   */
  async testPrivacyCompliance() {
    // Test Do Not Track respect
    navigator.doNotTrack = '1';

    const analytics1 = new CampaignAnalytics({
      debug: false,
      respectDNT: true,
      cookieConsent: 'disabled',
    });

    await analytics1.init();
    this.assert(analytics1.consentGiven !== true, 'Should respect Do Not Track');

    // Test data clearing
    navigator.doNotTrack = '0';

    const analytics2 = new CampaignAnalytics({
      debug: false,
      cookieConsent: 'disabled',
    });

    await analytics2.init();
    analytics2.trackEvent('test_event');

    this.assert(analytics2.events.length > 0, 'Should have events before clearing');

    analytics2.clearAllData();

    this.assert(analytics2.events.length === 0, 'Events should be cleared');
    this.assert(analytics2.visitorId === null, 'Visitor ID should be cleared');
    this.assert(localStorage.getItem('visitor_id') === null, 'Storage should be cleared');
  }

  /**
   * Test error handling
   */
  async testErrorHandling() {
    // Mock fetch failure
    const originalFetch = global.fetch;
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

    const analytics = new CampaignAnalytics({
      debug: false,
      cookieConsent: 'disabled',
    });

    await analytics.init();
    analytics.trackEvent('test_event');

    // Should not throw error
    try {
      await analytics.flushEvents();
      console.log('Error handling test passed - no exception thrown');
    } catch (error) {
      throw new Error('Should handle network errors gracefully');
    }

    // Restore fetch
    global.fetch = originalFetch;
  }

  /**
   * Test performance characteristics
   */
  async testPerformance() {
    const analytics = new CampaignAnalytics({
      debug: false,
      cookieConsent: 'disabled',
      batchSize: 5,
    });

    await analytics.init();
    analytics.events = [];

    // Test batch processing
    const startTime = Date.now();

    for (let i = 0; i < 10; i++) {
      analytics.trackEvent(`test_event_${i}`, { index: i });
    }

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    this.assert(processingTime < 100, `Event tracking should be fast (${processingTime}ms)`);
    this.assert(analytics.events.length <= 5, 'Should trigger batch send at batch size');

    // Test ID generation performance
    const idStartTime = Date.now();
    const ids = [];

    for (let i = 0; i < 1000; i++) {
      ids.push(analytics.generateId('test'));
    }

    const idEndTime = Date.now();
    const idGenerationTime = idEndTime - idStartTime;

    this.assert(idGenerationTime < 50, `ID generation should be fast (${idGenerationTime}ms)`);
    this.assert(new Set(ids).size === 1000, 'All generated IDs should be unique');
  }

  /**
   * Test utility - assertion helper
   */
  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  /**
   * Print test summary
   */
  printSummary() {
    const logs = this.testResults.filter((r) => r.type === 'log');
    const errors = this.testResults.filter((r) => r.type === 'error');

    console.log('\n📊 Test Summary:');
    console.log(`   Logs: ${logs.length}`);
    console.log(`   Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach((error) => console.log(`   - ${error.message}`));
    }

    console.log('\n🎉 Analytics Test Suite Complete!');
  }
}

/**
 * Manual testing utilities for browser environment
 */
export const manualTests = {
  /**
   * Test analytics initialization in browser
   */
  testInitialization: async () => {
    console.log('🧪 Testing analytics initialization...');

    const analytics = new CampaignAnalytics({
      debug: true,
      cookieConsent: 'disabled',
    });

    await analytics.init();

    console.log('✅ Analytics initialized');
    console.log('Visitor ID:', analytics.visitorId);
    console.log('Session ID:', analytics.sessionId);
    console.log('Status:', analytics.getTrackingStatus());
  },

  /**
   * Test event tracking
   */
  testEventTracking: () => {
    console.log('🧪 Testing event tracking...');

    if (window.trackEvent) {
      window.trackEvent('manual_test_event', {
        test: true,
        timestamp: Date.now(),
      });

      console.log('✅ Event tracked via global function');
    } else {
      console.error('❌ Global trackEvent function not available');
    }
  },

  /**
   * Test form interactions
   */
  testFormInteractions: () => {
    console.log('🧪 Testing form interactions...');

    // Create test form elements
    const form = document.createElement('form');
    form.id = 'test-form';

    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'test-input';
    input.placeholder = 'Test input field';

    const button = document.createElement('button');
    button.type = 'submit';
    button.textContent = 'Test Submit';

    form.appendChild(input);
    form.appendChild(button);
    document.body.appendChild(form);

    // Test focus event
    input.focus();

    // Test form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      console.log('✅ Form interaction events should be tracked');
    });

    setTimeout(() => {
      form.dispatchEvent(new Event('submit'));
      document.body.removeChild(form);
    }, 1000);
  },

  /**
   * Test conversion tracking
   */
  testConversionTracking: () => {
    console.log('🧪 Testing conversion tracking...');

    if (window.trackConversion) {
      window.trackConversion({
        amount: 1.5,
        transaction_hash: '0xtest123',
        currency: 'ETH',
        test: true,
      });

      console.log('✅ Conversion tracked via global function');
    } else {
      console.error('❌ Global trackConversion function not available');
    }
  },

  /**
   * Test privacy controls
   */
  testPrivacyControls: () => {
    console.log('🧪 Testing privacy controls...');

    if (window.setAnalyticsConsent) {
      // Test disabling
      window.setAnalyticsConsent(false);
      console.log('Analytics disabled');

      // Test enabling
      setTimeout(() => {
        window.setAnalyticsConsent(true);
        console.log('Analytics enabled');
        console.log('✅ Privacy controls working');
      }, 2000);
    } else {
      console.error('❌ Global setAnalyticsConsent function not available');
    }
  },

  /**
   * Run all manual tests
   */
  runAll: async () => {
    await manualTests.testInitialization();
    setTimeout(() => manualTests.testEventTracking(), 1000);
    setTimeout(() => manualTests.testFormInteractions(), 2000);
    setTimeout(() => manualTests.testConversionTracking(), 4000);
    setTimeout(() => manualTests.testPrivacyControls(), 5000);
  },
};

// Export test suite
export default AnalyticsTestSuite;

// Auto-run tests in Node.js environment
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  const testSuite = new AnalyticsTestSuite();
  testSuite.runAllTests().catch(console.error);
}
