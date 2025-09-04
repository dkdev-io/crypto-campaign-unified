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
      <h2 style={{ fontSize: 'var(--text-heading-xl)', fontWeight: '800', textAlign: 'center', marginBottom: '2rem', color: 'hsl(var(--crypto-white))', fontFamily: 'Inter, sans-serif' }}>
        Campaign Setup
      </h2>
      <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'hsl(var(--crypto-white) / 0.9)', fontSize: 'var(--text-body-lg)' }}>
        Step 1 of 8: Campaign Info
      </p>
      
      <div className="crypto-card" style={{ maxWidth: '500px', margin: '0 auto' }}>
        {/* Campaign Name */}
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'hsl(var(--crypto-white))', fontSize: 'var(--text-body-sm)', fontWeight: '500', fontFamily: 'Inter, sans-serif' }}>
            Campaign Name *
          </label>
          <div style={{ position: 'relative' }}>
            <Building2 style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#a0a0a0' }} />
            <input 
              className="form-input"
              style={{ 
                width: '100%', 
                padding: 'var(--space-sm) var(--space-sm) var(--space-sm) 40px', 
                border: validationErrors.campaignName ? '1px solid hsl(var(--destructive))' : '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
                background: 'hsl(var(--input))',
                color: 'hsl(var(--foreground))',
                fontSize: 'var(--text-body-sm)',
                fontFamily: 'Inter, sans-serif'
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
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'hsl(var(--crypto-white))', fontSize: 'var(--text-body-sm)', fontWeight: '500', fontFamily: 'Inter, sans-serif' }}>
            Admin First Name *
          </label>
          <div style={{ position: 'relative' }}>
            <User style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#a0a0a0' }} />
            <input 
              className="form-input"
              style={{ 
                width: '100%', 
                padding: 'var(--space-sm) var(--space-sm) var(--space-sm) 40px', 
                border: validationErrors.adminFirstName ? '1px solid hsl(var(--destructive))' : '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
                background: 'hsl(var(--input))',
                color: 'hsl(var(--foreground))',
                fontSize: 'var(--text-body-sm)',
                fontFamily: 'Inter, sans-serif'
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
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'hsl(var(--crypto-white))', fontSize: 'var(--text-body-sm)', fontWeight: '500', fontFamily: 'Inter, sans-serif' }}>
            Admin Last Name *
          </label>
          <div style={{ position: 'relative' }}>
            <User style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#a0a0a0' }} />
            <input 
              className="form-input"
              style={{ 
                width: '100%', 
                padding: 'var(--space-sm) var(--space-sm) var(--space-sm) 40px', 
                border: validationErrors.adminLastName ? '1px solid hsl(var(--destructive))' : '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
                background: 'hsl(var(--input))',
                color: 'hsl(var(--foreground))',
                fontSize: 'var(--text-body-sm)',
                fontFamily: 'Inter, sans-serif'
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
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'hsl(var(--crypto-white))', fontSize: 'var(--text-body-sm)', fontWeight: '500', fontFamily: 'Inter, sans-serif' }}>
            Admin Email *
          </label>
          <div style={{ position: 'relative' }}>
            <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#a0a0a0' }} />
            <input 
              className="form-input"
              type="email"
              style={{ 
                width: '100%', 
                padding: 'var(--space-sm) var(--space-sm) var(--space-sm) 40px', 
                border: validationErrors.adminEmail ? '1px solid hsl(var(--destructive))' : '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
                background: 'hsl(var(--input))',
                color: 'hsl(var(--foreground))',
                fontSize: 'var(--text-body-sm)',
                fontFamily: 'Inter, sans-serif'
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
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'hsl(var(--crypto-white))', fontSize: 'var(--text-body-sm)', fontWeight: '500', fontFamily: 'Inter, sans-serif' }}>
            Admin Phone *
          </label>
          <div style={{ position: 'relative' }}>
            <Phone style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#a0a0a0' }} />
            <input 
              className="form-input"
              type="tel"
              style={{ 
                width: '100%', 
                padding: 'var(--space-sm) var(--space-sm) var(--space-sm) 40px', 
                border: validationErrors.adminPhone ? '1px solid hsl(var(--destructive))' : '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
                background: 'hsl(var(--input))',
                color: 'hsl(var(--foreground))',
                fontSize: 'var(--text-body-sm)',
                fontFamily: 'Inter, sans-serif'
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
              padding: 'var(--space-sm) var(--space-lg)',
              borderRadius: 'var(--radius)',
              border: 'none',
              background: 'hsl(var(--crypto-gold))',
              color: 'hsl(var(--crypto-navy))',
              fontSize: 'var(--text-body)',
              fontWeight: '600',
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)'
            }}
          >
            Back
          </button>
          <button 
            className="btn btn-primary" 
            onClick={validateAndProceed}
            style={{
              padding: 'var(--space-sm) var(--space-lg)',
              borderRadius: 'var(--radius)',
              border: 'none',
              background: 'hsl(var(--crypto-navy))',
              color: 'hsl(var(--crypto-white))',
              fontSize: 'var(--text-body)',
              fontWeight: '600',
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)'
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
