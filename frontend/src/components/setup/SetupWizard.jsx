import React, { useState } from 'react';
import StepIndicator from './StepIndicator';
import Signup from './Signup';
import CommitteeSearch from './CommitteeSearch';
import BankConnection from './BankConnection';
import TermsAgreement from './TermsAgreement';
import EmbedCode from './EmbedCode';
import { supabase } from '../../lib/supabase';
import '../../styles/setup.css';

const SetupWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [campaignId, setCampaignId] = useState(null);

  const totalSteps = 5;

  const updateFormData = async (newData) => {
    const updatedData = { ...formData, ...newData };
    setFormData(updatedData);
    
    if (campaignId) {
      try {
        // Map React form field names to database column names
        const dbData = {};
        
        // Basic campaign info
        if (updatedData.userFullName) dbData.user_full_name = updatedData.userFullName;
        if (updatedData.campaignName) dbData.campaign_name = updatedData.campaignName;
        if (updatedData.email) dbData.email = updatedData.email;
        if (updatedData.website) dbData.website = updatedData.website;
        
        // FEC Committee info
        if (updatedData.fecCommitteeId) dbData.fec_committee_id = updatedData.fecCommitteeId;
        if (updatedData.committeeName) dbData.committee_name = updatedData.committeeName;
        if (updatedData.committeeDetails) dbData.committee_confirmed = true;
        
        // Bank connection info
        if (updatedData.bankAccountVerified !== undefined) dbData.bank_account_verified = updatedData.bankAccountVerified;
        if (updatedData.bankAccountInfo) {
          dbData.bank_account_name = updatedData.bankAccountInfo.accountName;
          dbData.bank_last_four = updatedData.bankAccountInfo.lastFour;
          dbData.plaid_account_id = updatedData.bankAccountInfo.accountId;
        }
        
        // Terms acceptance
        if (updatedData.allTermsAccepted) dbData.terms_accepted = updatedData.allTermsAccepted;
        if (updatedData.termsAcceptedAt) dbData.terms_accepted_at = updatedData.termsAcceptedAt;
        if (updatedData.termsIpAddress) dbData.terms_ip_address = updatedData.termsIpAddress;
        
        // Setup progress
        if (updatedData.setupStep) dbData.setup_step = updatedData.setupStep;
        if (updatedData.setupCompleted) dbData.setup_completed = updatedData.setupCompleted;
        if (updatedData.setupCompleted) dbData.setup_completed_at = new Date().toISOString();
        
        // Embed code
        if (updatedData.embedCode) {
          dbData.embed_code = updatedData.embedCode;
          dbData.embed_generated_at = new Date().toISOString();
        }
        
        // Legacy fields for compatibility
        if (updatedData.walletAddress) dbData.wallet_address = updatedData.walletAddress || 'temp-wallet';
        if (updatedData.maxDonation) dbData.max_donation_limit = parseFloat(updatedData.maxDonation) || 3300;
        if (updatedData.themeColor) dbData.theme_color = updatedData.themeColor;
        if (updatedData.supportedCryptos) dbData.supported_cryptos = updatedData.supportedCryptos;
        
        // Handle suggested amounts
        if (updatedData.suggestedAmounts !== undefined) {
          if (updatedData.suggestedAmounts && updatedData.suggestedAmounts !== '25, 50, 100, 250') {
            const amounts = typeof updatedData.suggestedAmounts === 'string' 
              ? updatedData.suggestedAmounts.split(',').map(a => parseFloat(a.trim())).filter(a => !isNaN(a))
              : updatedData.suggestedAmounts;
            dbData.suggested_amounts = amounts.length > 0 ? amounts : [25, 50, 100, 250];
          } else {
            dbData.suggested_amounts = [25, 50, 100, 250];
          }
        }

        console.log('Updating campaign with data:', dbData);
        const { data: updatedCampaign, error } = await supabase
          .from('campaigns')
          .update(dbData)
          .eq('id', campaignId)
          .select()
          .single();
        
        if (error) {
          console.error('Failed to save campaign data:', error);
        } else {
          console.log('Campaign data saved successfully:', updatedCampaign);
        }
      } catch (error) {
        console.error('Save error:', error);
      }
    }
  };

  const nextStep = async () => {
    if (currentStep === 1 && !campaignId) {
      try {
        // Create campaign with only existing schema fields
        const campaignData = {
          email: formData.email || 'test@test.com',
          campaign_name: formData.campaignName || 'New Campaign',
          website: formData.website || 'https://temp.com',
          wallet_address: 'temp-wallet-' + Date.now(),
          suggested_amounts: [25, 50, 100, 250],
          max_donation_limit: 3300,
          theme_color: '#2a2a72',
          supported_cryptos: ['ETH']
        };
        
        console.log('Attempting to create campaign with data:', campaignData);
        
        const { data, error } = await supabase
          .from('campaigns')
          .insert([campaignData])
          .select()
          .single();
          
        console.log('Supabase insert result:', { data, error });
        
        if (!error && data) {
          setCampaignId(data.id);
          console.log('Campaign created with ID:', data.id);
          updateFormData({ setupStep: currentStep + 1 });
        } else {
          console.error('Failed to create campaign:', error);
          console.error('Full error details:', JSON.stringify(error, null, 2));
          alert(`Campaign creation failed: ${error.message || error.details || JSON.stringify(error)}\n\nPlease check the browser console for more details.`);
          return;
        }
      } catch (error) {
        console.error('Campaign creation error:', error);
        alert('Campaign creation error: ' + error.message);
        return;
      }
    }
    
    // Update step in database
    if (campaignId) {
      updateFormData({ setupStep: currentStep + 1 });
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    const stepProps = {
      formData,
      updateFormData,
      onNext: nextStep,
      onPrev: prevStep,
      campaignId
    };

    switch (currentStep) {
      case 1:
        return <Signup {...stepProps} />;
      case 2:
        return <CommitteeSearch {...stepProps} />;
      case 3:
        return <BankConnection {...stepProps} />;
      case 4:
        return <TermsAgreement {...stepProps} />;
      case 5:
        return <EmbedCode {...stepProps} />;
      default:
        return <Signup {...stepProps} />;
    }
  };

  return (
    <div className="setup-container">
      <div className="setup-card">
        <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
          <a 
            href="/admin" 
            style={{ 
              color: '#666', 
              textDecoration: 'none', 
              fontSize: '14px',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: '#f8f9fa'
            }}
          >
            🔧 Admin Panel
          </a>
        </div>
        <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
        <div className="form-content">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
