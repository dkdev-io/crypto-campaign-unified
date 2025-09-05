import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, useNavigate } from 'react-router-dom';
import { useAdmin } from './contexts/AdminContext';
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
import CampaignDashboard from './pages/CampaignDashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SimpleTeamInvites from './components/team/SimpleTeamInvites';
import WorkingTeamInvites from './components/team/WorkingTeamInvites';
import RealWorkingInvites from './components/team/RealWorkingInvites';
import { AnalyticsProvider } from './components/analytics/AnalyticsProvider';
// import DonationTest from './pages/DonationTest';
import PrivacyBanner from './components/analytics/PrivacyBanner';

// Auth Context for Campaign Users
import { AuthProvider } from './contexts/AuthContext';

// Style Context for Campaign Theming
import CampaignStyleProvider from './contexts/CampaignStyleContext';

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

// Admin Redirect Component
const AdminRedirect = () => {
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  
  React.useEffect(() => {
    if (isAdmin()) {
      navigate('/minda/dashboard', { replace: true });
    } else {
      navigate('/minda/login', { replace: true });
    }
  }, [navigate, isAdmin]);
  
  return null;
};

// Donor Components
import { DonorAuthProvider } from './contexts/DonorAuthContext';
import DonorAuth from './components/donor/DonorAuth';
import DonorDashboard from './pages/donors/Dashboard';
import DonorProfile from './components/donor/DonorProfile';
import DonorProtectedRoute from './components/donor/DonorProtectedRoute';
import DonorVerifyEmail from './components/donor/DonorVerifyEmail';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TestBypass from './pages/TestBypass';
import About from './pages/About';
import Support from './pages/Support';
import Legal from './pages/Legal';
import Pricing from './pages/Pricing';
import Demo from './pages/Demo';
import Integrations from './pages/Integrations';
import ApiDocumentation from './pages/ApiDocumentation';
import Blog from './pages/Blog';
import Help from './pages/Help';

function App() {
  return (
    <CampaignStyleProvider>
      <AuthProvider>
        <AdminProvider>
          <DonorAuthProvider>
          <AnalyticsProvider
            config={{
              debug: process.env.NODE_ENV === 'development',
              cookieConsent: 'optional',
              respectDNT: true,
              enableGeolocation: true,
              enableScrollTracking: true,
              enableClickTracking: true,
            }}
          >
            <Router>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/campaigns/auth" element={<CampaignAuth />} />
                <Route path="/campaigns/auth/setup" element={<CampaignSetup />} />
                <Route path="/campaigns/auth/terms" element={<TermsOfService />} />
                <Route path="/campaigns/auth/privacy" element={<PrivacyPolicy />} />
                <Route path="/debug" element={<CampaignDebug />} />
                <Route path="/testing" element={<TestingDashboard />} />
                {/* <Route path="/donation-test" element={<DonationTest />} /> */}

                {/* Admin Routes - MUST be before /:campaignName to prevent conflicts */}
                <Route 
                  path="/minda" 
                  element={<AdminRedirect />} 
                />
                <Route path="/minda/login" element={<AdminLogin />} />
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
                <Route path="/donors/auth/register" element={<DonorAuth />} />
                <Route path="/donors/auth/login" element={<DonorAuth />} />
                <Route path="/donors/auth/terms" element={<TermsOfService />} />
                <Route path="/donors/auth/privacy" element={<PrivacyPolicy />} />
                <Route path="/donors/auth/verify-email" element={<DonorVerifyEmail />} />
                <Route path="/test-bypass" element={<TestBypass />} />
                <Route
                  path="/donors/dashboard"
                  element={
                    <DonorProtectedRoute>
                      <DonorDashboard />
                    </DonorProtectedRoute>
                  }
                />
                <Route
                  path="/donors/profile"
                  element={
                    <DonorProtectedRoute>
                      <DonorProfile />
                    </DonorProtectedRoute>
                  }
                />
                <Route
                  path="/donors/donations"
                  element={
                    <DonorProtectedRoute>
                      <DonorDashboard />
                    </DonorProtectedRoute>
                  }
                />
                <Route
                  path="/donors/campaigns"
                  element={
                    <DonorProtectedRoute>
                      <DonorDashboard />
                    </DonorProtectedRoute>
                  }
                />

                {/* Campaign Dashboard Route */}
                <Route 
                  path="/campaigns/dashboard" 
                  element={
                    <ProtectedRoute>
                      <CampaignDashboard />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Embed Form Route - for iframe embeds */}
                <Route
                  path="/embed-form.html"
                  element={
                    <EmbedDonorForm
                      campaignId={new URLSearchParams(window.location.search).get('campaign')}
                    />
                  }
                />

                {/* Footer Page Routes */}
                <Route path="/about" element={<About />} />
                <Route path="/support" element={<Support />} />
                <Route path="/legal" element={<Legal />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/demo" element={<Demo />} />
                <Route path="/integrations" element={<Integrations />} />
                <Route path="/api" element={<ApiDocumentation />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/help" element={<Help />} />

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
    </CampaignStyleProvider>
  );
}

export default App;
