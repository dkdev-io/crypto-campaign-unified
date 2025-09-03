import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import StepIndicator from './StepIndicator';
import Signup from './Signup';
import CommitteeSearch from './CommitteeSearch';
import BankConnection from './BankConnection';
import WebsiteStyleMatcher from './WebsiteStyleMatcher';
import StyleConfirmation from './StyleConfirmation';
import TermsAgreement from './TermsAgreement';
import EmbedCode from './EmbedCode';
import CampaignAuthNav from '../campaigns/CampaignAuthNav';
import { supabase } from '../../lib/supabase';
import '../../styles/setup.css';

const SetupWizard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [campaignId, setCampaignId] = useState(null);
  const [loading, setLoading] = useState(true);

  const totalSteps = 7;

  // Initialize setup wizard based on user's existing campaign data
  useEffect(() => {
    const initializeSetup = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Look for existing campaign for this user
        const { data: existingCampaign, error } = await supabase
          .from('campaigns')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (existingCampaign && !error) {
          // Found existing campaign - populate data and determine step
          setCampaignId(existingCampaign.id);
          
          // Build form data from database
          const existingFormData = {
            userFullName: existingCampaign.user_full_name || user.user_metadata?.full_name || '',
            campaignName: existingCampaign.campaign_name || '',
            email: existingCampaign.email || user.email,
            website: existingCampaign.website || '',
            fecCommitteeId: existingCampaign.fec_committee_id || '',
            committeeName: existingCampaign.committee_name || '',
            committeeDetails: existingCampaign.committee_confirmed || false,
            bankAccountVerified: existingCampaign.bank_account_verified || false,
            bankAccountInfo: existingCampaign.bank_account_name ? {
              accountName: existingCampaign.bank_account_name,
              lastFour: existingCampaign.bank_last_four,
              accountId: existingCampaign.plaid_account_id
            } : null,
            allTermsAccepted: existingCampaign.terms_accepted || false,
            websiteAnalyzed: existingCampaign.website_analyzed || '',
            styleAnalysis: existingCampaign.style_analysis || null,
            appliedStyles: existingCampaign.applied_styles || null,
            stylesApplied: existingCampaign.styles_applied || false,
            embedCode: existingCampaign.embed_code || '',
            description: existingCampaign.description || ''
          };
          
          setFormData(existingFormData);
          
          // Determine current step based on completion status
          if (existingCampaign.setup_completed) {
            setCurrentStep(7); // Show final step with embed code
          } else {
            // Start from the appropriate step based on setup_step or data completeness
            let startStep = existingCampaign.setup_step || 2; // Skip signup since user is authenticated
            
            // Skip signup step for authenticated users
            if (startStep === 1) {
              startStep = 2;
            }
            
            setCurrentStep(startStep);
          }
        } else {
          // No existing campaign - start fresh but skip signup
          const newFormData = {
            userFullName: user.user_metadata?.full_name || '',
            email: user.email,
            campaignName: '',
            website: '',
          };
          setFormData(newFormData);
          setCurrentStep(2); // Skip signup step for authenticated users
        }
      } catch (error) {
        console.error('Error initializing setup:', error);
        // Fallback to step 2 for authenticated users
        setFormData({
          userFullName: user.user_metadata?.full_name || '',
          email: user.email
        });
        setCurrentStep(2);
      } finally {
        setLoading(false);
      }
    };

    initializeSetup();
  }, [user]);

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
        
        // Website style matching
        if (updatedData.websiteUrl) dbData.website_analyzed = updatedData.websiteUrl;
        if (updatedData.styleAnalysis) dbData.style_analysis = updatedData.styleAnalysis;
        if (updatedData.appliedStyles) dbData.applied_styles = updatedData.appliedStyles;
        if (updatedData.stylesApplied) dbData.styles_applied = updatedData.stylesApplied;
        
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
    console.log('Moving to next step, current data:', formData);
    
    // Create campaign if we don't have one (for authenticated users starting fresh)
    if (!campaignId && user) {
      try {
        const newCampaignData = {
          user_id: user.id,
          user_full_name: formData.userFullName || user.user_metadata?.full_name || '',
          email: formData.email || user.email,
          campaign_name: formData.campaignName || '',
          website: formData.website || '',
          setup_step: currentStep + 1,
          setup_completed: false,
          // Default values for required fields
          wallet_address: 'temp-wallet-' + Date.now(),
          max_donation_limit: 3300,
          suggested_amounts: [25, 50, 100, 250]
        };

        console.log('Creating new campaign:', newCampaignData);
        const { data: newCampaign, error } = await supabase
          .from('campaigns')
          .insert([newCampaignData])
          .select()
          .single();

        if (error) {
          console.error('Failed to create campaign:', error);
          // Continue anyway with mock ID for demo
          setCampaignId('demo-campaign-' + Date.now());
        } else {
          setCampaignId(newCampaign.id);
          console.log('Campaign created successfully:', newCampaign);
        }
      } catch (error) {
        console.error('Error creating campaign:', error);
        setCampaignId('demo-campaign-' + Date.now());
      }
    } else {
      // Update existing campaign with current step
      await updateFormData({ setupStep: currentStep + 1 });
    }
    
    // Progress to next step
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      console.log(`Advanced to step ${currentStep + 1}`);
    } else {
      // Mark setup as completed
      await updateFormData({ 
        setupStep: totalSteps,
        setupCompleted: true,
        setupCompletedAt: new Date().toISOString()
      });
      console.log('Setup wizard completed!');
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
        // Skip signup for authenticated users - this should not be reached
        if (user) {
          return <CommitteeSearch {...stepProps} />;
        }
        return <Signup {...stepProps} />;
      case 2:
        return <CommitteeSearch {...stepProps} />;
      case 3:
        return <BankConnection {...stepProps} />;
      case 4:
        return <WebsiteStyleMatcher {...stepProps} />;
      case 5:
        return <StyleConfirmation {...stepProps} />;
      case 6:
        return <TermsAgreement {...stepProps} />;
      case 7:
        return <EmbedCode {...stepProps} />;
      default:
        return <CommitteeSearch {...stepProps} />;
    }
  };

  if (loading) {
    return (
      <div>
        <CampaignAuthNav />
        <div className="setup-container">
          <div className="setup-card">
            <div className="form-content" style={{ textAlign: 'center', padding: '2rem' }}>
              <div>Loading your campaign setup...</div>
              <div style={{ marginTop: '1rem' }}>
                <div className="spinner" style={{ 
                  width: '30px', 
                  height: '30px', 
                  border: '3px solid #f3f3f3',
                  borderTop: '3px solid #007bff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto'
                }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <CampaignAuthNav />
      <div className="setup-container">
        <div className="setup-card">
          <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
            <a 
              href="/minda" 
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
    </div>
  );
};

export default SetupWizard;
