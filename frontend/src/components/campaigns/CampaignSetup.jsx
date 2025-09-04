import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import EmbedDonorForm from '../EmbedDonorForm';
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

  // User is authenticated, show the embedded contribution form
  return <EmbedDonorForm campaignId={null} />;
};

export default CampaignSetup;