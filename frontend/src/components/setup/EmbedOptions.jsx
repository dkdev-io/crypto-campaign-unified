import React from 'react';

const EmbedOptions = ({ formData, updateFormData, onNext, onPrev, campaignId }) => {
  // Simple embed URL with just campaign ID
  console.log('EmbedOptions - Campaign ID:', campaignId);
  console.log('EmbedOptions - Form Data:', formData);
  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  const embedUrl = campaignId ? `${baseUrl}/embed-form.html?campaign=${campaignId}` : `${baseUrl}/embed-form.html`;
  const embedCode = `<iframe src="${embedUrl}" width="400" height="600" frameborder="0" style="border-radius: 8px;"></iframe>`;
  
   return (
    <div>
      <h2>Embed Options</h2>
      
      <div style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
        <h3>Campaign Summary</h3>
        <p><strong>Campaign:</strong> {formData.campaignName || 'Not set'}</p>
        <p><strong>Candidate:</strong> {formData.candidateName || 'Not set'}</p>
        <p><strong>Max Donation:</strong> ${formData.maxDonation || 3300}</p>
        <p><strong>Supported Crypto:</strong> {(formData.supportedCryptos || ['BTC', 'ETH', 'USDC']).join(', ')}</p>
        {campaignId && <p><strong>Campaign ID:</strong> {campaignId}</p>}
      </div>

      <div className="form-group">
        <label>Embed Code</label>
        <textarea 
          className="form-input"
          value={embedCode}
          readOnly
          rows="3"
          style={{ fontFamily: 'monospace', fontSize: '12px' }}
        />
        <small>Copy this code to embed on your website</small>
      </div>

      <div className="form-group">
        <label>Custom Success URL (optional)</label>
        <input 
          className="form-input"
          type="url"
          value={formData.successUrl || ''}
          onChange={(e) => updateFormData({ successUrl: e.target.value })}
          placeholder="https://yoursite.com/thank-you"
        />
      </div>

      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onPrev}>Back</button>
        <button className="btn btn-primary" onClick={onNext}>Next</button>
      </div>
    </div>
  );
};

export default EmbedOptions;
