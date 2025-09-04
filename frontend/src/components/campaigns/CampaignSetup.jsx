import React, { useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import CampaignAuth from './CampaignAuth';
import CampaignAuthNav from './CampaignAuthNav';
import { Spinner } from '../ui/spinner';

/**
 * CampaignSetup - Layout component for campaign setup workflow
 * 
 * This component handles authentication and layout for nested setup routes:
 * 1. If user is not authenticated, shows CampaignAuth
 * 2. If user is authenticated, shows layout with Outlet for child routes
 * 3. Redirects to first step if accessing base setup URL
 * 
 * Child routes: /campaigns/auth/setup/campaign-info, /committee-search, etc.
 */
const CampaignSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();

  // Redirect to first step if accessing base setup URL
  useEffect(() => {
    if (user && location.pathname === '/campaigns/auth/setup') {
      navigate('/campaigns/auth/setup/campaign-info', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen" style={{backgroundColor: 'hsl(var(--crypto-navy))'}}>
        <div className="flex items-center justify-center px-4 py-12">
          <div className="text-center">
            <Spinner size="lg" />
            <p className="mt-4 text-primary-foreground">Loading campaign setup...</p>
          </div>
        </div>
      </div>
    );
  }

  // Check for dev bypass in URL or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const devBypass = urlParams.get('bypass') === 'dev' || localStorage.getItem('devBypass') === 'true';
  
  // If user is not authenticated and no dev bypass, show auth component
  if (!user && !devBypass) {
    return <CampaignAuth />;
  }

  // Show layout with navigation and outlet for authenticated users
  return (
    <div>
      <CampaignAuthNav />
      <Outlet />
    </div>
  );
};

export default CampaignSetup;