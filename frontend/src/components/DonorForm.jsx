import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Web3Wallet from './Web3Wallet';
import web3Service from '../lib/web3';
import {
  extractCampaignStyles,
  getCampaignButtonStyles,
  debugCampaignStyles,
} from '../utils/styleGuide';

const DonorForm = ({ campaignId }) => {
  const [formData, setFormData] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [campaignData, setCampaignData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('traditional');
  const [walletInfo, setWalletInfo] = useState(null);
  const [cryptoTransaction, setCryptoTransaction] = useState(null);
  const [isProcessingCrypto, setIsProcessingCrypto] = useState(false);

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

      if (error) {
        console.error('Failed to load campaign:', error);
        setErrorMessage(`Unable to load campaign: ${error.message}`);
      } else if (!data) {
        setErrorMessage('Campaign not found. Please check the campaign ID.');
      } else {
        setCampaignData(data);
        console.log('Successfully loaded campaign data:', data);
        console.log('Available fields:', Object.keys(data));
        console.log('Suggested amounts from DB:', data.suggested_amounts);
        console.log('Candidate name:', data.candidate_name);

        // Debug style guide data
        debugCampaignStyles(data);
      }
    } catch (err) {
      console.error('Error loading campaign:', err);
      setErrorMessage('Unable to load campaign. Please try again.');
    } finally {
      setLoading(false);
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

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setErrorMessage('Please enter a valid contribution amount');
      return;
    }

    setIsProcessingCrypto(true);
    setErrorMessage('');

    try {
      // Convert USD amount to ETH
      const usdAmount = parseFloat(formData.amount);
      const ethAmount = await web3Service.convertUSDToETH(usdAmount);

      console.log(`💰 Contributing $${usdAmount} USD (≈${ethAmount.toFixed(4)} ETH)`);

      // Check if contribution is allowed
      const eligibility = await web3Service.canContribute(walletInfo.account, ethAmount);
      if (!eligibility.canContribute) {
        throw new Error(`Crypto contribution not allowed: ${eligibility.reason}`);
      }

      // Make the contribution
      const result = await web3Service.contribute(ethAmount);

      if (result.success) {
        setCryptoTransaction(result);
        console.log('✅ Crypto contribution successful:', result);

        // Now save to Supabase with crypto transaction details
        await saveToDatabaseWithCrypto(result, ethAmount);
      } else {
        throw new Error(result.error || 'Crypto transaction failed');
      }
    } catch (error) {
      console.error('❌ Crypto payment failed:', error);
      setErrorMessage(error.message);
    } finally {
      setIsProcessingCrypto(false);
    }
  };

  const saveToDatabaseWithCrypto = async (cryptoResult, ethAmount) => {
    try {
      const { data, error } = await supabase.from('form_submissions').insert([
        {
          campaign_id: campaignId,
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
          cryptocurrency: 'ETH',
          crypto_amount: ethAmount,
          wallet_address: walletInfo.account,
          transaction_hash: cryptoResult.txHash,
          citizenship_confirmed: true,
          own_funds_confirmed: true,
          not_corporate_confirmed: true,
          not_contractor_confirmed: true,
          age_confirmed: true,
        },
      ]);

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Failed to save contribution record');
      }

      setSubmitted(true);
      console.log('✅ Contribution record saved to database');
    } catch (error) {
      console.error('❌ Failed to save to database:', error);
      // Don't throw here - crypto payment succeeded, just logging failed
      setErrorMessage(`Crypto payment successful but failed to save record: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Validate campaign ID
      if (!campaignId) {
        throw new Error('No campaign ID found. Please check the campaign URL.');
      }

      // Validate amount
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        throw new Error('Please enter a valid contribution amount');
      }

      // Save donor submission to database
      const { data, error } = await supabase.from('form_submissions').insert([
        {
          campaign_id: campaignId,
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
          age_confirmed: true,
        },
      ]);

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Failed to save contribution');
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Form submission error:', err);
      setErrorMessage(
        err.message || 'An error occurred while processing your contribution. Please try again.'
      );
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
      <div
        style={{ padding: '2rem', textAlign: 'center', background: '#d4edda', borderRadius: '8px' }}
      >
        <h2>🎉 Thank You!</h2>
        <p>Your contribution has been submitted successfully.</p>
        {cryptoTransaction && (
          <div style={{ marginTop: '1rem', fontSize: '14px' }}>
            <p>
              <strong>Payment Method:</strong> Crypto (ETH)
            </p>
            <p>
              <strong>Transaction Hash:</strong>
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
    );
  }

  // Extract campaign styles from style guide data
  const campaignStyles = extractCampaignStyles(campaignData);
  const themeColor = campaignStyles.colors.primary;
  const suggestedAmounts = campaignData?.suggested_amounts || [25, 50, 100, 250];
  const maxDonation = campaignData?.max_donation_limit || 3300;
  const candidateName = campaignData?.candidate_name;

  // Generate button styles based on campaign theme
  const primaryButtonStyle = getCampaignButtonStyles(campaignData, 'primary');
  const secondaryButtonStyle = getCampaignButtonStyles(campaignData, 'secondary');

  return (
    <div className="donor-form container-responsive crypto-card" style={{ maxWidth: '500px' }}>
      <h1
        style={{
          color: campaignStyles.colors.primary,
          marginBottom: campaignStyles.layout.spacing,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontWeight: '800',
          fontSize: 'var(--text-heading-xl)',
        }}
      >
        {campaignData?.campaign_name || 'Support Our Campaign'}
      </h1>
      {candidateName && (
        <p style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
          Candidate: <strong>{candidateName}</strong>
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label className="form-label">Full Name *</label>
          <input
            className="form-input"
            required
            value={formData.fullName || ''}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label className="form-label">Email *</label>
          <input
            type="email"
            className="form-input"
            required
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label className="form-label">Address *</label>
          <input
            placeholder="Street Address"
            className="form-input"
            style={{ marginBottom: '0.5rem' }}
            required
            value={formData.street || ''}
            onChange={(e) => setFormData({ ...formData, street: e.target.value })}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.5rem' }}>
            <input
              placeholder="City"
              className="form-input"
              required
              value={formData.city || ''}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <input
              placeholder="State"
              className="form-input"
              required
              value={formData.state || ''}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
            <input
              placeholder="ZIP"
              className="form-input"
              required
              value={formData.zip || ''}
              onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
            />
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1rem',
          }}
        >
          <div>
            <label className="form-label">Employer *</label>
            <input
              className="form-input"
              required
              value={formData.employer || ''}
              onChange={(e) => setFormData({ ...formData, employer: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Occupation *</label>
            <input
              className="form-input"
              required
              value={formData.occupation || ''}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label className="form-label">
            Contribution Amount * {maxDonation && `(Max: $${maxDonation})`}
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            {suggestedAmounts.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setFormData({ ...formData, amount })}
                style={{
                  ...secondaryButtonStyle,
                  border: `2px solid ${campaignStyles.colors.primary}`,
                  background:
                    formData.amount === amount
                      ? campaignStyles.colors.primary
                      : campaignStyles.colors.background,
                  color:
                    formData.amount === amount
                      ? campaignStyles.colors.background
                      : campaignStyles.colors.primary,
                  fontFamily: campaignStyles.fonts.button.family,
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
                setFormData({ ...formData, amount: e.target.value });
              }
            }}
          />
        </div>

        {/* Payment Method Selection */}
        <div style={{ marginBottom: '1rem' }}>
          <label className="form-label" style={{ fontWeight: 'bold' }}>
            Payment Method *
          </label>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <label
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="traditional"
                checked={paymentMethod === 'traditional'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span>💳 Traditional Payment</span>
            </label>
            <label
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            >
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

          {/* Crypto Payment Section */}
          {paymentMethod === 'crypto' && (
            <div
              style={{
                background: '#f8f9fa',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid #dee2e6',
                marginBottom: '1rem',
              }}
            >
              <h4 style={{ margin: '0 0 1rem 0', color: '#495057' }}>
                🔗 Crypto Payment via Smart Contract
              </h4>

              <div style={{ marginBottom: '1rem', fontSize: '14px', color: '#6c757d' }}>
                <p>✅ FEC-compliant smart contract</p>
                <p>✅ Automatic contribution limit enforcement</p>
                <p>✅ Transparent on-chain record</p>
                {formData.amount && (
                  <p style={{ fontWeight: 'bold', color: '#495057' }}>
                    💰 ${formData.amount} USD (≈{(parseFloat(formData.amount) / 3000).toFixed(4)}{' '}
                    ETH)
                  </p>
                )}
              </div>

              <Web3Wallet onWalletChange={handleWalletChange} />

              {walletInfo?.isConnected && (
                <div style={{ marginTop: '1rem' }}>
                  {walletInfo.contributorInfo && !walletInfo.contributorInfo.isKYCVerified && (
                    <div
                      style={{
                        background: '#fff3cd',
                        padding: '1rem',
                        borderRadius: '4px',
                        marginBottom: '1rem',
                        border: '1px solid #ffeaa7',
                      }}
                    >
                      <strong>⚠️ KYC Required</strong>
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '14px' }}>
                        Your wallet needs KYC verification before making crypto contributions.
                        Please contact the campaign administrator.
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleCryptoPayment}
                    disabled={
                      isProcessingCrypto ||
                      !formData.amount ||
                      parseFloat(formData.amount) <= 0 ||
                      (walletInfo.contributorInfo && !walletInfo.contributorInfo.isKYCVerified)
                    }
                    style={{
                      ...primaryButtonStyle,
                      width: '100%',
                      opacity:
                        isProcessingCrypto ||
                        !formData.amount ||
                        (walletInfo.contributorInfo && !walletInfo.contributorInfo.isKYCVerified)
                          ? 0.5
                          : 1,
                      cursor:
                        isProcessingCrypto ||
                        !formData.amount ||
                        (walletInfo.contributorInfo && !walletInfo.contributorInfo.isKYCVerified)
                          ? 'not-allowed'
                          : 'pointer',
                    }}
                  >
                    {isProcessingCrypto
                      ? '⏳ Processing Crypto Payment...'
                      : `🔗 Pay ${formData.amount ? `$${formData.amount}` : '$0'} via Smart Contract`}
                  </button>
                </div>
              )}

              {cryptoTransaction && (
                <div
                  style={{
                    background: '#d4edda',
                    padding: '1rem',
                    borderRadius: '4px',
                    marginTop: '1rem',
                    border: '1px solid #c3e6cb',
                  }}
                >
                  <strong>✅ Crypto Payment Successful!</strong>
                  <div style={{ fontSize: '14px', marginTop: '0.5rem' }}>
                    <p>
                      Transaction:{' '}
                      <a
                        href={`https://etherscan.io/tx/${cryptoTransaction.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#007bff' }}
                      >
                        {cryptoTransaction.txHash}
                      </a>
                    </p>
                    <p>Block: {cryptoTransaction.blockNumber}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div
          style={{
            background: '#f0f8ff',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1rem',
            fontSize: '0.9rem',
          }}
        >
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <input type="checkbox" required style={{ marginTop: '0.25rem' }} />
            <span>
              I certify that I am a U.S. citizen or lawfully admitted permanent resident, this
              contribution is made from my own funds, I am not a federal contractor, and I am at
              least 18 years old.
            </span>
          </label>
        </div>

        {errorMessage && (
          <div
            style={{
              background: '#f8d7da',
              color: '#721c24',
              padding: '0.75rem',
              borderRadius: '4px',
              marginBottom: '1rem',
              border: '1px solid #f5c6cb',
            }}
          >
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Traditional Payment Button - Only show for traditional payment */}
        {paymentMethod === 'traditional' && (
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              ...primaryButtonStyle,
              width: '100%',
              opacity: isSubmitting ? 0.5 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting
              ? '⏳ Processing Traditional Payment...'
              : '💳 Submit Traditional Contribution'}
          </button>
        )}

        {/* Information for crypto payments */}
        {paymentMethod === 'crypto' && !walletInfo?.isConnected && (
          <div
            style={{
              padding: '1rem',
              background: '#e7f3ff',
              borderRadius: '4px',
              textAlign: 'center',
              border: '1px solid #b8daff',
            }}
          >
            <p style={{ margin: 0, color: '#004085' }}>
              🔗 Please connect your wallet above to proceed with crypto payment
            </p>
          </div>
        )}
      </form>
    </div>
  );
};

export default DonorForm;
