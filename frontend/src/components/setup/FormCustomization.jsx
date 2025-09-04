import React from 'react';

const FormCustomization = ({ formData, updateFormData, onNext, onPrev }) => {
  return (
    <div>
      <h2
        style={{
          fontSize: '2rem',
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: '0.5rem',
          color: 'hsl(var(--crypto-white))',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        Form Customization
      </h2>
      <p
        style={{
          textAlign: 'center',
          marginBottom: '2rem',
          color: 'hsl(var(--crypto-gold))',
          fontSize: '1rem',
          fontWeight: '500',
        }}
      >
        Step 5 of 8: Customize your donation form appearance
      </p>

      <div className="form-group">
        <label>Theme Color</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <input
            type="color"
            value={formData.themeColor || formData.appliedStyles?.colors?.primary || '#2a2a72'}
            onChange={(e) => updateFormData({ themeColor: e.target.value })}
          />
          {formData.appliedStyles?.colors?.primary && (
            <div
              style={{
                fontSize: '0.9rem',
                color: 'hsl(var(--crypto-gold))',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span></span>
              <span>From your website: {formData.appliedStyles.colors.primary}</span>
            </div>
          )}
        </div>
      </div>

      <div className="form-group">
        <label>Maximum Donation Limit</label>
        <input
          type="number"
          value={formData.maxDonation || 3300}
          onChange={(e) => updateFormData({ maxDonation: e.target.value })}
          max="3300"
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid hsl(var(--crypto-blue) / 0.4)',
            borderRadius: 'var(--radius)',
            background: 'hsl(223 57% 25% / 0.5)',
            color: 'hsl(var(--crypto-white))',
            fontSize: '1rem',
            fontFamily: 'Inter, sans-serif',
            transition: 'var(--transition-smooth)',
          }}
        />
        <small>Federal limit: $3,300 per candidate per election</small>
      </div>

      <div className="form-group">
        <label>Suggested Amounts (comma separated)</label>
        <input
          className="form-input"
          value={formData.suggestedAmounts || '25, 50, 100, 250'}
          onChange={(e) => {
            console.log('User entered custom amounts:', e.target.value);
            updateFormData({ suggestedAmounts: e.target.value });
          }}
          placeholder="25, 50, 100, 250"
        />
        <small>Current value: {formData.suggestedAmounts || '25, 50, 100, 250'}</small>
      </div>

      <div className="form-group">
        <label>Supported Cryptocurrencies</label>
        <div>
          {['BTC', 'ETH', 'USDC'].map((crypto) => (
            <label key={crypto} style={{ display: 'inline-block', margin: '0 1rem 0 0' }}>
              <input
                type="checkbox"
                checked={(formData.supportedCryptos || ['BTC', 'ETH', 'USDC']).includes(crypto)}
                onChange={(e) => {
                  const current = formData.supportedCryptos || ['BTC', 'ETH', 'USDC'];
                  const updated = e.target.checked
                    ? [...current, crypto]
                    : current.filter((c) => c !== crypto);
                  updateFormData({ supportedCryptos: updated });
                }}
              />
              {crypto}
            </label>
          ))}
        </div>
      </div>

      <div className="form-actions">
        <button
          onClick={onPrev}
          style={{
            background: 'hsl(var(--crypto-gold))',
            color: 'hsl(var(--crypto-navy))',
            border: 'none',
            padding: 'var(--space-sm) var(--space-lg)',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            fontSize: '1rem',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '600',
            transition: 'var(--transition-smooth)',
          }}
        >
          Back
        </button>
        <button
          onClick={onNext}
          style={{
            background: 'hsl(var(--crypto-navy))',
            color: 'hsl(var(--crypto-white))',
            border: 'none',
            padding: 'var(--space-sm) var(--space-lg)',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            fontSize: '1rem',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '600',
            transition: 'var(--transition-smooth)',
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default FormCustomization;
