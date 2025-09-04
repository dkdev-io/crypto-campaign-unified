import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  Palette, 
  Type, 
  Image, 
  Globe, 
  Upload, 
  Eye, 
  ArrowLeft, 
  ArrowRight, 
  Download,
  AlertCircle,
  Check,
  Building2
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Spinner } from '../ui/spinner';
import CampaignAuthNav from '../campaigns/CampaignAuthNav';

const StyleConfigurationForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [styleMethod, setStyleMethod] = useState('manual'); // 'manual' or 'import'
  const [manualStyles, setManualStyles] = useState({
    primaryColor: '#2a2a72',
    secondaryColor: '#ffffff',
    accentColor: '#28a745',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    logoImage: null
  });
  const [importedStyles, setImportedStyles] = useState(null);
  const [previewMode, setPreviewMode] = useState('original');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load existing form data from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('campaignSetupData');
      if (saved) {
        const savedData = JSON.parse(saved);
        setFormData(savedData);
        
        // Load any existing style data
        if (savedData.appliedStyles) {
          setManualStyles({
            primaryColor: savedData.appliedStyles.colors?.primary || '#2a2a72',
            secondaryColor: savedData.appliedStyles.colors?.secondary || '#ffffff',
            accentColor: savedData.appliedStyles.colors?.accent || '#28a745',
            fontFamily: savedData.appliedStyles.fonts?.body?.suggested || 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
            logoImage: savedData.appliedStyles.logoImage || null
          });
        }
      }
    } catch (e) {
      console.warn('Could not load saved data:', e);
    }
  }, []);

  const updateFormData = async (newData) => {
    const updatedData = { ...formData, ...newData };
    setFormData(updatedData);
    
    // Save to localStorage
    try {
      localStorage.setItem('campaignSetupData', JSON.stringify(updatedData));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }

    // Save to Supabase using proper style columns
    if (updatedData.campaignId) {
      try {
        const dbUpdates = {};
        
        if (newData.styleData) {
          dbUpdates.style_analysis = newData.styleData;
          dbUpdates.website_analyzed = formData.website;
        }
        
        if (newData.appliedStyles) {
          dbUpdates.applied_styles = newData.appliedStyles;
          dbUpdates.styles_applied = true;
          dbUpdates.styles_applied_at = new Date().toISOString();
        }
        
        if (newData.styleMethod) {
          dbUpdates.style_method = newData.styleMethod;
        }

        if (Object.keys(dbUpdates).length > 0) {
          const { error } = await supabase
            .from('campaigns')
            .update(dbUpdates)
            .eq('id', updatedData.campaignId);

          if (error) {
            console.warn('Could not save styles to database:', error);
          } else {
            console.log('Styles saved to database successfully:', dbUpdates);
          }
        }
      } catch (err) {
        console.warn('Database save error:', err);
      }
    }
  };

  const handleManualStyleChange = (field, value) => {
    setManualStyles(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        handleManualStyleChange('logoImage', event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImportFromWebsite = async () => {
    if (!formData.website) {
      setError('No website URL found. Please go back and enter your website URL.');
      return;
    }

    try {
      setImportLoading(true);
      setError('');
      
      console.log('🔍 Starting website style analysis for:', formData.website);

      // Call backend API to analyze website with Puppeteer
      const response = await fetch('/api/analyze-website-styles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url: formData.website,
          extractImages: true,
          extractFonts: true,
          extractColors: true
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze website');
      }

      console.log('✅ Website analysis completed:', data);

      setImportedStyles(data);
      setStyleMethod('import');
      setSuccess('Website styles imported successfully!');

      // Update form data with imported styles
      await updateFormData({
        styleData: data,
        styleMethod: 'import',
        websiteAnalyzed: true,
        importedAt: new Date().toISOString()
      });

    } catch (err) {
      console.error('❌ Website analysis failed:', err);
      setError(err.message || 'Failed to analyze website. Please try manual entry instead.');
    } finally {
      setImportLoading(false);
    }
  };

  const handleApplyStyles = async () => {
    try {
      setLoading(true);
      setError('');

      const finalStyles = styleMethod === 'import' ? {
        colors: {
          primary: importedStyles.colors?.primary || '#2a2a72',
          secondary: importedStyles.colors?.secondary || '#ffffff', 
          accent: importedStyles.colors?.accent || '#28a745',
          background: importedStyles.colors?.background || '#ffffff',
          text: importedStyles.colors?.text || '#333333'
        },
        fonts: {
          primary: importedStyles.fonts?.primary || 'Arial, sans-serif',
          heading: importedStyles.fonts?.heading || 'Arial, sans-serif',
          body: importedStyles.fonts?.body || 'Arial, sans-serif'
        },
        images: {
          logo: importedStyles.images?.logo || null,
          banner: importedStyles.images?.banner || null
        },
        method: 'website_import',
        source: formData.website,
        confidence: importedStyles.confidence || 0
      } : {
        colors: {
          primary: manualStyles.primaryColor,
          secondary: manualStyles.secondaryColor,
          accent: manualStyles.accentColor,
          background: '#ffffff',
          text: '#333333'
        },
        fonts: {
          primary: manualStyles.fontFamily,
          heading: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
          body: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
        },
        images: {
          logo: manualStyles.logoImage
        },
        method: 'manual_entry',
        source: 'user_input'
      };

      // Save styles to form data and database
      await updateFormData({
        appliedStyles: finalStyles,
        stylesApplied: true,
        styleMethod: styleMethod,
        stylesAppliedAt: new Date().toISOString()
      });

      setSuccess('Styles applied successfully!');
      
      // Navigate to next step after brief delay
      setTimeout(() => {
        navigate('/TermsAndLaunch');
      }, 1500);

    } catch (error) {
      console.error('Failed to apply styles:', error);
      setError('Failed to apply styles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    await updateFormData({
      stylesApplied: false,
      styleMethod: 'skipped',
      appliedStyles: null
    });
    navigate('/TermsAndLaunch');
  };

  const renderManualEntry = () => (
    <div className="space-y-6">
      <h3 className="font-semibold text-foreground mb-4" style={{fontSize: 'var(--text-heading-md)'}}>
        Manual Style Entry
      </h3>
      
      {/* Color Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Primary Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={manualStyles.primaryColor}
              onChange={(e) => handleManualStyleChange('primaryColor', e.target.value)}
              className="w-12 h-10 border border-border rounded cursor-pointer"
            />
            <Input
              value={manualStyles.primaryColor}
              onChange={(e) => handleManualStyleChange('primaryColor', e.target.value)}
              placeholder="#2a2a72"
              className="flex-1"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Secondary Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={manualStyles.secondaryColor}
              onChange={(e) => handleManualStyleChange('secondaryColor', e.target.value)}
              className="w-12 h-10 border border-border rounded cursor-pointer"
            />
            <Input
              value={manualStyles.secondaryColor}
              onChange={(e) => handleManualStyleChange('secondaryColor', e.target.value)}
              placeholder="#ffffff"
              className="flex-1"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Accent Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={manualStyles.accentColor}
              onChange={(e) => handleManualStyleChange('accentColor', e.target.value)}
              className="w-12 h-10 border border-border rounded cursor-pointer"
            />
            <Input
              value={manualStyles.accentColor}
              onChange={(e) => handleManualStyleChange('accentColor', e.target.value)}
              placeholder="#28a745"
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* Font Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Font Family
        </label>
        <select
          value={manualStyles.fontFamily}
          onChange={(e) => handleManualStyleChange('fontFamily', e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
        >
          <option value="Arial, sans-serif">Arial</option>
          <option value="Helvetica, sans-serif">Helvetica</option>
          <option value="'Times New Roman', serif">Times New Roman</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="'Courier New', monospace">Courier New</option>
          <option value="Verdana, sans-serif">Verdana</option>
          <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
          <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
          <option value="Impact, fantasy">Impact</option>
          <option value="'Lucida Console', monospace">Lucida Console</option>
        </select>
      </div>

      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Campaign Logo
        </label>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground"
            />
          </div>
          {manualStyles.logoImage && (
            <div className="w-16 h-16 border border-border rounded-lg overflow-hidden">
              <img 
                src={manualStyles.logoImage} 
                alt="Logo preview" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderImportSection = () => (
    <div className="space-y-6">
      <h3 className="font-semibold text-foreground mb-4" style={{fontSize: 'var(--text-heading-md)'}}>
        Import from Website
      </h3>
      
      <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="w-6 h-6 text-blue-600" />
          <div>
            <div className="font-medium text-blue-900">Website to Analyze</div>
            <div className="text-sm text-blue-700">{formData.website}</div>
          </div>
        </div>
        
        <Button
          onClick={handleImportFromWebsite}
          disabled={importLoading}
          className="w-full"
        >
          {importLoading ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Analyzing Website...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Import Colors, Fonts & Images
            </>
          )}
        </Button>
      </div>

      {/* Import Results */}
      {importedStyles && (
        <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="text-lg font-semibold text-green-900 mb-4">
Import Successful
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Colors */}
            <div>
              <h5 className="font-medium text-green-800 mb-2">Colors Found</h5>
              <div className="flex gap-2">
                {importedStyles.colors?.palette?.slice(0, 5).map((color, index) => (
                  <div
                    key={index}
                    className="w-8 h-8 rounded border border-border"
                    style={{ backgroundColor: color.hex }}
                    title={`${color.name}: ${color.hex}`}
                  />
                ))}
              </div>
            </div>
            
            {/* Fonts */}
            <div>
              <h5 className="font-medium text-green-800 mb-2">Fonts Found</h5>
              <div className="text-sm text-green-700">
                Primary: {importedStyles.fonts?.primary || 'Default'}<br />
                Found {importedStyles.fonts?.cleanFamilies?.length || 0} font families
              </div>
            </div>
            
            {/* Images */}
            {importedStyles.images?.logo && (
              <div className="md:col-span-2">
                <h5 className="font-medium text-green-800 mb-2">Logo Found</h5>
                <div className="w-24 h-24 border border-green-300 rounded overflow-hidden">
                  <img 
                    src={importedStyles.images.logo} 
                    alt="Imported logo" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 text-sm text-green-700">
            <strong>Confidence:</strong> {importedStyles.confidence || 0}%
          </div>
        </div>
      )}
    </div>
  );

  const renderPreview = () => {
    const styles = styleMethod === 'import' && importedStyles ? {
      primaryColor: importedStyles.colors?.primary || '#2a2a72',
      secondaryColor: importedStyles.colors?.secondary || '#ffffff',
      accentColor: importedStyles.colors?.accent || '#28a745',
      fontFamily: importedStyles.fonts?.primary || 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
      logoImage: importedStyles.images?.logo || null
    } : manualStyles;

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-foreground" style={{fontSize: 'var(--text-heading-md)'}}>
            Form Preview
          </h3>
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setPreviewMode('original')}
              className={`px-3 py-1 text-xs rounded ${
                previewMode === 'original' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground'
              }`}
            >
              Original
            </button>
            <button
              onClick={() => setPreviewMode('styled')}
              className={`px-3 py-1 text-xs rounded ${
                previewMode === 'styled' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground'
              }`}
            >
              With Your Styles
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Original Form */}
          {previewMode === 'original' && (
            <div>
              <h6 className="text-sm font-medium text-muted-foreground mb-3 text-center">
                Current Style
              </h6>
              <div className="p-6 bg-card border border-border rounded-lg"
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h4 className="text-lg font-semibold" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif', color: 'hsl(var(--crypto-navy))' }}>
                    {formData.campaignName || 'Your Campaign'}
                  </h4>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Donation Amount</label>
                    <input 
                      type="text" 
                      placeholder="$100" 
                      className="w-full px-3 py-2 border border-border bg-background text-foreground rounded"
                      readOnly
                    />
                  </div>
                  <button 
                    className="w-full py-2 rounded font-medium bg-primary text-primary-foreground"
                    style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif' }}
                  >
                    Donate Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Styled Form */}
          <div>
            <h6 className="text-sm font-medium text-green-600 mb-3 text-center">
              {previewMode === 'original' ? 'Your New Style' : 'Styled Form'}
            </h6>
            <div 
              className="p-6 rounded-lg border"
              style={{ 
                backgroundColor: styles.secondaryColor,
                borderColor: styles.primaryColor,
                fontFamily: styles.fontFamily 
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                {styles.logoImage ? (
                  <img 
                    src={styles.logoImage} 
                    alt="Campaign logo" 
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div 
                    className="w-12 h-12 rounded flex items-center justify-center"
                    style={{ backgroundColor: styles.accentColor }}
                  >
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                )}
                <h4 
                  className="text-lg font-semibold"
                  style={{ 
                    fontFamily: styles.fontFamily,
                    color: styles.primaryColor
                  }}
                >
                  {formData.campaignName || 'Your Campaign'}
                </h4>
              </div>
              <div className="space-y-3">
                <div>
                  <label 
                    className="block text-sm mb-1"
                    style={{ 
                      color: styles.primaryColor,
                      fontFamily: styles.fontFamily
                    }}
                  >
                    Donation Amount
                  </label>
                  <input 
                    type="text" 
                    placeholder="$100" 
                    className="w-full px-3 py-2 border rounded"
                    style={{ 
                      borderColor: styles.primaryColor,
                      fontFamily: styles.fontFamily
                    }}
                    readOnly
                  />
                </div>
                <button 
                  className="w-full py-2 text-white rounded font-medium"
                  style={{ 
                    backgroundColor: styles.primaryColor,
                    fontFamily: styles.fontFamily
                  }}
                >
                  Donate Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{backgroundColor: 'hsl(var(--crypto-navy))'}}>'
      <CampaignAuthNav />
      <div className="flex items-center justify-center px-4 py-12">
        <div className="max-w-4xl w-full">
          <div className="bg-card rounded-2xl shadow-2xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mb-4"></div>
              <h2 className="font-bold text-foreground mb-2" style={{fontSize: 'var(--text-heading-xl)'}}>
                Style Your Form
              </h2>
              <p className="text-muted-foreground">
                Steps 4-5: Configure colors, fonts, and images for your donation form
              </p>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">{success}</span>
              </div>
            )}

            {/* Method Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                How would you like to style your form?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setStyleMethod('manual')}
                  className={`p-6 border-2 rounded-xl transition-all ${
                    styleMethod === 'manual'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="text-center">
                    <Palette className="w-8 h-8 mx-auto mb-3 text-primary" />
                    <h4 className="font-semibold text-foreground mb-2">Manual Entry</h4>
                    <p className="text-sm text-muted-foreground">
                      Choose colors, fonts, and upload your logo manually
                    </p>
                  </div>
                </button>
                
                <button
                  onClick={() => setStyleMethod('import')}
                  className={`p-6 border-2 rounded-xl transition-all ${
                    styleMethod === 'import'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="text-center">
                    <Globe className="w-8 h-8 mx-auto mb-3 text-primary" />
                    <h4 className="font-semibold text-foreground mb-2">Import from Website</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically extract colors, fonts, and images from your website
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Style Configuration */}
            <div className="mb-8">
              {styleMethod === 'manual' && renderManualEntry()}
              {styleMethod === 'import' && renderImportSection()}
            </div>

            {/* Form Preview */}
            {(styleMethod === 'manual' || importedStyles) && (
              <div className="mb-8">
                {renderPreview()}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
              {(styleMethod === 'manual' || importedStyles) && (
                <Button
                  onClick={handleApplyStyles}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Applying Styles...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Apply Styles & Continue
                    </>
                  )}
                </Button>
              )}
              
              <Button
                onClick={handleSkip}
                variant="outline"
                className="w-full"
              >
                Skip Styling - Use Defaults
              </Button>
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button
                onClick={() => navigate('/BankConnection')}
                variant="ghost"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Bank Connection
              </Button>
              
              <div className="text-center">
                <div className="text-sm text-muted-foreground">
                  Steps 4-5 of 7 • Style Configuration
                </div>
              </div>
              
              <div className="w-32"> {/* Spacer */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StyleConfigurationForm;