import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const CampaignDebug = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      console.log('Loading all campaigns...');
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading campaigns:', error);
        setError(error.message);
      } else {
        console.log('Campaigns loaded:', data);
        setCampaigns(data || []);
      }
    } catch (err) {
      console.error('Exception loading campaigns:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading campaigns...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Campaign Debug Information</h2>
      
      {error && (
        <div style={{ background: '#f8d7da', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div style={{ marginBottom: '2rem' }}>
        <strong>Total Campaigns Found:</strong> {campaigns.length}
      </div>
      
      {campaigns.length === 0 ? (
        <div style={{ background: '#fff3cd', padding: '1rem', borderRadius: '4px' }}>
          <p><strong>No campaigns found!</strong></p>
          <p>You need to create a campaign first using the setup wizard at <code>/</code></p>
        </div>
      ) : (
        <div>
          <h3>Available Campaigns</h3>
          {campaigns.map((campaign, index) => (
            <div key={campaign.id} style={{ 
              background: '#f8f9fa', 
              padding: '1rem', 
              marginBottom: '1rem', 
              borderRadius: '4px',
              border: '1px solid #dee2e6'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '1rem' }}>
                <div>
                  <strong>Campaign #{index + 1}</strong>
                  <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                    ID: <code>{campaign.id}</code>
                  </div>
                </div>
                <div>
                  <div><strong>Name:</strong> {campaign.campaign_name}</div>
                  <div><strong>Email:</strong> {campaign.email}</div>
                  <div><strong>Candidate:</strong> {campaign.candidate_name || 'Not set'}</div>
                  <div><strong>Website:</strong> {campaign.website}</div>
                  <div><strong>Suggested Amounts:</strong> {JSON.stringify(campaign.suggested_amounts)}</div>
                  <div><strong>Theme:</strong> <span style={{ color: campaign.theme_color }}>{campaign.theme_color}</span></div>
                </div>
              </div>
              <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'white', borderRadius: '4px' }}>
                <strong>Test URLs:</strong>
                <div>
                  <a 
                    href={`/?campaign=${campaign.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#007bff', marginRight: '1rem' }}
                  >
                    Enhanced Form
                  </a>
                  <code>/?campaign={campaign.id}</code>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#e7f3ff', borderRadius: '4px' }}>
        <h4>Debug Actions</h4>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a href="/" style={{ color: '#007bff' }}>Setup Wizard</a>
          <a href="/supabase-check" style={{ color: '#007bff' }}>Supabase Check</a>
          <a href="/test-form" style={{ color: '#007bff' }}>Test Form (Fake ID)</a>
        </div>
      </div>
    </div>
  );
};

export default CampaignDebug;