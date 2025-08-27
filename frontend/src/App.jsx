import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import SetupWizard from './components/setup/SetupWizard';
import SimpleDonorForm from './components/SimpleDonorForm';
import CampaignDebug from './components/debug/CampaignDebug';
import TestingDashboard from './components/TestingDashboard';
import SimpleAuth from './components/auth/SimpleAuth';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SimpleTeamInvites from './components/team/SimpleTeamInvites';
import WorkingTeamInvites from './components/team/WorkingTeamInvites';
import RealWorkingInvites from './components/team/RealWorkingInvites';
import { AnalyticsProvider } from './components/analytics/AnalyticsProvider';
import DonationTest from './pages/DonationTest';
import PrivacyBanner from './components/analytics/PrivacyBanner';

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
import DonorDashboard from './components/donor/DonorDashboard';
import DonorProfile from './components/donor/DonorProfile';
import DonorProtectedRoute from './components/donor/DonorProtectedRoute';
import DonorVerifyEmail from './components/donor/DonorVerifyEmail';

function App() {
  return (
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
            <Route path="/setup" element={
              <ProtectedRoute requireVerified={true}>
                <SetupWizard />
              </ProtectedRoute>
            } />
            <Route path="/auth" element={<SimpleAuth />} />
            <Route path="/debug" element={<CampaignDebug />} />
            <Route path="/testing" element={<TestingDashboard />} />
            <Route path="/invite-test" element={
              <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
                <h2>Team Invitation System</h2>
                <RealWorkingInvites campaignId="test-campaign" />
              </div>
            } />
            <Route path="/donation-test" element={<DonationTest />} />
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
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/*" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="campaigns" element={<CampaignManagement />} />
              <Route path="transactions" element={<TransactionMonitoring />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<SystemSettings />} />
            </Route>
            
            {/* Donor Routes */}
            <Route path="/donor/register" element={<DonorRegister />} />
            <Route path="/donor/login" element={<DonorLogin />} />
            <Route path="/donor/verify-email" element={<DonorVerifyEmail />} />
            <Route path="/donor/dashboard" element={
              <DonorProtectedRoute>
                <DonorDashboard />
              </DonorProtectedRoute>
            } />
            <Route path="/donor/profile" element={
              <DonorProtectedRoute>
                <DonorProfile />
              </DonorProtectedRoute>
            } />
            <Route path="/donor/donations" element={
              <DonorProtectedRoute>
                <DonorDashboard />
              </DonorProtectedRoute>
            } />
            <Route path="/donor/campaigns" element={
              <DonorProtectedRoute>
                <DonorDashboard />
              </DonorProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          <PrivacyBanner />
        </Router>
      </AnalyticsProvider>
    </DonorAuthProvider>
    </AdminProvider>
  );
}

export default App;