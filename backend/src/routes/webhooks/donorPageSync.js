/**
 * Webhook endpoints for donor page synchronization
 * Handles real-time updates when campaign data changes
 */

const express = require('express');
const crypto = require('crypto');
const donorPageAutomation = require('../../services/donorPageAutomation');
const { supabase } = require('../../lib/supabase');

const router = express.Router();

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(req, res, next) {
  const signature = req.headers['x-webhook-signature'];
  const payload = JSON.stringify(req.body);
  const secret = process.env.WEBHOOK_SECRET || 'default-secret';
  
  if (!signature) {
    return res.status(401).json({ error: 'Missing webhook signature' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  const computedSignature = `sha256=${expectedSignature}`;

  if (!crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature)
  )) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  next();
}

/**
 * Campaign-specific donor page sync webhook
 * POST /api/webhooks/donor-page-sync/:campaignId
 */
router.post('/donor-page-sync/:campaignId', verifyWebhookSignature, async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { event, data, changes } = req.body;

    console.log('🔄 Received donor page sync webhook:', {
      campaignId,
      event,
      timestamp: new Date().toISOString()
    });

    // Validate campaign exists
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Handle different webhook events
    let result;
    
    switch (event) {
      case 'campaign.updated':
        result = await handleCampaignUpdate(campaignId, changes);
        break;
        
      case 'form.customized':
        result = await handleFormCustomization(campaignId, changes);
        break;
        
      case 'embed.regenerated':
        result = await handleEmbedRegeneration(campaignId, changes);
        break;
        
      case 'setup.completed':
        result = await handleSetupCompletion(campaignId, data);
        break;
        
      default:
        console.warn('Unknown webhook event:', event);
        return res.status(400).json({ error: 'Unknown event type' });
    }

    // Log webhook processing
    await logWebhookEvent(campaignId, event, 'success', result);

    res.json({
      success: true,
      event,
      campaignId,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    
    // Log webhook error
    await logWebhookEvent(req.params.campaignId, req.body.event, 'error', {
      message: error.message,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Webhook processing failed',
      message: error.message
    });
  }
});

/**
 * Handle campaign update events
 */
async function handleCampaignUpdate(campaignId, changes) {
  console.log('📝 Handling campaign update:', changes);
  
  // Check if changes affect the donor page
  const affectingFields = [
    'campaign_name',
    'committee_name', 
    'theme_color',
    'description'
  ];
  
  const needsUpdate = Object.keys(changes).some(field => 
    affectingFields.includes(field)
  );
  
  if (needsUpdate) {
    return await donorPageAutomation.syncPageFromWebhook(campaignId, changes);
  }
  
  return { message: 'No donor page update required' };
}

/**
 * Handle form customization events
 */
async function handleFormCustomization(campaignId, changes) {
  console.log('🎨 Handling form customization:', changes);
  
  // Form customization always affects the donor page
  return await donorPageAutomation.syncPageFromWebhook(campaignId, changes);
}

/**
 * Handle embed code regeneration
 */
async function handleEmbedRegeneration(campaignId, changes) {
  console.log('🔄 Handling embed regeneration:', changes);
  
  // Embed regeneration always requires page update
  return await donorPageAutomation.syncPageFromWebhook(campaignId, changes);
}

/**
 * Handle initial setup completion (triggers first page creation)
 */
async function handleSetupCompletion(campaignId, data) {
  console.log('✅ Handling setup completion:', campaignId);
  
  // Get full campaign data
  const { data: campaignData, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch campaign data: ${error.message}`);
  }

  // Trigger initial page creation
  return await donorPageAutomation.triggerPageCreation(campaignData);
}

/**
 * Manual webhook trigger for testing
 * POST /api/webhooks/donor-page-sync/:campaignId/test
 */
router.post('/donor-page-sync/:campaignId/test', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Test endpoint not available in production' });
  }

  try {
    const { campaignId } = req.params;
    const { event = 'campaign.updated' } = req.body;

    console.log('🧪 Testing webhook for campaign:', campaignId);

    // Trigger webhook processing
    const result = await donorPageAutomation.syncPageFromWebhook(campaignId, {
      test: true,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      test: true,
      campaignId,
      event,
      result
    });

  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({
      error: 'Test webhook failed',
      message: error.message
    });
  }
});

/**
 * Get webhook logs for a campaign
 * GET /api/webhooks/donor-page-sync/:campaignId/logs
 */
router.get('/donor-page-sync/:campaignId/logs', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const { data: logs, error } = await supabase
      .from('donor_page_logs')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      campaignId,
      logs,
      count: logs.length
    });

  } catch (error) {
    console.error('Failed to fetch webhook logs:', error);
    res.status(500).json({
      error: 'Failed to fetch logs',
      message: error.message
    });
  }
});

/**
 * Log webhook events
 */
async function logWebhookEvent(campaignId, event, status, data) {
  try {
    const { error } = await supabase
      .from('donor_page_logs')
      .insert({
        campaign_id: campaignId,
        event_type: `webhook.${event}`,
        status,
        data: JSON.stringify(data),
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to log webhook event:', error);
    }
  } catch (error) {
    console.error('Webhook logging error:', error);
  }
}

/**
 * Health check endpoint
 * GET /api/webhooks/donor-page-sync/health
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'donor-page-sync-webhooks',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;