import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import StepIndicator from './StepIndicator';
import CampaignInfo from './CampaignInfo';
import CommitteeSearch from './CommitteeSearch';
import BankConnection from './BankConnection';
import WebsiteStyleAnalyzer from './WebsiteStyleAnalyzer';
import StylePreferences from './StylePreferences';
import TermsAgreement from './TermsAgreement';
import EmbedCode from './EmbedCode';
import CampaignAuthNav from '../campaigns/CampaignAuthNav';
import { supabase } from '../../lib/supabase';
// All styles now consolidated in index.css

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

        // Look for existing campaign (only if we have a user)
        let existingCampaign = null;
        let error = null;

        if (user) {
          const result = await supabase
            .from('campaigns')
            .select(
              'id, campaign_name, email, website, wallet_address, status, created_at, styles_applied, style_method, committee_name, fec_committee_id, committee_address, committee_city, committee_state, committee_zip, committee_contact_info'
            )
            .eq('email', user.email)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          existingCampaign = result.data;
          error = result.error;
        }

        if (existingCampaign && !error) {
          console.log('🔍 EXISTING CAMPAIGN FOUND:', existingCampaign.id);
          setCampaignId(existingCampaign.id);

          // Build form data from available DB fields + localStorage
          const existingFormData = {
            campaignId: existingCampaign.id,
            userFullName: savedData?.userFullName || user.user_metadata?.full_name || '',
            campaignName:
              existingCampaign.campaign_name ||
              savedData?.campaignName ||
              '',
            email: existingCampaign.email || user.email,
            website: existingCampaign.website || savedData?.website || '',
            themeColor: savedData?.themeColor || '#2a2a72',
            suggestedAmounts: [25, 50, 100, 250],
            maxDonation: 3300,
            appliedStyles: savedData?.appliedStyles || null,
            stylesApplied: existingCampaign.styles_applied || savedData?.stylesApplied || false,
            styleMethod: existingCampaign.style_method || savedData?.styleMethod || null,

            // Committee data from database or localStorage
            fecCommitteeId: existingCampaign.fec_committee_id || savedData?.fecCommitteeId || '',
            committeeName: existingCampaign.committee_name || savedData?.committeeName || '',
            committeeAddress:
              existingCampaign.committee_address || savedData?.committeeAddress || '',
            committeeCity: existingCampaign.committee_city || savedData?.committeeCity || '',
            committeeState: existingCampaign.committee_state || savedData?.committeeState || '',
            committeeZip: existingCampaign.committee_zip || savedData?.committeeZip || '',
            selectedCommittee:
              existingCampaign.committee_contact_info || savedData?.selectedCommittee || null,
            committeeDetails: savedData?.committeeDetails || null,
            bankAccountVerified: savedData?.bankAccountVerified || false,
            bankAccountInfo: savedData?.bankAccountInfo || null,
            allTermsAccepted: savedData?.allTermsAccepted || false,
            websiteUrl: savedData?.websiteUrl || '',
            styleAnalysis: savedData?.styleAnalysis || null,
            embedCode: savedData?.embedCode || '',
            setupCompleted: savedData?.setupCompleted || false,
            currentStep: savedData?.currentStep || 1,
          };

          setFormData(existingFormData);
          setCurrentStep(savedData?.currentStep || 1);
        } else {
          // No existing campaign - create one immediately
          console.log('No existing campaign found, creating new campaign...');

          const newFormData = {
            userFullName: user.user_metadata?.full_name || '',
            email: user.email,
            campaignName: savedData?.campaignName || '',
            website: savedData?.website || '',
            currentStep: savedData?.currentStep || 1,
          };

          // Recover from localStorage if available
          if (savedData) {
            Object.assign(newFormData, savedData);
          }

          // Create campaign immediately so it's available for step 1
          try {
            const newCampaignData = {
              email: newFormData.email,
              campaign_name: newFormData.campaignName || 'New Campaign',
              website: newFormData.website || '',
              wallet_address: 'temp-wallet-' + Date.now(),
              max_donation_limit: 3300,
              suggested_amounts: [25, 50, 100, 250],
              theme_color: '#2a2a72',
              status: 'setup',
            };

            console.log('Creating new campaign:', newCampaignData);
            const { data: newCampaign, error: createError } = await supabase
              .from('campaigns')
              .insert([newCampaignData])
              .select()
              .single();

            if (!createError && newCampaign) {
              console.log('🆕 NEW CAMPAIGN CREATED:', newCampaign.id);
              setCampaignId(newCampaign.id);
              newFormData.campaignId = newCampaign.id;
              localStorage.setItem('campaignSetupData', JSON.stringify(newFormData));
            } else {
              console.error('Failed to create campaign:', createError);
              throw new Error('Campaign creation failed');
            }
          } catch (createError) {
            console.error('Error creating campaign during initialization:', createError);
            // Don't use fallback IDs - we need real campaign IDs for Supabase
            throw new Error('Campaign creation is required for setup');
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
              currentStep: 1,
            });
            setCurrentStep(1);
          }
        } catch (e) {
          setFormData({
            userFullName: user.user_metadata?.full_name || '',
            email: user.email,
            currentStep: 2,
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
        if (updatedData.appliedStyles) dbData.applied_styles = updatedData.appliedStyles;
        if (updatedData.stylesApplied !== undefined)
          dbData.styles_applied = updatedData.stylesApplied;
        if (updatedData.styleMethod) dbData.style_method = updatedData.styleMethod;

        // Committee information fields
        if (updatedData.committeeName) dbData.committee_name = updatedData.committeeName;
        if (updatedData.fecCommitteeId) dbData.fec_committee_id = updatedData.fecCommitteeId;
        if (updatedData.committeeAddress) dbData.committee_address = updatedData.committeeAddress;
        if (updatedData.committeeCity) dbData.committee_city = updatedData.committeeCity;
        if (updatedData.committeeState) dbData.committee_state = updatedData.committeeState;
        if (updatedData.committeeZip) dbData.committee_zip = updatedData.committeeZip;
        if (updatedData.selectedCommittee)
          dbData.committee_contact_info = updatedData.selectedCommittee;

        // Handle suggested amounts
        if (updatedData.suggestedAmounts !== undefined) {
          if (updatedData.suggestedAmounts && updatedData.suggestedAmounts !== '25, 50, 100, 250') {
            const amounts =
              typeof updatedData.suggestedAmounts === 'string'
                ? updatedData.suggestedAmounts
                    .split(',')
                    .map((a) => parseFloat(a.trim()))
                    .filter((a) => !isNaN(a))
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
          status: 'setup',
        };

        console.log('Creating new campaign with existing columns:', newCampaignData);
        const { data: newCampaign, error } = await supabase
          .from('campaigns')
          .insert([newCampaignData])
          .select()
          .single();

        if (error) {
          console.error('Failed to create campaign:', error);
          const fallbackId = 'demo-campaign-' + Date.now();
          setCampaignId(fallbackId);
          setFormData((prev) => ({ ...prev, campaignId: fallbackId }));
        } else {
          setCampaignId(newCampaign.id);
          setFormData((prev) => ({ ...prev, campaignId: newCampaign.id }));
          console.log('Campaign created successfully:', newCampaign);
        }
      } catch (error) {
        console.error('Error creating campaign:', error);
        const fallbackId = 'demo-campaign-' + Date.now();
        setCampaignId(fallbackId);
        setFormData((prev) => ({ ...prev, campaignId: fallbackId }));
      }
    }

    // Update form data with current step
    const nextStepNum = currentStep + 1;
    await updateFormData({
      currentStep: nextStepNum,
      setupCompleted: nextStepNum >= totalSteps,
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
    console.log('🎯 RENDERING STEP', currentStep, 'with campaignId:', campaignId);
    
    const stepProps = {
      formData,
      updateFormData,
      onNext: nextStep,
      onPrev: prevStep,
      campaignId,
    };

    switch (currentStep) {
      case 1:
        return <CampaignInfo {...stepProps} />;
      case 2:
        console.log('🔗 PASSING campaignId to CommitteeSearch:', campaignId);
        return <CommitteeSearch {...stepProps} />;
      case 3:
        return <BankConnection {...stepProps} />;
      case 4:
        return <WebsiteStyleAnalyzer {...stepProps} />;
      case 5:
        return <StylePreferences {...stepProps} />;
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
                <div
                  className="spinner"
                  style={{
                    width: '30px',
                    height: '30px',
                    border: '3px solid #f3f3f3',
                    borderTop: '3px solid #007bff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto',
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="setup-wizard">
      <CampaignAuthNav />
      <div className="setup-container">
        <div className="setup-card">
          <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
          <div className="form-content">{renderStep()}</div>
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
