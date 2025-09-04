import React, { useState } from 'react';
import { Building2, User, Mail, Phone, AlertCircle } from 'lucide-react';

const CampaignInfo = ({ formData, updateFormData, onNext, onPrev }) => {
  const [validationErrors, setValidationErrors] = useState({});

  const validateAndProceed = () => {
    const errors = {};

    if (!formData.campaignName?.trim()) {
      errors.campaignName = 'Campaign name is required';
    }

    if (!formData.adminFirstName?.trim()) {
      errors.adminFirstName = 'Admin first name is required';
    }

    if (!formData.adminLastName?.trim()) {
      errors.adminLastName = 'Admin last name is required';
    }

    if (!formData.adminEmail?.trim()) {
      errors.adminEmail = 'Admin email is required';
    } else {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(formData.adminEmail.trim())) {
        errors.adminEmail = 'Please enter a valid email address';
      }
    }

    if (!formData.adminPhone?.trim()) {
      errors.adminPhone = 'Admin phone is required';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    onNext();
  };

  const handleChange = (field, value) => {
    updateFormData({ [field]: value });
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '2rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '2rem', color: 'white' }}>
        Campaign Setup
      </h2>
      <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#a0a0a0' }}>
        Step 1 of 8: Campaign Info
      </p>
      
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        {/* Campaign Name */}
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontSize: '14px', fontWeight: '500' }}>
            Campaign Name *
          </label>
          <div style={{ position: 'relative' }}>
            <Building2 style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#a0a0a0' }} />
            <input 
              className="form-input"
              style={{ 
                width: '100%', 
                padding: '12px 12px 12px 40px', 
                border: validationErrors.campaignName ? '1px solid #ef4444' : '1px solid #374151',
                borderRadius: '8px',
                background: '#1f2937',
                color: 'white',
                fontSize: '14px'
              }}
              value={formData.campaignName || ''}
              onChange={(e) => handleChange('campaignName', e.target.value)}
              placeholder=""
            />
          </div>
          {validationErrors.campaignName && (
            <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>
              {validationErrors.campaignName}
            </p>
          )}
        </div>

        {/* Admin First Name */}
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontSize: '14px', fontWeight: '500' }}>
            Admin First Name *
          </label>
          <div style={{ position: 'relative' }}>
            <User style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#a0a0a0' }} />
            <input 
              className="form-input"
              style={{ 
                width: '100%', 
                padding: '12px 12px 12px 40px', 
                border: validationErrors.adminFirstName ? '1px solid #ef4444' : '1px solid #374151',
                borderRadius: '8px',
                background: '#1f2937',
                color: 'white',
                fontSize: '14px'
              }}
              value={formData.adminFirstName || ''}
              onChange={(e) => handleChange('adminFirstName', e.target.value)}
              placeholder=""
            />
          </div>
          {validationErrors.adminFirstName && (
            <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>
              {validationErrors.adminFirstName}
            </p>
          )}
        </div>

        {/* Admin Last Name */}
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontSize: '14px', fontWeight: '500' }}>
            Admin Last Name *
          </label>
          <div style={{ position: 'relative' }}>
            <User style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#a0a0a0' }} />
            <input 
              className="form-input"
              style={{ 
                width: '100%', 
                padding: '12px 12px 12px 40px', 
                border: validationErrors.adminLastName ? '1px solid #ef4444' : '1px solid #374151',
                borderRadius: '8px',
                background: '#1f2937',
                color: 'white',
                fontSize: '14px'
              }}
              value={formData.adminLastName || ''}
              onChange={(e) => handleChange('adminLastName', e.target.value)}
              placeholder=""
            />
          </div>
          {validationErrors.adminLastName && (
            <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>
              {validationErrors.adminLastName}
            </p>
          )}
        </div>

        {/* Admin Email */}
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontSize: '14px', fontWeight: '500' }}>
            Admin Email *
          </label>
          <div style={{ position: 'relative' }}>
            <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#a0a0a0' }} />
            <input 
              className="form-input"
              type="email"
              style={{ 
                width: '100%', 
                padding: '12px 12px 12px 40px', 
                border: validationErrors.adminEmail ? '1px solid #ef4444' : '1px solid #374151',
                borderRadius: '8px',
                background: '#1f2937',
                color: 'white',
                fontSize: '14px'
              }}
              value={formData.adminEmail || ''}
              onChange={(e) => handleChange('adminEmail', e.target.value)}
              placeholder=""
            />
          </div>
          {validationErrors.adminEmail && (
            <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>
              {validationErrors.adminEmail}
            </p>
          )}
        </div>

        {/* Admin Phone */}
        <div className="form-group" style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontSize: '14px', fontWeight: '500' }}>
            Admin Phone *
          </label>
          <div style={{ position: 'relative' }}>
            <Phone style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#a0a0a0' }} />
            <input 
              className="form-input"
              type="tel"
              style={{ 
                width: '100%', 
                padding: '12px 12px 12px 40px', 
                border: validationErrors.adminPhone ? '1px solid #ef4444' : '1px solid #374151',
                borderRadius: '8px',
                background: '#1f2937',
                color: 'white',
                fontSize: '14px'
              }}
              value={formData.adminPhone || ''}
              onChange={(e) => handleChange('adminPhone', e.target.value)}
              placeholder=""
            />
          </div>
          {validationErrors.adminPhone && (
            <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>
              {validationErrors.adminPhone}
            </p>
          )}
        </div>

        <div className="form-actions" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
          <button 
            className="btn btn-secondary" 
            onClick={onPrev}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: '1px solid #fbbf24',
              background: '#fbbf24',
              color: '#000',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Back
          </button>
          <button 
            className="btn btn-primary" 
            onClick={validateAndProceed}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: '1px solid #1e40af',
              background: '#1e40af',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampaignInfo;
