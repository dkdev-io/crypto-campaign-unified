import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import CampaignAnalytics from '../../utils/campaignAnalytics';

const AnalyticsContext = createContext();

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

export const AnalyticsProvider = ({ children, config = {} }) => {
  const [analytics, setAnalytics] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState(null);
  const [supabase] = useState(() => createClient(
    import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co',
    import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-key'
  ));

  useEffect(() => {
    initializeAnalytics();
  }, []);

  const initializeAnalytics = async () => {
    try {
      const analyticsInstance = new CampaignAnalytics({
        ...config,
        debug: import.meta.env.DEV || config.debug,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co',
        supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-key',
        apiEndpoint: '/rest/v1/rpc/create_or_update_session'
      });

      // Override the flushEvents method to use Supabase
      const originalFlushEvents = analyticsInstance.flushEvents.bind(analyticsInstance);
      analyticsInstance.flushEvents = async (synchronous = false) => {
        if (!analyticsInstance.events.length || !analyticsInstance.consentGiven) return;

        const eventsToSend = [...analyticsInstance.events];
        analyticsInstance.events = [];

        if (analyticsInstance.batchTimer) {
          clearTimeout(analyticsInstance.batchTimer);
          analyticsInstance.batchTimer = null;
        }

        try {
          // Process each event
          for (const event of eventsToSend) {
            await processAnalyticsEvent(event, analyticsInstance);
          }

          // Update session summary
          await updateSessionSummary(analyticsInstance);

          analyticsInstance.log('Events sent successfully:', eventsToSend.length);
        } catch (error) {
          analyticsInstance.log('Failed to send events:', error);
          // Re-add events to queue for retry
          analyticsInstance.events.unshift(...eventsToSend);
        }
      };

      setAnalytics(analyticsInstance);
      setIsInitialized(true);
      setTrackingStatus(analyticsInstance.getTrackingStatus());
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  };

  const processAnalyticsEvent = async (event, analyticsInstance) => {
    const campaignId = event.campaign_id;
    if (!campaignId) return;

    try {
      // Create or update session
      const sessionData = await supabase.rpc('create_or_update_session', {
        campaign_id_param: campaignId,
        visitor_id_param: event.visitor_id,
        page_url_param: event.url,
        referrer_param: event.event_data?.referrer || null,
        user_agent_param: event.user_agent,
        ip_address_param: event.location?.ip || null,
        utm_params: {
          utm_source: event.event_data?.traffic_source,
          utm_medium: event.event_data?.traffic_medium,
          utm_campaign: event.event_data?.traffic_campaign,
          utm_content: event.event_data?.traffic_content,
          utm_term: event.event_data?.traffic_term
        }
      });

      if (sessionData.error) {
        throw sessionData.error;
      }

      const sessionId = sessionData.data;

      // Insert page view if it's a page view event
      if (event.event_type === 'page_view') {
        await insertPageView(event, sessionId);
      }

      // Record conversion if it's a conversion event
      if (event.event_type === 'conversion') {
        await recordConversion(event, sessionId);
      }

      // Track other events as page interactions
      if (event.event_type !== 'page_view' && event.event_type !== 'heartbeat') {
        await trackPageInteraction(event, sessionId);
      }

    } catch (error) {
      analyticsInstance.log('Error processing event:', error);
      throw error;
    }
  };

  const insertPageView = async (event, sessionId) => {
    try {
      const { error } = await supabase
        .from('page_views')
        .insert({
          campaign_id: event.campaign_id,
          visitor_id: event.visitor_id,
          session_id: sessionId,
          page_url: event.url,
          page_title: event.event_data?.title,
          referrer: event.event_data?.referrer,
          utm_source: event.event_data?.traffic_source,
          utm_medium: event.event_data?.traffic_medium,
          utm_campaign: event.event_data?.traffic_campaign,
          utm_content: event.event_data?.traffic_content,
          utm_term: event.event_data?.traffic_term,
          user_agent: event.user_agent,
          ip_address: event.location?.ip,
          browser: detectBrowser(event.user_agent),
          os: detectOS(event.user_agent),
          device_type: detectDeviceType(event.user_agent),
          screen_resolution: event.screen_resolution,
          country: event.location?.country,
          region: event.location?.region,
          city: event.location?.city,
          timezone: event.location?.timezone,
          session_start: new Date(event.timestamp),
          page_load_time_ms: event.event_data?.load_time
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error inserting page view:', error);
      throw error;
    }
  };

  const recordConversion = async (event, sessionId) => {
    try {
      const { error } = await supabase.rpc('record_conversion', {
        session_id_param: sessionId,
        contribution_amount_param: event.event_data?.amount || 0,
        transaction_hash_param: event.event_data?.transaction_hash || null
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error recording conversion:', error);
      throw error;
    }
  };

  const trackPageInteraction = async (event, sessionId) => {
    try {
      // Update page views table with interaction data
      const updateData = {};
      
      if (event.event_type === 'click') {
        updateData.clicks_count = supabase.sql`clicks_count + 1`;
      } else if (event.event_type === 'form_submit') {
        updateData.form_submissions = supabase.sql`form_submissions + 1`;
      } else if (event.event_type.startsWith('scroll_')) {
        const scrollPercent = parseInt(event.event_type.split('_')[1]);
        updateData.scroll_depth = Math.max(scrollPercent, 0);
      }

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('page_views')
          .update(updateData)
          .eq('session_id', sessionId)
          .eq('page_url', event.url);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error tracking page interaction:', error);
    }
  };

  const updateSessionSummary = async (analyticsInstance) => {
    if (!analyticsInstance.sessionId) return;

    try {
      // Calculate session duration
      const sessionDuration = analyticsInstance.sessionStart 
        ? Math.floor((Date.now() - analyticsInstance.sessionStart.getTime()) / 1000)
        : 0;

      const { error } = await supabase
        .from('user_sessions_analytics')
        .update({
          session_end: new Date().toISOString(),
          duration_seconds: sessionDuration,
          page_count: analyticsInstance.events.filter(e => e.event_type === 'page_view').length,
          scroll_depth_max: analyticsInstance.maxScrollDepth,
          clicks_total: analyticsInstance.clickCount,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', analyticsInstance.sessionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating session summary:', error);
    }
  };

  // Utility functions for device detection
  const detectBrowser = (userAgent) => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  };

  const detectOS = (userAgent) => {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Other';
  };

  const detectDeviceType = (userAgent) => {
    if (/tablet|ipad/i.test(userAgent)) return 'tablet';
    if (/mobile|android|iphone/i.test(userAgent)) return 'mobile';
    return 'desktop';
  };

  // Analytics methods to expose
  const trackEvent = (eventType, eventData = {}) => {
    analytics?.trackEvent(eventType, eventData);
  };

  const trackConversion = (conversionData) => {
    analytics?.trackConversion(conversionData);
  };

  const trackFormStart = (formId) => {
    trackEvent('form_start', { formId });
  };

  const trackFormField = (fieldId, fieldType) => {
    trackEvent('form_field_interaction', { fieldId, fieldType });
  };

  const trackWalletConnect = (walletType) => {
    trackEvent('wallet_connect', { walletType });
  };

  const trackContributionAttempt = (amount, currency = 'ETH') => {
    trackEvent('contribution_attempt', { amount, currency });
  };

  const trackContributionSuccess = (amount, transactionHash, currency = 'ETH') => {
    trackConversion({
      amount,
      transaction_hash: transactionHash,
      currency,
      success: true
    });
  };

  const trackContributionFailure = (amount, error, currency = 'ETH') => {
    trackEvent('contribution_failure', { amount, currency, error });
  };

  const setConsentStatus = (granted) => {
    analytics?.setTrackingEnabled(granted);
    setTrackingStatus(analytics?.getTrackingStatus());
  };

  const getStatus = () => {
    return trackingStatus;
  };

  const value = {
    analytics,
    isInitialized,
    trackingStatus,
    
    // Tracking methods
    trackEvent,
    trackConversion,
    trackFormStart,
    trackFormField,
    trackWalletConnect,
    trackContributionAttempt,
    trackContributionSuccess,
    trackContributionFailure,
    
    // Privacy methods
    setConsentStatus,
    getStatus,
    clearData: () => analytics?.clearAllData()
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};