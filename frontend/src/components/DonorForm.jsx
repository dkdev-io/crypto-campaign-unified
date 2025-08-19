import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const DonorForm = ({ campaignId }) => {
  const [formData, setFormData] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [campaignData, setCampaignData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (campaignId) {
      loadCampaignData();
    } else {
      setLoading(false);
    }
  }, [campaignId]);

  const loadCampaignData = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) {
        console.error('Failed to load campaign:', error);
        setErrorMessage('Failed to load campaign data');
      } else {
        setCampaignData(data);
        console.log('Loaded campaign data:', data);
      }
    } catch (err) {
      console.error('Error loading campaign:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      // Validate amount
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        throw new Error('Please enter a valid contribution amount');
      }
      
      // Save donor submission to database
      const { data, error } = await supabase
        .from('form_submissions')
        .insert([{
          campaign_id: campaignId || 'demo-campaign',
          donor_full_name: formData.fullName,
          donor_email: formData.email,
          donor_phone: formData.phone || '',
          donor_street: formData.street,
          donor_city: formData.city,
          donor_state: formData.state,
          donor_zip: formData.zip,
          donor_employer: formData.employer,
          donor_occupation: formData.occupation,
          amount_usd: parseFloat(formData.amount),
          cryptocurrency: 'BTC',
          crypto_amount: 0.001,
          wallet_address: 'donor-wallet-placeholder',
          citizenship_confirmed: true,
          own_funds_confirmed: true,
          not_corporate_confirmed: true,
          not_contractor_confirmed: true,
          age_confirmed: true
        }]);

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Failed to save contribution');
      }
      
      setSubmitted(true);
    } catch (err) {
      console.error('Form submission error:', err);
      setErrorMessage(err.message || 'An error occurred while processing your contribution. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading campaign...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', background: '#d4edda', borderRadius: '8px' }}>
        <h2>🎉 Thank You!</h2>
        <p>Your contribution has been submitted successfully.</p>
      </div>
    );
  }

  const themeColor = campaignData?.theme_color || '#2a2a72';
  const suggestedAmounts = campaignData?.suggested_amounts || [25, 50, 100, 250];
  const maxDonation = campaignData?.max_donation_limit || 3300;

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem', background: 'white', borderRadius: '8px' }}>
      <h1 style={{ color: themeColor, marginBottom: '1rem' }}>
        {campaignData?.campaign_name || 'Support Our Campaign'}
      </h1>
      {campaignData?.candidate_name && (
        <p style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
          Candidate: <strong>{campaignData.candidate_name}</strong>
        </p>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Full Name *</label>
          <input 
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            required
            value={formData.fullName || ''}
            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Email *</label>
          <input 
            type="email"
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            required
            value={formData.email || ''}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Address *</label>
          <input 
            placeholder="Street Address"
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '0.5rem' }}
            required
            value={formData.street || ''}
            onChange={(e) => setFormData({...formData, street: e.target.value})}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.5rem' }}>
            <input 
              placeholder="City"
              style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
              required
              value={formData.city || ''}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
            />
            <input 
              placeholder="State"
              style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
              required
              value={formData.state || ''}
              onChange={(e) => setFormData({...formData, state: e.target.value})}
            />
            <input 
              placeholder="ZIP"
              style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
              required
              value={formData.zip || ''}
              onChange={(e) => setFormData({...formData, zip: e.target.value})}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label>Employer *</label>
            <input 
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
              required
              value={formData.employer || ''}
              onChange={(e) => setFormData({...formData, employer: e.target.value})}
            />
          </div>
          <div>
            <label>Occupation *</label>
            <input 
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
              required
              value={formData.occupation || ''}
              onChange={(e) => setFormData({...formData, occupation: e.target.value})}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Contribution Amount * {maxDonation && `(Max: $${maxDonation})`}</label>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            {suggestedAmounts.map(amount => (
              <button 
                key={amount}
                type="button"
                onClick={() => setFormData({...formData, amount})}
                style={{ 
                  padding: '0.5rem 1rem', 
                  border: `2px solid ${themeColor}`, 
                  background: formData.amount === amount ? themeColor : 'white',
                  color: formData.amount === amount ? 'white' : themeColor,
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ${amount}
              </button>
            ))}
          </div>
          <input 
            type="number"
            placeholder="Custom amount"
            min="1"
            max={maxDonation}
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            value={formData.amount || ''}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (value > maxDonation) {
                setErrorMessage(`Maximum contribution is $${maxDonation}`);
              } else {
                setErrorMessage('');
                setFormData({...formData, amount: e.target.value});
              }
            }}
          />
        </div>

        <div style={{ background: '#f0f8ff', padding: '1rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <input 
              type="checkbox"
              required
              style={{ marginTop: '0.25rem' }}
            />
            <span>
              I certify that I am a U.S. citizen or lawfully admitted permanent resident, 
              this contribution is made from my own funds, I am not a federal contractor, 
              and I am at least 18 years old.
            </span>
          </label>
        </div>

        {errorMessage && (
          <div style={{ 
            background: '#f8d7da', 
            color: '#721c24', 
            padding: '0.75rem', 
            borderRadius: '4px', 
            marginBottom: '1rem',
            border: '1px solid #f5c6cb'
          }}>
            ⚠️ {errorMessage}
          </div>
        )}
        
        <button 
          type="submit"
          disabled={isSubmitting}
          style={{ 
            width: '100%', 
            padding: '1rem', 
            background: isSubmitting ? '#ccc' : (campaignData?.button_color || '#F0A202'), 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            fontSize: '1.1rem',
            cursor: isSubmitting ? 'not-allowed' : 'pointer'
          }}
        >
          {isSubmitting ? '⏳ Processing...' : '🚀 Contribute Now'}
        </button>
      </form>
    </div>
  );
};

export default DonorForm;
