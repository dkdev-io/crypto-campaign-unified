import React, { useState } from 'react';

const StylePreferences = ({ formData, updateFormData, onNext, onPrev }) => {
  const [formTitle, setFormTitle] = useState(formData.formTitle || formData.campaignName || 'Campaign Title');
  const [formDescription, setFormDescription] = useState(formData.formDescription || 'Support our campaign with your contribution');
  const [donateButtonText, setDonateButtonText] = useState(formData.donateButtonText || 'DONATE NOW');
  const [amountMode, setAmountMode] = useState(formData.amountMode || 'defaults');
  const [customAmounts, setCustomAmounts] = useState(formData.customAmounts || '');
  const [applying, setApplying] = useState(false);

  // Default suggested amounts
  const defaultAmounts = [10, 25, 50, 100, 250, 500, 1000, 2000, 3300];

  // Get colors and font from previous step (WebsiteStyleAnalyzer)
  const selectedColors = {
    primary: formData.primaryColor || '#2a2a72',
    secondary: formData.secondaryColor || '#ffd700',
  };
  
  const selectedFont = formData.selectedFont || 'Inter';

  const parseSuggestedAmounts = () => {
    if (amountMode === 'defaults') {
      return defaultAmounts;
    } else {
      // Parse custom amounts from comma-separated string
      const amounts = customAmounts
        .split(',')
        .map(amount => parseFloat(amount.trim()))
        .filter(amount => !isNaN(amount) && amount > 0)
        .sort((a, b) => a - b);
      
      return amounts.length > 0 ? amounts : defaultAmounts;
    }
  };

  const handleSubmit = async () => {
    try {
      setApplying(true);

      const suggestedAmounts = parseSuggestedAmounts();

      // Update form data with form customization
      await updateFormData({
        formTitle,
        formDescription,
        donateButtonText,
        amountMode,
        customAmounts,
        suggestedAmounts,
        stylesApplied: true,
        setupStep: 5,
      });

      // Continue to next step
      onNext();
    } catch (error) {
      console.error('Failed to save form preferences:', error);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div>
      <div className="crypto-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h3 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          textAlign: 'center',
          marginBottom: '2rem',
          color: 'hsl(var(--crypto-white))',
          fontFamily: 'Inter, sans-serif',
        }}>
          Customize Your Form Content
        </h3>

        {/* Form Content Fields */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: 'hsl(var(--crypto-white))',
            fontSize: '0.875rem',
            fontWeight: '600',
            fontFamily: 'Inter, sans-serif',
          }}>
            Campaign Title
          </label>
          <input
            type="text"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 'var(--radius)',
              border: '1px solid hsl(var(--crypto-blue) / 0.4)',
              background: 'hsl(223 57% 25% / 0.5)',
              color: 'hsl(var(--crypto-white))',
              fontSize: '1rem',
              fontFamily: 'Inter, sans-serif',
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: 'hsl(var(--crypto-white))',
            fontSize: '0.875rem',
            fontWeight: '600',
            fontFamily: 'Inter, sans-serif',
          }}>
            Form Description
          </label>
          <textarea
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 'var(--radius)',
              border: '1px solid hsl(var(--crypto-blue) / 0.4)',
              background: 'hsl(223 57% 25% / 0.5)',
              color: 'hsl(var(--crypto-white))',
              fontSize: '1rem',
              fontFamily: 'Inter, sans-serif',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: 'hsl(var(--crypto-white))',
            fontSize: '0.875rem',
            fontWeight: '600',
            fontFamily: 'Inter, sans-serif',
          }}>
            Donate Button Text
          </label>
          <input
            type="text"
            value={donateButtonText}
            onChange={(e) => setDonateButtonText(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 'var(--radius)',
              border: '1px solid hsl(var(--crypto-blue) / 0.4)',
              background: 'hsl(223 57% 25% / 0.5)',
              color: 'hsl(var(--crypto-white))',
              fontSize: '1rem',
              fontFamily: 'Inter, sans-serif',
            }}
          />
        </div>

        {/* Suggested Amounts */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: 'hsl(var(--crypto-white))',
            fontSize: '0.875rem',
            fontWeight: '600',
            fontFamily: 'Inter, sans-serif',
          }}>
            Suggested Donation Amounts
          </label>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              marginBottom: '0.75rem',
              cursor: 'pointer',
            }}>
              <input
                type="radio"
                name="amountMode"
                value="defaults"
                checked={amountMode === 'defaults'}
                onChange={(e) => setAmountMode(e.target.value)}
                style={{ margin: 0 }}
              />
              <span style={{
                color: 'hsl(var(--crypto-white))',
                fontSize: '0.875rem',
                fontFamily: 'Inter, sans-serif',
              }}>
                Use default amounts
              </span>
            </label>
            <div style={{
              marginLeft: '1.5rem',
              marginBottom: '0.75rem',
              color: 'hsl(var(--crypto-white) / 0.7)',
              fontSize: '0.8rem',
              fontFamily: 'Inter, sans-serif',
            }}>
              ${defaultAmounts.join(', $')}
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              marginBottom: '0.75rem',
              cursor: 'pointer',
            }}>
              <input
                type="radio"
                name="amountMode"
                value="custom"
                checked={amountMode === 'custom'}
                onChange={(e) => setAmountMode(e.target.value)}
                style={{ margin: 0 }}
              />
              <span style={{
                color: 'hsl(var(--crypto-white))',
                fontSize: '0.875rem',
                fontFamily: 'Inter, sans-serif',
              }}>
                Enter custom amounts
              </span>
            </label>
            
            {amountMode === 'custom' && (
              <div style={{ marginLeft: '1.5rem' }}>
                <input
                  type="text"
                  value={customAmounts}
                  onChange={(e) => setCustomAmounts(e.target.value)}
                  placeholder="25, 50, 100, 250, 500"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius)',
                    border: '1px solid hsl(var(--crypto-blue) / 0.4)',
                    background: 'hsl(223 57% 25% / 0.5)',
                    color: 'hsl(var(--crypto-white))',
                    fontSize: '1rem',
                    fontFamily: 'Inter, sans-serif',
                  }}
                />
                <p style={{
                  marginTop: '0.5rem',
                  color: 'hsl(var(--crypto-white) / 0.7)',
                  fontSize: '0.75rem',
                  fontFamily: 'Inter, sans-serif',
                }}>
                  Enter amounts separated by commas (e.g., 25, 50, 100, 250)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Form Preview */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{
            color: 'hsl(var(--crypto-white))',
            marginBottom: '1rem',
            fontSize: '1.125rem',
            fontWeight: '600',
            fontFamily: 'Inter, sans-serif',
          }}>
            Preview Your Donation Form
          </h4>
          
          <div style={{
            background: '#ffffff',
            color: '#333333',
            padding: '2rem',
            borderRadius: 'var(--radius)',
            border: `1px solid ${selectedColors.secondary}`,
            textAlign: 'center',
          }}>
            {/* Logo display area */}
            {formData.logoImage && (
              <div style={{
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'center',
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: selectedColors.secondary,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  fontFamily: selectedFont,
                }}>
                  LOGO
                </div>
              </div>
            )}

            <h4 style={{
              fontFamily: selectedFont,
              fontWeight: '600',
              color: selectedColors.primary,
              marginBottom: '1rem',
              fontSize: '1.5rem',
              textAlign: 'center',
              width: '100%',
            }}>
              {formTitle || 'Campaign Title'}
            </h4>
            <p style={{
              fontFamily: selectedFont,
              fontWeight: '400',
              marginBottom: '2rem',
              textAlign: 'center',
              lineHeight: '1.5',
              width: '100%',
            }}>
              {formDescription || 'Support our campaign with your contribution'}
            </p>
            
            {/* Suggested Amounts Preview */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.75rem',
                marginBottom: '1rem',
                maxWidth: '350px',
                margin: '0 auto 1rem auto',
              }}>
                {parseSuggestedAmounts().slice(0, 8).map((amount, index) => (
                  <button
                    key={index}
                    style={{
                      fontFamily: selectedFont,
                      background: selectedColors.secondary,
                      color: '#ffffff',
                      border: `2px solid ${selectedColors.secondary}`,
                      padding: '0.75rem',
                      borderRadius: 'var(--radius)',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      width: '75px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ${amount}
                  </button>
                ))}
                
                {/* Fill remaining grid spots if needed */}
                {parseSuggestedAmounts().length < 8 && 
                  Array.from({ length: 8 - parseSuggestedAmounts().length }, (_, index) => (
                    <div key={`empty-${index}`} style={{ width: '75px', height: '40px' }} />
                  ))
                }
              </div>
              
              {/* Other Amount Option */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.75rem',
                marginTop: '1rem',
              }}>
                <button
                  style={{
                    fontFamily: selectedFont,
                    background: 'transparent',
                    color: selectedColors.primary,
                    border: `2px solid ${selectedColors.primary}`,
                    padding: '0.75rem',
                    borderRadius: 'var(--radius)',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    width: '75px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  Other
                </button>
                <input
                  type="number"
                  placeholder="$"
                  style={{
                    fontFamily: selectedFont,
                    width: '75px',
                    height: '40px',
                    padding: '0.5rem',
                    border: `2px solid ${selectedColors.secondary}`,
                    borderRadius: 'var(--radius)',
                    fontSize: '0.9rem',
                    textAlign: 'center',
                    background: '#f9f9f9',
                  }}
                />
              </div>
            </div>

            <button style={{
              fontFamily: selectedFont,
              fontWeight: '600',
              background: selectedColors.primary,
              color: '#ffffff',
              padding: '1rem 3rem',
              border: `2px solid ${selectedColors.primary}`,
              borderRadius: 'var(--radius)',
              fontSize: '1.1rem',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginTop: '1rem',
            }}>
              {donateButtonText}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation with consistent button styling */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: '2rem' 
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button
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
            onClick={handleSubmit}
            disabled={applying}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: 'var(--radius)',
              border: '2px solid hsl(var(--crypto-gold))',
              background: 'hsl(var(--crypto-gold))',
              color: 'hsl(var(--crypto-navy))',
              fontSize: '1rem',
              fontWeight: '700',
              fontFamily: 'Inter, sans-serif',
              cursor: applying ? 'wait' : 'pointer',
              transition: 'var(--transition-smooth)',
              textTransform: 'uppercase',
              letterSpacing: '0.025em',
              opacity: applying ? 0.7 : 1,
            }}
          >
            {applying ? 'APPLYING...' : 'NEXT'}
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
  );
};

export default StylePreferences;