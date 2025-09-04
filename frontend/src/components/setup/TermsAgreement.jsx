import React, { useState } from 'react';

const TermsAgreement = ({ formData, updateFormData, onNext, onPrev }) => {
  const [termsAccepted, setTermsAccepted] = useState(formData.termsAccepted || false);
  const [showErrors, setShowErrors] = useState(false);

  const handleAgreementChange = (value) => {
    setTermsAccepted(value);
    
    updateFormData({
      termsAccepted: value
    });

    if (showErrors) {
      setShowErrors(false);
    }
  };

  const handleComplete = () => {
    if (!termsAccepted) {
      setShowErrors(true);
      return;
    }

    // Record agreement timestamp and complete setup
    updateFormData({
      termsAcceptedAt: new Date().toISOString(),
      termsIpAddress: '127.0.0.1', // In production, get real IP
      setupCompleted: true
    });

    // This could redirect to dashboard or show success
    alert('Campaign setup completed successfully! Your campaign is now live.');
  };

  return (
    <div>
      <h2 style={{ fontSize: '2rem', fontWeight: '700', textAlign: 'center', marginBottom: '0.5rem', color: 'hsl(var(--crypto-white))', fontFamily: 'Inter, sans-serif' }}>
        Terms & Conditions
      </h2>
      <p style={{ textAlign: 'center', marginBottom: '3rem', color: 'hsl(var(--crypto-gold))', fontSize: '1rem', fontWeight: '500' }}>
        Step 7 of 8: Accept terms to complete your campaign setup
      </p>

      {/* Campaign Summary */}
      <div style={{ 
        background: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '3rem'
      }}>
        <h4 style={{ color: '#495057', marginTop: 0 }}>
          Setup Summary
        </h4>
        <div className="text-sm text-muted-foreground">
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Campaign:</strong> {formData.campaignName || 'Not specified'}
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Setup by:</strong> {formData.userFullName || 'Not specified'} ({formData.email || 'Not specified'})
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Committee:</strong> {formData.committeeName || 'Not specified'}
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Bank Account:</strong> {
              formData.bankAccountVerified ? 
                `Connected (${formData.bankAccountInfo?.accountName})` : 
                formData.skipBankConnection ? 
                  'Skipped (Dev Mode)' : 
                  'Not connected'
            }
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Embed Code:</strong> Generated and ready
          </div>
        </div>
      </div>

      {/* Simplified Terms */}
      <div style={{ 
        background: 'white',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        padding: '2rem',
        marginBottom: '3rem',
        textAlign: 'center'
      }}>
        <h3 style={{ color: '#495057', marginBottom: '2rem' }}>
          Terms & Conditions
        </h3>
        <p style={{ 
          fontSize: 'var(--text-body-lg)', 
          color: '#6c757d', 
          marginBottom: '2rem',
          fontStyle: 'italic'
        }}>
          You agree to a lot of terms.
        </p>
        
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: '600',
          fontFamily: 'Inter, sans-serif',
          color: termsAccepted ? '#28a745' : 'hsl(var(--crypto-navy))'
        }}>
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => handleAgreementChange(e.target.checked)}
            style={{ 
              marginRight: '1rem',
              transform: 'scale(1.5)',
              accentColor: '#2a2a72'
            }}
          />
          <span style={{ fontWeight: '500' }}>
            I accept the Terms & Conditions
          </span>
        </label>
      </div>

      {/* Error Message */}
      {showErrors && !termsAccepted && (
        <div style={{ 
          background: '#fee', 
          color: '#c33', 
          padding: '1rem', 
          borderRadius: '4px', 
          marginBottom: '2rem',
          border: '1px solid #fcc',
          textAlign: 'center'
        }}>
          You must accept the terms and conditions to complete setup
        </div>
      )}

      {/* Final Launch Section */}
      <div style={{ 
        background: termsAccepted ? '#d4edda' : '#f8f9fa',
        border: `1px solid ${termsAccepted ? '#c3e6cb' : '#e9ecef'}`,
        borderRadius: '8px',
        padding: '3rem',
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          {termsAccepted ? '' : ''}
        </div>
        <h3 style={{ 
          color: termsAccepted ? '#155724' : '#495057',
          marginBottom: '1rem',
          fontSize: 'var(--text-heading-sm)'
        }}>
          {termsAccepted ? 
            'Campaign Setup Complete!' : 
            'Accept Terms to Launch'
          }
        </h3>
        <p style={{ 
          color: termsAccepted ? '#155724' : '#6c757d',
          marginBottom: '2rem',
          fontSize: 'var(--text-body)'
        }}>
          {termsAccepted ? 
            'Your campaign contribution system is now live and ready to accept donations!' :
            'Please accept the terms above to complete your campaign setup.'
          }
        </p>
        
        <button
          onClick={handleComplete}
          disabled={!termsAccepted}
          style={{
            background: termsAccepted ? '#28a745' : '#6c757d',
            color: 'white',
            border: 'none',
            padding: '1.5rem 3rem',
            borderRadius: '8px',
            cursor: termsAccepted ? 'pointer' : 'not-allowed',
            fontSize: 'var(--text-body-lg)',
            fontWeight: '600',
            opacity: termsAccepted ? 1 : 0.6,
            transform: termsAccepted ? 'scale(1)' : 'scale(0.95)',
            transition: 'all 0.3s ease'
          }}
        >
          {termsAccepted ? 'Launch Campaign!' : 'Accept Terms First'}
        </button>
      </div>

      {/* Navigation */}
      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onPrev}>
          Back to Embed Code
        </button>
      </div>
    </div>
  );
};

export default TermsAgreement;