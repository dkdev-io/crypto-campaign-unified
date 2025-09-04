/**
 * Website Style Matcher Component
 * Allows users to input their website URL and analyze styling for form matching
 */

import React, { useState } from 'react';

const WebsiteStyleMatcher = ({ formData, updateFormData, onNext, onPrev }) => {
  const [websiteUrl, setWebsiteUrl] = useState(formData.websiteUrl || '');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');

  /**
   * Validate URL format
   */
  const validateUrl = (url) => {
    if (!url.trim()) {
      return 'Please enter your website URL';
    }

    // Basic URL pattern check
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
    } finally {
      setAnalyzing(false);
    }
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

  const handleNext = () => {
    // Allow progression even without website analysis
    if (!websiteUrl.trim()) {
      skipStyleMatching();
    } else {
      onNext();
    }
  };

  /**
   * Continue to style confirmation
   */
  const continueToConfirmation = () => {
    if (analysis) {
      onNext();
    }
  };

  /**
   * Render URL examples
   */
  const renderUrlExamples = () => (
    <div
      style={{
        background: '#f8f9fa',
        padding: '1rem',
        borderRadius: '4px',
        marginTop: '1rem',
        fontSize: '0.9rem',
      }}
    >
      <strong style={{ color: '#495057' }}>Examples:</strong>
      <div style={{ color: '#6c757d', marginTop: '0.5rem' }}>
        • yoursite.com
        <br />
        • https://www.example.com
        <br />• subdomain.yoursite.org
      </div>
    </div>
  );

  /**
   * Render analysis preview
   */
  const renderAnalysisPreview = () => {
    if (!analysis) return null;

    const { colors, fonts, summary, confidence } = analysis;

    return (
      <div
        style={{
          background: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          padding: '1.5rem',
          marginTop: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
          <div className="mr-2"></div>
          <div>
            <h4 style={{ margin: 0, color: '#28a745' }}>Analysis Complete!</h4>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
              Found {summary.colorsExtracted} colors and {summary.fontsFound} fonts (Confidence:{' '}
              {confidence}%)
            </p>
          </div>
        </div>

        {/* Quick Preview */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* Colors Preview */}
          <div>
            <h6 style={{ margin: '0 0 0.5rem 0', color: '#495057' }}>Colors Found</h6>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {colors.palette?.slice(0, 4).map((color, index) => (
                <div
                  key={index}
                  style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: color.hex,
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    position: 'relative',
                  }}
                  title={`${color.name}: ${color.hex}`}
                />
              ))}
              {colors.palette?.length > 4 && (
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    color: '#666',
                  }}
                >
                  +{colors.palette.length - 4}
                </div>
              )}
            </div>
          </div>

          {/* Fonts Preview */}
          <div>
            <h6 style={{ margin: '0 0 0.5rem 0', color: '#495057' }}>Typography</h6>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
              <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                {fonts.primary || 'Default Font'}
              </div>
              <div style={{ fontSize: '0.8rem' }}>Heading - Body - Buttons</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={continueToConfirmation}
            style={{
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
            }}
          >
            Review & Apply Styles
          </button>
          <button
            onClick={() => setAnalysis(null)}
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Try Different URL
          </button>
        </div>
      </div>
    );
  };

  /**
   * Render loading state
   */
  const renderLoadingState = () => (
    <div
      style={{
        background: '#e7f3ff',
        border: '1px solid #b6d7ff',
        borderRadius: '8px',
        padding: '2rem',
        textAlign: 'center',
        marginTop: '1.5rem',
      }}
    >
      <div
        style={{
          display: 'inline-block',
          width: '40px',
          height: '40px',
          border: '4px solid #b6d7ff',
          borderTop: '4px solid #0066cc',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem',
        }}
      />
      <h4 style={{ color: '#0066cc', margin: '0 0 0.5rem 0' }}>Analyzing Your Website</h4>
      <p style={{ color: '#004499', margin: 0, fontSize: '0.9rem' }}>
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
        Website Style Matcher
      </h2>
      <p
        style={{
          textAlign: 'center',
          marginBottom: '2rem',
          color: 'hsl(var(--crypto-gold))',
          fontSize: '1rem',
          fontWeight: '500',
        }}
      >
        Step 4 of 8: Enter your website URL to automatically match your form styling
      </p>

      {/* URL Input Section */}
      {!analysis && !analyzing && (
        <div className="bg-card border border-border rounded-lg p-12 my-8">
          <div className="mb-10 text-center">
            <div className="mb-6"></div>
            <h3 className="text-foreground mb-4" style={{ fontSize: 'var(--text-heading-md)' }}>
              Analyze Your Website
            </h3>
            <p style={{ color: '#6c757d', margin: 0, fontSize: '1.1rem' }}>
              We'll extract colors, fonts, and styling to match your campaign form
            </p>
          </div>

          {/* URL Input */}
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '1rem',
                fontWeight: '500',
                color: '#495057',
                fontSize: '1.1rem',
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
              <div style={{ color: '#dc3545', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {validationError}
              </div>
            )}

            {renderUrlExamples()}

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                gap: '1.5rem',
                justifyContent: 'center',
                marginTop: '3rem',
              }}
            >
              <button
                onClick={analyzeWebsite}
                disabled={analyzing || !websiteUrl || validationError}
                style={{
                  background: validationError || !websiteUrl ? '#ccc' : '#2a2a72',
                  color: 'white',
                  border: 'none',
                  padding: '1rem 2.5rem',
                  borderRadius: '6px',
                  cursor: validationError || !websiteUrl ? 'not-allowed' : 'pointer',
                  fontSize: '1.1rem',
                  fontWeight: '500',
                  opacity: validationError || !websiteUrl ? 0.6 : 1,
                }}
              >
                Analyze Website
              </button>

              <button
                onClick={skipStyleMatching}
                style={{
                  background: 'transparent',
                  color: '#6c757d',
                  border: '1px solid #6c757d',
                  padding: '1rem 2rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                }}
              >
                Skip Style Matching
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {analyzing && renderLoadingState()}

      {/* Analysis Results */}
      {analysis && renderAnalysisPreview()}

      {/* Error Display */}
      {error && (
        <div
          style={{
            background: '#fee',
            color: '#c33',
            padding: '1rem',
            borderRadius: '4px',
            marginTop: '1rem',
            border: '1px solid #fcc',
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
              }}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
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
                color: '#dc3545',
                border: '1px solid #dc3545',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              Continue Without Styles
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="form-actions" style={{ marginTop: '2rem' }}>
        <button
          onClick={onPrev}
          style={{
            background: 'hsl(var(--crypto-gold))',
            color: 'hsl(var(--crypto-navy))',
            border: 'none',
            padding: 'var(--space-sm) var(--space-lg)',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            fontSize: '1rem',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '600',
            transition: 'var(--transition-smooth)',
          }}
        >
          Back to Form Options
        </button>

        {analysis ? (
          <button
            onClick={continueToConfirmation}
            style={{
              background: 'hsl(var(--crypto-navy))',
              color: 'hsl(var(--crypto-white))',
              border: 'none',
              padding: 'var(--space-sm) var(--space-lg)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontSize: '1rem',
              fontFamily: 'Inter, sans-serif',
              fontWeight: '600',
              transition: 'var(--transition-smooth)',
            }}
          >
            Review Styles
          </button>
        ) : (
          <button
            onClick={skipStyleMatching}
            style={{
              background: 'hsl(var(--crypto-navy))',
              color: 'hsl(var(--crypto-white))',
              border: 'none',
              padding: 'var(--space-sm) var(--space-lg)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontSize: '1rem',
              fontFamily: 'Inter, sans-serif',
              fontWeight: '600',
              transition: 'var(--transition-smooth)',
            }}
          >
            Skip Style Matching
          </button>
        )}
      </div>
    </div>
  );
};

export default WebsiteStyleMatcher;
