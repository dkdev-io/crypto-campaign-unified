import React, { useState } from 'react';

const TermsAgreement = ({ formData, updateFormData, onNext, onPrev }) => {
  const [termsAccepted, setTermsAccepted] = useState(formData.termsAccepted || false);
  const [showErrors, setShowErrors] = useState(false);

  const handleAgreementChange = (value) => {
    setTermsAccepted(value);

    updateFormData({
      termsAccepted: value,
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
      setupCompleted: true,
    });

    // Proceed to final embed code screen
    onNext();
  };

  return (
    <div>

      {/* Simplified Terms */}
      <div
        className="crypto-card"
        style={{
          maxWidth: '500px',
          margin: '0 auto 2rem auto',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <h3 
          style={{ 
            color: 'hsl(var(--crypto-white))',
            marginBottom: '1.5rem',
            fontSize: '1.5rem',
            fontWeight: '600',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Terms & Conditions
        </h3>
        <p
          style={{
            fontSize: '1rem',
            color: 'hsl(var(--crypto-white) / 0.7)',
            marginBottom: '2rem',
            fontStyle: 'italic',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          You agree to a lot of terms.
        </p>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            fontFamily: 'Inter, sans-serif',
            color: 'hsl(var(--crypto-white))',
          }}
        >
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => handleAgreementChange(e.target.checked)}
            style={{
              marginRight: '1rem',
              transform: 'scale(1.5)',
              accentColor: 'hsl(var(--crypto-gold))',
            }}
          />
          <span>I accept the Terms & Conditions</span>
        </label>
      </div>

      {/* Error Message */}
      {showErrors && !termsAccepted && (
        <div
          style={{
            background: 'hsl(var(--destructive) / 0.1)',
            color: 'hsl(var(--destructive))',
            padding: '1.5rem',
            borderRadius: 'var(--radius)',
            marginBottom: '2rem',
            border: '1px solid hsl(var(--destructive) / 0.3)',
            textAlign: 'center',
            fontFamily: 'Inter, sans-serif',
            maxWidth: '500px',
            margin: '0 auto 2rem auto',
          }}
        >
          <h3
            style={{
              color: 'hsl(var(--destructive))',
              marginBottom: '0.5rem',
              fontSize: '1.25rem',
              fontWeight: '600',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Accept Terms to Launch
          </h3>
          <p
            style={{
              color: 'hsl(var(--destructive))',
              fontSize: '1rem',
              fontFamily: 'Inter, sans-serif',
              margin: 0,
            }}
          >
            Please accept the terms above to complete your campaign setup.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: '2rem' 
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
              transition: 'var(--transition-smooth)',
              textTransform: 'uppercase',
              letterSpacing: '0.025em',
            }}
          >
            BACK
          </button>
          <div style={{
            color: 'hsl(var(--crypto-gold))',
            fontSize: '1.5rem',
            marginTop: '0.5rem',
          }}>
            ←
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button
            onClick={handleComplete}
            disabled={!termsAccepted}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: 'var(--radius)',
              border: '2px solid hsl(var(--crypto-gold))',
              background: termsAccepted ? 'hsl(var(--crypto-gold))' : 'hsl(var(--crypto-white) / 0.1)',
              color: termsAccepted ? 'hsl(var(--crypto-navy))' : 'hsl(var(--crypto-white) / 0.5)',
              fontSize: '1rem',
              fontWeight: '700',
              fontFamily: 'Inter, sans-serif',
              cursor: termsAccepted ? 'pointer' : 'not-allowed',
              transition: 'var(--transition-smooth)',
              textTransform: 'uppercase',
              letterSpacing: '0.025em',
              opacity: termsAccepted ? 1 : 0.6,
            }}
          >
            FINISH
          </button>
          <div style={{
            color: 'hsl(var(--crypto-gold))',
            fontSize: '1.5rem',
            marginTop: '0.5rem',
          }}>
            →
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAgreement;
