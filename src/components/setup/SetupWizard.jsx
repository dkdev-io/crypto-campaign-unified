import React, { useState } from 'react';
import StepIndicator from './StepIndicator';
import Signup from './Signup';
import CampaignInfo from './CampaignInfo';
import Compliance from './Compliance';
import FormCustomization from './FormCustomization';
import EmbedOptions from './EmbedOptions';
import LaunchConfirmation from './LaunchConfirmation';
import { supabase } from '../../lib/supabase';
import '../../styles/setup.css';

const SetupWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [campaignId, setCampaignId] = useState(null);

  const totalSteps = 6;

  const updateFormData = async (newData) => {
    const updatedData = { ...formData, ...newData };
    setFormData(updatedData);
    
    if (campaignId) {
      try {
        // Map React form field names to database column names
        const dbData = {};
        if (updatedData.campaignName) dbData.campaign_name = updatedData.campaignName;
        if (updatedData.suggestedAmounts) {
          // Convert comma-separated string to array of numbers
          const amounts = typeof updatedData.suggestedAmounts === 'string' 
            ? updatedData.suggestedAmounts.split(',').map(a => parseFloat(a.trim())).filter(a => !isNaN(a))
            : updatedData.suggestedAmounts;
          dbData.suggested_amounts = amounts;
        }
        if (updatedData.maxDonation) dbData.max_donation_limit = parseFloat(updatedData.maxDonation);
        if (updatedData.themeColor) dbData.theme_color = updatedData.themeColor;
        if (updatedData.buttonColor) dbData.button_color = updatedData.buttonColor;
        if (updatedData.supportedCryptos) dbData.supported_cryptos = updatedData.supportedCryptos;
        if (updatedData.candidateName) dbData.candidate_name = updatedData.candidateName;
        if (updatedData.website) dbData.website = updatedData.website;

        const { error } = await supabase
          .from('campaigns')
          .update(dbData)
          .eq('id', campaignId);
        
        if (error) {
          console.error('Failed to save campaign data:', error);
        } else {
          console.log('Campaign data saved successfully');
        }
      } catch (error) {
        console.error('Save error:', error);
      }
    }
  };

  const nextStep = async () => {
    if (currentStep === 1 && !campaignId) {
      try {
        const { data, error } = await supabase
          .from('campaigns')
          .insert([{
            email: formData.email || 'test@test.com',
            campaign_name: formData.campaignName || 'New Campaign',
            website: 'https://temp.com',
            wallet_address: 'temp-wallet'
          }])
          .select()
          .single();
        
        if (!error) {
          setCampaignId(data.id);
          console.log('Campaign created with ID:', data.id);
        } else {
          console.error('Failed to create campaign:', error);
        }
      } catch (error) {
        console.error('Campaign creation error:', error);
      }
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
        return <CampaignInfo {...stepProps} />;
      case 3:
        return <Compliance {...stepProps} />;
      case 4:
        return <FormCustomization {...stepProps} />;
      case 5:
        return <EmbedOptions {...stepProps} />;
      case 6:
        return <LaunchConfirmation {...stepProps} />;
      default:
        return <Signup {...stepProps} />;
    }
  };

  return (
    <div className="setup-container">
      <div className="setup-card">
        <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
        <div className="form-content">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
