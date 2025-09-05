import React, { createContext, useContext, useState, useEffect } from 'react';
import { extractCampaignStyles, generateCSSProperties, getCampaignButtonStyles } from '../utils/styleGuide';

const CampaignStyleContext = createContext({});

export const useCampaignStyleContext = () => {
  const context = useContext(CampaignStyleContext);
  if (!context) {
    console.warn('useCampaignStyleContext used outside of CampaignStyleProvider, using defaults');
    return {
      campaignStyles: null,
      cssProperties: {},
      isLoading: false,
      getContainerStyle: () => ({ background: 'var(--gradient-hero)' }),
      getCardStyle: () => ({ backgroundColor: 'rgba(255, 255, 255, 0.95)' }),
      getHeadingStyle: () => ({ color: 'var(--foreground)' }),
      getTextStyle: () => ({ color: 'inherit' }),
      getLinkStyle: () => ({ color: 'var(--primary)' }),
      getButtonStyle: () => ({}),
      getTabStyle: () => ({})
    };
  }
  return context;
};

export const CampaignStyleProvider = ({ children }) => {
  const [campaignStyles, setCampaignStyles] = useState(null);
  const [cssProperties, setCssProperties] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastCampaignId, setLastCampaignId] = useState(null);

  const loadCampaignStyles = async (campaignId) => {
    if (!campaignId || campaignId === lastCampaignId) {
      setIsLoading(false);
      return;
    }

    try {
      console.log('🎨 CampaignStyleProvider: Loading styles for campaign:', campaignId);
      
      let campaignData = null;
      
      // Try multiple API endpoints
      const endpoints = [
        `/api/campaigns/${campaignId}`,
        `/api/public/campaigns/${campaignId}`
      ];

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

      // Fallback to Supabase
      if (!campaignData) {
        try {
          const { supabase } = await import('../lib/supabase');
          const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', campaignId)
            .single();
          
          if (!error && data) {
            campaignData = data;
          }
        } catch (err) {
          console.warn('Could not load from Supabase:', err);
        }
      }

      if (campaignData) {
        const styles = extractCampaignStyles(campaignData);
        const cssProps = generateCSSProperties(campaignData);
        
        setCampaignStyles(styles);
        setCssProperties(cssProps);
        setLastCampaignId(campaignId);
        
        // Apply to document root
        const root = document.documentElement;
        Object.entries(cssProps).forEach(([property, value]) => {
          root.style.setProperty(property, value);
        });
        
        console.log('✅ Applied campaign styles:', {
          campaignId,
          primaryColor: styles.colors.primary,
          headingFont: styles.fonts.heading.family
        });
      }
    } catch (error) {
      console.error('Error loading campaign styles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-detect campaign ID from multiple sources
  useEffect(() => {
    const detectCampaignId = () => {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('campaignId') || 
             urlParams.get('campaign') || 
             localStorage.getItem('currentCampaignId') ||
             sessionStorage.getItem('activeCampaignId') ||
             window.location.pathname.match(/\/campaigns\/([a-zA-Z0-9-]+)/)?.[1];
    };

    const campaignId = detectCampaignId();
    if (campaignId) {
      loadCampaignStyles(campaignId);
    } else {
      setIsLoading(false);
    }

    // Listen for campaign changes
    const handleCampaignChange = (event) => {
      if (event.detail && event.detail.campaignId) {
        loadCampaignStyles(event.detail.campaignId);
      }
    };

    window.addEventListener('campaignChanged', handleCampaignChange);
    
    return () => {
      window.removeEventListener('campaignChanged', handleCampaignChange);
    };
  }, []);

  // Helper functions
  const getContainerStyle = () => ({
    background: campaignStyles ? 
      `linear-gradient(135deg, ${campaignStyles.colors.primary} 0%, ${campaignStyles.colors.secondary} 100%)` : 
      'var(--gradient-hero)',
    fontFamily: campaignStyles?.fonts.body.family || 'Inter, system-ui, sans-serif',
    ...cssProperties
  });

  const getCardStyle = () => ({
    backgroundColor: campaignStyles?.colors.background || 'rgba(255, 255, 255, 0.95)',
    color: campaignStyles?.colors.text || 'inherit',
    fontFamily: campaignStyles?.fonts.body.family || 'Inter, system-ui, sans-serif',
    borderRadius: campaignStyles?.layout.borderRadius || '1rem',
    backdropFilter: 'blur(10px)'
  });

  const getHeadingStyle = (level = 'heading') => ({
    color: campaignStyles?.colors.primary || 'var(--foreground)',
    fontFamily: campaignStyles?.fonts.heading.family || 'Inter, system-ui, sans-serif',
    fontSize: campaignStyles?.fonts.heading.size || 'var(--text-heading-xl)',
    fontWeight: campaignStyles?.fonts.heading.weight || '700'
  });

  const getTextStyle = () => ({
    color: campaignStyles?.colors.text || 'inherit',
    fontFamily: campaignStyles?.fonts.body.family || 'Inter, system-ui, sans-serif',
    fontSize: campaignStyles?.fonts.body.size || '1rem'
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

  const value = {
    campaignStyles,
    cssProperties,
    isLoading,
    getContainerStyle,
    getCardStyle,
    getHeadingStyle,
    getTextStyle,
    getLinkStyle,
    getButtonStyle,
    getTabStyle,
    // Direct access
    loadCampaignStyles,
    extractCampaignStyles,
    generateCSSProperties,
    getCampaignButtonStyles
  };

  return (
    <CampaignStyleContext.Provider value={value}>
      {children}
    </CampaignStyleContext.Provider>
  );
};

export default CampaignStyleProvider;