import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
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
  return (
    <AnalyticsProvider config={{ 
      debug: process.env.NODE_ENV === 'development',
      cookieConsent: 'optional',
      respectDNT: true,
      enableGeolocation: true,
      enableScrollTracking: true,
      enableClickTracking: true 
    }}>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/setup" element={<SetupWizard />} />
          <Route path="/auth" element={<SimpleAuth />} />
          <Route path="/debug" element={<CampaignDebug />} />
          <Route path="/testing" element={<TestingDashboard />} />
          <Route path="/invite-test" element={
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
              <h2>Team Invitation System</h2>
              <RealWorkingInvites campaignId="test-campaign" />
            </div>
          } />
          <Route path="/analytics-demo" element={
            <div style={{ 
              minHeight: '100vh', 
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              padding: '2rem 0'
            }}>
              <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
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
                </div>
                <SimpleDonorForm campaignId={null} />
              </div>
            </div>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <PrivacyBanner />
      </Router>
    </AnalyticsProvider>
  );
}

export default App;