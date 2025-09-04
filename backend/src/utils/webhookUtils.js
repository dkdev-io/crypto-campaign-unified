/**
 * Webhook utilities for managing campaign update notifications
 * Handles webhook creation, management, and delivery
 */

const crypto = require('crypto');
const { supabase } = require('../lib/supabase');

/**
 * Create webhook for campaign events
 */
async function createWebhookForCampaign(config) {
  const {
    campaignId,
    events = ['campaign.updated'],
    endpoint,
    secret = process.env.WEBHOOK_SECRET || 'default-secret',
  } = config;

  try {
    // Store webhook configuration in database
    const { data, error } = await supabase
      .from('campaign_webhooks')
      .insert({
        campaign_id: campaignId,
        endpoint,
        events,
        secret_hash: hashSecret(secret),
        status: 'active',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Webhook created for campaign:', campaignId);
    return data;
  } catch (error) {
    console.error('❌ Failed to create webhook:', error);
    throw error;
  }
}

/**
 * Update existing webhook configuration
 */
async function updateWebhook(webhookId, updates) {
  try {
    const { data, error } = await supabase
      .from('campaign_webhooks')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', webhookId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to update webhook:', error);
    throw error;
  }
}

/**
 * Delete webhook
 */
async function deleteWebhook(webhookId) {
  try {
    const { error } = await supabase.from('campaign_webhooks').delete().eq('id', webhookId);

    if (error) throw error;

    console.log('✅ Webhook deleted:', webhookId);
    return true;
  } catch (error) {
    console.error('Failed to delete webhook:', error);
    throw error;
  }
}

/**
 * Get all webhooks for a campaign
 */
async function getCampaignWebhooks(campaignId) {
  try {
    const { data, error } = await supabase
      .from('campaign_webhooks')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('status', 'active');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to fetch campaign webhooks:', error);
    return [];
  }
}

/**
 * Trigger webhooks for campaign events
 */
async function triggerWebhooks(campaignId, event, data, changes = {}) {
  try {
    console.log('🔔 Triggering webhooks for:', { campaignId, event });

    // Get active webhooks for this campaign
    const webhooks = await getCampaignWebhooks(campaignId);

    if (webhooks.length === 0) {
      console.log('No active webhooks found for campaign:', campaignId);
      return [];
    }

    // Filter webhooks by event type
    const relevantWebhooks = webhooks.filter(
      (webhook) => webhook.events.includes(event) || webhook.events.includes('*')
    );

    if (relevantWebhooks.length === 0) {
      console.log('No webhooks configured for event:', event);
      return [];
    }

    // Send webhooks in parallel
    const results = await Promise.allSettled(
      relevantWebhooks.map((webhook) => sendWebhook(webhook, event, data, changes))
    );

    // Log results
    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    console.log(`📊 Webhook results: ${successful} success, ${failed} failed`);

    return results;
  } catch (error) {
    console.error('❌ Failed to trigger webhooks:', error);
    throw error;
  }
}

/**
 * Send individual webhook
 */
async function sendWebhook(webhook, event, data, changes) {
  try {
    const payload = {
      event,
      data,
      changes,
      timestamp: new Date().toISOString(),
      campaignId: webhook.campaign_id,
    };

    const signature = generateWebhookSignature(payload, webhook.secret_hash);

    console.log('📤 Sending webhook to:', webhook.endpoint);

    const response = await fetch(webhook.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': event,
        'User-Agent': 'CryptoCampaign-Webhooks/1.0',
      },
      body: JSON.stringify(payload),
      timeout: 30000, // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }

    // Log successful delivery
    await logWebhookDelivery(webhook.id, event, 'success', {
      status: response.status,
      response: await response.text(),
    });

    console.log('✅ Webhook delivered successfully');
    return { success: true, webhook: webhook.endpoint };
  } catch (error) {
    console.error('❌ Webhook delivery failed:', error);

    // Log failed delivery
    await logWebhookDelivery(webhook.id, event, 'failed', {
      error: error.message,
      stack: error.stack,
    });

    // Handle webhook failures
    await handleWebhookFailure(webhook.id, error);

    throw error;
  }
}

/**
 * Generate webhook signature
 */
function generateWebhookSignature(payload, secret) {
  const payloadString = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', secret).update(payloadString).digest('hex');

  return `sha256=${signature}`;
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = generateWebhookSignature(payload, secret);

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

/**
 * Hash secret for storage
 */
function hashSecret(secret) {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

/**
 * Log webhook delivery attempts
 */
async function logWebhookDelivery(webhookId, event, status, details) {
  try {
    const { error } = await supabase.from('webhook_delivery_logs').insert({
      webhook_id: webhookId,
      event,
      status,
      details: JSON.stringify(details),
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to log webhook delivery:', error);
    }
  } catch (error) {
    console.error('Webhook logging error:', error);
  }
}

/**
 * Handle webhook delivery failures
 */
async function handleWebhookFailure(webhookId, error) {
  try {
    // Get current failure count
    const { data: webhook } = await supabase
      .from('campaign_webhooks')
      .select('failure_count')
      .eq('id', webhookId)
      .single();

    const failureCount = (webhook?.failure_count || 0) + 1;
    const maxFailures = 5;

    if (failureCount >= maxFailures) {
      // Disable webhook after too many failures
      await supabase
        .from('campaign_webhooks')
        .update({
          status: 'disabled',
          failure_count: failureCount,
          disabled_at: new Date().toISOString(),
          disable_reason: `Too many failures: ${error.message}`,
        })
        .eq('id', webhookId);

      console.warn(`🚫 Webhook disabled after ${failureCount} failures:`, webhookId);
    } else {
      // Update failure count
      await supabase
        .from('campaign_webhooks')
        .update({
          failure_count: failureCount,
          last_failure_at: new Date().toISOString(),
        })
        .eq('id', webhookId);
    }
  } catch (updateError) {
    console.error('Failed to handle webhook failure:', updateError);
  }
}

/**
 * Retry failed webhooks
 */
async function retryFailedWebhooks(campaignId, event) {
  try {
    // Get recently failed webhooks
    const { data: failedWebhooks } = await supabase
      .from('campaign_webhooks')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('status', 'active')
      .lt('failure_count', 5)
      .gt('last_failure_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (!failedWebhooks || failedWebhooks.length === 0) {
      return [];
    }

    console.log(`🔄 Retrying ${failedWebhooks.length} failed webhooks`);

    // Get campaign data for retry
    const { data: campaignData } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    // Retry each webhook
    const retryResults = await Promise.allSettled(
      failedWebhooks.map((webhook) => sendWebhook(webhook, event, campaignData, { retry: true }))
    );

    return retryResults;
  } catch (error) {
    console.error('Failed to retry webhooks:', error);
    return [];
  }
}

/**
 * Get webhook delivery statistics
 */
async function getWebhookStats(campaignId, timeframe = '24h') {
  try {
    const timeframeSql =
      timeframe === '24h'
        ? "created_at > now() - interval '24 hours'"
        : timeframe === '7d'
          ? "created_at > now() - interval '7 days'"
          : "created_at > now() - interval '30 days'";

    const { data, error } = await supabase.rpc('get_webhook_stats', {
      campaign_id: campaignId,
      timeframe: timeframeSql,
    });

    if (error) throw error;

    return (
      data || {
        total_deliveries: 0,
        successful_deliveries: 0,
        failed_deliveries: 0,
        success_rate: 0,
      }
    );
  } catch (error) {
    console.error('Failed to get webhook stats:', error);
    return {
      total_deliveries: 0,
      successful_deliveries: 0,
      failed_deliveries: 0,
      success_rate: 0,
    };
  }
}

module.exports = {
  createWebhookForCampaign,
  updateWebhook,
  deleteWebhook,
  getCampaignWebhooks,
  triggerWebhooks,
  sendWebhook,
  generateWebhookSignature,
  verifyWebhookSignature,
  retryFailedWebhooks,
  getWebhookStats,
};
