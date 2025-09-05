import React, { useState, useEffect } from 'react';
import { plaidService } from '../../lib/plaid-service.js';

const BankConnection = ({ formData, updateFormData, onNext, onPrev, campaignId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bankInfo, setBankInfo] = useState(null);
  const [plaidReady, setPlaidReady] = useState(false);

  useEffect(() => {
    // Load existing bank info if available
    loadBankInfo();

    // Load Plaid script
    loadPlaidScript();

    // Listen for Plaid events
    const handlePlaidSuccess = (event) => {
      setSuccess(
        `Bank account connected successfully: ${event.detail.accountName} (...${event.detail.lastFour})`
      );
      loadBankInfo(); // Reload to get updated info
    };

    const handlePlaidExit = (event) => {
      if (event.detail.error) {
        setError('Bank connection cancelled: ' + event.detail.error.error_message);
      } else {
        console.log('User exited Plaid Link');
      }
    };

    window.addEventListener('plaidLinkSuccess', handlePlaidSuccess);
    window.addEventListener('plaidLinkExit', handlePlaidExit);

    return () => {
      window.removeEventListener('plaidLinkSuccess', handlePlaidSuccess);
      window.removeEventListener('plaidLinkExit', handlePlaidExit);
    };
  }, [campaignId]);

  const loadPlaidScript = async () => {
    try {
      if (!window.Plaid) {
        await plaidService.constructor.loadPlaidScript();
      }
      setPlaidReady(true);
    } catch (err) {
      console.error('Failed to load Plaid:', err);
      setError('Failed to load Plaid SDK. Please refresh the page.');
    }
  };

  const loadBankInfo = async () => {
    if (!campaignId) return;

    try {
      const info = await plaidService.getBankAccountInfo(campaignId);
      setBankInfo(info);

      if (info.isVerified) {
        updateFormData({
          bankAccountVerified: true,
          bankAccountInfo: info,
        });
      }
    } catch (err) {
      console.error('Failed to load bank info:', err);
    }
  };

  const handleConnectBank = async () => {
    if (!campaignId) {
      setError('Campaign ID is required. Please go back and complete the previous steps.');
      return;
    }

    if (!plaidReady) {
      setError('Plaid SDK is not ready. Please wait or refresh the page.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Initialize Plaid Link
      const linkHandler = await plaidService.initializePlaidLink(campaignId, formData.email);

      // Open Plaid Link modal
      linkHandler.open();
    } catch (err) {
      console.error('Plaid connection error:', err);

      if (err.message.includes('backend integration required')) {
        setError(`
          Plaid backend integration is required to connect bank accounts.
          
          For development purposes, you can skip this step and continue with the setup.
          In production, this would connect to your bank account securely through Plaid.
        `);
      } else {
        setError('Failed to initialize bank connection: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBank = async () => {
    if (!campaignId) return;

    try {
      setLoading(true);
      await plaidService.removeBankAccount(campaignId);
      setBankInfo(null);
      setSuccess('Bank account disconnected successfully');
      updateFormData({
        bankAccountVerified: false,
        bankAccountInfo: null,
      });
    } catch (err) {
      setError('Failed to remove bank account: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    onNext();
  };

  const handleSkipForDev = async () => {
    console.log('Skip button clicked, current formData:', formData);

    try {
      setLoading(true);
      setError('');

      // Update form data first
      await updateFormData({
        skipBankConnection: true,
        bankAccountVerified: false,
      });

      setSuccess('Bank connection skipped - proceeding to next step');

      // Call onNext directly without timeout
      setTimeout(() => {
        console.log('Calling onNext() after brief delay');
        onNext();
      }, 500);
    } catch (err) {
      console.error('Error in handleSkipForDev:', err);
      setError('Failed to skip bank connection: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>

      {/* Status Messages */}
      {error && (
        <div
          className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg mb-4"
          style={{ whiteSpace: 'pre-line' }}
        >
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-4">
          {success}
        </div>
      )}

      {/* Current Bank Account Status */}
      {bankInfo?.isVerified ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <h4 className="text-green-700 mt-0">Bank Account Connected</h4>

          <div className="bg-white p-4 rounded mb-4">
            <div className="text-base font-medium mb-2">
              {bankInfo.details?.institution_name || 'Connected Bank'}
            </div>
            <div className="text-muted-foreground text-base">
              Account: {bankInfo.accountName} (...{bankInfo.lastFour})
            </div>
            <div className="text-muted-foreground text-xs mt-2">
              Connected: {new Date(bankInfo.details?.created_at).toLocaleDateString()}
            </div>
          </div>

          <button
            onClick={handleRemoveBank}
            disabled={loading}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Removing...' : 'Remove Bank Account'}
          </button>
        </div>
      ) : (
        <div
          className="crypto-card"
          style={{
            background: 'hsl(var(--crypto-navy))',
            border: '1px solid hsl(var(--crypto-white) / 0.2)',
            padding: '2rem',
            marginBottom: '2rem',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              color: 'hsl(var(--crypto-white) / 0.8)',
              marginBottom: '2rem',
              fontSize: '1rem',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Connect your campaign's bank account to process contributions securely through Plaid.
          </p>

          <button
            onClick={handleConnectBank}
            disabled={loading || !plaidReady}
            style={{
              background: 'hsl(var(--crypto-gold))',
              color: 'hsl(var(--crypto-navy))',
              border: '2px solid hsl(var(--crypto-gold))',
              padding: '1rem 2rem',
              borderRadius: 'var(--radius)',
              fontSize: '1rem',
              fontWeight: '600',
              marginBottom: '1rem',
              cursor: (loading || !plaidReady) ? 'not-allowed' : 'pointer',
              opacity: (loading || !plaidReady) ? 0.7 : 1,
              fontFamily: 'Inter, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.025em',
            }}
          >
            {loading
              ? 'Connecting...'
              : !plaidReady
                ? 'Loading...'
                : 'Connect Bank Account - Powered by Plaid'}
          </button>

          {!plaidReady && (
            <div
              style={{
                color: 'hsl(var(--crypto-white) / 0.6)',
                fontSize: '1rem',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Loading Plaid SDK...
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '2rem',
          gap: '1rem',
        }}
      >
        <button
          onClick={onPrev}
          style={{
            padding: '0.75rem 2rem',
            borderRadius: 'var(--radius)',
            border: 'none',
            background: 'hsl(var(--crypto-gold))',
            color: 'hsl(var(--crypto-navy))',
            fontSize: '1rem',
            fontWeight: '700',
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.025em',
          }}
        >
          Back
        </button>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={handleSkipForDev}
            disabled={loading}
            style={{
              background: 'hsl(var(--crypto-blue))',
              color: 'hsl(var(--crypto-white))',
              border: '1px solid hsl(var(--crypto-blue))',
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius)',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              opacity: loading ? 0.7 : 1,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {loading ? 'Skipping...' : 'Skip Bank Connection'}
          </button>

          <button
            onClick={handleNext}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: 'var(--radius)',
              border: '2px solid hsl(var(--crypto-gold))',
              background: 'hsl(var(--crypto-gold))',
              color: 'hsl(var(--crypto-navy))',
              fontSize: '1rem',
              fontWeight: '700',
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.025em',
            }}
          >
            Next: Website Style
          </button>
        </div>
      </div>
    </div>
  );
};

export default BankConnection;
