/**
 * Middleware to integrate donor page automation with existing campaign setup
 * Automatically triggers page creation after successful form setup completion
 */

const donorPageAutomation = require('../services/donorPageAutomation');
const { triggerWebhooks } = require('../utils/webhookUtils');

/**
 * Middleware to automatically trigger donor page creation after campaign setup
 * This integrates with the existing EmbedCode.jsx workflow
 */
const integrateDonorPageAutomation = (req, res, next) => {
  // Store the original res.json to intercept responses
  const originalJson = res.json;
  
  res.json = async function(data) {
    try {
      // Check if this is a successful embed code generation response
      if (shouldTriggerPageCreation(req, data)) {
        console.log('🚀 Triggering donor page automation from middleware');
        
        const campaignId = extractCampaignId(req, data);
        
        if (campaignId) {
          // Don't await this to avoid blocking the response
          triggerPageCreationAsync(campaignId)
            .catch(error => {
              console.error('❌ Background donor page creation failed:', error);
            });
        }
      }
      
      // Call the original res.json
      originalJson.call(this, data);
      
    } catch (error) {
      console.error('❌ Donor page middleware error:', error);
      // Still send the original response even if our automation fails
      originalJson.call(this, data);
    }
  };
  
  next();
};

/**
 * Determine if we should trigger page creation based on the request/response
 */
function shouldTriggerPageCreation(req, responseData) {
  // Check if this is the embed code generation endpoint
  const isEmbedEndpoint = req.path?.includes('generate_embed_code') || 
                          req.body?.p_campaign_id ||
                          responseData?.embedCode;
  
  // Check if this is a successful setup completion
  const isSetupComplete = responseData?.setupCompleted ||
                          responseData?.embedGenerated ||
                          (responseData?.data && typeof responseData.data === 'string' && 
                           responseData.data.includes('<script>'));
  
  return isEmbedEndpoint && isSetupComplete;
}

/**
 * Extract campaign ID from request/response data
 */
function extractCampaignId(req, responseData) {
  // Try various sources for campaign ID
  return req.body?.p_campaign_id ||
         req.params?.campaignId ||
         req.query?.campaign ||
         responseData?.campaignId ||
         extractFromUrl(req.originalUrl);
}

/**
 * Extract campaign ID from URL path
 */
function extractFromUrl(url) {
  const matches = url.match(/campaign[=/]([a-f0-9-]+)/i);
  return matches ? matches[1] : null;
}

/**
 * Async function to handle page creation without blocking response
 */
