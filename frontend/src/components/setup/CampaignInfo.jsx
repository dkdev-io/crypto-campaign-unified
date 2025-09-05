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
      setValidationErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  return (
    <div>

      <div className="crypto-card" style={{ maxWidth: '500px', margin: '0 auto' }}>
        {/* Campaign Name */}
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'hsl(var(--crypto-white))',
              fontSize: '0.875rem',
              fontWeight: '600',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Campaign Name *
          </label>
          <div style={{ position: 'relative' }}>
            <Building2
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: '#a0a0a0',
              }}
            />
            <input
              className="form-input"
              style={{
                width: '100%',
                padding: '0.75rem 0.75rem 0.75rem 40px',
                border: validationErrors.campaignName
                  ? '1px solid hsl(var(--destructive))'
                  : '1px solid hsl(var(--crypto-blue) / 0.4)',
                borderRadius: 'var(--radius)',
                background: 'hsl(223 57% 25% / 0.5)',
                color: 'hsl(var(--crypto-white))',
                fontSize: '1rem',
                fontFamily: 'Inter, sans-serif',
                transition: 'var(--transition-smooth)',
              }}
              value={formData.campaignName || ''}
              onChange={(e) => handleChange('campaignName', e.target.value)}
              placeholder="Enter your campaign name"
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
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'hsl(var(--crypto-white))',
              fontSize: '0.875rem',
              fontWeight: '600',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Admin First Name *
          </label>
          <div style={{ position: 'relative' }}>
            <User
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: '#a0a0a0',
              }}
            />
            <input
              className="form-input"
              style={{
                width: '100%',
                padding: '0.75rem 0.75rem 0.75rem 40px',
                border: validationErrors.adminFirstName
                  ? '1px solid hsl(var(--destructive))'
                  : '1px solid hsl(var(--crypto-blue) / 0.4)',
                borderRadius: 'var(--radius)',
                background: 'hsl(223 57% 25% / 0.5)',
                color: 'hsl(var(--crypto-white))',
                fontSize: '1rem',
                fontFamily: 'Inter, sans-serif',
                transition: 'var(--transition-smooth)',
              }}
              value={formData.adminFirstName || ''}
              onChange={(e) => handleChange('adminFirstName', e.target.value)}
              placeholder="Enter first name"
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
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'hsl(var(--crypto-white))',
              fontSize: '0.875rem',
              fontWeight: '600',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Admin Last Name *
          </label>
          <div style={{ position: 'relative' }}>
            <User
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: '#a0a0a0',
              }}
            />
            <input
              className="form-input"
              style={{
                width: '100%',
                padding: '0.75rem 0.75rem 0.75rem 40px',
                border: validationErrors.adminLastName
                  ? '1px solid hsl(var(--destructive))'
                  : '1px solid hsl(var(--crypto-blue) / 0.4)',
                borderRadius: 'var(--radius)',
                background: 'hsl(223 57% 25% / 0.5)',
                color: 'hsl(var(--crypto-white))',
                fontSize: '1rem',
                fontFamily: 'Inter, sans-serif',
                transition: 'var(--transition-smooth)',
              }}
              value={formData.adminLastName || ''}
              onChange={(e) => handleChange('adminLastName', e.target.value)}
              placeholder="Enter last name"
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
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'hsl(var(--crypto-white))',
              fontSize: '0.875rem',
              fontWeight: '600',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Admin Email *
          </label>
          <div style={{ position: 'relative' }}>
            <Mail
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: '#a0a0a0',
              }}
            />
            <input
              className="form-input"
              type="email"
              style={{
                width: '100%',
                padding: '0.75rem 0.75rem 0.75rem 40px',
                border: validationErrors.adminEmail
                  ? '1px solid hsl(var(--destructive))'
                  : '1px solid hsl(var(--crypto-blue) / 0.4)',
                borderRadius: 'var(--radius)',
                background: 'hsl(223 57% 25% / 0.5)',
                color: 'hsl(var(--crypto-white))',
                fontSize: '1rem',
                fontFamily: 'Inter, sans-serif',
                transition: 'var(--transition-smooth)',
              }}
              value={formData.adminEmail || ''}
              onChange={(e) => handleChange('adminEmail', e.target.value)}
              placeholder="Enter email address"
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
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'hsl(var(--crypto-white))',
              fontSize: '0.875rem',
              fontWeight: '600',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Admin Phone *
          </label>
          <div style={{ position: 'relative' }}>
            <Phone
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: '#a0a0a0',
              }}
            />
            <input
              className="form-input"
              type="tel"
              style={{
                width: '100%',
                padding: '0.75rem 0.75rem 0.75rem 40px',
                border: validationErrors.adminPhone
                  ? '1px solid hsl(var(--destructive))'
                  : '1px solid hsl(var(--crypto-blue) / 0.4)',
                borderRadius: 'var(--radius)',
                background: 'hsl(223 57% 25% / 0.5)',
                color: 'hsl(var(--crypto-white))',
                fontSize: '1rem',
                fontFamily: 'Inter, sans-serif',
                transition: 'var(--transition-smooth)',
              }}
              value={formData.adminPhone || ''}
              onChange={(e) => handleChange('adminPhone', e.target.value)}
              placeholder="Enter phone number"
            />
          </div>
          {validationErrors.adminPhone && (
            <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>
              {validationErrors.adminPhone}
            </p>
          )}
        </div>

        <div
          className="form-actions"
          style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button
              className="btn btn-secondary"
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
              className="btn btn-primary"
              onClick={validateAndProceed}
              style={{
                padding: '0.75rem 2rem',
                borderRadius: 'var(--radius)',
                border: '2px solid hsl(var(--crypto-gold))',
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
              NEXT
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
    </div>
  );
};

export default CampaignInfo;
