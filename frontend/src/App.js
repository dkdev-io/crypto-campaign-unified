import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnalyticsProvider } from './components/analytics/AnalyticsProvider';
import PrivacyBanner from './components/analytics/PrivacyBanner';
import CampaignPage from './pages/CampaignPage';
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
              <h1>NEXTRAISE</h1>
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
                    <h2>Welcome to NEXTRAISE</h2>
                    <p>Support innovative projects with cryptocurrency contributions.</p>
                    
                    <div className="text-center mt-8">
                      <a 
                        href="/campaigns" 
                        className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        View Campaigns
                      </a>
                      <a 
                        href="/campaigns/auth/setup" 
                        className="inline-block ml-4 border border-primary text-primary px-6 py-3 rounded-lg hover:bg-primary/10 transition-colors"
                      >
                        Create Campaign
                      </a>
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
                path="/campaign/:campaignName" 
                element={<CampaignPage />} 
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
            <p>&copy; 2025 NEXTRAISE. All rights reserved.</p>
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