async function triggerPageCreationAsync(campaignId) {
  try {
    console.log('📄 Creating donor page for campaign:', campaignId);
    
    // Get campaign data
    const { supabase } = require('../lib/supabase');
    const { data: campaignData, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();
    
    if (error) {
      console.error('Failed to fetch campaign data:', error);
      return;
    }
    
    if (!campaignData) {
      console.error('Campaign not found:', campaignId);
      return;
    }
    
    // Check if page already exists
    if (campaignData.donor_page_generated) {
      console.log('Donor page already exists for campaign:', campaignId);
      return;
    }
    
    // Trigger page creation
    const result = await donorPageAutomation.triggerPageCreation(campaignData);
    
    // Trigger webhooks for the setup completion event
    await triggerWebhooks(campaignId, 'setup.completed', campaignData);
    
    console.log('✅ Donor page automation completed successfully:', result.url);
    
  } catch (error) {
    console.error('❌ Async donor page creation failed:', error);
    
    // Log the error but don't throw (this runs in background)
    const { supabase } = require('../lib/supabase');
    await supabase
      .from('donor_page_logs')
      .insert({
        campaign_id: campaignId,
        event_type: 'error',
        error_message: error.message,
        error_stack: error.stack,
        created_at: new Date().toISOString()
      })
      .catch(logError => {
        console.error('Failed to log error:', logError);
      });
  }
}

/**
 * Error handling middleware for donor page operations
 */
const handleDonorPageErrors = (err, req, res, next) => {
  // Check if this is a donor page related error
  if (err.message?.includes('donor page') || err.donorPageError) {
    console.error('🚫 Donor page error:', err);
    
    return res.status(500).json({
      error: 'Donor page automation failed',
      message: 'The embed code was generated successfully, but there was an issue creating your donor page. Please contact support.',
      embedCodeWorking: true,
      donorPageError: true
    });
  }
  
  // Pass to next error handler
  next(err);
};

/**
 * Middleware to add donor page URLs to campaign responses
 */
const enrichCampaignWithDonorPage = async (req, res, next) => {
  const originalJson = res.json;
  
  res.json = async function(data) {
    try {
      // Check if this is a campaign response that should include donor page info
      if (shouldEnrichWithDonorPage(data)) {
        const enriched = await addDonorPageInfo(data);
        originalJson.call(this, enriched);
      } else {
        originalJson.call(this, data);
      }
    } catch (error) {
      console.error('Failed to enrich with donor page info:', error);
      originalJson.call(this, data);
    }
  };
  
  next();
};

/**
 * Check if response should be enriched with donor page info
 */
function shouldEnrichWithDonorPage(data) {
  return data?.id || // Single campaign
         (Array.isArray(data) && data[0]?.id) || // Campaign array
         data?.campaigns; // Campaigns object
}

/**
 * Add donor page information to campaign data
 */
async function addDonorPageInfo(data) {
  const { supabase } = require('../lib/supabase');
  
  try {
    if (data.id) {
      // Single campaign
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('donor_page_url, donor_page_generated')
        .eq('id', data.id)
        .single();
      
      if (campaign) {
        data.donorPageUrl = campaign.donor_page_url;
        data.donorPageGenerated = campaign.donor_page_generated;
      }
      
    } else if (Array.isArray(data)) {
      // Array of campaigns
      for (let campaign of data) {
        if (campaign.id) {
          const { data: donorInfo } = await supabase
            .from('campaigns')
            .select('donor_page_url, donor_page_generated')
            .eq('id', campaign.id)
            .single();
          
          if (donorInfo) {
            campaign.donorPageUrl = donorInfo.donor_page_url;
            campaign.donorPageGenerated = donorInfo.donor_page_generated;
          }
        }
      }
    }
    
    return data;
  } catch (error) {
    console.error('Failed to add donor page info:', error);
    return data;
  }
}

/**
 * Middleware to monitor donor page performance
 */
const monitorDonorPagePerformance = (req, res, next) => {
  const start = Date.now();
  
  // Log request start
  console.log(`📊 Donor page request: ${req.method} ${req.path}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log slow requests
    if (duration > 5000) {
      console.warn(`⚠️ Slow donor page request: ${duration}ms for ${req.method} ${req.path}`);
    }
    
    // Log errors
    if (res.statusCode >= 400) {
      console.error(`❌ Donor page request error: ${res.statusCode} for ${req.method} ${req.path}`);
    }
  });
  
  next();
};

/**
 * Security middleware for donor page endpoints
 */
const secureDonorPageAccess = (req, res, next) => {
  // Add security headers for donor pages
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Rate limiting for page generation (prevent abuse)
  if (req.path?.includes('regenerate') || req.method === 'POST') {
    // Simple in-memory rate limiting
    const ip = req.ip;
    const key = `donor_page_${ip}`;
    const now = Date.now();
    
    // Allow 5 requests per minute
    if (!req.app.locals.rateLimits) {
      req.app.locals.rateLimits = new Map();
    }
    
    const requests = req.app.locals.rateLimits.get(key) || [];
    const recentRequests = requests.filter(time => now - time < 60000);
    
    if (recentRequests.length >= 5) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many donor page requests. Please wait a minute before trying again.'
      });
    }
    
    recentRequests.push(now);
    req.app.locals.rateLimits.set(key, recentRequests);
    
    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      for (const [k, times] of req.app.locals.rateLimits.entries()) {
        const recent = times.filter(time => now - time < 60000);
        if (recent.length === 0) {
          req.app.locals.rateLimits.delete(k);
        } else {
          req.app.locals.rateLimits.set(k, recent);
        }
      }
    }
  }
  
  next();
};

module.exports = {
  integrateDonorPageAutomation,
  handleDonorPageErrors,
  enrichCampaignWithDonorPage,
  monitorDonorPagePerformance,
  secureDonorPageAccess
};