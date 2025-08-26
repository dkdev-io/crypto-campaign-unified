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
        <label htmlFor="userFullName">Your Full Name *</label>
        <input
          id="userFullName"
          className="form-input"
          type="text"
          value={formData.userFullName || ''}
          onChange={(e) => handleInputChange('userFullName', e.target.value)}
          placeholder="Enter your full name"
          required
          aria-required="true"
          style={{ 
            borderColor: showErrors && !formData.userFullName ? '#dc3545' : '#ced4da' 
          }}
        />
        {showErrors && !formData.userFullName && (
          <small style={{ color: '#dc3545' }}>Your full name is required</small>
        )}
        <small className="field-help" style={{ color: '#6c757d', fontSize: '12px' }}>
          This will be used for FEC reporting
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="email">Your Email Address *</label>
        <input
          id="email"
          className="form-input"
          type="email"
          value={formData.email || ''}
          onChange={(e) => handleInputChange('email', e.target.value)}
          placeholder="your.email@domain.com"
          required
          aria-required="true"
          style={{ 
            borderColor: showErrors && !formData.email ? '#dc3545' : '#ced4da' 
          }}
        />
        {showErrors && !formData.email && (
          <small style={{ color: '#dc3545' }}>Email address is required</small>
        )}
        <small className="field-help" style={{ color: '#6c757d', fontSize: '12px' }}>
          Used for notifications and account management
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="campaignName">Campaign Name *</label>
        <input
          id="campaignName"
          className="form-input"
          type="text"
          value={formData.campaignName || ''}
          onChange={(e) => handleInputChange('campaignName', e.target.value)}
          placeholder="e.g., Smith for Mayor 2024"
          required
          aria-required="true"
          style={{ 
            borderColor: showErrors && !formData.campaignName ? '#dc3545' : '#ced4da' 
          }}
        />
        {showErrors && !formData.campaignName && (
          <small style={{ color: '#dc3545' }}>Campaign name is required</small>
        )}
        <small className="field-help" style={{ color: '#6c757d', fontSize: '12px' }}>
          Publicly displayed name for your campaign
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="committeeNameSearch">Committee Name or Search Term *</label>
        <input
          id="committeeNameSearch"
          className="form-input"
          type="text"
          value={formData.committeeNameSearch || ''}
          onChange={(e) => handleInputChange('committeeNameSearch', e.target.value)}
          placeholder="Friends of John Smith Committee"
          required
          aria-required="true"
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
        <label htmlFor="suggestedAmounts">Suggested Contribution Amounts</label>
        <input
          id="suggestedAmounts"
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
        <label htmlFor="maxDonationLimit">Maximum Contribution Limit</label>
        <input
          id="maxDonationLimit"
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
        <label htmlFor="website">Campaign Website (Optional)</label>
        <input
          id="website"
          className="form-input"
          type="url"
          value={formData.website || ''}
          onChange={(e) => handleInputChange('website', e.target.value)}
          placeholder="https://yourcampaign.com"
          required
          aria-required="true"
        />
        <small className="field-help" style={{ color: '#6c757d', fontSize: '12px' }}>
          Your official campaign website
        </small>
      </div>

      <div className="form-actions">
        <div></div>
        <button className="btn btn-primary" onClick={handleNext}>
          Next: Find Your Committee →
        </button>
      </div>

      {/* Information Sections */}
      <div style={{ 
        marginTop: '2rem',
        padding: '1rem',
        background: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '6px',
        fontSize: '14px',
        color: '#6c757d'
      }}>
        <h3>🔄 What Happens Next</h3>
        <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.2rem' }}>
          <li><strong>Find Your FEC Committee:</strong> We'll search for your registered committee</li>
          <li><strong>Connect Bank Account:</strong> Secure connection via Plaid</li>
          <li><strong>Launch Your Form:</strong> Get your embed code and start collecting</li>
        </ul>
        
        <h3 style={{ marginTop: '1rem' }}>🔒 Privacy & Security</h3>
        <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.2rem' }}>
          <li><strong>Your information is encrypted</strong> and stored securely</li>
          <li><strong>FEC-compliant data handling</strong> with audit trails</li>
          <li><strong>You control your campaign data</strong> - export anytime</li>
        </ul>
        
        <h3 style={{ marginTop: '1rem' }}>📋 Requirements</h3>
        <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.2rem' }}>
          <li><strong>Valid FEC committee</strong> registration required</li>
          <li><strong>Campaign bank account</strong> for processing donations</li>
          <li><strong>Official campaign website</strong> (recommended)</li>
        </ul>
        
        <p style={{ marginTop: '1rem', textAlign: 'center', color: '#495057' }}>
          <strong>We'll guide you through the complete setup process.</strong><br/>
          This process takes about 5-10 minutes to complete.
        </p>
      </div>
    </div>
  );
};

export default Signup;
