import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import SetupWizard from './components/setup/SetupWizard';
import SimpleDonorForm from './components/SimpleDonorForm';
import EmbedDonorForm from './components/EmbedDonorForm';
import CampaignDebug from './components/debug/CampaignDebug';
import TestingDashboard from './components/TestingDashboard';
import SimpleAuth from './components/auth/SimpleAuth';
import CampaignAuth from './components/campaigns/CampaignAuth';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SimpleTeamInvites from './components/team/SimpleTeamInvites';
import WorkingTeamInvites from './components/team/WorkingTeamInvites';
import RealWorkingInvites from './components/team/RealWorkingInvites';
import { AnalyticsProvider } from './components/analytics/AnalyticsProvider';
// import DonationTest from './pages/DonationTest';
import PrivacyBanner from './components/analytics/PrivacyBanner';

// Auth Context for Campaign Users
import { AuthProvider } from './contexts/AuthContext';

// Admin Components
import { AdminProvider } from './contexts/AdminContext';
import AdminLogin from './components/admin/AdminLogin';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import UserManagement from './components/admin/UserManagement';
import TransactionMonitoring from './components/admin/TransactionMonitoring';
import CampaignManagement from './components/admin/CampaignManagement';
import Analytics from './components/admin/Analytics';
import SystemSettings from './components/admin/SystemSettings';

// Donor Components
import { DonorAuthProvider } from './contexts/DonorAuthContext';
import DonorRegister from './components/donor/DonorRegister';
import DonorLogin from './components/donor/DonorLogin';
import DonorAuth from './components/donor/DonorAuth';
import DonorDashboard from './pages/donors/Dashboard';
import DonorProfile from './components/donor/DonorProfile';
import DonorProtectedRoute from './components/donor/DonorProtectedRoute';
import DonorVerifyEmail from './components/donor/DonorVerifyEmail';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';

function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <DonorAuthProvider>
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
            <Route path="/auth" element={<SimpleAuth />} />
            <Route path="/campaigns/auth" element={<CampaignAuth />} />
            <Route path="/campaigns/auth/terms" element={<TermsOfService />} />
            <Route path="/campaigns/auth/privacy" element={<PrivacyPolicy />} />
            <Route path="/debug" element={<CampaignDebug />} />
            <Route path="/testing" element={<TestingDashboard />} />
            <Route path="/invite-test" element={
              <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
                <h2>Team Invitation System</h2>
                <RealWorkingInvites campaignId="test-campaign" />
              </div>
            } />
            {/* <Route path="/donation-test" element={<DonationTest />} /> */}
            <Route path="/analytics-demo" element={
              <div style={{ 
                minHeight: '100vh', 
                background: 'var(--gradient-section)',
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
                    <h1 style={{ color: 'hsl(var(--crypto-navy))', marginBottom: '1rem' }}>
                      🚀 Analytics Demo - Live Campaign Form
                    </h1>
                    <p style={{ color: 'hsl(var(--crypto-medium-gray))', fontSize: '1.1rem', marginBottom: '1rem' }}>
                      This is your actual SimpleDonorForm component with integrated analytics tracking.
                    </p>
                  </div>
                  <SimpleDonorForm campaignId={null} />
                </div>
              </div>
            } />
            
            {/* Admin Routes */}
            <Route path="/minda" element={<AdminLogin />} />
            <Route path="/minda/*" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="campaigns" element={<CampaignManagement />} />
              <Route path="transactions" element={<TransactionMonitoring />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<SystemSettings />} />
            </Route>
            
            {/* Donor Routes */}
            <Route path="/donors/auth" element={<DonorAuth />} />
            <Route path="/donors/auth/register" element={<DonorRegister />} />
            <Route path="/donors/auth/login" element={<DonorLogin />} />
            <Route path="/donors/auth/terms" element={<TermsOfService />} />
            <Route path="/donors/auth/privacy" element={<PrivacyPolicy />} />
            <Route path="/donors/auth/verify-email" element={<DonorVerifyEmail />} />
            <Route path="/donors/dashboard" element={
              <DonorProtectedRoute>
                <DonorDashboard />
              </DonorProtectedRoute>
            } />
            <Route path="/donors/profile" element={
              <DonorProtectedRoute>
                <DonorProfile />
              </DonorProtectedRoute>
            } />
            <Route path="/donors/donations" element={
              <DonorProtectedRoute>
                <DonorDashboard />
              </DonorProtectedRoute>
            } />
            <Route path="/donors/campaigns" element={
              <DonorProtectedRoute>
                <DonorDashboard />
              </DonorProtectedRoute>
            } />
            
            {/* Embed Form Route - for iframe embeds */}
            <Route path="/embed-form.html" element={
              <EmbedDonorForm campaignId={new URLSearchParams(window.location.search).get('campaign')} />
            } />
            <Route path="/embed-form" element={
              <div style={{ minHeight: '100vh', padding: '1rem' }}>
                <SimpleDonorForm campaignId={new URLSearchParams(window.location.search).get('campaign')} />
              </div>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          <PrivacyBanner />
        </Router>
      </AnalyticsProvider>
    </DonorAuthProvider>
    </AdminProvider>
    </AuthProvider>
  );
}

export default App;