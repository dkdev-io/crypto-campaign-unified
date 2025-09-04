import React, { useState, useEffect } from 'react';

const StylePreferences = ({ formData, updateFormData, onNext, onPrev }) => {
  const [selectedColors, setSelectedColors] = useState({
    primary: '#2a2a72',
    secondary: '#4a4a95',
    accent: '#28a745',
    background: '#ffffff',
    text: '#333333'
  });
  
  const [selectedFonts, setSelectedFonts] = useState({
    heading: { family: 'Arial, sans-serif', weight: '600' },
    body: { family: 'Arial, sans-serif', weight: '400' },
    button: { family: 'Arial, sans-serif', weight: '500' }
  });

  const [applying, setApplying] = useState(false);

  // Font options
  const fontOptions = [
    'Arial, sans-serif',
    'Helvetica, sans-serif', 
    'Georgia, serif',
    'Times New Roman, serif',
    'Verdana, sans-serif',
    'Trebuchet MS, sans-serif',
    'Impact, sans-serif',
    'Courier New, monospace',
    'Roboto, sans-serif',
    'Open Sans, sans-serif',
    'Lato, sans-serif',
    'Montserrat, sans-serif',
    'Poppins, sans-serif',
    'Source Sans Pro, sans-serif'
  ];

  // Initialize from existing applied styles if available
  useEffect(() => {
    if (formData.appliedStyles?.colors) {
      setSelectedColors(formData.appliedStyles.colors);
    }
    if (formData.appliedStyles?.fonts) {
      setSelectedFonts(formData.appliedStyles.fonts);
    }
  }, [formData]);

  const handleColorChange = (category, color) => {
    setSelectedColors(prev => ({
      ...prev,
      [category]: color
    }));
  };

  const handleFontChange = (category, family) => {
    setSelectedFonts(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        family: family,
        suggested: family
      }
    }));
  };

  const applyStyles = async () => {
    try {
      setApplying(true);

      const finalStyles = {
        colors: selectedColors,
        fonts: selectedFonts,
        appliedAt: new Date().toISOString(),
        method: 'manual_input'
      };

      // Update form data with selected styles
      await updateFormData({
        appliedStyles: finalStyles,
        stylesApplied: true,
        themeColor: selectedColors.primary,
        customColors: selectedColors,
        customFonts: selectedFonts,
        styleMethod: 'manual'
      });

      // Continue to next step
      onNext();

    } catch (error) {
      console.error('Failed to apply styles:', error);
      alert('Failed to apply styles. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  const skipStyles = () => {
    updateFormData({
      stylesApplied: false,
      styleApplicationSkipped: true
    });
    onNext();
  };

  // Render form preview
  const renderFormPreview = () => {
    const previewStyles = {
      backgroundColor: selectedColors.background,
      color: selectedColors.text,
      fontFamily: selectedFonts.body.family,
      padding: '2rem',
      borderRadius: '8px',
      border: '1px solid #e9ecef'
    };

    const buttonStyles = {
      backgroundColor: selectedColors.primary,
      color: 'white',
      border: 'none',
      padding: '0.75rem 2rem',
      borderRadius: '4px',
      fontFamily: selectedFonts.button.family,
      fontWeight: selectedFonts.button.weight,
      fontSize: '1rem',
      cursor: 'pointer'
    };

    const headingStyles = {
      fontFamily: selectedFonts.heading.family,
      fontWeight: selectedFonts.heading.weight,
      fontSize: '1.5rem',
      color: selectedColors.primary,
      marginBottom: '1rem'
    };

    return (
      <div style={{
        background: 'white',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h4 style={{ color: '#495057', marginTop: 0 }}>
          👁️ Preview Your Donation Form
        </h4>
        
        <div style={previewStyles}>
          <h3 style={headingStyles}>
            {formData.campaignName || 'Support Our Campaign'}
          </h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '500',
              fontFamily: selectedFonts.body.family,
              color: selectedColors.text
            }}>
              Donation Amount
            </label>
            <input 
              type="text" 
              placeholder="$100" 
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${selectedColors.secondary}`,
                borderRadius: '4px',
                fontFamily: selectedFonts.body.family,
                fontSize: '1rem'
              }}
              readOnly
            />
          </div>
          <button style={buttonStyles}>
            Donate Now
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <h2 style={{ color: '#2a2a72', textAlign: 'center', marginBottom: '1rem' }}>
        🎨 Customize Your Form Style - Step 4.5
      </h2>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>
        Choose colors and fonts for your donation form
      </p>

      {/* Color Palette Section */}
      <div style={{
        background: 'white',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h4 style={{ color: '#495057', marginTop: 0 }}>
          🎨 Color Palette
        </h4>

        <div style={{ marginBottom: '2rem' }}>
          {[
            { key: 'primary', label: 'Primary Brand Color', description: 'Main color for buttons and highlights' },
            { key: 'secondary', label: 'Secondary Color', description: 'Supporting color for borders and accents' },
            { key: 'accent', label: 'Accent Color', description: 'Call-to-action highlights' },
            { key: 'background', label: 'Background Color', description: 'Form background color' },
            { key: 'text', label: 'Text Color', description: 'Main text color' }
          ].map(({ key, label, description }) => (
            <div key={key} style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                fontWeight: '500', 
                marginBottom: '0.5rem',
                color: '#495057'
              }}>
                {label}
              </label>
              <p style={{ fontSize: '0.85rem', color: '#6c757d', margin: '0 0 0.75rem 0' }}>
                {description}
              </p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input
                  type="color"
                  value={selectedColors[key]}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  style={{
                    width: '60px',
                    height: '40px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                />
                <input
                  type="text"
                  value={selectedColors[key]}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    width: '100px'
                  }}
                />
                <div style={{
                  width: '30px',
                  height: '30px',
                  backgroundColor: selectedColors[key],
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Typography Section */}
      <div style={{
        background: 'white',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h4 style={{ color: '#495057', marginTop: 0 }}>
          🔤 Typography
        </h4>

        <div style={{ marginBottom: '1rem' }}>
          {[
            { key: 'heading', label: 'Headings', description: 'For titles and section headers', sample: 'Campaign Title' },
            { key: 'body', label: 'Body Text', description: 'For form labels and descriptions', sample: 'Enter your information below' },
            { key: 'button', label: 'Buttons', description: 'For button text and CTAs', sample: 'DONATE NOW' }
          ].map(({ key, label, description, sample }) => (
            <div key={key} style={{ marginBottom: '2rem' }}>
              <label style={{ 
                display: 'block', 
                fontWeight: '500', 
                marginBottom: '0.5rem',
                color: '#495057'
              }}>
                {label}
              </label>
              <p style={{ fontSize: '0.85rem', color: '#6c757d', margin: '0 0 0.75rem 0' }}>
                {description}
              </p>

              <select
                value={selectedFonts[key].family}
                onChange={(e) => handleFontChange(key, e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontFamily: selectedFonts[key].family,
                  marginBottom: '0.75rem'
                }}
              >
                {fontOptions.map(font => (
                  <option key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </option>
                ))}
              </select>

              {/* Font preview */}
              <div style={{
                background: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: '4px',
                padding: '1rem'
              }}>
                <div
                  style={{
                    fontFamily: selectedFonts[key].family,
                    fontSize: key === 'heading' ? '1.5rem' : '1rem',
                    fontWeight: selectedFonts[key].weight,
                    color: selectedColors.text
                  }}
                >
                  {sample}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form Preview */}
      {renderFormPreview()}

      {/* Action Buttons */}
      <div style={{
        background: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h4 style={{ color: '#495057', marginTop: 0 }}>
          Ready to Apply These Styles?
        </h4>
        <p style={{ color: '#6c757d', marginBottom: '2rem' }}>
          Your form will be updated with the selected colors and fonts
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={applyStyles}
            disabled={applying}
            style={{
              background: applying ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '6px',
              cursor: applying ? 'not-allowed' : 'pointer',
              fontSize: '1.1rem',
              fontWeight: '500',
              opacity: applying ? 0.7 : 1
            }}
          >
            {applying ? '⏳ Applying Styles...' : '✨ Apply These Styles'}
          </button>

          <button
            onClick={skipStyles}
            disabled={applying}
            style={{
              background: 'transparent',
              color: '#6c757d',
              border: '1px solid #6c757d',
              padding: '1rem 2rem',
              borderRadius: '6px',
              cursor: applying ? 'not-allowed' : 'pointer',
              fontSize: '1.1rem',
              opacity: applying ? 0.7 : 1
            }}
          >
            Skip Styling
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="form-actions" style={{ marginTop: '2rem' }}>
        <button 
          className="btn btn-secondary" 
          onClick={onPrev}
          disabled={applying}
        >
          ← Back
        </button>
      </div>
    </div>
  );
};

export default StylePreferences;