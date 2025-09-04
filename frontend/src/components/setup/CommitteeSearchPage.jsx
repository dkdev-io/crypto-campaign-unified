import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import CommitteeSearch from './CommitteeSearch';
import CampaignAuthNav from '../campaigns/CampaignAuthNav';

const CommitteeSearchPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({});
  const [campaignId, setCampaignId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize campaign and load form data
  useEffect(() => {
    const initializeCommitteeSearch = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Try to load from localStorage first
        let savedData = null;
        try {
          const saved = localStorage.getItem('campaignSetupData');
          if (saved) {
            savedData = JSON.parse(saved);
            console.log('Loaded saved data:', savedData);
          }
        } catch (e) {
          console.warn('Could not load saved data:', e);
        }

        // Look for existing campaign
        const { data: existingCampaign, error } = await supabase
          .from('campaigns')
          .select('*')
          .eq('email', user.email)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (existingCampaign && !error) {
          setCampaignId(existingCampaign.id);
          setFormData({
            ...savedData,
            campaignId: existingCampaign.id,
            email: user.email
          });
        } else {
          // Create new campaign
          const newCampaignData = {
            email: user.email,
            title: savedData?.campaignName || 'New Campaign',
            wallet_address: 'temp-wallet-' + Date.now(),
            status: 'setup',
            user_id: user.id
          };

          const { data: newCampaign, error: createError } = await supabase
            .from('campaigns')
            .insert([newCampaignData])
            .select()
            .single();

          if (createError) {
            console.error('Failed to create campaign:', createError);
            // Use fallback ID
            const fallbackId = 'demo-campaign-' + Date.now();
            setCampaignId(fallbackId);
            setFormData({
              ...savedData,
              campaignId: fallbackId,
              email: user.email
            });
          } else {
            setCampaignId(newCampaign.id);
            setFormData({
              ...savedData,
              campaignId: newCampaign.id,
              email: user.email
            });
            console.log('Campaign created successfully:', newCampaign);
          }
        }
      } catch (error) {
        console.error('Error initializing committee search:', error);
        // Fallback
        const fallbackId = 'demo-campaign-' + Date.now();
        setCampaignId(fallbackId);
        setFormData({
          campaignId: fallbackId,
          email: user.email
        });
      } finally {
        setLoading(false);
      }
    };

    initializeCommitteeSearch();
  }, [user]);

  const updateFormData = async (newData) => {
    const updatedData = { ...formData, ...newData };
    setFormData(updatedData);
    
    // Save to localStorage
    try {
      localStorage.setItem('campaignSetupData', JSON.stringify(updatedData));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }

    // Save committee information to Supabase if we have a campaign ID
    if (campaignId && (newData.committeeName || newData.fecCommitteeId || newData.committeeAddress)) {
      try {
        const dbData = {};
        if (updatedData.committeeName) dbData.committee_name = updatedData.committeeName;
        if (updatedData.fecCommitteeId) dbData.fec_committee_id = updatedData.fecCommitteeId;
        if (updatedData.committeeAddress) dbData.committee_address = updatedData.committeeAddress;
        if (updatedData.committeeCity) dbData.committee_city = updatedData.committeeCity;
        if (updatedData.committeeState) dbData.committee_state = updatedData.committeeState;
        if (updatedData.committeeZip) dbData.committee_zip = updatedData.committeeZip;
        if (updatedData.selectedCommittee) dbData.committee_contact_info = updatedData.selectedCommittee;

        if (Object.keys(dbData).length > 0) {
          const { error } = await supabase
            .from('campaigns')
            .update(dbData)
            .eq('id', campaignId);

          if (error) {
            console.warn('Failed to save committee data to database:', error.message);
          } else {
            console.log('Committee data saved to database successfully');
          }
        }
      } catch (error) {
        console.warn('Database save error:', error);
      }
    }
  };

  const handleNext = () => {
    navigate('/BankConnection');
  };

  const handlePrev = () => {
    navigate('/YourInfo');
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{backgroundColor: 'hsl(var(--crypto-navy))'}}>
        <CampaignAuthNav />
        <div className="flex items-center justify-center px-4 py-12">
          <div className="max-w-4xl w-full">
            <div className="bg-card rounded-2xl shadow-2xl p-8 text-center">
              <div>Loading your campaign...</div>
              <div style={{ marginTop: '1rem' }}>
                <div style={{ 
                  width: '30px', 
                  height: '30px', 
                  border: '3px solid #f3f3f3',
                  borderTop: '3px solid hsl(var(--crypto-navy))',
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
              campaignId={campaignId}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommitteeSearchPage;