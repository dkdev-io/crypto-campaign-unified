import React, { useState } from 'react';

const LaunchConfirmation = ({ formData, updateFormData, onPrev, campaignId }) => {
  const [isLaunched, setIsLaunched] = useState(false);

  const handleLaunch = () => {
    setIsLaunched(true);
    updateFormData({ status: 'live', launchDate: new Date().toISOString() });
  };

  if (isLaunched) {
    // Simple embed URL with just campaign ID
    console.log('🚀 Launch screen - Campaign ID:', campaignId);
    console.log('🚀 Launch screen - Form data:', formData);
    const embedUrl = campaignId
      ? `http://localhost:5173/?campaign=${campaignId}`
      : 'http://localhost:5173/';
    const embedCode = `<iframe src="${embedUrl}" width="400" height="600" frameborder="0" style="border-radius: 8px;"></iframe>`;

    return (
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: '#28a745' }}>🎉 Campaign Successfully Launched!</h2>
        <p>Your donation form is now live and ready to accept contributions.</p>
        {campaignId && (
          <p
            style={{
              background: '#e7f3ff',
              padding: '0.5rem',
              borderRadius: '4px',
              marginTop: '1rem',
            }}
          >
            <strong>Campaign ID:</strong> {campaignId}
          </p>
        )}

        <div
          style={{
            background: '#fff3cd',
            padding: '1.5rem',
            borderRadius: '8px',
            margin: '2rem 0',
          }}
        >
          <h3 style={{ marginBottom: '1rem' }}>📋 Your Embed Code</h3>
          <textarea
            value={embedCode}
            readOnly
            style={{
              width: '100%',
              height: '80px',
              fontFamily: 'monospace',
              fontSize: '12px',
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
          <div style={{ marginTop: '1rem' }}>
            <a
              href={embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#007bff',
                textDecoration: 'underline',
                fontSize: '14px',
              }}
            >
              🔗 Preview your contribution form in a new tab
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>Launch Confirmation</h2>
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={formData.finalConfirmation || false}
            onChange={(e) => updateFormData({ finalConfirmation: e.target.checked })}
          />
          I confirm all information is accurate and I'm ready to launch
        </label>
      </div>

      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onPrev}>
          Back
        </button>
        <button
          className="btn btn-primary"
          onClick={handleLaunch}
          disabled={!formData.finalConfirmation}
        >
          🚀 Launch Campaign
        </button>
      </div>
    </div>
  );
};

export default LaunchConfirmation;
