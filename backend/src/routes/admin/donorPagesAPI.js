/**
 * Admin API endpoints for donor page management
 * Provides CRUD operations for generated donor pages
 */

const express = require('express');
const donorPageAutomation = require('../../services/donorPageAutomation');
const { supabase } = require('../../lib/supabase');
const { requireAuth, requireAdmin } = require('../../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);
router.use(requireAdmin);

/**
 * Get all generated donor pages
 * GET /api/admin/donor-pages
 */
router.get('/', async (req, res) => {
  try {
    console.log('📊 Fetching all donor pages for admin dashboard');

    // Get all campaigns with donor pages
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select(
        `
        id,
        campaign_name,
        committee_name,
        donor_page_url,
        donor_page_generated,
        donor_page_generated_at,
        theme_color,
        setup_completed,
        created_at
      `
      )
      .eq('donor_page_generated', true)
      .order('donor_page_generated_at', { ascending: false });

    if (campaignsError) {
      throw new Error(`Database query failed: ${campaignsError.message}`);
    }

    // Get additional page data from registry
    const registryPages = await donorPageAutomation.getAllGeneratedPages();

    // Merge campaign data with registry data
    const pages = campaigns.map((campaign) => {
      const registryPage = registryPages.find((p) => p.campaignId === campaign.id);

      return {
        campaignId: campaign.id,
        campaignName: campaign.campaign_name,
        committeeName: campaign.committee_name,
        pageUrl: campaign.donor_page_url,
        status: determinePageStatus(campaign, registryPage),
        createdAt: campaign.donor_page_generated_at || campaign.created_at,
        lastSyncAt: registryPage?.lastSyncAt || campaign.donor_page_generated_at,
        filePath: registryPage?.filePath || `Unknown`,
        seoData: registryPage?.seoData || null,
        themeColor: campaign.theme_color || '#2a2a72',
        embedCode: registryPage?.embedCode || null,
      };
    });

    // Get statistics
    const stats = {
      total: pages.length,
      active: pages.filter((p) => p.status === 'active').length,
      error: pages.filter((p) => p.status === 'error').length,
      recent: pages.filter(
        (p) => new Date(p.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length,
    };

    res.json({
      success: true,
      pages,
      stats,
      count: pages.length,
    });
  } catch (error) {
    console.error('❌ Failed to fetch donor pages:', error);
    res.status(500).json({
      error: 'Failed to fetch donor pages',
      message: error.message,
    });
  }
});

/**
 * Get specific donor page details
 * GET /api/admin/donor-pages/:campaignId
 */
router.get('/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;

    // Get campaign data
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return res.status(404).json({
        error: 'Campaign not found',
      });
    }

    if (!campaign.donor_page_generated) {
      return res.status(404).json({
        error: 'No donor page generated for this campaign',
      });
    }

    // Get page logs
    const { data: logs, error: logsError } = await supabase
      .from('donor_page_logs')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (logsError) {
      console.warn('Failed to fetch page logs:', logsError);
    }

    // Get registry data
    const registryPages = await donorPageAutomation.getAllGeneratedPages();
    const registryPage = registryPages.find((p) => p.campaignId === campaignId);

    const pageDetails = {
      campaignId: campaign.id,
      campaignName: campaign.campaign_name,
      committeeName: campaign.committee_name,
      pageUrl: campaign.donor_page_url,
      status: determinePageStatus(campaign, registryPage),
      createdAt: campaign.donor_page_generated_at,
      lastSyncAt: registryPage?.lastSyncAt,
      filePath: registryPage?.filePath,
      seoData: registryPage?.seoData,
      embedCode: registryPage?.embedCode,
      logs: logs || [],
      campaign: campaign,
    };

    res.json({
      success: true,
      page: pageDetails,
    });
  } catch (error) {
    console.error('❌ Failed to fetch page details:', error);
    res.status(500).json({
      error: 'Failed to fetch page details',
      message: error.message,
    });
  }
});

/**
 * Regenerate a donor page
 * POST /api/admin/donor-pages/:campaignId/regenerate
 */
router.post('/:campaignId/regenerate', async (req, res) => {
  try {
    const { campaignId } = req.params;

    console.log('🔄 Admin regenerating donor page:', campaignId);

    // Get campaign data
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return res.status(404).json({
        error: 'Campaign not found',
      });
    }

    // Trigger page regeneration
    const result = await donorPageAutomation.triggerPageCreation(campaign);

    res.json({
      success: true,
      message: 'Page regenerated successfully',
      result,
    });
  } catch (error) {
    console.error('❌ Failed to regenerate page:', error);
    res.status(500).json({
      error: 'Failed to regenerate page',
      message: error.message,
    });
  }
});

/**
 * Delete a donor page
 * DELETE /api/admin/donor-pages/:campaignId
 */
