import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { processContribution } from '../lib/smart-contract';
import { web3Service } from '../lib/web3';

const SimpleDonorForm = ({ campaignId }) => {
  const [formData, setFormData] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [campaignData, setCampaignData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Analytics integration - check if provider exists
  const formStartTime = Date.now();

  console.log('SimpleDonorForm rendering with campaignId:', campaignId);

  useEffect(() => {
    if (campaignId) {
      loadCampaignData();
    } else {
      // No campaign ID, just show default form
      setLoading(false);
    }
  }, [campaignId]);

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
    
    try {
      // Use demo campaign if no campaign ID provided
      const effectiveCampaignId = campaignId || 'demo-campaign';
      
      // Validate amount
      if (!formData.amount || contributionAmount <= 0) {
        throw new Error('Please enter a valid contribution amount');
      }
      
      // Initialize Web3 and process contribution through blockchain
      console.log('🚀 Initiating Web3 connection and transaction...');
      
      // Initialize Web3 service
      await web3Service.init();
      
      // Connect wallet (demo mode if MetaMask unavailable)
      const walletConnection = await web3Service.connectWallet();
      if (!walletConnection.success) {
        throw new Error(`Wallet connection failed: ${walletConnection.error}`);
      }
      
      // Convert USD to ETH for blockchain transaction
      const amountETH = await web3Service.convertUSDToETH(contributionAmount);
      console.log(`Converting $${contributionAmount} to ${amountETH} ETH`);
      
      // Execute blockchain contribution
      const contractResult = await web3Service.contribute(amountETH);
      
      if (!contractResult.success) {
        throw new Error(`Blockchain transaction failed: ${contractResult.error}`);
      }
      
      console.log('✅ Blockchain transaction successful:', contractResult);
      
      // Save donor submission to database with transaction details
      const { data, error } = await supabase
        .from('form_submissions')
        .insert([{
          campaign_id: effectiveCampaignId,
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
          contributor_wallet: walletConnection.account || 'demo-wallet',
          transaction_hash: contractResult.txHash,
          payment_method: 'crypto',
          is_us_citizen: true,
          is_prohibited_source: false,
          acknowledgment_signed: true
        }]);

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Failed to save contribution');
      }
      
      setSubmitted(true);
      console.log('✅ Contribution submitted successfully');
    } catch (err) {
      console.error('Form submission error:', err);
      setErrorMessage(err.message || 'An error occurred while processing your contribution. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="crypto-card max-w-md mx-auto text-center">
        <p className="text-lg font-medium" style={{color: 'hsl(var(--crypto-navy))'}}>Loading campaign...</p>
        {campaignId && <p className="text-sm text-muted-foreground mt-2">Campaign ID: {campaignId}</p>}
      </div>
    );
  }

  if (errorMessage && !campaignData) {
    return (
      <div className="crypto-card max-w-md mx-auto text-center" style={{backgroundColor: 'hsl(0 93% 94%)', borderColor: 'hsl(0 84% 80%)'}}>
        <h3 className="text-lg font-bold mb-3" style={{color: 'hsl(var(--crypto-navy))'}}>Unable to Load Campaign</h3>
        <p className="text-muted-foreground mb-2">{errorMessage}</p>
        <p className="text-sm text-muted-foreground mb-4">Campaign ID: {campaignId || 'None provided'}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="crypto-card max-w-md mx-auto text-center" style={{backgroundColor: 'hsl(120 60% 97%)', borderColor: 'hsl(120 60% 84%)'}}>
        <h2 className="text-2xl font-bold mb-4" style={{color: 'hsl(var(--crypto-navy))'}}>🎉 Thank You!</h2>
        <p className="text-muted-foreground">Your contribution has been submitted successfully.</p>
      </div>
    );
  }

  const themeColor = campaignData?.theme_color || 'hsl(var(--crypto-navy))';
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
    <div className="crypto-card max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4" style={{color: themeColor || 'hsl(var(--crypto-navy))'}}>
        {campaignData?.campaign_name || 'Support Our Campaign'}
      </h1>
      {candidateName && (
        <p className="mb-6 text-lg">
          Candidate: <strong className="font-bold">{candidateName}</strong>
        </p>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">First Name *</label>
            <input 
              className="form-input"
              required
              value={formData.firstName || ''}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
            />
          </div>
          <div>
            <label className="form-label">Last Name *</label>
            <input 
              className="form-input"
              required
              value={formData.lastName || ''}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="form-label">Email *</label>
          <input 
            type="email"
            className="form-input"
            required
            value={formData.email || ''}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>

        <div>
          <label className="form-label">Address *</label>
          <input 
            placeholder="Street Address"
            className="form-input mb-3"
            required
            value={formData.street || ''}
            onChange={(e) => setFormData({...formData, street: e.target.value})}
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <input 
              placeholder="City"
              className="form-input col-span-2 md:col-span-1"
              required
              value={formData.city || ''}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
            />
            <input 
              placeholder="State"
              className="form-input"
              required
              value={formData.state || ''}
              onChange={(e) => setFormData({...formData, state: e.target.value})}
            />
            <input 
              placeholder="ZIP"
              className="form-input"
              required
              value={formData.zip || ''}
              onChange={(e) => setFormData({...formData, zip: e.target.value})}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Employer *</label>
            <input 
              className="form-input"
              required
              value={formData.employer || ''}
              onChange={(e) => setFormData({...formData, employer: e.target.value})}
            />
          </div>
          <div>
            <label className="form-label">Occupation *</label>
            <input 
              className="form-input"
              required
              value={formData.occupation || ''}
              onChange={(e) => setFormData({...formData, occupation: e.target.value})}
            />
          </div>
        </div>

        <div className="crypto-card" style={{backgroundColor: 'hsl(var(--crypto-blue) / 0.05)', borderColor: 'hsl(var(--crypto-blue) / 0.2)'}}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔗</span>
            <div>
              <p className="font-medium">Crypto Wallet Connection</p>
              <p className="text-sm text-muted-foreground">
                Your wallet will be connected automatically when you submit your contribution
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="form-label">Contribution Amount * {maxDonation && `(Max: $${maxDonation})`}</label>
          <div className="flex gap-2 mb-3 flex-wrap">
            {suggestedAmounts.map(amount => (
              <button 
                key={amount}
                type="button"
                onClick={() => setFormData({...formData, amount})}
                className={`px-4 py-2 rounded font-medium transition-all duration-200 ${
                  formData.amount === amount 
                    ? 'btn-secondary' 
                    : 'border-2 bg-transparent hover:bg-primary/5'
                }`}
                style={{
                  borderColor: themeColor || 'hsl(var(--crypto-navy))',
                  color: formData.amount === amount ? 'hsl(var(--crypto-navy))' : themeColor || 'hsl(var(--crypto-navy))'
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
            className="form-input"
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

        <div className="crypto-card" style={{backgroundColor: 'hsl(var(--crypto-blue) / 0.05)', borderColor: 'hsl(var(--crypto-blue) / 0.2)'}}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input 
              type="checkbox"
              required
              className="mt-1 w-4 h-4"
            />
            <span className="text-sm leading-relaxed">
              I certify that I am a U.S. citizen or lawfully admitted permanent resident, 
              this contribution is made from my own funds, I am not a federal contractor, 
              and I am at least 18 years old.
            </span>
          </label>
        </div>

        {errorMessage && (
          <div className="crypto-card" style={{
            backgroundColor: 'hsl(0 93% 94%)',
            borderColor: 'hsl(0 84% 80%)',
            color: 'hsl(var(--crypto-navy))'
          }}>
            <span className="font-medium">⚠️ {errorMessage}</span>
          </div>
        )}
        
        <button 
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-4 text-lg font-bold rounded transition-all duration-200 ${
            isSubmitting 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'btn-primary hover:transform hover:scale-[1.02]'
          }`}
          style={{
            backgroundColor: isSubmitting ? 'hsl(220 14% 65%)' : (themeColor || 'hsl(var(--crypto-navy))'),
            color: 'white'
          }}
        >
          {isSubmitting ? '⏳ Initiating Smart Contract...' : '🚀 Launch Smart Contract'}
        </button>
      </form>
    </div>
  );
};

export default SimpleDonorForm;