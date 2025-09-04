import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const ProfileCompletion = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    phone: '',
    company: '',
    jobTitle: '',
    timezone: 'America/New_York',
    notificationPreferences: {
      email: true,
      sms: false,
    },
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { userProfile, updateProfile } = useAuth();

  useEffect(() => {
    // Pre-fill form if profile data exists
    if (userProfile) {
      setFormData((prev) => ({
        ...prev,
        phone: userProfile.phone || '',
        company: userProfile.company || '',
        jobTitle: userProfile.job_title || '',
        timezone: userProfile.timezone || 'America/New_York',
        notificationPreferences: userProfile.notification_preferences || {
          email: true,
          sms: false,
        },
      }));
    }
  }, [userProfile]);

  const validateForm = () => {
    const newErrors = {};

    // Phone validation (optional but if provided should be valid)
    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const updates = {
        phone: formData.phone || null,
        company: formData.company || null,
        job_title: formData.jobTitle || null,
        timezone: formData.timezone,
        notification_preferences: formData.notificationPreferences,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await updateProfile(updates);

      if (error) {
        setErrors({ submit: error.message });
        return;
      }

      // Success
      if (onComplete) {
        onComplete(data);
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      // Handle nested object fields like notificationPreferences.email
      const [parent, child] = field.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const timezones = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Phoenix', label: 'Arizona Time (MST)' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
  ];

  return (
    <div className="profile-completion-container">
      <div className="profile-card">
        <div className="profile-header">
          <h2>📝 Complete Your Profile</h2>
          <p>Help us personalize your experience by completing your profile</p>
          <div className="welcome-user">Welcome, {userProfile?.full_name}! 👋</div>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-section">
            <h3>Contact Information</h3>

            <div className="form-group">
              <label htmlFor="phone">Phone Number (Optional)</label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`form-input ${errors.phone ? 'error' : ''}`}
                placeholder="+1 (555) 123-4567"
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
              <small className="field-help">
                Used for SMS notifications and campaign communication
              </small>
            </div>
          </div>

          <div className="form-section">
            <h3>Professional Information</h3>

            <div className="form-group">
              <label htmlFor="company">Organization/Company (Optional)</label>
              <input
                id="company"
                type="text"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="form-input"
                placeholder="Your organization name"
              />
              <small className="field-help">Campaign organization or employer</small>
            </div>

            <div className="form-group">
              <label htmlFor="jobTitle">Job Title/Role (Optional)</label>
              <input
                id="jobTitle"
                type="text"
                value={formData.jobTitle}
                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                className="form-input"
                placeholder="Campaign Manager, Political Director, etc."
              />
              <small className="field-help">Your role in the campaign or organization</small>
            </div>
          </div>

          <div className="form-section">
            <h3>Preferences</h3>

            <div className="form-group">
              <label htmlFor="timezone">Time Zone</label>
              <select
                id="timezone"
                value={formData.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                className="form-input"
              >
                {timezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <small className="field-help">
                Used for scheduling and time-sensitive notifications
              </small>
            </div>

            <div className="form-group">
              <label>Notification Preferences</label>
              <div className="checkbox-group">
                <div className="checkbox-item">
                  <input
                    id="emailNotifications"
                    type="checkbox"
                    checked={formData.notificationPreferences.email}
                    onChange={(e) =>
                      handleInputChange('notificationPreferences.email', e.target.checked)
                    }
                  />
                  <label htmlFor="emailNotifications">Email notifications</label>
                </div>
                <div className="checkbox-item">
                  <input
                    id="smsNotifications"
                    type="checkbox"
                    checked={formData.notificationPreferences.sms}
                    onChange={(e) =>
                      handleInputChange('notificationPreferences.sms', e.target.checked)
                    }
                    disabled={!formData.phone}
                  />
                  <label htmlFor="smsNotifications">
                    SMS notifications {!formData.phone && '(phone number required)'}
                  </label>
                </div>
              </div>
              <small className="field-help">
                Choose how you'd like to receive updates and alerts
              </small>
            </div>
          </div>

          {errors.submit && <div className="error-banner">{errors.submit}</div>}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => onComplete && onComplete()}
            >
              Skip for Now
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Complete Profile'}
            </button>
          </div>
        </form>

        <div className="profile-notice">
          <h4>Why complete your profile?</h4>
          <ul>
            <li>📞 Enable SMS notifications for urgent campaign updates</li>
            <li>🕒 Get time-zone appropriate scheduling</li>
            <li>👥 Help team members identify your role</li>
            <li>📊 Receive personalized campaign insights</li>
          </ul>
          <p>
            <em>You can update this information anytime in your settings.</em>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletion;
