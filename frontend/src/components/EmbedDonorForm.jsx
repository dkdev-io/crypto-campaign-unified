import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const EmbedDonorForm = ({ campaignId }) => {
  const [formData, setFormData] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [campaignData, setCampaignData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (campaignId) {
      loadCampaignData();
    } else {
      setLoading(false);
    }
  }, [campaignId]);

  const loadCampaignData = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) {
        console.error('Failed to load campaign:', error);
        setErrorMessage(`Unable to load campaign: ${error.message}`);
      } else if (!data) {
        setErrorMessage('Campaign not found. Please check the campaign ID.');
      } else {
        setCampaignData(data);
      }
    } catch (err) {
      console.error('Error loading campaign:', err);
      setErrorMessage('Unable to load campaign. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const effectiveCampaignId = campaignId || 'standalone-form';

      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        throw new Error('Please enter a valid contribution amount');
      }

      const { data, error } = await supabase.from('form_submissions').insert([
        {
          campaign_id: effectiveCampaignId,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone || '',
          address: formData.street,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip,
          employer: formData.employer,
          occupation: formData.occupation,
          amount: parseFloat(formData.amount),
          contributor_wallet: null,
          transaction_hash: null,
          payment_method: 'pending',
          is_us_citizen: true,
          is_prohibited_source: false,
          acknowledgment_signed: true,
        },
      ]);

      if (error) {
        throw new Error(error.message || 'Failed to save contribution');
      }

      setSubmitted(true);
    } catch (err) {
      setErrorMessage(
        err.message || 'An error occurred while processing your contribution. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading campaign...</div>;
  }

  if (errorMessage && !campaignData && campaignId) {
    return (
      <div style={styles.errorContainer}>
        <h3 style={styles.errorTitle}>Unable to Load Campaign</h3>
        <p style={styles.errorText}>{errorMessage}</p>
        <button style={styles.retryButton} onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={styles.successContainer}>
        <h2 style={styles.successTitle}>🎉 Thank You!</h2>
        <p style={styles.successText}>Your contribution has been submitted successfully.</p>
      </div>
    );
  }

  const campaignName = campaignData?.form_title || campaignData?.campaign_name || 'Support Our Campaign';
  const campaignDescription = campaignData?.form_description;
  const donateButtonText = campaignData?.donate_button_text || 'DONATE NOW';
  const logoImageUrl = campaignData?.logo_image_url;
  const suggestedAmounts = campaignData?.suggested_amounts || [25, 50, 100, 250];
  const maxDonation = campaignData?.max_donation_limit || 3300;

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        {/* Campaign Logo */}
        {logoImageUrl && (
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <img 
              src={logoImageUrl} 
              alt="Campaign Logo"
              style={{
                maxWidth: '120px',
                maxHeight: '80px',
                objectFit: 'contain',
              }}
            />
          </div>
        )}

        <h1 style={{...styles.title, textAlign: 'center'}}>{campaignName}</h1>

        {/* Campaign Description */}
        {campaignDescription && (
          <p style={{ 
            textAlign: 'center',
            marginBottom: '1.5rem',
            fontSize: '1rem',
            lineHeight: '1.5',
            color: '#666',
          }}>
            {campaignDescription}
          </p>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>First Name *</label>
              <input
                style={styles.input}
                required
                value={formData.firstName || ''}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Last Name *</label>
              <input
                style={styles.input}
                required
                value={formData.lastName || ''}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email *</label>
            <input
              type="email"
              style={styles.input}
              required
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Address *</label>
            <input
              placeholder="Street Address"
              style={{ ...styles.input, marginBottom: '8px' }}
              required
              value={formData.street || ''}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
            />
            <div style={styles.addressRow}>
              <input
                placeholder="City"
                style={{ ...styles.input, flex: '2' }}
                required
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
              <input
                placeholder="State"
                style={{ ...styles.input, flex: '1' }}
                required
                value={formData.state || ''}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
              <input
                placeholder="ZIP"
                style={{ ...styles.input, flex: '1' }}
                required
                value={formData.zip || ''}
                onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Employer *</label>
              <input
                style={styles.input}
                required
                value={formData.employer || ''}
                onChange={(e) => setFormData({ ...formData, employer: e.target.value })}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Occupation *</label>
              <input
                style={styles.input}
                required
                value={formData.occupation || ''}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Contribution Amount * (Max: ${maxDonation})</label>
            <div style={styles.amountButtons}>
              {suggestedAmounts.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setFormData({ ...formData, amount })}
                  style={{
                    ...styles.amountButton,
                    ...(formData.amount === amount ? styles.amountButtonActive : {}),
                  }}
                >
                  ${amount}
                </button>
              ))}
            </div>
            <input
              type="number"
              placeholder="Custom amount"
              min="1"
              max={maxDonation}
              style={styles.input}
              value={formData.amount || ''}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (value > maxDonation) {
                  setErrorMessage(`Maximum contribution is $${maxDonation}`);
                } else {
                  setErrorMessage('');
                  setFormData({ ...formData, amount: e.target.value });
                }
              }}
            />
          </div>

          <div style={styles.disclaimerBox}>
            <label style={styles.checkboxLabel}>
              <input type="checkbox" required style={styles.checkbox} />
              <span style={styles.disclaimerText}>
                I certify that I am a U.S. citizen or lawfully admitted permanent resident, this
                contribution is made from my own funds, I am not a federal contractor, and I am at
                least 18 years old.
              </span>
            </label>
          </div>

          {errorMessage && <div style={styles.errorBox}>⚠️ {errorMessage}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              ...styles.submitButton,
              ...(isSubmitting ? styles.submitButtonDisabled : {}),
            }}
          >
            {isSubmitting ? '⏳ Processing...' : donateButtonText}
          </button>
        </form>
      </div>
    </div>
  );
};

