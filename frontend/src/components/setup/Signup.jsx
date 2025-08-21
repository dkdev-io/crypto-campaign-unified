import React, { useState } from 'react';

const Signup = ({ formData, updateFormData, onNext }) => {
  const [showErrors, setShowErrors] = useState(false);
  
  const handleInputChange = (field, value) => {
    updateFormData({ [field]: value });
    if (showErrors) {
      setShowErrors(false);
    }
  };

  const handleNext = () => {
    // Validate all required fields
    const requiredFields = ['userFullName', 'email', 'campaignName', 'committeeNameSearch'];
    const missingFields = requiredFields.filter(field => !formData[field]?.trim());
    
    if (missingFields.length > 0) {
      setShowErrors(true);
      return;
    }
    
    onNext();
  };

  return (
    <div>
      <h2 style={{ color: '#2a2a72', textAlign: 'center', marginBottom: '1rem' }}>
        📋 Campaign Setup - Step 1
      </h2>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>
        Tell us about yourself and your campaign
      </p>

      <div className="form-group">
        <label>Your Full Name *</label>
        <input
          className="form-input"
          type="text"
          value={formData.userFullName || ''}
          onChange={(e) => handleInputChange('userFullName', e.target.value)}
          placeholder="John Smith"
          style={{ 
            borderColor: showErrors && !formData.userFullName ? '#dc3545' : '#ced4da' 
          }}
        />
        {showErrors && !formData.userFullName && (
          <small style={{ color: '#dc3545' }}>Your full name is required</small>
        )}
        <small className="field-help" style={{ color: '#6c757d', fontSize: '12px' }}>
          This is the person setting up the campaign
        </small>
      </div>

      <div className="form-group">
        <label>Your Email Address *</label>
        <input
          className="form-input"
          type="email"
          value={formData.email || ''}
          onChange={(e) => handleInputChange('email', e.target.value)}
          placeholder="john@campaign.com"
          style={{ 
            borderColor: showErrors && !formData.email ? '#dc3545' : '#ced4da' 
          }}
        />
        {showErrors && !formData.email && (
          <small style={{ color: '#dc3545' }}>Email address is required</small>
        )}
        <small className="field-help" style={{ color: '#6c757d', fontSize: '12px' }}>
          We'll use this to contact you about your campaign
        </small>
      </div>

      <div className="form-group">
        <label>Campaign Name *</label>
        <input
          className="form-input"
          type="text"
          value={formData.campaignName || ''}
          onChange={(e) => handleInputChange('campaignName', e.target.value)}
          placeholder="Friends of John Smith"
          style={{ 
            borderColor: showErrors && !formData.campaignName ? '#dc3545' : '#ced4da' 
          }}
        />
        {showErrors && !formData.campaignName && (
          <small style={{ color: '#dc3545' }}>Campaign name is required</small>
        )}
        <small className="field-help" style={{ color: '#6c757d', fontSize: '12px' }}>
          The public name for your campaign
        </small>
      </div>

      <div className="form-group">
        <label>Committee Name or Search Term *</label>
        <input
          className="form-input"
          type="text"
          value={formData.committeeNameSearch || ''}
          onChange={(e) => handleInputChange('committeeNameSearch', e.target.value)}
          placeholder="Friends of John Smith Committee"
          style={{ 
            borderColor: showErrors && !formData.committeeNameSearch ? '#dc3545' : '#ced4da' 
          }}
        />
        {showErrors && !formData.committeeNameSearch && (
          <small style={{ color: '#dc3545' }}>Committee name is required</small>
        )}
        <small className="field-help" style={{ color: '#6c757d', fontSize: '12px' }}>
          Enter your FEC committee name or keywords to search. 
          We'll help you find the exact match in the next step.
        </small>
      </div>

      <div className="form-group">
        <label>Suggested Contribution Amounts</label>
        <input
          className="form-input"
          type="text"
          value={formData.suggestedAmounts || '25, 50, 100, 250'}
          onChange={(e) => handleInputChange('suggestedAmounts', e.target.value)}
          placeholder="25, 50, 100, 250"
        />
        <small className="field-help" style={{ color: '#6c757d', fontSize: '12px' }}>
          Comma-separated dollar amounts that contributors can quickly select
        </small>
      </div>

      <div className="form-group">
        <label>Maximum Contribution Limit</label>
        <input
          className="form-input"
          type="number"
          value={formData.maxDonationLimit || 3300}
          onChange={(e) => handleInputChange('maxDonationLimit', e.target.value)}
          placeholder="3300"
          min="1"
          max="10000"
        />
        <small className="field-help" style={{ color: '#6c757d', fontSize: '12px' }}>
          Maximum amount a single contributor can donate (FEC limit: $3,300 per election)
        </small>
      </div>

      <div className="form-group">
        <label>Campaign Website (Optional)</label>
        <input
          className="form-input"
          type="url"
          value={formData.website || ''}
          onChange={(e) => handleInputChange('website', e.target.value)}
          placeholder="https://www.friendsofjohnsmith.com"
        />
        <small className="field-help" style={{ color: '#6c757d', fontSize: '12px' }}>
          Your campaign website URL
        </small>
      </div>

      <div className="form-actions">
        <div></div>
        <button className="btn btn-primary" onClick={handleNext}>
          Next: Find Committee →
        </button>
      </div>

      {/* Info Box */}
      <div style={{ 
        marginTop: '2rem',
        padding: '1rem',
        background: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '6px',
        fontSize: '14px',
        color: '#6c757d'
      }}>
        <strong style={{ color: '#495057' }}>📌 What happens next:</strong>
        <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.2rem' }}>
          <li>We'll search for your FEC committee in our database</li>
          <li>You'll confirm the correct committee details</li>
          <li>We'll connect your bank account securely with Plaid</li>
          <li>You'll get your embed code to start collecting contributions</li>
        </ul>
      </div>
    </div>
  );
};

export default Signup;
