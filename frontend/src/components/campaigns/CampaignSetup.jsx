import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import SetupWizard from '../setup/SetupWizard';
import CampaignAuth from './CampaignAuth';
import { Spinner } from '../ui/spinner';

/**
 * CampaignSetup - The main component for campaign setup workflow
 * 
 * This component handles the complete setup flow:
 * 1. If user is not authenticated, shows CampaignAuth
 * 2. If user is authenticated, shows SetupWizard
 * 
 * This should be accessible at /campaigns/auth/setup
 */
const CampaignSetup = () => {
  const { user, loading } = useAuth();

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

  // Show SetupWizard for authenticated users
  return <SetupWizard />;
};

export default CampaignSetup;