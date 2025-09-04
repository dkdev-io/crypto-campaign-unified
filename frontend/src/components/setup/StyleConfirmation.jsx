/**
 * Style Confirmation Screen Component
 * Shows extracted styles with visual previews and allows users to approve/customize them
 */

import React, { useState, useEffect } from 'react';

const StyleConfirmation = ({ formData, updateFormData, onNext, onPrev }) => {
  const [selectedColors, setSelectedColors] = useState({});
  const [selectedFonts, setSelectedFonts] = useState({});
  const [customizations, setCustomizations] = useState({});
  const [previewMode, setPreviewMode] = useState('split'); // 'split', 'original', 'styled'
  const [applying, setApplying] = useState(false);

  const analysis = formData.styleAnalysis;

  useEffect(() => {
    if (analysis) {
      // Initialize selected styles with extracted values
      const initialColors = {};
      const initialFonts = {};

      // Set up initial color selections
      if (analysis.colors) {
        initialColors.primary = analysis.colors.primary;
        initialColors.secondary = analysis.colors.secondary;
        initialColors.accent = analysis.colors.accent;
        initialColors.background = analysis.colors.background;
        initialColors.text = analysis.colors.text;
      }

      // Set up initial font selections
      if (analysis.fonts && analysis.fonts.recommendations) {
        initialFonts.heading = analysis.fonts.recommendations.heading;
        initialFonts.body = analysis.fonts.recommendations.body;
        initialFonts.button = analysis.fonts.recommendations.button;
      }

      setSelectedColors(initialColors);
      setSelectedFonts(initialFonts);
    }
  }, [analysis]);

  if (!analysis) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>No style analysis found. Please go back and analyze a website first.</p>
        <button className="btn btn-secondary" onClick={onPrev}>
          ← Back to Website Analysis
        </button>
      </div>
    );
  }

  /**
   * Handle color selection
   */
  const handleColorSelection = (category, color) => {
    setSelectedColors(prev => ({
      ...prev,
      [category]: color
    }));
  };

  /**
   * Handle font selection
   */
  const handleFontSelection = (category, font) => {
    setSelectedFonts(prev => ({
      ...prev,
      [category]: font
    }));
  };

  /**
   * Apply selected styles and continue
   */
  const applyStyles = async () => {
    try {
      setApplying(true);

      const finalStyles = {
        colors: selectedColors,
        fonts: selectedFonts,
        customizations,
        appliedAt: new Date().toISOString(),
        sourceWebsite: analysis.url
      };

      // Update form data with selected styles
      updateFormData({
        appliedStyles: finalStyles,
        stylesApplied: true,
        themeColor: selectedColors.primary,
        // Update existing form customization fields
        customColors: selectedColors,
        customFonts: selectedFonts
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

  /**
   * Skip style application
   */
  const skipStyles = () => {
    updateFormData({
      stylesApplied: false,
      styleApplicationSkipped: true
    });
    onNext();
  };

  /**
   * Render color palette section
   */
  const renderColorPalette = () => {
    const { colors } = analysis;
    
    return (
      <div style={{
        background: 'white',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h4 style={{ color: '#495057', marginTop: 0, display: 'flex', alignItems: 'center' }}>
          🎨 Color Palette
          <span style={{ 
            background: '#e7f3ff', 
            color: '#0066cc', 
            padding: '0.25rem 0.5rem', 
            borderRadius: '12px', 
            fontSize: '0.75rem', 
            marginLeft: '1rem' 
          }}>
            {colors.palette?.length || 0} colors found
          </span>
        </h4>

        {/* Color Categories */}
        <div style={{ marginBottom: '2rem' }}>
          {[
            { key: 'primary', label: 'Primary Brand Color', description: 'Main color for buttons and highlights' },
            { key: 'secondary', label: 'Secondary Color', description: 'Supporting color for accents' },
            { key: 'accent', label: 'Accent Color', description: 'Call-to-action and emphasis' }
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
              
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {/* Current selection */}
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    backgroundColor: selectedColors[key],
                    border: '2px solid #28a745',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    position: 'relative',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  title={`Selected: ${selectedColors[key]}`}
                >
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#28a745',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px'
                  }}>
                    ✓
                  </div>
                </div>

                {/* Alternative options */}
                {colors.palette?.filter(color => color.hex !== selectedColors[key]).slice(0, 6).map((color, index) => (
                  <div
                    key={index}
                    onClick={() => handleColorSelection(key, color.hex)}
                    style={{
                      width: '50px',
                      height: '50px',
                      backgroundColor: color.hex,
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    title={`${color.name}: ${color.hex} (${color.usage})`}
                  >
                    <div style={{
                      position: 'absolute',
                      bottom: '-20px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '0.7rem',
                      color: '#666',
                      whiteSpace: 'nowrap'
                    }}>
                      {color.hex}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /**
   * Render typography section
   */
  const renderTypography = () => {
    const { fonts } = analysis;
    
    return (
      <div style={{
        background: 'white',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h4 style={{ color: '#495057', marginTop: 0, display: 'flex', alignItems: 'center' }}>
          🔤 Typography
          <span style={{ 
            background: '#e7f3ff', 
            color: '#0066cc', 
            padding: '0.25rem 0.5rem', 
            borderRadius: '12px', 
            fontSize: '0.75rem', 
            marginLeft: '1rem' 
          }}>
            {fonts.cleanFamilies?.length || 0} fonts found
          </span>
        </h4>

        {/* Font Categories */}
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

              {/* Current selection preview */}
              <div style={{
                background: '#f8f9fa',
                border: '2px solid #28a745',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '0.75rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div
                      style={{
                        fontFamily: selectedFonts[key]?.family || selectedFonts[key]?.suggested || 'Inter',
                        fontSize: key === 'heading' ? '1.5rem' : '1rem',
                        fontWeight: selectedFonts[key]?.weight || (key === 'heading' ? '600' : '400'),
                        color: selectedColors.text,
                        marginBottom: '0.25rem'
                      }}
                    >
                      {sample}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      {selectedFonts[key]?.suggested || selectedFonts[key]?.family || 'Default'}
                    </div>
                  </div>
                  <div style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem'
                  }}>
                    ✓ Selected
                  </div>
                </div>
              </div>

              {/* Alternative font options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {fonts.cleanFamilies?.filter(family => family !== selectedFonts[key]?.family).slice(0, 3).map((family, index) => (
                  <div
                    key={index}
                    onClick={() => handleFontSelection(key, { ...selectedFonts[key], family, suggested: family })}
                    style={{
                      background: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      padding: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#f8f9fa';
                      e.target.style.borderColor = '#2a2a72';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'white';
                      e.target.style.borderColor = '#ddd';
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: family,
                          fontSize: key === 'heading' ? '1.2rem' : '0.9rem',
                          fontWeight: key === 'heading' ? '600' : '400',
                          marginBottom: '0.25rem'
                        }}
                      >
                        {sample}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>
                        {family}
                      </div>
                    </div>
                    <div style={{ color: '#2a2a72', fontSize: '0.8rem' }}>
                      Click to select
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /**
   * Render form preview
   */
  const renderFormPreview = () => {
    const previewStyles = {
      backgroundColor: selectedColors.background || '#ffffff',
      color: selectedColors.text || '#333333',
      fontFamily: selectedFonts.body?.suggested || 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
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
      fontFamily: selectedFonts.button?.suggested || selectedFonts.body?.suggested || 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
      fontWeight: selectedFonts.button?.weight || '500',
      fontSize: '1rem',
      cursor: 'pointer'
    };

    const headingStyles = {
      fontFamily: selectedFonts.heading?.suggested || 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
      fontWeight: selectedFonts.heading?.weight || '600',
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h4 style={{ color: '#495057', margin: 0 }}>
            👁️ Preview Your Styled Form
          </h4>
          
          {/* Preview mode selector */}
          <div style={{ display: 'flex', background: '#f8f9fa', borderRadius: '4px', padding: '0.25rem' }}>
            {[
              { key: 'split', label: 'Split', icon: '⚡' },
              { key: 'styled', label: 'New Style', icon: '🎨' }
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setPreviewMode(key)}
                style={{
                  background: previewMode === key ? 'white' : 'transparent',
                  border: previewMode === key ? '1px solid #ddd' : 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  color: previewMode === key ? '#495057' : '#6c757d'
                }}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          display: previewMode === 'split' ? 'grid' : 'block',
          gridTemplateColumns: previewMode === 'split' ? '1fr 1fr' : '1fr',
          gap: '1rem'
        }}>
          {/* Original Form (only in split mode) */}
          {previewMode === 'split' && (
            <div>
              <h6 style={{ color: '#6c757d', marginBottom: '1rem', textAlign: 'center' }}>
                Before (Current Style)
              </h6>
              <div style={{
                backgroundColor: '#ffffff',
                color: '#333333',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
                padding: '2rem',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <h3 style={{
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
                  fontWeight: '600',
                  fontSize: '1.5rem',
                  color: '#2a2a72',
                  marginBottom: '1rem'
                }}>
                  Support Our Campaign
                </h3>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Donation Amount
                  </label>
                  <input 
                    type="text" 
                    placeholder="$100" 
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ced4da',
                      borderRadius: '4px'
                    }}
                    readOnly
                  />
                </div>
                <button style={{
                  backgroundColor: '#2a2a72',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 2rem',
                  borderRadius: '4px',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
                  fontWeight: '500',
                  fontSize: '1rem'
                }}>
                  Donate Now
                </button>
              </div>
            </div>
          )}

          {/* Styled Form */}
          <div>
            <h6 style={{ 
              color: '#28a745', 
              marginBottom: '1rem', 
              textAlign: 'center'
            }}>
              {previewMode === 'split' ? 'After (Website Style)' : 'Your Styled Form'}
            </h6>
            <div style={previewStyles}>
              <h3 style={headingStyles}>
                Support Our Campaign
              </h3>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '500',
                  fontFamily: selectedFonts.body?.suggested || 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
                }}>
                  Donation Amount
                </label>
                <input 
                  type="text" 
                  placeholder="$100" 
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${selectedColors.secondary || '#ced4da'}`,
                    borderRadius: '4px',
                    fontFamily: selectedFonts.body?.suggested || 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
                  }}
                  readOnly
                />
              </div>
              <button style={buttonStyles}>
                Donate Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <h2 style={{ color: '#2a2a72', textAlign: 'center', marginBottom: '1rem' }}>
        ✨ Review & Apply Styles - Step 5
      </h2>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>
        Review the extracted styles and customize as needed
      </p>

      {/* Website Info */}
      <div style={{
        background: '#e7f3ff',
        border: '1px solid #b6d7ff',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '32px', marginRight: '1rem' }}>🌐</div>
        <div>
          <strong style={{ color: '#0066cc' }}>Analyzing: {analysis.url}</strong>
          <div style={{ fontSize: '0.9rem', color: '#004499', marginTop: '0.25rem' }}>
            Confidence: {analysis.confidence}% • 
            Found {analysis.summary.colorsExtracted} colors, {analysis.summary.fontsFound} fonts
          </div>
        </div>
      </div>

      {/* Color Palette */}
      {renderColorPalette()}

      {/* Typography */}
      {renderTypography()}

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
          ← Back to Website Analysis
        </button>
      </div>
    </div>
  );
};

export default StyleConfirmation;