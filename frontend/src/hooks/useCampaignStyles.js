import { useState, useEffect } from 'react';
import { extractCampaignStyles, generateCSSProperties, getCampaignButtonStyles } from '../utils/styleGuide';

/**
 * Custom hook to manage campaign-specific styling across components
 * Provides consistent styling based on campaign configuration
 */
export const useCampaignStyles = () => {
  const [campaignStyles, setCampaignStyles] = useState(null);
  const [cssProperties, setCssProperties] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCampaignStyles = async () => {
      try {
        // Check multiple sources for campaign identification
        const urlParams = new URLSearchParams(window.location.search);
        let campaignId = urlParams.get('campaignId') || 
                        urlParams.get('campaign') || 
                        localStorage.getItem('currentCampaignId') ||
                        sessionStorage.getItem('activeCampaignId');

        // Try to extract from URL path (e.g., /campaigns/123/setup)
        if (!campaignId) {
          const pathMatch = window.location.pathname.match(/\/campaigns\/([a-zA-Z0-9-]+)/);
          if (pathMatch) {
            campaignId = pathMatch[1];
          }
        }

        if (campaignId) {
          console.log('🎨 Loading campaign styles for ID:', campaignId);
          
          // Try multiple API endpoints to fetch campaign data
          const endpoints = [
            `/api/campaigns/${campaignId}`,
            `/api/public/campaigns/${campaignId}`,
            // Fallback to Supabase direct query if API endpoints fail
          ];

          let campaignData = null;
          
          for (const endpoint of endpoints) {
            try {
              const response = await fetch(endpoint);
              if (response.ok) {
                campaignData = await response.json();
                break;
              }
            } catch (err) {
              console.warn(`Failed to fetch from ${endpoint}:`, err);
            }
          }

          // Fallback: try to get from Supabase directly if we have access
          if (!campaignData) {
            try {
              // This will only work if supabase client is available
              const { supabase } = await import('../lib/supabase');
              const { data, error } = await supabase
                .from('campaigns')
                .select('*')
                .eq('id', campaignId)
                .single();
              
              if (!error && data) {
                campaignData = data;
                console.log('✅ Loaded campaign data from Supabase');
              }
            } catch (err) {
              console.warn('Could not load from Supabase directly:', err);
            }
          }

          if (campaignData) {
            const styles = extractCampaignStyles(campaignData);
            const cssProps = generateCSSProperties(campaignData);
            
            setCampaignStyles(styles);
            setCssProperties(cssProps);
            
            // Apply CSS custom properties to document root
            const root = document.documentElement;
            Object.entries(cssProps).forEach(([property, value]) => {
              root.style.setProperty(property, value);
            });
            
            console.log('🎨 Applied campaign styles:', {
              campaignId,
              primaryColor: styles.colors.primary,
              headingFont: styles.fonts.heading.family,
              source: styles.source
            });
          } else {
            console.warn('No campaign data found, using default styles');
          }
        } else {
          console.log('No campaign ID found, using default styles');
        }
      } catch (error) {
        console.error('Error loading campaign styles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCampaignStyles();
  }, []);

  // Helper functions for common styling patterns
  const getContainerStyle = () => ({
    background: campaignStyles ? 
      `linear-gradient(135deg, ${campaignStyles.colors.primary} 0%, ${campaignStyles.colors.secondary} 100%)` : 
      'var(--gradient-hero)',
    fontFamily: campaignStyles?.fonts.body.family || 'Inter, system-ui, sans-serif',
    ...cssProperties
  });

  const getCardStyle = () => ({
    backgroundColor: '#1e40af',
    color: 'hsl(var(--crypto-white))',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    borderRadius: 'var(--radius)',
    backdropFilter: 'blur(10px)'
  });

  const getHeadingStyle = (level = 'heading') => ({
    color: 'hsl(var(--crypto-white))',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 'var(--text-heading-xl)',
    fontWeight: '800'
  });

  const getTextStyle = () => ({
    color: 'hsl(var(--crypto-white))',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 'var(--text-body)'
  });

  const getLinkStyle = () => ({
    color: campaignStyles?.colors.primary || 'var(--primary)',
    fontFamily: campaignStyles?.fonts.body.family || 'Inter, system-ui, sans-serif'
  });

  const getButtonStyle = (variant = 'primary') => {
    if (!campaignStyles) return {};
    return getCampaignButtonStyles(campaignStyles, variant);
  };

  const getTabStyle = (isActive = false) => ({
    backgroundColor: isActive ? 
      (campaignStyles?.colors.primary || 'var(--primary)') : 
      (campaignStyles?.colors.background || 'var(--muted)'),
    color: isActive ? 
      (campaignStyles?.colors.background || 'var(--primary-foreground)') : 
      (campaignStyles?.colors.secondary || 'var(--muted-foreground)'),
    fontFamily: campaignStyles?.fonts.button.family || 'Inter, system-ui, sans-serif',
    borderRadius: campaignStyles?.layout.borderRadius || '0.5rem'
  });

  return {
    campaignStyles,
    cssProperties,
    isLoading,
    // Helper functions
    getContainerStyle,
    getCardStyle,
    getHeadingStyle,
    getTextStyle,
    getLinkStyle,
    getButtonStyle,
    getTabStyle,
    // Direct access for advanced use
    extractCampaignStyles,
    generateCSSProperties,
    getCampaignButtonStyles
  };
};