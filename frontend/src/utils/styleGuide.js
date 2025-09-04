/**
 * Style Guide Utility Functions
 * Extracts and applies campaign style guide data from Supabase
 */

/**
 * Extract campaign styles with fallbacks
 * @param {Object} campaignData - Campaign data from Supabase
 * @returns {Object} Extracted style configuration
 */
export const extractCampaignStyles = (campaignData) => {
  if (!campaignData) {
    return getDefaultStyles();
  }

  // Priority order: applied_styles > custom_styles > theme_color > defaults
  const appliedStyles = campaignData.applied_styles;
  const customStyles = campaignData.custom_styles;
  const themeColor = campaignData.theme_color;

  return {
    colors: {
      primary:
        appliedStyles?.colors?.primary || customStyles?.colors?.primary || themeColor || '#2a2a72',
      secondary: appliedStyles?.colors?.secondary || customStyles?.colors?.secondary || '#666666',
      accent: appliedStyles?.colors?.accent || customStyles?.colors?.accent || '#28a745',
      background:
        appliedStyles?.colors?.background || customStyles?.colors?.background || '#ffffff',
      text: appliedStyles?.colors?.text || customStyles?.colors?.text || '#333333',
    },
    fonts: {
      heading: {
        family:
          appliedStyles?.fonts?.heading?.suggested ||
          customStyles?.fonts?.heading?.family ||
          'Inter, system-ui, -apple-system, sans-serif',
        weight:
          appliedStyles?.fonts?.heading?.weight || customStyles?.fonts?.heading?.weight || '600',
        size: appliedStyles?.fonts?.heading?.size || customStyles?.fonts?.heading?.size || '1.5rem',
      },
      body: {
        family:
          appliedStyles?.fonts?.body?.suggested ||
          customStyles?.fonts?.body?.family ||
          'Inter, system-ui, -apple-system, sans-serif',
        weight: appliedStyles?.fonts?.body?.weight || customStyles?.fonts?.body?.weight || '400',
        size: appliedStyles?.fonts?.body?.size || customStyles?.fonts?.body?.size || '1rem',
      },
      button: {
        family:
          appliedStyles?.fonts?.button?.suggested ||
          customStyles?.fonts?.button?.family ||
          appliedStyles?.fonts?.heading?.suggested ||
          'Inter, system-ui, -apple-system, sans-serif',
        weight:
          appliedStyles?.fonts?.button?.weight || customStyles?.fonts?.button?.weight || '500',
        size: appliedStyles?.fonts?.button?.size || customStyles?.fonts?.button?.size || '1rem',
      },
    },
    layout: {
      borderRadius:
        appliedStyles?.layout?.recommendations?.borderRadius ||
        customStyles?.layout?.borderRadius ||
        '8px',
      spacing:
        appliedStyles?.layout?.recommendations?.margin || customStyles?.layout?.spacing || '1rem',
    },
    // Source information for debugging
    source: {
      hasAppliedStyles: !!appliedStyles,
      hasCustomStyles: !!customStyles,
      hasThemeColor: !!themeColor,
      websiteAnalyzed: campaignData.website_analyzed,
      stylesApplied: campaignData.styles_applied,
    },
  };
};

/**
 * Get default styles when no campaign data is available
 * @returns {Object} Default style configuration
 */
export const getDefaultStyles = () => ({
  colors: {
    primary: '#2a2a72',
    secondary: '#666666',
    accent: '#28a745',
    background: '#ffffff',
    text: '#333333',
  },
  fonts: {
    heading: {
      family: 'Inter, system-ui, -apple-system, sans-serif',
      weight: '600',
      size: '1.5rem',
    },
    body: {
      family: 'Inter, system-ui, -apple-system, sans-serif',
      weight: '400',
      size: '1rem',
    },
    button: {
      family: 'Inter, system-ui, -apple-system, sans-serif',
      weight: '500',
      size: '1rem',
    },
  },
  layout: {
    borderRadius: '8px',
    spacing: '1rem',
  },
  source: {
    hasAppliedStyles: false,
    hasCustomStyles: false,
    hasThemeColor: false,
    websiteAnalyzed: null,
    stylesApplied: false,
  },
});

/**
 * Generate CSS custom properties from campaign styles
 * @param {Object} campaignData - Campaign data from Supabase
 * @returns {Object} CSS custom properties object
 */
export const generateCSSProperties = (campaignData) => {
  const styles = extractCampaignStyles(campaignData);

  return {
    '--campaign-color-primary': styles.colors.primary,
    '--campaign-color-secondary': styles.colors.secondary,
    '--campaign-color-accent': styles.colors.accent,
    '--campaign-color-background': styles.colors.background,
    '--campaign-color-text': styles.colors.text,
    '--campaign-font-heading': styles.fonts.heading.family,
    '--campaign-font-body': styles.fonts.body.family,
    '--campaign-font-button': styles.fonts.button.family,
    '--campaign-border-radius': styles.layout.borderRadius,
    '--campaign-spacing': styles.layout.spacing,
  };
};

/**
 * Apply campaign styles to a React component's style prop
 * @param {Object} campaignData - Campaign data from Supabase
 * @param {Object} baseStyles - Base styles to merge with
 * @returns {Object} Combined styles object
 */
export const applyCampaignStyles = (campaignData, baseStyles = {}) => {
  const styles = extractCampaignStyles(campaignData);
  const cssProps = generateCSSProperties(campaignData);

  return {
    ...baseStyles,
    ...cssProps,
    // Common style applications
    '--primary-color': styles.colors.primary,
    '--text-color': styles.colors.text,
    '--font-family': styles.fonts.body.family,
  };
};

/**
 * Get button styles based on campaign theme
 * @param {Object} campaignData - Campaign data from Supabase
 * @param {string} variant - Button variant ('primary', 'secondary', 'accent')
 * @returns {Object} Button style object
 */
export const getCampaignButtonStyles = (campaignData, variant = 'primary') => {
  const styles = extractCampaignStyles(campaignData);

  const baseButton = {
    fontFamily: styles.fonts.button.family,
    fontWeight: styles.fonts.button.weight,
    fontSize: styles.fonts.button.size,
    borderRadius: styles.layout.borderRadius,
    padding: `calc(${styles.layout.spacing} * 0.75) calc(${styles.layout.spacing} * 1.5)`,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
  };

  switch (variant) {
    case 'primary':
      return {
        ...baseButton,
        backgroundColor: styles.colors.primary,
        color: '#ffffff',
      };
    case 'secondary':
      return {
        ...baseButton,
        backgroundColor: styles.colors.secondary,
        color: '#ffffff',
      };
    case 'accent':
      return {
        ...baseButton,
        backgroundColor: styles.colors.accent,
        color: '#ffffff',
      };
    default:
      return baseButton;
  }
};

/**
 * Debug function to log style guide information
 * @param {Object} campaignData - Campaign data from Supabase
 */
export const debugCampaignStyles = (campaignData) => {
  const styles = extractCampaignStyles(campaignData);

  console.log('🎨 Campaign Style Debug:', {
    campaignId: campaignData?.id,
    source: styles.source,
    extractedStyles: {
      primaryColor: styles.colors.primary,
      headingFont: styles.fonts.heading.family,
      bodyFont: styles.fonts.body.family,
    },
    rawData: {
      applied_styles: campaignData?.applied_styles,
      custom_styles: campaignData?.custom_styles,
      theme_color: campaignData?.theme_color,
    },
  });

  return styles;
};
