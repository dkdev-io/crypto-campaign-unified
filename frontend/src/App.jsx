import React from 'react';
import SetupWizard from './components/setup/SetupWizard';
import SimpleDonorForm from './components/SimpleDonorForm';
import CampaignDebug from './components/debug/CampaignDebug';
import TestingDashboard from './components/TestingDashboard';
import SimpleAuth from './components/auth/SimpleAuth';
import SimpleTeamInvites from './components/team/SimpleTeamInvites';
import WorkingTeamInvites from './components/team/WorkingTeamInvites';
import RealWorkingInvites from './components/team/RealWorkingInvites';
import { AnalyticsProvider } from './components/analytics/AnalyticsProvider';
import PrivacyBanner from './components/analytics/PrivacyBanner';

function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const campaignId = urlParams.get('campaign');
  const path = window.location.pathname;
  
  console.log('App routing:', { path, campaignId, search: window.location.search });
  
  // Test invite form directly
  if (path === '/invite-test') {
    return (
      <AnalyticsProvider config={{ debug: true }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
          <h2>Team Invitation System</h2>
          <RealWorkingInvites campaignId="test-campaign" />
        </div>
        <PrivacyBanner />
      </AnalyticsProvider>
    );
  }

  // Analytics Demo Route - NEW!
  if (path === '/analytics-demo') {
    return (
      <AnalyticsProvider config={{ 
        debug: true,
        cookieConsent: 'optional',
        enableGeolocation: true,
        enableScrollTracking: true,
        enableClickTracking: true 
      }}>
        <div style={{ 
          minHeight: '100vh', 
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          padding: '2rem 0'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
            {/* Header */}
            <div style={{ 
              textAlign: 'center', 
              marginBottom: '3rem',
              background: 'white',
              padding: '2rem',
              borderRadius: '1rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
              <h1 style={{ color: '#1e293b', marginBottom: '1rem' }}>
                🚀 Analytics Demo - Live Campaign Form
              </h1>
              <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '1rem' }}>
                This is your actual SimpleDonorForm component with integrated analytics tracking.
              </p>
              <div style={{
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginTop: '1rem'
              }}>
                <h4 style={{ color: '#0369a1', margin: '0 0 0.5rem 0' }}>
                  📊 Real-time Analytics Active
                </h4>
                <p style={{ color: '#0369a1', margin: 0, fontSize: '0.9rem' }}>
                  Open browser dev tools (F12) to see analytics events being tracked live.
                  Try interacting with the form below!
                </p>
              </div>
            </div>
            
            {/* Your actual form with analytics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
              <div>
                <SimpleDonorForm campaignId={null} />
              </div>
              
              {/* Analytics info panel */}
              <div style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                position: 'sticky',
                top: '2rem'
              }}>
                <h3 style={{ color: '#1e293b', marginBottom: '1rem', fontSize: '1.1rem' }}>
                  📊 Analytics Features Active
                </h3>
                <div style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: '1.6' }}>
                  <div style={{ marginBottom: '0.5rem' }}>✅ Anonymous visitor tracking</div>
                  <div style={{ marginBottom: '0.5rem' }}>✅ Session monitoring & timing</div>
                  <div style={{ marginBottom: '0.5rem' }}>✅ Form interaction analytics</div>
                  <div style={{ marginBottom: '0.5rem' }}>✅ Wallet connection tracking</div>
                  <div style={{ marginBottom: '0.5rem' }}>✅ Conversion funnel tracking</div>
                  <div style={{ marginBottom: '0.5rem' }}>✅ Privacy-compliant data collection</div>
                  <div style={{ marginBottom: '1rem' }}>✅ GDPR/CCPA compliance</div>
                  
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    marginTop: '1rem'
                  }}>
                    <strong>Test Commands:</strong><br/>
                    <code style={{ fontSize: '0.8rem', display: 'block', marginTop: '0.25rem', color: '#4f46e5' }}>
                      window.getAnalyticsStatus()
                    </code>
                    <code style={{ fontSize: '0.8rem', display: 'block', color: '#4f46e5' }}>
                      window.trackEvent('test', {'{test: true}'})
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <PrivacyBanner position="bottom" theme="dark" />
      </AnalyticsProvider>
    );
  }

  // Auth route (new default)
  if (path === '/auth' || path === '/') {
    return <SimpleAuth />;
  }

  // Test route
  if (path === '/test') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>✅ Test Route Works!</h1>
        <p>React app is functioning correctly</p>
        <div style={{ marginTop: '2rem' }}>
          <a href="/analytics-demo" style={{ padding: '1rem', background: '#f59e0b', color: 'white', textDecoration: 'none', borderRadius: '4px', marginRight: '1rem' }}>
            🚀 Analytics Demo
          </a>
          <a href="/setup" style={{ padding: '1rem', background: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '4px', marginRight: '1rem' }}>
            Go to Setup Wizard
          </a>
          <a href="/auth" style={{ padding: '1rem', background: '#2a2a72', color: 'white', textDecoration: 'none', borderRadius: '4px', marginRight: '1rem' }}>
            Auth Demo
          </a>
          <a href="/invite-test" style={{ padding: '1rem', background: '#dc3545', color: 'white', textDecoration: 'none', borderRadius: '4px', marginRight: '1rem' }}>
            Test Invite Form
          </a>
          <a href="/debug" style={{ padding: '1rem', background: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '4px', marginRight: '1rem' }}>
            Debug Panel
          </a>
          <a href="/testing" style={{ padding: '1rem', background: '#6f42c1', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
            Smart Contract Testing
          </a>
        </div>
      </div>
    );
  }
  
  // Smart Contract Testing Dashboard
  if (path === '/testing') {
    return <TestingDashboard />;
  }
  
  // Debug panel
  if (path === '/debug') {
    return <CampaignDebug />;
  }
  
  // Setup wizard route (moved from default)
  if (path === '/setup') {
    return <SetupWizard />;
  }

  // Simple form for campaigns
  if (campaignId) {
    return <SimpleDonorForm campaignId={campaignId} />;
  }
  
  // Default: Simple auth system
  return <SimpleAuth />;
}

export default App;