import React, { useState } from 'react';

const LaunchConfirmation = ({ formData, updateFormData, onPrev }) => {
  const [isLaunched, setIsLaunched] = useState(false);

  const handleLaunch = () => {
    setIsLaunched(true);
    updateFormData({ status: 'live', launchDate: new Date().toISOString() });
  };

  if (isLaunched) {
    const campaignId = 'demo-' + Date.now();
    const embedCode = '<iframe src="http://localhost:5174/?campaign=' + campaignId + '" width="400" height="600" frameborder="0" style="border-radius: 8px;"></iframe>';

    return (
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: '#28a745' }}>🎉 Campaign Successfully Launched!</h2>
        <p>Your donation form is now live and ready to accept contributions.</p>
        
        <div style={{ background: '#fff3cd', padding: '1.5rem', borderRadius: '8px', margin: '2rem 0' }}>
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
              borderRadius: '4px'
            }}
          />
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
        <button className="btn btn-secondary" onClick={onPrev}>Back</button>
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
