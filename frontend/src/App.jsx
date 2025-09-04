import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import CampaignPage from './pages/CampaignPage';
import SetupWizard from './components/setup/SetupWizard';
import CampaignSetup from './components/campaigns/CampaignSetup';
import EmbeddedDonorForm from './components/EmbeddedDonorForm';
import EmbedDonorForm from './components/EmbedDonorForm';
import CampaignDebug from './components/debug/CampaignDebug';
import TestingDashboard from './components/TestingDashboard';
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
import DonorAuth from './components/donor/DonorAuth';
import TestDonorRoute from './components/donor/TestDonorRoute';
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
            {/* DEBUG: Test route to verify routing works */}
            <Route path="/test-route" element={<div style={{padding: '50px', fontSize: '30px', backgroundColor: 'red', color: 'white'}}>TEST ROUTE WORKING!</div>} />
            <Route path="/" element={<Index />} />
            <Route path="/campaigns/auth" element={<CampaignAuth />} />
            <Route path="/campaigns/auth/setup" element={<CampaignSetup />} />
            <Route path="/campaigns/auth/terms" element={<TermsOfService />} />
            <Route path="/campaigns/auth/privacy" element={<PrivacyPolicy />} />
            <Route path="/debug" element={<CampaignDebug />} />
            <Route path="/testing" element={<TestingDashboard />} />
            {/* <Route path="/donation-test" element={<DonationTest />} /> */}
            
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
            <Route path="/donors/auth" element={<TestDonorRoute />} />
            <Route path="/donors/auth/register" element={<TestDonorRoute />} />
            <Route path="/donors/auth/login" element={<TestDonorRoute />} />
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
            
            {/* Dynamic Campaign Pages - must be last before 404 */}
            <Route path="/:campaignName" element={<CampaignPage />} />
            
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