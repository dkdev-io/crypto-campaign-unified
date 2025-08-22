import React from 'react';
import SetupWizard from './components/setup/SetupWizard';
import SimpleDonorForm from './components/SimpleDonorForm';
import CampaignDebug from './components/debug/CampaignDebug';
import TestingDashboard from './components/TestingDashboard';

function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const campaignId = urlParams.get('campaign');
  const path = window.location.pathname;
  
  console.log('App routing:', { path, campaignId, search: window.location.search });
  
  // Test route
  if (path === '/test') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>✅ Test Route Works!</h1>
        <p>React app is functioning correctly</p>
        <div style={{ marginTop: '2rem' }}>
          <a href="/" style={{ padding: '1rem', background: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '4px', marginRight: '1rem' }}>
            Go to Setup Wizard
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
  
  // Simple form for campaigns
  if (campaignId) {
    return <SimpleDonorForm campaignId={campaignId} />;
  }
  
  // Default: Setup wizard
  return <SetupWizard />;
}

export default App;