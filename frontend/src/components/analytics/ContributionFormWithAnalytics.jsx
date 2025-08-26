import React, { useState, useEffect, useRef } from 'react';
import { useAnalytics } from './AnalyticsProvider';

const ContributionFormWithAnalytics = ({ campaignId, onContribution }) => {
  const [amount, setAmount] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');
  
  const formRef = useRef(null);
  const {
    trackFormStart,
    trackFormField,
    trackWalletConnect,
    trackContributionAttempt,
    trackContributionSuccess,
    trackContributionFailure,
    trackEvent
  } = useAnalytics();

  useEffect(() => {
    // Track form view
    trackEvent('form_view', { formType: 'contribution', campaignId });
  }, [campaignId, trackEvent]);

  useEffect(() => {
    // Track when user starts interacting with the form
    const handleFormFocus = () => {
      trackFormStart('contribution-form');
    };

    const formElement = formRef.current;
    if (formElement) {
      formElement.addEventListener('focusin', handleFormFocus, { once: true });
      return () => formElement.removeEventListener('focusin', handleFormFocus);
    }
  }, [trackFormStart]);

  const connectWallet = async () => {
    try {
      setError('');
      setIsLoading(true);
      
      // Track wallet connection attempt
      trackWalletConnect('metamask');
      
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed');
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setIsConnected(true);
        
        // Track successful wallet connection
        trackEvent('wallet_connected', { 
          walletType: 'metamask',
          address: accounts[0].slice(0, 6) + '...' + accounts[0].slice(-4) // Partial address for privacy
        });
      }
    } catch (error) {
      setError(error.message);
      
      // Track wallet connection failure
      trackEvent('wallet_connection_failed', { 
        walletType: 'metamask',
        error: error.message 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    
    // Track amount field interaction
    trackFormField('contribution-amount', 'number');
    
    // Track amount milestones
    const numValue = parseFloat(value);
    if (numValue >= 0.1) {
      trackEvent('amount_milestone_01', { amount: numValue });
    }
    if (numValue >= 1) {
      trackEvent('amount_milestone_1', { amount: numValue });
    }
    if (numValue >= 10) {
      trackEvent('amount_milestone_10', { amount: numValue });
    }
  };

  const handlePresetAmount = (presetAmount) => {
    setAmount(presetAmount.toString());
    trackEvent('preset_amount_selected', { amount: presetAmount });
  };

  const validateForm = () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      trackEvent('form_validation_failed', { reason: 'wallet_not_connected' });
      return false;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid contribution amount');
      trackEvent('form_validation_failed', { reason: 'invalid_amount' });
      return false;
    }
    
    if (parseFloat(amount) < 0.001) {
      setError('Minimum contribution is 0.001 ETH');
      trackEvent('form_validation_failed', { reason: 'amount_too_small' });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');
    
    const contributionAmount = parseFloat(amount);
    
    // Track contribution attempt
    trackContributionAttempt(contributionAmount, 'ETH');

    try {
      // Simulate blockchain transaction
      const transactionHash = await simulateContribution(contributionAmount, walletAddress);
      
      // Track successful contribution
      trackContributionSuccess(contributionAmount, transactionHash, 'ETH');
      
      // Call parent callback
      if (onContribution) {
        onContribution({
          amount: contributionAmount,
          transactionHash,
          walletAddress,
          campaignId
        });
      }

      // Reset form
      setAmount('');
      
      // Show success message
      alert('Contribution successful! Thank you for your support.');
      
    } catch (error) {
      setError(error.message);
      
      // Track contribution failure
      trackContributionFailure(contributionAmount, error.message, 'ETH');
      
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate blockchain contribution (replace with actual implementation)
  const simulateContribution = async (amount, address) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate random failures for testing
    if (Math.random() < 0.1) {
      throw new Error('Transaction failed: Insufficient gas fee');
    }
    
    // Return mock transaction hash
    return '0x' + Math.random().toString(16).substr(2, 64);
  };

  return (
    <div className="contribution-form-container">
      <form ref={formRef} onSubmit={handleSubmit} className="contribution-form">
        <div className="form-header">
          <h2>Support This Campaign</h2>
          <p>Your contribution helps make this project possible</p>
        </div>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        {/* Wallet Connection */}
        <div className="wallet-section">
          {!isConnected ? (
            <button
              type="button"
              onClick={connectWallet}
              disabled={isLoading}
              className="wallet-connect-btn"
            >
              {isLoading ? 'Connecting...' : 'Connect Wallet'}
            </button>
          ) : (
            <div className="wallet-connected">
              <span className="wallet-status">✅ Wallet Connected</span>
              <span className="wallet-address">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
            </div>
          )}
        </div>

        {/* Amount Selection */}
        <div className="amount-section">
          <label htmlFor="contribution-amount" className="amount-label">
            Contribution Amount (ETH)
          </label>
          
          {/* Preset amounts */}
          <div className="preset-amounts">
            {[0.1, 0.5, 1, 5].map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetAmount(preset)}
                className={`preset-btn ${amount === preset.toString() ? 'active' : ''}`}
              >
                {preset} ETH
              </button>
            ))}
          </div>

          <input
            id="contribution-amount"
            type="number"
            value={amount}
            onChange={handleAmountChange}
            placeholder="0.001"
            min="0.001"
            step="0.001"
            className="amount-input"
            disabled={isLoading}
          />
          
          {amount && (
            <div className="amount-details">
              <span>≈ ${(parseFloat(amount) * 2000).toFixed(2)} USD</span>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isConnected || !amount || isLoading}
          className="contribute-btn"
        >
          {isLoading ? 'Processing...' : `Contribute ${amount || '0'} ETH`}
        </button>

        {/* Progress Indicator */}
        {isLoading && (
          <div className="progress-indicator">
            <div className="progress-bar"></div>
            <span>Processing your contribution...</span>
          </div>
        )}
      </form>

      <style jsx>{`
        .contribution-form-container {
          max-width: 500px;
          margin: 0 auto;
          padding: 20px;
        }

        .contribution-form {
          background: #fff;
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .form-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .form-header h2 {
          margin: 0 0 8px 0;
          color: #1f2937;
          font-size: 24px;
          font-weight: 600;
        }

        .form-header p {
          margin: 0;
          color: #6b7280;
          font-size: 16px;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 24px;
          font-size: 14px;
        }

        .wallet-section {
          margin-bottom: 32px;
        }

        .wallet-connect-btn {
          width: 100%;
          background: #4f46e5;
          color: white;
          border: none;
          padding: 16px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .wallet-connect-btn:hover:not(:disabled) {
          background: #4338ca;
        }

        .wallet-connect-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .wallet-connected {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          padding: 16px;
          border-radius: 8px;
        }

        .wallet-status {
          color: #166534;
          font-weight: 600;
        }

        .wallet-address {
          color: #374151;
          font-family: monospace;
          font-size: 14px;
        }

        .amount-section {
          margin-bottom: 32px;
        }

        .amount-label {
          display: block;
          margin-bottom: 12px;
          color: #374151;
          font-weight: 600;
          font-size: 16px;
        }

        .preset-amounts {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .preset-btn {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          color: #374151;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .preset-btn:hover {
          background: #e5e7eb;
        }

        .preset-btn.active {
          background: #4f46e5;
          color: white;
          border-color: #4f46e5;
        }

        .amount-input {
          width: 100%;
          padding: 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 18px;
          font-weight: 600;
          text-align: center;
          transition: border-color 0.2s;
        }

        .amount-input:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .amount-details {
          margin-top: 8px;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }

        .contribute-btn {
          width: 100%;
          background: #10b981;
          color: white;
          border: none;
          padding: 16px;
          border-radius: 8px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .contribute-btn:hover:not(:disabled) {
          background: #059669;
        }

        .contribute-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .progress-indicator {
          margin-top: 16px;
          text-align: center;
        }

        .progress-bar {
          width: 100%;
          height: 4px;
          background: #e5e7eb;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-bar::after {
          content: '';
          display: block;
          width: 30%;
          height: 100%;
          background: #4f46e5;
          animation: progress 2s ease-in-out infinite;
        }

        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(200%); }
          100% { transform: translateX(300%); }
        }

        .progress-indicator span {
          color: #6b7280;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default ContributionFormWithAnalytics;