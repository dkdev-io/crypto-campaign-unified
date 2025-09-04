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
      setSuccess(`Bank account connected successfully: ${event.detail.accountName} (...${event.detail.lastFour})`);
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
          bankAccountInfo: info 
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
      const linkHandler = await plaidService.initializePlaidLink(
        campaignId,
        formData.email
      );

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
        bankAccountInfo: null 
      });
    } catch (err) {
      setError('Failed to remove bank account: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    // For development, allow continuing without bank connection
    if (!bankInfo?.isVerified && !formData.skipBankConnection) {
      setError('Please connect a bank account or choose to skip for development purposes');
      return;
    }
    
    onNext();
  };

  const handleSkipForDev = () => {
    updateFormData({ 
      skipBankConnection: true,
      bankAccountVerified: false
    });
    setSuccess('Bank connection skipped for development purposes');
    setTimeout(() => {
      onNext();
    }, 1000);
  };

  return (
    <div>
      <h2 style={{ color: '#2a2a72', textAlign: 'center', marginBottom: '1rem' }}>
        🏦 Connect Bank Account - Step 3
      </h2>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>
        Securely connect your campaign's bank account for contribution processing
      </p>

      {/* Status Messages */}
      {error && (
        <div style={{ 
          background: '#fee', 
          color: '#c33', 
          padding: '1rem', 
          borderRadius: '4px', 
          marginBottom: '1rem',
          border: '1px solid #fcc',
          whiteSpace: 'pre-line'
        }}>
          ❌ {error}
        </div>
      )}

      {success && (
        <div style={{ 
          background: '#efe', 
          color: '#393', 
          padding: '1rem', 
          borderRadius: '4px', 
          marginBottom: '1rem',
          border: '1px solid #cfc'
        }}>
          ✅ {success}
        </div>
      )}

      {/* Current Bank Account Status */}
      {bankInfo?.isVerified ? (
        <div style={{ 
          background: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h4 style={{ color: '#155724', marginTop: 0 }}>
            ✅ Bank Account Connected
          </h4>
          
          <div style={{ 
            background: 'white',
            padding: '1rem',
            borderRadius: '6px',
            marginBottom: '1rem'
          }}>
            <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '0.5rem' }}>
              {bankInfo.details?.institution_name || 'Connected Bank'}
            </div>
            <div style={{ color: '#6c757d', fontSize: '14px' }}>
              Account: {bankInfo.accountName} (...{bankInfo.lastFour})
            </div>
            <div style={{ color: '#6c757d', fontSize: '12px', marginTop: '0.5rem' }}>
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
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? '⏳ Removing...' : '🗑️ Remove Bank Account'}
          </button>
        </div>
      ) : (
        <div style={{ 
          background: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🏦</div>
          <h4 style={{ color: '#495057', marginBottom: '1rem' }}>
            No Bank Account Connected
          </h4>
          <p style={{ color: '#6c757d', marginBottom: '2rem' }}>
            Connect your campaign's bank account to process contributions securely through Plaid.
          </p>
          
          <button
            onClick={handleConnectBank}
            disabled={loading || !plaidReady}
            style={{
              background: '#2a2a72',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '6px',
              cursor: loading || !plaidReady ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              opacity: loading || !plaidReady ? 0.7 : 1,
              marginBottom: '1rem'
            }}
          >
            {loading ? '⏳ Connecting...' : !plaidReady ? '⏳ Loading...' : '🔗 Connect Bank Account'}
          </button>
          
          {!plaidReady && (
            <div style={{ fontSize: '14px', color: '#6c757d' }}>
              Loading Plaid SDK...
            </div>
          )}
        </div>
      )}

      {/* Security Information */}
      <div style={{ 
        background: '#e7f3ff',
        border: '1px solid #b6d7ff',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h5 style={{ color: '#0066cc', marginTop: 0 }}>
          🔒 Your Security is Our Priority
        </h5>
        <ul style={{ color: '#004499', fontSize: '14px', margin: 0, paddingLeft: '1.2rem' }}>
          <li>Bank connections are powered by Plaid, used by thousands of financial apps</li>
          <li>Your login credentials are never stored on our servers</li>
          <li>All data transmission is encrypted with bank-level security</li>
          <li>We only access basic account information needed for processing</li>
          <li>You can disconnect your bank account at any time</li>
        </ul>
      </div>

      {/* Skip Option */}
      <div style={{ 
        background: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <button
          onClick={handleSkipForDev}
          style={{
            background: '#ffc107',
            color: '#212529',
            border: 'none',
            padding: '0.75rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          ⚠️ Skip Bank Connection
        </button>
      </div>


      {/* Navigation */}
      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onPrev}>
          ← Back
        </button>
        <button 
          className="btn btn-primary"
          onClick={handleNext}
        >
          Next: Website Style →
        </button>
      </div>

    </div>
  );
};

export default BankConnection;