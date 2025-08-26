import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnalyticsProvider } from './components/analytics/AnalyticsProvider';
import PrivacyBanner from './components/analytics/PrivacyBanner';
import ContributionFormWithAnalytics from './components/analytics/ContributionFormWithAnalytics';
import './App.css';

function App() {
  const handleContribution = (contributionData) => {
    console.log('Contribution received:', contributionData);
    // Handle successful contribution
  };

  return (
    <AnalyticsProvider
      config={{
        debug: process.env.NODE_ENV === 'development',
        cookieConsent: 'optional', // Can be 'required', 'optional', or 'disabled'
        respectDNT: true,
        enableGeolocation: true,
        enableScrollTracking: true,
        enableClickTracking: true
      }}
    >
      <Router>
        <div className="App">
          <header className="App-header">
            <nav>
              <h1>Crypto Campaign Platform</h1>
              <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/campaigns">Campaigns</a></li>
                <li><a href="/about">About</a></li>
              </ul>
            </nav>
          </header>

          <main>
            <Routes>
              <Route 
                path="/" 
                element={
                  <div>
                    <h2>Welcome to Crypto Campaign Platform</h2>
                    <p>Support innovative projects with cryptocurrency contributions.</p>
                    
                    {/* Demo Campaign */}
                    <div style={{ marginTop: '2rem' }}>
                      <ContributionFormWithAnalytics
                        campaignId="demo-campaign-123"
                        onContribution={handleContribution}
                      />
                    </div>
                  </div>
                } 
              />
              
              <Route 
                path="/campaigns" 
                element={
                  <div>
                    <h2>All Campaigns</h2>
                    <p>Browse and support various cryptocurrency campaigns.</p>
                  </div>
                } 
              />
              
              <Route 
                path="/campaign/:campaignId" 
                element={
                  <div>
                    <h2>Campaign Details</h2>
                    <ContributionFormWithAnalytics
                      campaignId="specific-campaign"
                      onContribution={handleContribution}
                    />
                  </div>
                } 
              />
              
              <Route 
                path="/about" 
                element={
                  <div>
                    <h2>About Us</h2>
                    <p>Learn more about our platform and mission.</p>
                  </div>
                } 
              />
            </Routes>
          </main>

          <footer>
            <p>&copy; 2025 Crypto Campaign Platform. All rights reserved.</p>
            <div>
              <button onClick={() => window.setAnalyticsConsent?.(false)}>
                Disable Analytics
              </button>
              {' | '}
              <button onClick={() => console.log(window.getAnalyticsStatus?.())}>
                View Analytics Status
              </button>
            </div>
          </footer>

          {/* Privacy Banner */}
          <PrivacyBanner
            position="bottom"
            theme="dark"
            showLearnMore={true}
            onConsentChange={(granted) => {
              console.log('Privacy consent:', granted);
            }}
          />
        </div>
      </Router>
    </AnalyticsProvider>
  );
}

export default App;