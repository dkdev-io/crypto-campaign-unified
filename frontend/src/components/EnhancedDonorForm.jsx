import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Web3Wallet from './Web3Wallet';
import web3Service from '../lib/web3';
import contributionService from '../lib/contributions';
import { extractCampaignStyles, getCampaignButtonStyles, debugCampaignStyles } from '../utils/styleGuide';

const EnhancedDonorForm = ({ campaignId }) => {
  console.log('EnhancedDonorForm rendering with campaignId:', campaignId);
  const [formData, setFormData] = useState({
    // Donor info
    fullName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    employer: '',
    occupation: '',
    
    // Contribution info
    amount: '',
    donationType: 'one_time',
    
    // Recurring options
    recurringFrequency: 'monthly',
    recurringStartDate: new Date().toISOString().split('T')[0],
    recurringEndDate: '',
    
    // Scheduled options
    scheduledDate: '',
    
    // Compliance checkboxes
    citizenshipConfirmed: false,
    ownFundsConfirmed: false,
    ageConfirmed: false,
    notContractorConfirmed: false,
    personalCardConfirmed: false,
    smsConsent: false,
    notOilGasConfirmed: false,
    termsAccepted: false,
    bluetokensTermsAccepted: false
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [campaignData, setCampaignData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('traditional');
  const [walletInfo, setWalletInfo] = useState(null);
  const [cryptoTransaction, setCryptoTransaction] = useState(null);
  const [isProcessingCrypto, setIsProcessingCrypto] = useState(false);
  const [contributionProjection, setContributionProjection] = useState(null);
  const [transactionCode, setTransactionCode] = useState('');
  const [limitCheck, setLimitCheck] = useState(null);

  useEffect(() => {
    if (campaignId) {
      loadCampaignData();
    } else {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    // Check contribution limits when amount, donation type, or wallet changes
    if (formData.amount && formData.email && campaignId) {
      checkContributionLimits();
    }
  }, [formData.amount, formData.donationType, formData.recurringFrequency, formData.recurringStartDate, formData.email, walletInfo]);

  const loadCampaignData = async () => {
    try {
      console.log('Loading campaign data for ID:', campaignId);
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      console.log('Campaign query result:', { data, error });

      if (error) {
        console.error('Campaign load error:', error);
        setErrorMessage(`Unable to load campaign: ${error.message}`);
      } else if (!data) {
        console.error('No campaign data returned');
        setErrorMessage('Campaign not found. Please check the campaign ID.');
      } else {
        console.log('Campaign loaded successfully:', data);
        setCampaignData(data);
        
        // Debug style guide data
        debugCampaignStyles(data);
      }
    } catch (err) {
      console.error('Campaign load exception:', err);
      setErrorMessage('Unable to load campaign. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkContributionLimits = async () => {
    if (!formData.amount || !formData.email) return;

    try {
      const amount = parseFloat(formData.amount);
      
      const recurringDetails = formData.donationType === 'recurring' ? {
        frequency: formData.recurringFrequency,
        startDate: formData.recurringStartDate,
        endDate: formData.recurringEndDate || null
      } : null;

      const result = await contributionService.checkContributionLimits(
        campaignId,
        formData.email,
        amount,
        formData.donationType === 'recurring',
        recurringDetails
      );

      setLimitCheck(result);
      
      if (result.projection) {
        setContributionProjection(result.projection);
      }
    } catch (error) {
      console.log('Contribution limits check failed, using defaults:', error.message);
      // Set default limits if check fails
      setLimitCheck({
        canContribute: parseFloat(formData.amount) <= 3300,
        currentTotal: 0,
        remainingCapacity: 3300,
        proposedAmount: parseFloat(formData.amount),
        message: 'Using default limits (database tables not found)'
      });
    }
  };

  const handleWalletChange = (wallet) => {
    setWalletInfo(wallet);
  };

  const handleCryptoPayment = async () => {
    if (!walletInfo?.isConnected) {
      setErrorMessage('Please connect your wallet first');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsProcessingCrypto(true);
    setErrorMessage('');

    try {
      const usdAmount = parseFloat(formData.amount);
      const ethAmount = await web3Service.convertUSDToETH(usdAmount);

      const eligibility = await web3Service.canContribute(walletInfo.account, ethAmount);
      if (!eligibility.canContribute) {
        throw new Error(`Crypto contribution not allowed: ${eligibility.reason}`);
      }

      const result = await web3Service.contribute(ethAmount);

      if (result.success) {
        setCryptoTransaction(result);
        await saveContribution('crypto', result, ethAmount);
      } else {
        throw new Error(result.error || 'Crypto transaction failed');
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsProcessingCrypto(false);
    }
  };

  const validateForm = () => {
    // Check all required fields
    if (!formData.fullName || !formData.email || !formData.street || 
        !formData.city || !formData.state || !formData.zip || 
        !formData.employer || !formData.occupation) {
      setErrorMessage('Please fill in all required fields');
      return false;
    }

    // Check amount
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setErrorMessage('Please enter a valid contribution amount');
      return false;
    }

    // Check FEC compliance checkboxes
    if (!formData.citizenshipConfirmed || !formData.ownFundsConfirmed || 
        !formData.ageConfirmed || !formData.notContractorConfirmed || 
        !formData.personalCardConfirmed || !formData.termsAccepted) {
      setErrorMessage('Please confirm all required compliance statements');
      return false;
    }

    // Check contribution limits
    if (limitCheck && !limitCheck.canContribute) {
      setErrorMessage(limitCheck.message);
      return false;
    }

    return true;
  };

  const saveContribution = async (method = 'traditional', cryptoResult = null, ethAmount = null) => {
    try {
      const contributionData = {
        campaign_id: campaignId,
        donor_full_name: formData.fullName,
        donor_email: formData.email,
        donor_phone: formData.phone,
        donor_street: formData.street,
        donor_city: formData.city,
        donor_state: formData.state,
        donor_zip: formData.zip,
        donor_employer: formData.employer,
        donor_occupation: formData.occupation,
        amount_usd: parseFloat(formData.amount),
        donation_type: formData.donationType,
        payment_method: method === 'crypto' ? 'crypto' : 'credit_card',
        
        // Crypto specific
        cryptocurrency: method === 'crypto' ? 'ETH' : null,
        crypto_amount: ethAmount,
        wallet_address: method === 'crypto' ? walletInfo.account : null,
        transaction_hash: cryptoResult?.txHash,
        
        // Recurring specific
        is_recurring: formData.donationType === 'recurring',
        recurring_frequency: formData.donationType === 'recurring' ? formData.recurringFrequency : null,
        recurring_start_date: formData.donationType === 'recurring' ? formData.recurringStartDate : null,
        recurring_end_date: formData.donationType === 'recurring' && formData.recurringEndDate ? formData.recurringEndDate : null,
        recurring_amount: formData.donationType === 'recurring' ? parseFloat(formData.amount) : null,
        recurring_projection: contributionProjection,
        
        // Scheduled specific
        scheduled_date: formData.donationType === 'scheduled' ? formData.scheduledDate : null,
        
        // Compliance confirmations
        citizenship_confirmed: formData.citizenshipConfirmed,
        own_funds_confirmed: formData.ownFundsConfirmed,
        age_confirmed: formData.ageConfirmed,
        not_contractor_confirmed: formData.notContractorConfirmed,
        personal_card_confirmed: formData.personalCardConfirmed,
        sms_consent_confirmed: formData.smsConsent,
        not_oil_gas_confirmed: formData.notOilGasConfirmed,
        terms_accepted: formData.termsAccepted,
        bluetokens_terms_accepted: formData.bluetokensTermsAccepted,
        
        // Metadata
        status: 'confirmed'
      };

      const result = await contributionService.saveContribution(contributionData);

      if (result.success) {
        setTransactionCode(result.transactionCode);
        setSubmitted(true);
      } else {
        throw new Error(result.error || 'Failed to save contribution');
      }
    } catch (error) {
      setErrorMessage(`Failed to save contribution: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      await saveContribution('traditional');
    } catch (err) {
      setErrorMessage(err.message || 'An error occurred while processing your contribution.');
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
        <h2>🎉 Thank You for Your Contribution!</h2>
        <div style={{ marginTop: '1rem', background: 'white', padding: '1.5rem', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '1rem' }}>Transaction Confirmation</h3>
          <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#28a745' }}>
            Transaction Code: {transactionCode}
          </p>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
            Please save this transaction code for your records.
          </p>
          
          {formData.donationType === 'recurring' && contributionProjection && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
              <h4>Recurring Donation Summary</h4>
              <p>Amount per payment: ${formData.amount}</p>
              <p>Frequency: {formData.recurringFrequency}</p>
              <p>Total scheduled payments: {contributionProjection.paymentCount}</p>
              <p>Total projected amount: ${contributionProjection.totalAmount.toFixed(2)}</p>
              {contributionProjection.autoCancelDate && (
                <p style={{ color: '#dc3545', fontWeight: 'bold' }}>
                  Auto-cancellation date: {new Date(contributionProjection.autoCancelDate).toLocaleDateString()}
                  <br />
                  <small>(To comply with FEC $3,300 limit)</small>
                </p>
              )}
            </div>
          )}

          {cryptoTransaction && (
            <div style={{ marginTop: '1rem', fontSize: '14px' }}>
              <p><strong>Payment Method:</strong> Crypto (ETH)</p>
              <p><strong>Transaction Hash:</strong> 
                <a 
                  href={`https://etherscan.io/tx/${cryptoTransaction.txHash}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#007bff', marginLeft: '0.5rem' }}
                >
                  {cryptoTransaction.txHash.slice(0, 10)}...
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Extract campaign styles from style guide data
  const campaignStyles = extractCampaignStyles(campaignData);
  const themeColor = campaignStyles.colors.primary;
  const suggestedAmounts = campaignData?.suggested_amounts || [25, 50, 100, 250];
  const maxDonation = campaignData?.max_donation_limit || 3300;
  
  // Generate button styles based on campaign theme
  const primaryButtonStyle = getCampaignButtonStyles(campaignData, 'primary');
  const secondaryButtonStyle = getCampaignButtonStyles(campaignData, 'secondary');

  console.log('Rendering form with:', {
    campaignData: !!campaignData,
    themeColor,
    suggestedAmounts,
    maxDonation,
    hasError: !!errorMessage
  });

  return (
    <div className="container-responsive crypto-card" style={{ maxWidth: '600px' }}>
      <h1 style={{ color: themeColor, marginBottom: '1rem' }}>
        {campaignData?.campaign_name || 'Support Our Campaign'}
      </h1>
      
      {/* CRITICAL: Show warning if wallet not connected for validation */}
      {!walletInfo?.isConnected && formData.amount && (
        <div style={{ 
          padding: '15px',
          background: '#fff3cd',
          color: '#856404',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #ffeaa7'
        }}>
          ⚠️ <strong>Wallet Connection Required for Validation</strong><br/>
          To ensure FEC compliance and validate contribution limits, please connect your wallet using the Web3 component above.
          This is required for proper validation of both traditional and crypto payments.
        </div>
      )}
      
      {errorMessage && (
        <div style={{ 
          padding: '15px',
          background: '#f8d7da',
          color: '#721c24',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          {errorMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Donation Type Selection */}
        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Donation Type *
          </label>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="donationType"
                value="one_time"
                checked={formData.donationType === 'one_time'}
                onChange={(e) => setFormData({...formData, donationType: e.target.value})}
              />
              <span>One-Time Donation</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="donationType"
                value="recurring"
                checked={formData.donationType === 'recurring'}
                onChange={(e) => setFormData({...formData, donationType: e.target.value})}
              />
              <span>Recurring Donation</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="donationType"
                value="scheduled"
                checked={formData.donationType === 'scheduled'}
                onChange={(e) => setFormData({...formData, donationType: e.target.value})}
              />
              <span>Scheduled Donation</span>
            </label>
          </div>

          {/* Recurring Options */}
          {formData.donationType === 'recurring' && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'white', borderRadius: '4px' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>Recurring Donation Settings</h4>
              
              <div style={{ marginBottom: '1rem' }}>
                <label>Frequency *</label>
                <select 
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                  value={formData.recurringFrequency}
                  onChange={(e) => setFormData({...formData, recurringFrequency: e.target.value})}
                >
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Start Date *</label>
                  <input 
                    type="date"
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                    value={formData.recurringStartDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData({...formData, recurringStartDate: e.target.value})}
                  />
                </div>
                <div>
                  <label>End Date (Optional)</label>
                  <input 
                    type="date"
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                    value={formData.recurringEndDate}
                    min={formData.recurringStartDate}
                    onChange={(e) => setFormData({...formData, recurringEndDate: e.target.value})}
                  />
                </div>
              </div>

              {contributionProjection && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#e7f3ff', borderRadius: '4px' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>
                    <strong>Projection:</strong> {contributionProjection.paymentCount} payments totaling ${contributionProjection.totalAmount.toFixed(2)}
                  </p>
                  {contributionProjection.willExceedLimit && (
                    <p style={{ margin: '0.5rem 0 0 0', color: '#dc3545', fontSize: '0.9rem' }}>
                      ⚠️ Will auto-cancel on {new Date(contributionProjection.autoCancelDate).toLocaleDateString()} to comply with FEC $3,300 limit
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Scheduled Options */}
          {formData.donationType === 'scheduled' && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'white', borderRadius: '4px' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>Schedule Your Donation</h4>
              <label>Scheduled Date *</label>
              <input 
                type="date"
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                value={formData.scheduledDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                required={formData.donationType === 'scheduled'}
              />
            </div>
          )}
        </div>

        {/* Contribution Amount */}
        <div style={{ marginBottom: '1rem' }}>
          <label className="form-label">Contribution Amount * {maxDonation && `(Max: $${maxDonation})`}</label>
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
          
          {limitCheck && formData.amount && (
            <div style={{ 
              marginTop: '0.5rem', 
              padding: '0.75rem', 
              background: limitCheck.canContribute ? '#d4edda' : '#f8d7da', 
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}>
              {limitCheck.canContribute ? (
                <span style={{ color: '#155724' }}>
                  ✓ You can contribute ${formData.amount}. 
                  {limitCheck.remainingCapacity < 3300 && 
                    ` (${limitCheck.remainingCapacity.toFixed(2)} remaining of $3,300 limit)`
                  }
                </span>
              ) : (
                <span style={{ color: '#721c24' }}>
                  ✗ {limitCheck.message}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Donor Information */}
        <div style={{ marginBottom: '1rem' }}>
          <label className="form-label">Full Name *</label>
          <input 
            className="form-input"
            required
            value={formData.fullName}
            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label className="form-label">Email *</label>
            <input 
              type="email"
              className="form-input"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="form-label">Phone</label>
            <input 
              type="tel"
              className="form-input"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label className="form-label">Address *</label>
          <input 
            placeholder="Street Address"
            className="form-input"
            style={{ marginBottom: '0.5rem' }}
            required
            value={formData.street}
            onChange={(e) => setFormData({...formData, street: e.target.value})}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.5rem' }}>
            <input 
              placeholder="City"
              className="form-input"
              required
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
            />
            <input 
              placeholder="State"
              className="form-input"
              required
              maxLength="2"
              value={formData.state}
              onChange={(e) => setFormData({...formData, state: e.target.value.toUpperCase()})}
            />
            <input 
              placeholder="ZIP"
              className="form-input"
              required
              value={formData.zip}
              onChange={(e) => setFormData({...formData, zip: e.target.value})}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label className="form-label">Employer *</label>
            <input 
              className="form-input"
              required
              value={formData.employer}
              onChange={(e) => setFormData({...formData, employer: e.target.value})}
            />
          </div>
          <div>
            <label className="form-label">Occupation *</label>
            <input 
              className="form-input"
              required
              value={formData.occupation}
              onChange={(e) => setFormData({...formData, occupation: e.target.value})}
            />
          </div>
        </div>

        {/* Payment Method Selection */}
        <div style={{ marginBottom: '1rem' }}>
          <label className="form-label" style={{ fontWeight: 'bold' }}>
            Payment Method *
          </label>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="paymentMethod"
                value="traditional"
                checked={paymentMethod === 'traditional'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span>💳 Credit/Debit Card</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="paymentMethod"
                value="crypto"
                checked={paymentMethod === 'crypto'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span>🔗 Crypto Payment (ETH)</span>
            </label>
          </div>

          {paymentMethod === 'crypto' && (
            <div style={{ 
              background: '#f8f9fa', 
              padding: '1rem', 
              borderRadius: '8px', 
              border: '1px solid #dee2e6',
              marginBottom: '1rem'
            }}>
              <Web3Wallet onWalletChange={handleWalletChange} />
            </div>
          )}
        </div>

        {/* FEC Compliance Checkboxes */}
        <div style={{ background: '#f0f8ff', padding: '1rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem' }}>
          <h4 style={{ marginBottom: '1rem' }}>Required FEC Compliance Confirmations</h4>
          
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input 
              type="checkbox"
              required
              checked={formData.citizenshipConfirmed}
              onChange={(e) => setFormData({...formData, citizenshipConfirmed: e.target.checked})}
              style={{ marginTop: '0.25rem' }}
            />
            <span>
              I certify that I am a U.S. citizen or lawfully admitted permanent resident 
              (i.e., green card holder).
            </span>
          </label>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input 
              type="checkbox"
              required
              checked={formData.ownFundsConfirmed}
              onChange={(e) => setFormData({...formData, ownFundsConfirmed: e.target.checked})}
              style={{ marginTop: '0.25rem' }}
            />
            <span>
              This contribution is made from my own funds, and funds are not being provided 
              to me by another person or entity for the purpose of making this contribution.
            </span>
          </label>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input 
              type="checkbox"
              required
              checked={formData.ageConfirmed}
              onChange={(e) => setFormData({...formData, ageConfirmed: e.target.checked})}
              style={{ marginTop: '0.25rem' }}
            />
            <span>
              I am at least eighteen years old.
            </span>
          </label>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input 
              type="checkbox"
              required
              checked={formData.notContractorConfirmed}
              onChange={(e) => setFormData({...formData, notContractorConfirmed: e.target.checked})}
              style={{ marginTop: '0.25rem' }}
            />
            <span>
              I am not a federal contractor.
            </span>
          </label>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input 
              type="checkbox"
              required
              checked={formData.personalCardConfirmed}
              onChange={(e) => setFormData({...formData, personalCardConfirmed: e.target.checked})}
              style={{ marginTop: '0.25rem' }}
            />
            <span>
              I am making this contribution with my own personal credit card and not with a 
              corporate or business credit card or a card issued to another person.
            </span>
          </label>
        </div>

        {/* Additional Confirmations */}
        <div style={{ background: '#fffbf0', padding: '1rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input 
              type="checkbox"
              checked={formData.smsConsent}
              onChange={(e) => setFormData({...formData, smsConsent: e.target.checked})}
              style={{ marginTop: '0.25rem' }}
            />
            <span>
              By providing your cell phone number you consent to receive recurring automated 
              marketing messages from the campaign. Message & data rates may apply. 
              Reply HELP for help, STOP to end.
            </span>
          </label>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input 
              type="checkbox"
              checked={formData.notOilGasConfirmed}
              onChange={(e) => setFormData({...formData, notOilGasConfirmed: e.target.checked})}
              style={{ marginTop: '0.25rem' }}
            />
            <span>
              I am not an executive of a fossil fuel company.
            </span>
          </label>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input 
              type="checkbox"
              required
              checked={formData.termsAccepted}
              onChange={(e) => setFormData({...formData, termsAccepted: e.target.checked})}
              style={{ marginTop: '0.25rem' }}
            />
            <span>
              I understand that contributions or gifts are not deductible as charitable 
              contributions for federal income tax purposes.
            </span>
          </label>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <input 
              type="checkbox"
              checked={formData.bluetokensTermsAccepted}
              onChange={(e) => setFormData({...formData, bluetokensTermsAccepted: e.target.checked})}
              style={{ marginTop: '0.25rem' }}
            />
            <span>
              I understand the purchase of BluTokens will be shipped to me separately with no cash value.
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
        
        {/* Submit Button */}
        {paymentMethod === 'traditional' && (
          <button 
            type="submit"
            disabled={isSubmitting || (limitCheck && !limitCheck.canContribute)}
            className="btn-primary"
            style={{ 
              width: '100%',
              opacity: (isSubmitting || (limitCheck && !limitCheck.canContribute)) ? 0.5 : 1,
              cursor: isSubmitting || (limitCheck && !limitCheck.canContribute) ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting ? '⏳ Processing...' : `💳 Contribute $${formData.amount || '0'}`}
          </button>
        )}

        {paymentMethod === 'crypto' && walletInfo?.isConnected && (
          <button
            type="button"
            onClick={handleCryptoPayment}
            disabled={
              isProcessingCrypto || 
              !formData.amount || 
              (limitCheck && !limitCheck.canContribute) ||
              !validateForm()
            }
            className="btn-secondary"
            style={{
              width: '100%',
              opacity: (isProcessingCrypto || (limitCheck && !limitCheck.canContribute)) ? 0.5 : 1,
              cursor: isProcessingCrypto || (limitCheck && !limitCheck.canContribute) ? 'not-allowed' : 'pointer'
            }}
          >
            {isProcessingCrypto 
              ? '⏳ Processing Crypto Payment...' 
              : `🔗 Pay $${formData.amount || '0'} via Smart Contract`
            }
          </button>
        )}
      </form>
    </div>
  );
};

export default EnhancedDonorForm;