router.delete('/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;

    console.log('🗑️ Admin deleting donor page:', campaignId);

    // Delete the page using the service
    const deleted = await donorPageAutomation.deletePage(campaignId);

    if (!deleted) {
      return res.status(404).json({
        error: 'Page not found or already deleted',
      });
    }

    res.json({
      success: true,
      message: 'Page deleted successfully',
    });
  } catch (error) {
    console.error('❌ Failed to delete page:', error);
    res.status(500).json({
      error: 'Failed to delete page',
      message: error.message,
    });
  }
});

/**
 * Bulk operations on multiple pages
 * POST /api/admin/donor-pages/bulk
 */
router.post('/bulk', async (req, res) => {
  try {
    const { operation, campaignIds } = req.body;

    if (!operation || !campaignIds || !Array.isArray(campaignIds)) {
      return res.status(400).json({
        error: 'Missing operation or campaignIds',
      });
    }

    console.log(`🔄 Bulk ${operation} for ${campaignIds.length} pages`);

    const results = [];

    for (const campaignId of campaignIds) {
      try {
        let result;

        switch (operation) {
          case 'regenerate':
            const { data: campaign } = await supabase
              .from('campaigns')
              .select('*')
              .eq('id', campaignId)
              .single();

            if (campaign) {
              result = await donorPageAutomation.triggerPageCreation(campaign);
              results.push({ campaignId, success: true, result });
            } else {
              results.push({ campaignId, success: false, error: 'Campaign not found' });
            }
            break;

          case 'delete':
            const deleted = await donorPageAutomation.deletePage(campaignId);
            results.push({
              campaignId,
              success: deleted,
              error: deleted ? null : 'Page not found',
            });
            break;

          default:
            results.push({ campaignId, success: false, error: 'Unknown operation' });
        }
      } catch (error) {
        results.push({ campaignId, success: false, error: error.message });
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    res.json({
      success: true,
      operation,
      results,
      summary: {
        total: campaignIds.length,
        successful,
        failed,
      },
    });
  } catch (error) {
    console.error('❌ Bulk operation failed:', error);
    res.status(500).json({
      error: 'Bulk operation failed',
      message: error.message,
    });
  }
});

/**
 * Get donor page statistics and analytics
 * GET /api/admin/donor-pages/stats/analytics
 */
router.get('/stats/analytics', async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;

    // Get campaign statistics
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('id, donor_page_generated, donor_page_generated_at, created_at')
      .eq('donor_page_generated', true);

    if (campaignsError) {
      throw campaignsError;
    }

    // Get activity logs
    const { data: logs, error: logsError } = await supabase
      .from('donor_page_logs')
      .select('event_type, created_at, status')
      .gte('created_at', getTimeframeDate(timeframe));

    if (logsError) {
      console.warn('Failed to fetch activity logs:', logsError);
    }

    // Calculate statistics
    const stats = {
      totalPages: campaigns.length,
      createdToday: campaigns.filter((c) =>
        isWithinTimeframe(c.donor_page_generated_at || c.created_at, '1d')
      ).length,
      createdThisWeek: campaigns.filter((c) =>
        isWithinTimeframe(c.donor_page_generated_at || c.created_at, '7d')
      ).length,
      createdThisMonth: campaigns.filter((c) =>
        isWithinTimeframe(c.donor_page_generated_at || c.created_at, '30d')
      ).length,

      // Activity stats
      totalEvents: logs?.length || 0,
      successfulEvents: logs?.filter((l) => l.status === 'success').length || 0,
      errorEvents: logs?.filter((l) => l.event_type?.includes('error')).length || 0,

      // Daily breakdown for last 7 days
      dailyActivity: generateDailyActivity(logs || []),
    };

    res.json({
      success: true,
      timeframe,
      stats,
    });
  } catch (error) {
    console.error('❌ Failed to fetch analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics',
      message: error.message,
    });
  }
});

/**
 * Helper function to determine page status
 */
function determinePageStatus(campaign, registryPage) {
  if (!campaign.donor_page_generated) return 'inactive';
  if (!registryPage) return 'error';

  // Check if page file exists and was recently updated
  const lastSync = new Date(registryPage.lastSyncAt || registryPage.createdAt);
  const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);

  // If not synced in over a week, mark as potentially stale
  if (hoursSinceSync > 168) return 'inactive';

  return 'active';
}

/**
 * Helper function to get date for timeframe
 */
function getTimeframeDate(timeframe) {
  const now = new Date();
  const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 1;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Helper function to check if date is within timeframe
 */
function isWithinTimeframe(date, timeframe) {
  if (!date) return false;
  const targetDate = new Date(date);
  const cutoff = getTimeframeDate(timeframe);
  return targetDate >= new Date(cutoff);
}

/**
 * Helper function to generate daily activity breakdown
 */
function generateDailyActivity(logs) {
  const dailyActivity = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];

    const dayLogs = logs.filter((log) => {
      const logDate = new Date(log.created_at).toISOString().split('T')[0];
      return logDate === dateStr;
    });

    dailyActivity.push({
      date: dateStr,
      events: dayLogs.length,
      errors: dayLogs.filter((l) => l.status === 'error' || l.event_type?.includes('error')).length,
    });
  }

  return dailyActivity;
}

module.exports = router;
