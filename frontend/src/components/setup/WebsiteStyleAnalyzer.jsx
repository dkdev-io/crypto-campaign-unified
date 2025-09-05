/**
 * Combined Website Style Analyzer Component
 * Combines WebsiteStyleMatcher and StyleConfirmation into a single step
 * Shows analysis form, then confirmation with edit option
 */

import React, { useState, useEffect } from 'react';

const WebsiteStyleAnalyzer = ({ formData, updateFormData, onNext, onPrev }) => {
  const [websiteUrl, setWebsiteUrl] = useState(formData.websiteUrl || '');
  const [primaryColor, setPrimaryColor] = useState(formData.primaryColor || '#2a2a72');
  const [secondaryColor, setSecondaryColor] = useState(formData.secondaryColor || '#ff6b6b');
  const [selectedFont, setSelectedFont] = useState(formData.selectedFont || 'Inter');
  const [logoImage, setLogoImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(formData.styleAnalysis || null);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(!!formData.styleAnalysis);
  const [applying, setApplying] = useState(false);
  
  // Style selections for confirmation
  const [selectedColors, setSelectedColors] = useState({});
  const [selectedFonts, setSelectedFonts] = useState({});
  const [previewMode, setPreviewMode] = useState('split');

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
      setShowConfirmation(true);
    }
  }, [analysis]);

  /**
   * Validate URL format
   */
  const validateUrl = (url) => {
    if (!url.trim()) {
      return 'Please enter your website URL';
    }

    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlPattern.test(url.trim())) {
      return 'Please enter a valid website URL (e.g., yoursite.com)';
    }

    return '';
  };

  /**
   * Handle URL input changes with real-time validation
   */
  const handleUrlChange = (e) => {
    const url = e.target.value;
    setWebsiteUrl(url);
    setValidationError(validateUrl(url));
    setError('');

    // Clear previous analysis if URL changes significantly
    if (analysis && !url.includes(analysis.domain)) {
      setAnalysis(null);
      setShowConfirmation(false);
    }
  };

  /**
   * Analyze website styling
   */
  const analyzeWebsite = async () => {
    const validation = validateUrl(websiteUrl);
    if (validation) {
      setValidationError(validation);
      return;
    }

    try {
      setAnalyzing(true);
      setError('');
      setValidationError('');

      console.log('Starting website style analysis for:', websiteUrl);

      const response = await fetch('/api/analyze-website-styles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: websiteUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      console.log('Website analysis completed:', data);

      setAnalysis(data);
      updateFormData({
        websiteUrl: websiteUrl,
        styleAnalysis: data,
        stylesAnalyzed: true,
      });
    } catch (err) {
      console.error('Website analysis failed:', err);
      setError(err.message || 'Failed to analyze website. Please check the URL and try again.');
      setAnalysis(null);
      setShowConfirmation(false);
    } finally {
      setAnalyzing(false);
    }
  };

  /**
   * Handle color input changes
   */
  const handleColorChange = (colorType, value) => {
    if (colorType === 'primary') {
      setPrimaryColor(value);
      updateFormData({ primaryColor: value });
    } else if (colorType === 'secondary') {
      setSecondaryColor(value);
      updateFormData({ secondaryColor: value });
    }
  };

  /**
   * Handle font selection change
   */
  const handleFontChange = (e) => {
    const font = e.target.value;
    setSelectedFont(font);
    updateFormData({ selectedFont: font });
  };

  /**
   * Handle image upload
   */
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoImage(file);
      updateFormData({ logoImage: file });
    }
  };

  /**
   * Go back to edit website URL
   */
  const goBackToEdit = () => {
    setShowConfirmation(false);
    setAnalysis(null);
    setError('');
  };

  /**
   * Skip style matching and continue
   */
  const skipStyleMatching = () => {
    updateFormData({
      websiteUrl: '',
      styleAnalysis: null,
      stylesAnalyzed: false,
      styleMatchingSkipped: true,
    });
    onNext();
  };

  /**
   * Handle color selection
   */
  const handleColorSelection = (category, color) => {
    setSelectedColors((prev) => ({
      ...prev,
      [category]: color,
    }));
  };

  /**
   * Handle font selection
   */
  const handleFontSelection = (category, font) => {
    setSelectedFonts((prev) => ({
      ...prev,
      [category]: font,
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
        appliedAt: new Date().toISOString(),
        sourceWebsite: analysis.url,
      };

      // Update form data with selected styles
      updateFormData({
        appliedStyles: finalStyles,
        stylesApplied: true,
        themeColor: selectedColors.primary,
        customColors: selectedColors,
        customFonts: selectedFonts,
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
      styleApplicationSkipped: true,
    });
    onNext();
  };

  /**
   * Render URL analysis section
   */
  const renderUrlAnalysis = () => (
    <div>
      <h2
        style={{
          fontSize: '2rem',
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: '0.5rem',
          color: 'hsl(var(--crypto-white))',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        Website Style Analyzer
      </h2>

      {/* URL Input Section */}
      <div className="crypto-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="mb-10 text-center">
          <h3 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '600', 
            color: 'hsl(var(--crypto-white))', 
            marginBottom: '1rem' 
          }}>
            Analyze Your Website
          </h3>
          <p style={{ 
            color: 'hsl(var(--crypto-gold))', 
            margin: 0, 
            fontSize: '1rem' 
          }}>
            We'll extract colors and fonts to match your campaign form
          </p>
        </div>

        {/* URL Input */}
        <div style={{ marginBottom: '2rem' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '1rem',
              fontWeight: '500',
              color: 'hsl(var(--crypto-white))',
              fontSize: '1rem',
            }}
          >
            Your Website URL
          </label>
          <input
            type="url"
            value={websiteUrl}
            onChange={handleUrlChange}
            placeholder="https://yoursite.com"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `1px solid ${validationError ? 'hsl(var(--destructive))' : 'hsl(var(--crypto-blue) / 0.4)'}`,
              borderRadius: 'var(--radius)',
              fontSize: '1rem',
              fontFamily: 'Inter, sans-serif',
              background: validationError ? 'hsl(var(--destructive) / 0.1)' : 'hsl(223 57% 25% / 0.5)',
              color: 'hsl(var(--crypto-white))',
              marginBottom: '1rem',
              transition: 'var(--transition-smooth)',
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !validationError) {
                analyzeWebsite();
              }
            }}
          />

          {validationError && (
            <div style={{ color: 'hsl(var(--destructive))', fontSize: '0.875rem', marginBottom: '1rem' }}>
              {validationError}
            </div>
          )}

          {/* URL Examples */}
          <div
            style={{
              background: 'hsl(223 57% 25% / 0.3)',
              padding: '1rem',
              borderRadius: 'var(--radius)',
              marginBottom: '2rem',
              fontSize: '0.9rem',
            }}
          >
            <strong style={{ color: 'hsl(var(--crypto-white))' }}>Examples:</strong>
            <div style={{ color: 'hsl(var(--crypto-gold))', marginTop: '0.5rem' }}>
              • yoursite.com
              <br />
              • https://www.example.com
              <br />• subdomain.yoursite.org
            </div>
          </div>

        </div>

        {/* Submit button for website analysis */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <button
            onClick={analyzeWebsite}
            disabled={analyzing || !websiteUrl || validationError}
            style={{
              background: validationError || !websiteUrl ? 'hsl(var(--crypto-blue) / 0.3)' : 'hsl(var(--crypto-gold))',
              color: validationError || !websiteUrl ? 'hsl(var(--crypto-white) / 0.5)' : 'hsl(var(--crypto-navy))',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: 'var(--radius)',
              cursor: validationError || !websiteUrl ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              fontFamily: 'Inter, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.025em',
              opacity: validationError || !websiteUrl ? 0.6 : 1,
            }}
          >
            {analyzing ? 'Analyzing...' : 'Submit'}
          </button>
        </div>
      </div>

      {/* Manual Styling Section */}
      <div>
        <h3 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          textAlign: 'center',
          marginBottom: '2rem',
          color: 'hsl(var(--crypto-white))',
          fontFamily: 'Inter, sans-serif',
        }}>
          Or Select Styling
        </h3>

        <div className="crypto-card" style={{ maxWidth: '500px', margin: '0 auto' }}>
          {/* Color Selection - Only 2 colors */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: 'hsl(var(--crypto-white))',
                  fontSize: '1rem',
                }}
              >
                Primary Color
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: primaryColor,
                    border: '2px solid hsl(var(--crypto-white) / 0.3)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                  onClick={() => document.getElementById('color-primary-analyzer').click()}
                />
                <input
                  id="color-primary-analyzer"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  style={{ opacity: 0, position: 'absolute', pointerEvents: 'none' }}
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: '1px solid hsl(var(--crypto-blue) / 0.4)',
                    borderRadius: 'var(--radius)',
                    fontSize: '0.875rem',
                    fontFamily: 'Inter, sans-serif',
                    background: 'hsl(223 57% 25% / 0.5)',
                    color: 'hsl(var(--crypto-white))',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: 'hsl(var(--crypto-white))',
                  fontSize: '1rem',
                }}
              >
                Secondary Color
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: secondaryColor,
                    border: '2px solid hsl(var(--crypto-white) / 0.3)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                  onClick={() => document.getElementById('color-secondary-analyzer').click()}
                />
                <input
                  id="color-secondary-analyzer"
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  style={{ opacity: 0, position: 'absolute', pointerEvents: 'none' }}
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: '1px solid hsl(var(--crypto-blue) / 0.4)',
                    borderRadius: 'var(--radius)',
                    fontSize: '0.875rem',
                    fontFamily: 'Inter, sans-serif',
                    background: 'hsl(223 57% 25% / 0.5)',
                    color: 'hsl(var(--crypto-white))',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Font Selection - Only 1 font */}
          <div style={{ marginBottom: '2rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: 'hsl(var(--crypto-white))',
                fontSize: '1rem',
              }}
            >
              Font Family
            </label>
            <select
              value={selectedFont}
              onChange={handleFontChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid hsl(var(--crypto-blue) / 0.4)',
                borderRadius: 'var(--radius)',
                fontSize: '1rem',
                fontFamily: 'Inter, sans-serif',
                background: 'hsl(223 57% 25% / 0.5)',
                color: 'hsl(var(--crypto-white))',
              }}
            >
              <option value="Inter">Inter</option>
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Georgia">Georgia</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Lato">Lato</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Source Sans Pro">Source Sans Pro</option>
            </select>
          </div>

          {/* Image Upload */}
          <div style={{ marginBottom: '2rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: 'hsl(var(--crypto-white))',
                fontSize: '1rem',
              }}
            >
              Logo/Brand Image (Optional)
            </label>
            <div
              style={{
                border: '2px dashed hsl(var(--crypto-blue) / 0.4)',
                borderRadius: 'var(--radius)',
                padding: '2rem',
                textAlign: 'center',
                background: 'hsl(223 57% 25% / 0.3)',
                transition: 'var(--transition-smooth)',
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                id="logo-upload-analyzer"
              />
              <label
                htmlFor="logo-upload-analyzer"
                style={{
                  cursor: 'pointer',
                  display: 'block',
                  color: 'hsl(var(--crypto-white))',
                }}
              >
                {logoImage ? (
                  <div>
                    <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>✓</div>
                    <div>{logoImage.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'hsl(var(--crypto-gold))' }}>
                      Click to change
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📁</div>
                    <div>Click to upload an image</div>
                    <div style={{ fontSize: '0.8rem', color: 'hsl(var(--crypto-gold))' }}>
                      PNG, JPG, GIF up to 5MB
                    </div>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Submit button for manual styling */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => {
                // Save manual styling data and proceed
                updateFormData({
                  primaryColor,
                  secondaryColor,
                  selectedFont,
                  logoImage,
                  styleMethod: 'manual',
                  stylesApplied: true,
                });
                onNext();
              }}
              style={{
                background: 'hsl(var(--crypto-gold))',
                color: 'hsl(var(--crypto-navy))',
                border: 'none',
                padding: '0.75rem 2rem',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                fontFamily: 'Inter, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.025em',
              }}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * Render loading state
   */
  const renderLoadingState = () => (
    <div
      style={{
        background: 'hsl(var(--crypto-blue) / 0.1)',
        border: '1px solid hsl(var(--crypto-blue) / 0.3)',
        borderRadius: 'var(--radius)',
        padding: '2rem',
        textAlign: 'center',
        marginTop: '2rem',
      }}
    >
      <div
        style={{
          display: 'inline-block',
          width: '40px',
          height: '40px',
          border: '4px solid hsl(var(--crypto-blue) / 0.3)',
          borderTop: '4px solid hsl(var(--crypto-gold))',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem',
        }}
      />
      <h4 style={{ color: 'hsl(var(--crypto-white))', margin: '0 0 0.5rem 0' }}>Analyzing Your Website</h4>
      <p style={{ color: 'hsl(var(--crypto-gold))', margin: 0, fontSize: '0.9rem' }}>
        Extracting colors, fonts, and styling patterns...
        <br />
        This may take 10-15 seconds.
      </p>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  /**
   * Render style confirmation section
   */
  const renderStyleConfirmation = () => {
    if (!analysis) return null;

    return (
      <div>
        <h2
          style={{
            fontSize: '2rem',
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: '0.5rem',
            color: 'hsl(var(--crypto-white))',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Review & Apply Styles
        </h2>

        {/* Website Info */}
        <div
          style={{
            background: 'hsl(var(--crypto-blue) / 0.1)',
            border: '1px solid hsl(var(--crypto-blue) / 0.3)',
            borderRadius: 'var(--radius)',
            padding: '1rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '32px', marginRight: '1rem' }}>🌐</div>
          <div>
            <strong style={{ color: 'hsl(var(--crypto-white))' }}>Analyzing: {analysis.url}</strong>
            <div style={{ fontSize: '0.9rem', color: 'hsl(var(--crypto-gold))', marginTop: '0.25rem' }}>
              Confidence: {analysis.confidence}% • Found {analysis.summary?.colorsExtracted || 0} colors,{' '}
              {analysis.summary?.fontsFound || 0} fonts
            </div>
          </div>
        </div>

        {/* Color Palette Preview */}
        {analysis.colors && (
          <div className="crypto-card" style={{ marginBottom: '2rem' }}>
            <h4
              style={{
                color: 'hsl(var(--crypto-white))',
                marginTop: 0,
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              🎨 Color Palette
              <span
                style={{
                  background: 'hsl(var(--crypto-gold) / 0.2)',
                  color: 'hsl(var(--crypto-gold))',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  marginLeft: '1rem',
                }}
              >
                {analysis.colors.palette?.length || 0} colors found
              </span>
            </h4>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {analysis.colors.palette?.slice(0, 8).map((color, index) => (
                <div
                  key={index}
                  style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: color.hex,
                    borderRadius: 'var(--radius)',
                    border: '2px solid hsl(var(--crypto-blue) / 0.3)',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    padding: '0.25rem',
                  }}
                  title={`${color.name}: ${color.hex}`}
                >
                  <div
                    style={{
                      fontSize: '0.6rem',
                      color: 'white',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      fontWeight: '600',
                    }}
                  >
                    {color.hex}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Typography Preview */}
        {analysis.fonts && (
          <div className="crypto-card" style={{ marginBottom: '2rem' }}>
            <h4
              style={{
                color: 'hsl(var(--crypto-white))',
                marginTop: 0,
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              🔤 Typography
              <span
                style={{
                  background: 'hsl(var(--crypto-gold) / 0.2)',
                  color: 'hsl(var(--crypto-gold))',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  marginLeft: '1rem',
                }}
              >
                {analysis.fonts.cleanFamilies?.length || 0} fonts found
              </span>
            </h4>

            <div style={{ color: 'hsl(var(--crypto-white))' }}>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Primary Font:</strong> {analysis.fonts.primary || 'Default'}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Font Families:</strong> {analysis.fonts.cleanFamilies?.slice(0, 3).join(', ') || 'None'}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div
          className="crypto-card"
          style={{
            textAlign: 'center',
            padding: '2rem',
          }}
        >
          <h4 style={{ color: 'hsl(var(--crypto-white))', marginTop: 0, marginBottom: '1rem' }}>
            Ready to Apply These Styles?
          </h4>
          <p style={{ color: 'hsl(var(--crypto-gold))', marginBottom: '2rem' }}>
            Your form will be updated with the extracted colors and fonts
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={applyStyles}
              disabled={applying}
              style={{
                background: applying ? 'hsl(var(--crypto-blue) / 0.3)' : 'hsl(var(--crypto-gold))',
                color: applying ? 'hsl(var(--crypto-white) / 0.5)' : 'hsl(var(--crypto-navy))',
                border: 'none',
                padding: '0.75rem 2rem',
                borderRadius: 'var(--radius)',
                cursor: applying ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                fontFamily: 'Inter, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.025em',
                opacity: applying ? 0.7 : 1,
              }}
            >
              {applying ? 'Applying...' : 'Apply Styles'}
            </button>

            <button
              onClick={goBackToEdit}
              disabled={applying}
              style={{
                background: 'transparent',
                color: 'hsl(var(--crypto-gold))',
                border: '1px solid hsl(var(--crypto-gold))',
                padding: '0.75rem 2rem',
                borderRadius: 'var(--radius)',
                cursor: applying ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                fontFamily: 'Inter, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.025em',
                opacity: applying ? 0.7 : 1,
              }}
            >
              Edit URL
            </button>

            <button
              onClick={skipStyles}
              disabled={applying}
              style={{
                background: 'transparent',
                color: 'hsl(var(--crypto-white) / 0.7)',
                border: '1px solid hsl(var(--crypto-white) / 0.3)',
                padding: '0.75rem 2rem',
                borderRadius: 'var(--radius)',
                cursor: applying ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                fontFamily: 'Inter, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.025em',
                opacity: applying ? 0.7 : 1,
              }}
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render error state
   */
  const renderError = () => {
    if (!error) return null;

    return (
      <div
        style={{
          background: 'hsl(var(--destructive) / 0.1)',
          color: 'hsl(var(--destructive))',
          padding: '1rem',
          borderRadius: 'var(--radius)',
          marginTop: '1rem',
          border: '1px solid hsl(var(--destructive) / 0.3)',
        }}
      >
        <strong>Analysis Failed</strong>
        <br />
        {error}
        <div style={{ marginTop: '1rem' }}>
          <button
            onClick={() => {
              setError('');
              setAnalysis(null);
              setShowConfirmation(false);
            }}
            style={{
              background: 'hsl(var(--destructive))',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginRight: '1rem',
            }}
          >
            Try Again
          </button>
          <button
            onClick={skipStyleMatching}
            style={{
              background: 'transparent',
              color: 'hsl(var(--destructive))',
              border: '1px solid hsl(var(--destructive))',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Continue Without Styles
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* URL Analysis or Style Confirmation */}
      {!showConfirmation && !analyzing ? renderUrlAnalysis() : null}
      {analyzing ? renderLoadingState() : null}
      {showConfirmation ? renderStyleConfirmation() : null}

      {/* Error Display */}
      {renderError()}

      {/* Navigation */}
      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
        <button
          onClick={onPrev}
          disabled={applying}
          style={{
            background: 'hsl(var(--crypto-gold))',
            color: 'hsl(var(--crypto-navy))',
            border: 'none',
            padding: '0.75rem 2rem',
            borderRadius: 'var(--radius)',
            cursor: applying ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.025em',
            opacity: applying ? 0.7 : 1,
          }}
        >
          Back
        </button>

        <button
          onClick={() => {
            // Save current styling data and proceed
            updateFormData({
              primaryColor,
              secondaryColor,
              selectedFont,
              logoImage,
              styleMethod: 'manual',
              stylesApplied: true,
            });
            onNext();
          }}
          style={{
            background: 'hsl(var(--crypto-gold))',
            color: 'hsl(var(--crypto-navy))',
            border: 'none',
            padding: '0.75rem 2rem',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            fontSize: '1rem',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.025em',
          }}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default WebsiteStyleAnalyzer;