// Self-contained styles - no dependencies on external CSS
const styles = {
  container: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#ffffff',
    color: '#333333',
    lineHeight: '1.5',
    fontSize: '16px',
    boxSizing: 'border-box',
  },

  loading: {
    textAlign: 'center',
    padding: '40px 20px',
    fontSize: '18px',
    color: '#666666',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  errorContainer: {
    backgroundColor: '#ffebee',
    border: '1px solid #f44336',
    borderRadius: '8px',
    padding: '24px',
    textAlign: 'center',
    maxWidth: '500px',
    margin: '20px auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  errorTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#c62828',
    marginBottom: '12px',
    margin: '0 0 12px 0',
  },

  errorText: {
    fontSize: '16px',
    color: '#d32f2f',
    marginBottom: '16px',
    margin: '0 0 16px 0',
  },

  retryButton: {
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: 'inherit',
  },

  successContainer: {
    backgroundColor: '#e8f5e8',
    border: '1px solid #4caf50',
    borderRadius: '12px',
    padding: '32px',
    textAlign: 'center',
    maxWidth: '500px',
    margin: '20px auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  successTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: '16px',
    margin: '0 0 16px 0',
  },

  successText: {
    fontSize: '16px',
    color: '#388e3c',
    margin: '0',
  },

  formCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },

  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: '24px',
    textAlign: 'center',
    margin: '0 0 24px 0',
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },

  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },

  row: {
    display: 'flex',
    gap: '16px',
  },

  addressRow: {
    display: 'flex',
    gap: '12px',
  },

  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333333',
    marginBottom: '6px',
  },

  input: {
    padding: '12px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '16px',
    backgroundColor: '#ffffff',
    color: '#333333',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box',
  },

  amountButtons: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },

  amountButton: {
    padding: '10px 20px',
    border: '2px solid #1a237e',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    color: '#1a237e',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },

  amountButtonActive: {
    backgroundColor: '#1a237e',
    color: '#ffffff',
  },

  disclaimerBox: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #e9ecef',
    borderRadius: '8px',
    padding: '16px',
  },

  checkboxLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    cursor: 'pointer',
  },

  checkbox: {
    marginTop: '2px',
    width: '16px',
    height: '16px',
    accentColor: '#1a237e',
  },

  disclaimerText: {
    fontSize: '14px',
    color: '#555555',
    lineHeight: '1.4',
  },

  errorBox: {
    backgroundColor: '#ffebee',
    border: '1px solid #f44336',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#c62828',
    fontSize: '14px',
    fontWeight: '500',
  },

  submitButton: {
    backgroundColor: '#1a237e',
    color: '#ffffff',
    border: 'none',
    padding: '16px 32px',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },

  submitButtonDisabled: {
    backgroundColor: '#9e9e9e',
    cursor: 'not-allowed',
  },
};

// Add responsive styles
if (typeof window !== 'undefined' && window.innerWidth <= 768) {
  styles.container.padding = '16px';
  styles.formCard.padding = '24px';
  styles.row.flexDirection = 'column';
  styles.row.gap = '16px';
  styles.addressRow.flexWrap = 'wrap';
  styles.title.fontSize = '24px';
}

export default EmbedDonorForm;
