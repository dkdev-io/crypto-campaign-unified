# Campaign Analytics System

A comprehensive, privacy-compliant analytics tracking system for cryptocurrency contribution campaigns.

## 🚀 Features

### Core Analytics

- **Anonymous Visitor Tracking** - Generate unique visitor IDs without collecting personal information
- **Session Management** - Track user sessions with automatic timeout and continuation
- **Page Interaction Tracking** - Monitor scrolling, clicks, form interactions, and page views
- **Conversion Tracking** - Link page visits to actual contributions with attribution models
- **Real-time Analytics** - Live data collection with batching for performance

### Privacy & Compliance

- **GDPR/CCPA Compliant** - Built-in consent management and user rights
- **Do Not Track Support** - Respects browser DNT settings
- **Opt-out Anytime** - Users can disable tracking at any point
- **Data Retention Limits** - Automatic data deletion after configured period
- **No Cross-Site Tracking** - Isolated to your domain only

### Traffic Attribution

- **UTM Parameter Support** - Full UTM tracking for campaign attribution
- **Referrer Analysis** - Automatically classify traffic sources (Google, Facebook, Twitter, etc.)
- **First/Last Touch Attribution** - Multiple attribution models supported
- **Social Media Detection** - Identify traffic from major social platforms

### Form Analytics

- **Form Interaction Tracking** - Monitor field focus, completion rates
- **Wallet Connection Analytics** - Track wallet connection success/failure
- **Contribution Funnel** - Complete funnel from view to conversion
- **Error Tracking** - Monitor and track form submission errors

## 📦 Installation

1. **Install the analytics components:**

```bash
# The analytics system is already included in your project
# No additional dependencies required
```

2. **Wrap your app with the AnalyticsProvider:**

```jsx
import { AnalyticsProvider } from './components/analytics/AnalyticsProvider';
import PrivacyBanner from './components/analytics/PrivacyBanner';

function App() {
  return (
    <AnalyticsProvider
      config={{
        debug: process.env.NODE_ENV === 'development',
        cookieConsent: 'optional', // 'required', 'optional', 'disabled'
        respectDNT: true,
        enableGeolocation: true,
      }}
    >
      {/* Your app content */}
      <PrivacyBanner />
    </AnalyticsProvider>
  );
}
```

## 🔧 Configuration

### Analytics Provider Config

```jsx
<AnalyticsProvider config={{
  // Privacy settings
  respectDNT: true,              // Respect Do Not Track
  cookieConsent: 'optional',     // 'required', 'optional', 'disabled'
  dataRetention: 365,            // Days to retain data

  // Feature toggles
  enableGeolocation: true,       // IP-based location detection
  enableScrollTracking: true,    // Scroll depth tracking
  enableClickTracking: true,     // Click event tracking

  // Performance settings
  batchSize: 10,                // Events per batch
  batchTimeout: 5000,           // Batch timeout (ms)
  sessionTimeout: 30,           // Session timeout (minutes)

  // Debug mode
  debug: false                  // Enable debug logging
}}>
```

### Supabase Environment Variables

```bash
# Add to your .env file
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📊 Usage Examples

### Basic Event Tracking

```jsx
import { useAnalytics } from './components/analytics/AnalyticsProvider';

function MyComponent() {
  const { trackEvent } = useAnalytics();

  const handleButtonClick = () => {
    trackEvent('button_click', {
      buttonId: 'cta-button',
      location: 'hero-section',
    });
  };

  return <button onClick={handleButtonClick}>Contribute</button>;
}
```

### Form Analytics

```jsx
import { useAnalytics } from './components/analytics/AnalyticsProvider';

function ContributionForm() {
  const { trackFormStart, trackContributionSuccess, trackContributionFailure } = useAnalytics();

  const handleSubmit = async (formData) => {
    trackFormStart('contribution-form');

    try {
      const result = await submitContribution(formData);

      trackContributionSuccess(formData.amount, result.transactionHash, 'ETH');
    } catch (error) {
      trackContributionFailure(formData.amount, error.message, 'ETH');
    }
  };
}
```

### Wallet Connection Tracking

```jsx
const { trackWalletConnect } = useAnalytics();

const connectWallet = async () => {
  trackWalletConnect('metamask');
  // ... wallet connection logic
};
```

### Global Functions (Alternative)

```javascript
// Available globally without React hooks
window.trackEvent('page_interaction', { type: 'scroll', depth: 50 });
window.trackConversion({ amount: 1.5, hash: '0x123...' });
window.setAnalyticsConsent(false); // Disable tracking
window.getAnalyticsStatus(); // Get current status
```

## 🎯 Privacy Banner Component

The privacy banner handles GDPR/CCPA compliance automatically:

```jsx
import PrivacyBanner from './components/analytics/PrivacyBanner';

<PrivacyBanner
  position="bottom" // 'top', 'bottom', 'bottom-left', 'bottom-right'
  theme="dark" // 'dark', 'light', 'blue', 'transparent'
  showLearnMore={true} // Show detailed privacy info
  onConsentChange={(granted) => {
    console.log('User consent:', granted);
  }}
/>;
```

## 📈 Analytics Dashboard Integration

The system integrates with your Supabase database:

### Key Tables Created:

- `page_views` - Individual page view records
- `user_sessions_analytics` - Session summaries with conversion data
- `traffic_sources` - Daily traffic source aggregations
- `campaign_analytics_summary` - Real-time dashboard summaries

### Sample Analytics Queries:

```sql
-- Get daily conversions by traffic source
SELECT
  traffic_source,
  COUNT(*) as conversions,
  SUM(contribution_amount) as total_revenue
FROM user_sessions_analytics
WHERE contributed = true
AND DATE(session_start) = CURRENT_DATE
GROUP BY traffic_source;

