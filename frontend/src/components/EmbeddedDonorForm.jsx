import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const EmbeddedDonorForm = ({ campaignId }) => {
  const [formData, setFormData] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [campaignData, setCampaignData] = useState(null);
  const [appliedStyles, setAppliedStyles] = useState(null);

  useEffect(() => {
    if (campaignId) {
      loadCampaignData();
    }
  }, [campaignId]);

  const loadCampaignData = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*, applied_styles')
        .eq('id', campaignId)
        .single();

      if (error) {
        console.error('Failed to load campaign:', error);
      } else {
        setCampaignData(data);
        if (data.applied_styles) {
          setAppliedStyles(data.applied_styles);
        }
      }
    } catch (err) {
      console.error('Error loading campaign:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      const effectiveCampaignId = campaignId || 'demo-campaign';
      
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        throw new Error('Please enter a valid contribution amount');
      }
      
      const { data, error } = await supabase
        .from('form_submissions')
        .insert([{
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
          acknowledgment_signed: true
        }]);

      if (error) {
        throw new Error(error.message || 'Failed to save contribution');
      }
      
      setSubmitted(true);
    } catch (err) {
      setErrorMessage(err.message || 'An error occurred while processing your contribution. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={styles.container}>
        <div style={styles.successCard}>
          <h2 style={styles.successTitle}>🎉 Thank You!</h2>
          <p style={styles.successText}>Your contribution has been submitted successfully.</p>
        </div>
      </div>
    );
  }

  const campaignName = campaignData?.campaign_name || 'Support Our Campaign';
  const suggestedAmounts = campaignData?.suggested_amounts || [25, 50, 100, 250];
  const maxDonation = campaignData?.max_donation_limit || 3300;

  // Get styled components based on applied styles
  const getStyledComponents = () => {
    if (!appliedStyles) return styles;

    const { colors, fonts } = appliedStyles;
    
    return {
      ...styles,
      container: {
        ...styles.container,
        fontFamily: fonts?.body?.family || styles.container.fontFamily,
        backgroundColor: colors?.background || styles.container.backgroundColor,
        color: colors?.text || styles.container.color,
      },
      title: {
        ...styles.title,
        fontFamily: fonts?.heading?.family || styles.title.fontFamily,
        fontWeight: fonts?.heading?.weight || styles.title.fontWeight,
        color: colors?.primary || styles.title.color,
      },
      label: {
        ...styles.label,
        fontFamily: fonts?.body?.family || styles.label.fontFamily,
        color: colors?.text || styles.label.color,
      },
      input: {
        ...styles.input,
        fontFamily: fonts?.body?.family || styles.input.fontFamily,
        borderColor: colors?.secondary || '#e0e0e0',
        backgroundColor: colors?.background || styles.input.backgroundColor,
        color: colors?.text || styles.input.color,
      },
      amountButton: {
        ...styles.amountButton,
        fontFamily: fonts?.button?.family || styles.amountButton.fontFamily,
        borderColor: colors?.primary || styles.amountButton.borderColor,
        color: colors?.primary || styles.amountButton.color,
      },
      amountButtonActive: {
        ...styles.amountButtonActive,
        backgroundColor: colors?.primary || styles.amountButtonActive.backgroundColor,
        color: colors?.background || styles.amountButtonActive.color,
      },
      submitButton: {
        ...styles.submitButton,
        fontFamily: fonts?.button?.family || styles.submitButton.fontFamily,
        fontWeight: fonts?.button?.weight || styles.submitButton.fontWeight,
        backgroundColor: colors?.primary || styles.submitButton.backgroundColor,
        color: colors?.background || styles.submitButton.color,
      }
    };
  };

  const dynamicStyles = getStyledComponents();

  return (
    <div style={dynamicStyles.container}>
      <div style={dynamicStyles.formCard}>
        <h1 style={dynamicStyles.title}>{campaignName}</h1>
        
        <form onSubmit={handleSubmit} style={dynamicStyles.form}>
          <div style={dynamicStyles.row}>
            <div style={dynamicStyles.halfField}>
              <label style={dynamicStyles.label}>First Name *</label>
              <input 
                style={dynamicStyles.input}
                required
                value={formData.firstName || ''}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              />
            </div>
            <div style={dynamicStyles.halfField}>
              <label style={dynamicStyles.label}>Last Name *</label>
              <input 
                style={dynamicStyles.input}
                required
                value={formData.lastName || ''}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              />
            </div>
          </div>

          <div style={dynamicStyles.field}>
            <label style={styles.label}>Email *</label>
            <input 
              type="email"
              style={dynamicStyles.input}
              required
              value={formData.email || ''}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div style={dynamicStyles.field}>
            <label style={styles.label}>Address *</label>
            <input 
              placeholder="Street Address"
              style={dynamicStyles.input}
              required
              value={formData.street || ''}
              onChange={(e) => setFormData({...formData, street: e.target.value})}
            />
            <div style={dynamicStyles.addressRow}>
              <input 
                placeholder="City"
                style={{...dynamicStyles.input, ...dynamicStyles.cityInput}}
                required
                value={formData.city || ''}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
              />
              <input 
                placeholder="State"
                style={{...dynamicStyles.input, ...dynamicStyles.stateInput}}
                required
                value={formData.state || ''}
                onChange={(e) => setFormData({...formData, state: e.target.value})}
              />
              <input 
                placeholder="ZIP"
                style={{...dynamicStyles.input, ...dynamicStyles.zipInput}}
                required
                value={formData.zip || ''}
                onChange={(e) => setFormData({...formData, zip: e.target.value})}
              />
            </div>
          </div>

          <div style={dynamicStyles.row}>
            <div style={dynamicStyles.halfField}>
              <label style={dynamicStyles.label}>Employer *</label>
              <input 
                style={dynamicStyles.input}
                required
                value={formData.employer || ''}
                onChange={(e) => setFormData({...formData, employer: e.target.value})}
              />
            </div>
            <div style={dynamicStyles.halfField}>
              <label style={dynamicStyles.label}>Occupation *</label>
              <input 
                style={dynamicStyles.input}
                required
                value={formData.occupation || ''}
                onChange={(e) => setFormData({...formData, occupation: e.target.value})}
              />
            </div>
          </div>

          <div style={dynamicStyles.field}>
            <label style={dynamicStyles.label}>Contribution Amount * (Max: ${maxDonation})</label>
            <div style={dynamicStyles.amountButtons}>
              {suggestedAmounts.map(amount => (
                <button 
                  key={amount}
                  type="button"
                  onClick={() => setFormData({...formData, amount})}
                  style={{
                    ...dynamicStyles.amountButton,
                    ...(formData.amount === amount ? dynamicStyles.amountButtonActive : {})
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
              style={dynamicStyles.input}
              value={formData.amount || ''}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (value > maxDonation) {
                  setErrorMessage(`Maximum contribution is $${maxDonation}`);
                } else {
                  setErrorMessage('');
                  setFormData({...formData, amount: e.target.value});
                }
              }}
            />
          </div>

          <div style={dynamicStyles.disclaimerBox}>
            <label style={dynamicStyles.checkboxLabel}>
              <input 
                type="checkbox"
                required
                style={dynamicStyles.checkbox}
              />
              <span style={dynamicStyles.disclaimerText}>
                I certify that I am a U.S. citizen or lawfully admitted permanent resident, 
                this contribution is made from my own funds, I am not a federal contractor, 
                and I am at least 18 years old.
              </span>
            </label>
          </div>

          {errorMessage && (
            <div style={dynamicStyles.errorBox}>
              ⚠️ {errorMessage}
            </div>
          )}
          
          <button 
            type="submit"
            disabled={isSubmitting}
            style={{
              ...dynamicStyles.submitButton,
              ...(isSubmitting ? dynamicStyles.submitButtonDisabled : {})
            }}
          >
            {isSubmitting ? '⏳ Processing...' : '💝 Contribute Now'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#ffffff',
    color: '#333333',
    lineHeight: '1.5',
    fontSize: '16px',
  },
  
  formCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  },
  
  successCard: {
    backgroundColor: '#f0f9f0',
    border: '1px solid #4caf50',
    borderRadius: '12px',
    padding: '32px',
    textAlign: 'center',
  },
  
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: '24px',
    textAlign: 'center',
    margin: '0 0 24px 0',
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
    color: '#4caf50',
    margin: '0',
  },
  
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  
  field: {
    display: 'flex',
    flexDirection: 'column',
  },
  
  row: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  
  halfField: {
    flex: '1',
    minWidth: '200px',
    display: 'flex',
    flexDirection: 'column',
  },
  
  addressRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
    flexWrap: 'wrap',
  },
  
  cityInput: {
    flex: '2',
    minWidth: '120px',
  },
  
  stateInput: {
    flex: '1',
    minWidth: '60px',
  },
  
  zipInput: {
    flex: '1',
    minWidth: '80px',
  },
  
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333333',
    marginBottom: '6px',
    display: 'block',
  },
  
  input: {
    padding: '12px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '16px',
    backgroundColor: '#ffffff',
    color: '#333333',
    transition: 'border-color 0.2s ease',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
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
    textAlign: 'center',
  },
  
  submitButtonDisabled: {
    backgroundColor: '#9e9e9e',
    cursor: 'not-allowed',
  },
};

export default EmbeddedDonorForm;