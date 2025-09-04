import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import StepIndicator from './StepIndicator';
import CampaignInfo from './CampaignInfo';
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

  // Initialize setup wizard with fallbacks for missing DB columns
  useEffect(() => {
    const initializeSetup = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Try to recover from localStorage first
        let savedData = null;
        try {
          const saved = localStorage.getItem('campaignSetupData');
          if (saved) {
            savedData = JSON.parse(saved);
            console.log('Recovered form data from localStorage:', savedData);
          }
        } catch (e) {
          console.warn('Could not recover from localStorage:', e);
        }

        // Look for existing campaign (only select existing columns to avoid errors)
        const { data: existingCampaign, error } = await supabase
          .from('campaigns')
          .select('id, campaign_name, email, website, wallet_address, max_donation_limit, suggested_amounts, theme_color, supported_cryptos, status, created_at')
          .eq('email', user.email)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (existingCampaign && !error) {
          setCampaignId(existingCampaign.id);
          
          // Build form data from available DB fields + localStorage
          const existingFormData = {
            userFullName: savedData?.userFullName || user.user_metadata?.full_name || '',
            campaignName: existingCampaign.campaign_name || savedData?.campaignName || '',
            email: existingCampaign.email || user.email,
            website: existingCampaign.website || savedData?.website || '',
            themeColor: existingCampaign.theme_color || savedData?.themeColor || '#2a2a72',
            suggestedAmounts: existingCampaign.suggested_amounts || [25, 50, 100, 250],
            maxDonation: existingCampaign.max_donation_limit || 3300,
            
            // Data that exists only in localStorage (until DB is fixed)
            fecCommitteeId: savedData?.fecCommitteeId || '',
            committeeName: savedData?.committeeName || '',
            selectedCommittee: savedData?.selectedCommittee || null,
            committeeDetails: savedData?.committeeDetails || null,
            bankAccountVerified: savedData?.bankAccountVerified || false,
            bankAccountInfo: savedData?.bankAccountInfo || null,
            allTermsAccepted: savedData?.allTermsAccepted || false,
            websiteUrl: savedData?.websiteUrl || '',
            styleAnalysis: savedData?.styleAnalysis || null,
            appliedStyles: savedData?.appliedStyles || null,
            stylesApplied: savedData?.stylesApplied || false,
            embedCode: savedData?.embedCode || '',
            setupCompleted: savedData?.setupCompleted || false,
            currentStep: savedData?.currentStep || 2
          };
          
          setFormData(existingFormData);
          setCurrentStep(savedData?.currentStep || 1);
        } else {
          // No existing campaign - start fresh
          const newFormData = {
            userFullName: user.user_metadata?.full_name || '',
            email: user.email,
            campaignName: '',
            website: '',
            currentStep: 2
          };
          
          // Recover from localStorage if available
          if (savedData) {
            Object.assign(newFormData, savedData);
          }
          
          setFormData(newFormData);
          setCurrentStep(newFormData.currentStep || 1);
        }
      } catch (error) {
        console.error('Error initializing setup:', error);
        
        // Try localStorage recovery as final fallback
        try {
          const saved = localStorage.getItem('campaignSetupData');
          if (saved) {
            const savedData = JSON.parse(saved);
            setFormData(savedData);
            setCurrentStep(savedData.currentStep || 1);
          } else {
            // Complete fallback
            setFormData({
              userFullName: user.user_metadata?.full_name || '',
              email: user.email,
              currentStep: 2
            });
            setCurrentStep(1);
          }
        } catch (e) {
          setFormData({
            userFullName: user.user_metadata?.full_name || '',
            email: user.email
          });
          setCurrentStep(2);
        }
      } finally {
        setLoading(false);
      }
    };

    initializeSetup();
  }, [user]);

  const updateFormData = async (newData) => {
    const updatedData = { ...formData, ...newData };
    setFormData(updatedData);
    
    // Store in localStorage as backup
    try {
      localStorage.setItem('campaignSetupData', JSON.stringify(updatedData));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
    
    if (campaignId) {
      try {
        // Only update existing columns to avoid DB errors
        const dbData = {};
        
        // Only include fields that exist in current schema
        if (updatedData.campaignName) dbData.campaign_name = updatedData.campaignName;
        if (updatedData.email) dbData.email = updatedData.email;
        if (updatedData.website) dbData.website = updatedData.website;
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

        // Only update if we have data to save
        if (Object.keys(dbData).length > 0) {
          console.log('Updating campaign with available columns:', dbData);
          const { data: updatedCampaign, error } = await supabase
            .from('campaigns')
            .update(dbData)
            .eq('id', campaignId)
            .select()
            .single();
          
          if (error) {
            console.warn('Database save failed (expected with missing columns):', error.message);
          } else {
            console.log('Campaign data saved successfully:', updatedCampaign);
          }
        }
      } catch (error) {
        console.warn('Database save error (continuing with localStorage):', error.message);
      }
    }
  };

  const nextStep = async () => {
    console.log('Moving to next step, current data:', formData);
    
    // Create campaign if we don't have one (using only existing columns)
    if (!campaignId && user) {
      try {
        const newCampaignData = {
          email: formData.email || user.email,
          campaign_name: formData.campaignName || 'New Campaign',
          website: formData.website || '',
          // Required existing fields
          wallet_address: 'temp-wallet-' + Date.now(),
          max_donation_limit: 3300,
          suggested_amounts: [25, 50, 100, 250],
          theme_color: formData.themeColor || '#2a2a72',
          status: 'setup'
        };

        console.log('Creating new campaign with existing columns:', newCampaignData);
        const { data: newCampaign, error } = await supabase
          .from('campaigns')
          .insert([newCampaignData])
          .select()
          .single();

        if (error) {
          console.error('Failed to create campaign:', error);
          setCampaignId('demo-campaign-' + Date.now());
        } else {
          setCampaignId(newCampaign.id);
          console.log('Campaign created successfully:', newCampaign);
        }
      } catch (error) {
        console.error('Error creating campaign:', error);
        setCampaignId('demo-campaign-' + Date.now());
      }
    }
    
    // Update form data with current step
    const nextStepNum = currentStep + 1;
    await updateFormData({ 
      currentStep: nextStepNum,
      setupCompleted: nextStepNum >= totalSteps
    });
    
    // Progress to next step
    if (currentStep < totalSteps) {
      setCurrentStep(nextStepNum);
      console.log(`Advanced to step ${nextStepNum}`);
    } else {
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
        return <CampaignInfo {...stepProps} />;
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
        return <CampaignInfo {...stepProps} />;
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