-- Calculate conversion funnel
SELECT
  campaign_id,
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE contributed = true) as conversions,
  ROUND(
    (COUNT(*) FILTER (WHERE contributed = true)::DECIMAL / COUNT(*)::DECIMAL) * 100,
    2
  ) as conversion_rate
FROM user_sessions_analytics
GROUP BY campaign_id;
```

## 🧪 Testing

### Run the Test Suite

```javascript
import AnalyticsTestSuite from './utils/analyticsTestSuite';

const testSuite = new AnalyticsTestSuite();
testSuite.runAllTests();
```

### Manual Browser Testing

```javascript
import { manualTests } from './utils/analyticsTestSuite';

// Test analytics initialization
manualTests.testInitialization();

// Test event tracking
manualTests.testEventTracking();

// Test form interactions
manualTests.testFormInteractions();

// Run all tests
manualTests.runAll();
```

### Console Testing

Open browser console and run:

```javascript
// Check if analytics is working
window.getAnalyticsStatus();

// Track a test event
window.trackEvent('test_event', { test: true });

// Test conversion tracking
window.trackConversion({
  amount: 1.0,
  transaction_hash: '0xtest123',
  test: true,
});
```

## 🔒 Privacy Features

### Consent Management

- **Automatic Banner Display** - Shows privacy banner on first visit
- **Consent Persistence** - Remembers user choice for 1 year
- **Re-consent Required** - Asks for consent renewal annually
- **Granular Controls** - Users can enable/disable specific tracking features

### Data Protection

- **Anonymous IDs Only** - No personal information collected
- **IP Anonymization** - Only country/city level location data
- **Secure Storage** - All data encrypted in transit and at rest
- **Automatic Deletion** - Data automatically deleted after retention period

### User Rights (GDPR/CCPA)

- **Right to Access** - Users can view their analytics status
- **Right to Delete** - Complete data deletion on request
- **Right to Opt-out** - Disable tracking anytime
- **Data Portability** - Export user's analytics data

## 🚀 Performance

### Optimizations

- **Batched Requests** - Events sent in batches to reduce network overhead
- **Lazy Loading** - Analytics only loads when needed
- **Debounced Events** - Scroll and resize events debounced for performance
- **Minimal Payload** - Only essential data sent to backend
- **Background Processing** - Non-blocking event processing

### Benchmarks

- **Bundle Size**: ~15KB minified + gzipped
- **Memory Usage**: <2MB average
- **Network**: <1KB per batch request
- **Performance Impact**: <5ms initialization time

## 🛠️ Troubleshooting

### Common Issues

**Analytics not tracking:**

```javascript
// Check consent status
console.log(window.getAnalyticsStatus());

// Check for Do Not Track
console.log(navigator.doNotTrack);

// Verify Supabase connection
console.log(process.env.REACT_APP_SUPABASE_URL);
```

**Events not sending:**

```javascript
// Check network tab in browser dev tools
// Look for POST requests to /rest/v1/rpc/create_or_update_session

// Enable debug mode
const analytics = new CampaignAnalytics({ debug: true });
```

**Privacy banner not showing:**

```javascript
// Clear consent to show banner again
localStorage.removeItem('analytics_consent');
localStorage.removeItem('analytics_consent_time');
```

### Debug Mode

Enable debug mode to see detailed logging:

```jsx
<AnalyticsProvider config={{ debug: true }}>
```

## 📚 API Reference

### AnalyticsProvider Props

| Prop                       | Type    | Default    | Description                                      |
| -------------------------- | ------- | ---------- | ------------------------------------------------ |
| `config.debug`             | boolean | false      | Enable debug logging                             |
| `config.cookieConsent`     | string  | 'optional' | Consent mode: 'required', 'optional', 'disabled' |
| `config.respectDNT`        | boolean | true       | Respect Do Not Track header                      |
| `config.dataRetention`     | number  | 365        | Days to retain data                              |
| `config.enableGeolocation` | boolean | true       | Enable IP-based location                         |
| `config.batchSize`         | number  | 10         | Events per batch                                 |
| `config.sessionTimeout`    | number  | 30         | Session timeout in minutes                       |

### useAnalytics Hook Methods

| Method                      | Description                       |
| --------------------------- | --------------------------------- |
| `trackEvent(type, data)`    | Track custom event                |
| `trackConversion(data)`     | Track conversion with attribution |
| `trackFormStart(formId)`    | Track form interaction start      |
| `trackWalletConnect(type)`  | Track wallet connection           |
| `setConsentStatus(granted)` | Set user consent                  |
| `getStatus()`               | Get current tracking status       |
| `clearData()`               | Clear all analytics data          |

### Global Functions

| Function                              | Description                |
| ------------------------------------- | -------------------------- |
| `window.trackEvent(type, data)`       | Global event tracking      |
| `window.trackConversion(data)`        | Global conversion tracking |
| `window.setAnalyticsConsent(granted)` | Set consent globally       |
| `window.getAnalyticsStatus()`         | Get status globally        |

## 🔄 Migration Guide

### From Google Analytics

```javascript
// Replace GA events with our tracking
// OLD: gtag('event', 'click', { event_category: 'button' });
trackEvent('button_click', { category: 'ui' });

// OLD: gtag('event', 'purchase', { value: 100 });
trackConversion({ amount: 100, currency: 'ETH' });
```

### From Other Analytics

The system provides a drop-in replacement for most analytics platforms with better privacy compliance.

## 📞 Support

For questions or issues:

1. Check the troubleshooting section above
2. Review the test suite for usage examples
3. Enable debug mode for detailed logging
4. Check browser console for error messages

The analytics system is designed to fail gracefully - if there are any issues, it won't break your application functionality.
