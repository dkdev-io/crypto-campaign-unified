import React from 'react';
import SetupWizard from './components/setup/SetupWizard';
import SimpleDonorForm from './components/SimpleDonorForm';
import CampaignDebug from './components/debug/CampaignDebug';
import TestingDashboard from './components/TestingDashboard';
import SimpleAuth from './components/auth/SimpleAuth';
import SimpleTeamInvites from './components/team/SimpleTeamInvites';
import WorkingTeamInvites from './components/team/WorkingTeamInvites';
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
          <WorkingTeamInvites campaignId="test-campaign" />
        </div>
        <PrivacyBanner />
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