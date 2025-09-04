import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CommitteeSearch from './CommitteeSearch';
import CampaignAuthNav from '../campaigns/CampaignAuthNav';

const CommitteeSearchPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});

  // Load existing form data from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('campaignSetupData');
      if (saved) {
        const savedData = JSON.parse(saved);
        setFormData(savedData);
      }
    } catch (e) {
      console.warn('Could not load saved data:', e);
    }
  }, []);

  const updateFormData = (newData) => {
    const updatedData = { ...formData, ...newData };
    setFormData(updatedData);
    
    // Save to localStorage
    try {
      localStorage.setItem('campaignSetupData', JSON.stringify(updatedData));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  };

  const handleNext = () => {
    navigate('/BankConnection');
  };

  const handlePrev = () => {
    navigate('/YourInfo');
  };

  return (
    <div className="min-h-screen" style={{backgroundColor: 'hsl(var(--crypto-navy))'}}>
      <CampaignAuthNav />
      <div className="flex items-center justify-center px-4 py-12">
        <div className="max-w-4xl w-full">
          <div className="bg-card rounded-2xl shadow-2xl p-8">
            <CommitteeSearch 
              formData={formData}
              updateFormData={updateFormData}
              onNext={handleNext}
              onPrev={handlePrev}
              campaignId={formData.campaignId}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommitteeSearchPage;