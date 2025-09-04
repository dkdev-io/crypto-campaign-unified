import React from 'react';

const FormCustomization = ({ formData, updateFormData, onNext, onPrev }) => {
  return (
    <div>
      <h2>Form Customization</h2>
      
      <div className="form-group">
        <label>Theme Color</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <input 
            type="color"
            value={formData.themeColor || formData.appliedStyles?.colors?.primary || '#2a2a72'}
            onChange={(e) => updateFormData({ themeColor: e.target.value })}
          />
          {formData.appliedStyles?.colors?.primary && (
            <div style={{ 
              fontSize: '0.9rem', 
              color: 'hsl(120 60% 40%)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span></span>
              <span>From your website: {formData.appliedStyles.colors.primary}</span>
            </div>
          )}
        </div>
      </div>

      <div className="form-group">
        <label>Maximum Donation Limit</label>
        <input 
          className="form-input"
          type="number"
          value={formData.maxDonation || 3300}
          onChange={(e) => updateFormData({ maxDonation: e.target.value })}
          max="3300"
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
          {['BTC', 'ETH', 'USDC'].map(crypto => (
            <label key={crypto} style={{ display: 'inline-block', margin: '0 1rem 0 0' }}>
              <input 
                type="checkbox"
                checked={(formData.supportedCryptos || ['BTC', 'ETH', 'USDC']).includes(crypto)}
                onChange={(e) => {
                  const current = formData.supportedCryptos || ['BTC', 'ETH', 'USDC'];
                  const updated = e.target.checked 
                    ? [...current, crypto]
                    : current.filter(c => c !== crypto);
                  updateFormData({ supportedCryptos: updated });
                }}
              />
              {crypto}
            </label>
          ))}
        </div>
      </div>

      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onPrev}>Back</button>
        <button className="btn btn-primary" onClick={onNext}>Next</button>
      </div>
    </div>
  );
};

export default FormCustomization;
