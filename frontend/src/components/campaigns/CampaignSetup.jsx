import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import SetupWizard from '../setup/SetupWizard';
import CampaignAuth from './CampaignAuth';
import { Spinner } from '../ui/spinner';

/**
 * CampaignSetup - Unified campaign setup workflow
 * 
 * This component handles the complete setup flow in one unified experience:
 * 1. Authentication (if needed) 
 * 2. Campaign setup wizard
 * 
 * This should be accessible at /campaigns/auth/setup
 */
const CampaignSetup = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Check for bypass flag in URL
  const params = new URLSearchParams(location.search);
  const isBypass = params.get('bypass') === 'true';
  const isDev = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname.includes('netlify.app');
  
  // If bypass is enabled in dev mode, skip auth
  if (isDev && isBypass) {
    console.log('DEV BYPASS: Skipping auth check, showing setup wizard');
    return <SetupWizard />;
  }

  // Loading state
  if (loading) {
    return (
      <div className="campaign-setup min-h-screen" style={{backgroundColor: 'hsl(var(--crypto-navy))'}}>
        <div className="flex items-center justify-center px-4 py-12">
          <div className="text-center">
            <Spinner size="lg" />
            <p className="mt-4 text-primary-foreground">Loading campaign setup...</p>
          </div>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show auth component
  if (!user) {
    return <CampaignAuth />;
  }

  // Show SetupWizard for authenticated users
  return <SetupWizard />;
};

export default CampaignSetup;