import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { processContribution } from '../lib/smart-contract';
import { useAnalytics } from './analytics/AnalyticsProvider';

const SimpleDonorForm = ({ campaignId }) => {
  const [formData, setFormData] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [campaignData, setCampaignData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Analytics integration (with safe fallback)
  let analytics;
  try {
    analytics = useAnalytics();
  } catch (e) {
    // Analytics provider not available in this context
    analytics = {
      trackEvent: () => {},
      trackConversion: () => {}
    };
  }
  const formStartTime = Date.now();

  console.log('SimpleDonorForm rendering with campaignId:', campaignId);

  useEffect(() => {
    // Track form view
    analytics?.trackEvent('form_view', { 
      formType: 'contribution', 
      campaignId,
      timestamp: new Date().toISOString()
    });
    
    if (campaignId) {
      loadCampaignData();
    } else {
      // No campaign ID, just show default form
      setLoading(false);
    }
  }, [campaignId, analytics]);

  const loadCampaignData = async () => {
    try {
      console.log('Loading campaign with ID:', campaignId);
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      console.log('Campaign query result:', { data, error });

      if (error) {
        console.error('Failed to load campaign:', error);
        setErrorMessage(`Unable to load campaign: ${error.message}`);
      } else if (!data) {
        setErrorMessage('Campaign not found. Please check the campaign ID.');
      } else {
        setCampaignData(data);
        console.log('Successfully loaded campaign data:', data);
      }
    } catch (err) {
      console.error('Error loading campaign:', err);
      setErrorMessage('Unable to load campaign. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setErrorMessage('');
    
    const contributionAmount = parseFloat(formData.amount);
    const processingStartTime = Date.now();
    
    // Track contribution attempt
    analytics?.trackEvent('contribution_attempt', {
      amount: contributionAmount,
      campaign_id: campaignId,
      has_wallet: !!formData.walletAddress,
      form_completion_time: Date.now() - formStartTime
    });
    
    try {
      // Validate campaign ID
      if (!campaignId) {
        analytics?.trackEvent('contribution_validation_error', { error: 'missing_campaign_id' });
        throw new Error('No campaign ID found. Please check the campaign URL.');
      }
      
      // Validate amount
      if (!formData.amount || contributionAmount <= 0) {
        analytics?.trackEvent('contribution_validation_error', { error: 'invalid_amount', value: formData.amount });
        throw new Error('Please enter a valid contribution amount');
      }
      
      // Validate wallet address for crypto contributions
      if (!formData.walletAddress || !formData.walletAddress.trim()) {
        analytics?.trackEvent('contribution_validation_error', { error: 'missing_wallet' });
        throw new Error('Wallet address is required for cryptocurrency contributions');
      }
      
      // Process contribution through smart contract
      console.log('🚀 Initiating smart contract transaction...');
      const contractResult = await processContribution(formData, campaignId);
      
      if (!contractResult.success) {
        analytics?.trackEvent('contribution_blockchain_error', {
          amount: contributionAmount,
          error: contractResult.error,
          processing_time: Date.now() - processingStartTime
        });
        throw new Error(`Smart contract error: ${contractResult.error}`);
      }
      
      console.log('✅ Smart contract transaction successful:', contractResult);
      
      // Track successful blockchain transaction
      analytics?.trackEvent('contribution_blockchain_success', {
        amount: contributionAmount,
        transaction_hash: contractResult.transactionHash,
        processing_time: Date.now() - processingStartTime
      });
      
      // Save donor submission to database with transaction details
      const { data, error } = await supabase
        .from('form_submissions')
        .insert([{
          campaign_id: campaignId,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone || '',
          address: formData.street,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip,
          employer: formData.employer,
          occupation: formData.occupation,
          amount: parseFloat(formData.amount),
          contributor_wallet: formData.walletAddress,
          transaction_hash: contractResult.transactionHash,
          payment_method: 'crypto',
          is_us_citizen: true,
          is_prohibited_source: false,
          acknowledgment_signed: true
        }]);

      if (error) {
        console.error('Supabase error:', error);
        analytics?.trackEvent('contribution_database_error', {
          amount: contributionAmount,
          error: error.message,
          processing_time: Date.now() - processingStartTime
        });
        throw new Error(error.message || 'Failed to save contribution');
      }
      
      // Track full contribution success (conversion!)
      analytics?.trackConversion({
        amount: contributionAmount,
        transaction_hash: contractResult.transactionHash,
        campaign_id: campaignId,
        total_processing_time: Date.now() - processingStartTime,
        form_completion_time: Date.now() - formStartTime
      });
      
      setSubmitted(true);
      console.log('✅ Contribution submitted successfully');
    } catch (err) {
      console.error('Form submission error:', err);
      
      // Track contribution failure
      analytics?.trackEvent('contribution_failure', {
        amount: contributionAmount || 0,
        error: err.message,
        error_step: err.message.includes('Smart contract') ? 'blockchain' : 
                   err.message.includes('campaign ID') ? 'validation' : 
                   err.message.includes('amount') ? 'validation' : 
                   err.message.includes('wallet') ? 'validation' : 'database',
        total_time_to_error: Date.now() - formStartTime
      });
      
      setErrorMessage(err.message || 'An error occurred while processing your contribution. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading campaign...</p>
        {campaignId && <p style={{ fontSize: '0.9rem', color: '#666' }}>Campaign ID: {campaignId}</p>}
      </div>
    );
  }

  if (errorMessage && !campaignData) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', background: '#f8d7da', borderRadius: '8px' }}>
        <h3>Unable to Load Campaign</h3>
        <p>{errorMessage}</p>
        <p style={{ fontSize: '0.9rem', color: '#666' }}>Campaign ID: {campaignId || 'None provided'}</p>
        <button 
          onClick={() => window.location.reload()} 
          style={{ 
            padding: '0.5rem 1rem', 
            background: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '1rem'
          }}
        >
          Retry
        </button>
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
  const candidateName = campaignData?.candidate_name;

  console.log('Rendering simple form with:', {
    campaignData: !!campaignData,
    themeColor,
    suggestedAmounts,
    maxDonation,
    hasError: !!errorMessage
  });

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem', background: 'white', borderRadius: '8px' }}>
      <h1 style={{ color: themeColor, marginBottom: '1rem' }}>
        {campaignData?.campaign_name || 'Support Our Campaign'}
      </h1>
      {candidateName && (
        <p style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
          Candidate: <strong>{candidateName}</strong>
        </p>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label>First Name *</label>
            <input 
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
              required
              value={formData.firstName || ''}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              onFocus={() => analytics?.trackEvent('form_field_focus', { field: 'firstName' })}
            />
          </div>
          <div>
            <label>Last Name *</label>
            <input 
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
              required
              value={formData.lastName || ''}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            />
          </div>
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
          <label>Your Crypto Wallet Address *</label>
          <input 
            placeholder="Enter your cryptocurrency wallet address"
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '1rem' }}
            required
            value={formData.walletAddress || ''}
            onChange={(e) => setFormData({...formData, walletAddress: e.target.value})}
          />
          <small style={{ color: '#666', fontSize: '0.9rem' }}>
            This is where your crypto contribution will be sent from
          </small>
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
              
              // Track amount changes for analytics
              if (value && !isNaN(value)) {
                analytics?.trackEvent('contribution_amount_change', { 
                  amount: value,
                  milestone: value >= 100 ? '100+' : value >= 50 ? '50+' : value >= 25 ? '25+' : 'under_25'
                });
              }
            }}
            onFocus={() => analytics?.trackEvent('form_field_focus', { field: 'amount' })}
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
            background: isSubmitting ? '#ccc' : themeColor, 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            fontSize: '1.1rem',
            cursor: isSubmitting ? 'not-allowed' : 'pointer'
          }}
        >
          {isSubmitting ? '⏳ Initiating Smart Contract...' : '🚀 Launch Smart Contract'}
        </button>
      </form>
    </div>
  );
};

export default SimpleDonorForm;