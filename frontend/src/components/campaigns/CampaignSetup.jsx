import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import CampaignAuth from './CampaignAuth';
import SetupWizard from '../setup/SetupWizard';
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
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Show SetupWizard for authenticated users  
  useEffect(() => {
    // Don't redirect, let component handle the flow
  }, [user, loading, navigate]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80">
        <div className="flex items-center justify-center px-4 py-12">
          <div className="text-center">
            <Spinner size="lg" />
            <p className="mt-4 text-primary-foreground">Loading campaign setup...</p>
          </div>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show the auth component
  if (!user) {
    return <CampaignAuth />;
  }

  // Show SetupWizard for authenticated users
  return <SetupWizard />;
};

export default CampaignSetup;