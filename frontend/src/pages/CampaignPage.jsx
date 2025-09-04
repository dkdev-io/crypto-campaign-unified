import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import EmbeddedDonorForm from '../components/EmbeddedDonorForm';
import Header from '../components/Header';
import Footer from '../components/Footer';

const CampaignPage = () => {
  const { campaignName } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCampaign = async () => {
      try {
        // Convert URL-friendly name back to campaign name and try multiple variations
        const decodedName = decodeURIComponent(campaignName).replace(/-/g, ' ');
        console.log('Looking for campaign:', { urlParam: campaignName, decoded: decodedName });
        
        // Simplified query - just get the campaign
        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .ilike('campaign_name', decodedName)
          .maybeSingle();
        
        console.log('Campaign lookup result:', { data: !!data, error: error?.message });

        if (error) {
          console.error('Database error:', error);
          setError('Database error: ' + error.message);
        } else if (!data) {
          setError('Campaign "' + campaignName + '" not found');
        } else {
          setCampaign(data);
        }
      } finally {
        setLoading(false);
      }
    };

    if (campaignName) {
      loadCampaign();
    }
  }, [campaignName]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80">
        <Header />
        <div className="flex items-center justify-center px-4 py-12">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading campaign...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80">
        <Header />
        <div className="flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full text-center">
            <div className="bg-white rounded-lg p-8 shadow-xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Campaign Not Found</h2>
              <p className="text-gray-600 mb-6">
                The campaign "{campaignName}" could not be found or is not currently active.
              </p>
              <a
                href="/"
                className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Return Home
              </a>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Campaign Header */}
          <div className="text-center text-white mb-12">
            <h1 className="text-4xl font-bold mb-4">
              {campaign.campaign_name}
            </h1>
            {campaign.description && (
              <p className="text-xl opacity-90 max-w-2xl mx-auto">
                {campaign.description}
              </p>
            )}
          </div>

          {/* Donation Form */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Support Our Campaign
                </h2>
                <p className="text-gray-600">
                  Make a secure contribution with cryptocurrency or traditional payment
                </p>
              </div>
              
              <EmbeddedDonorForm 
                campaignId={campaign.id}
              />
            </div>
          </div>

          {/* Campaign Info Footer */}
          <div className="text-center text-white mt-12 opacity-80">
            <p className="text-sm">
              Powered by NEXTRAISE - Secure, FEC-compliant cryptocurrency donations
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default CampaignPage;