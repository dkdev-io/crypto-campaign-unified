/**
 * Contribution Status API Routes
 * Endpoints for querying contribution and rejection status
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { ethers } = require('ethers');
const ContributionRecorderService = require('../services/contributionRecorder');
const RetryHandler = require('../services/retryHandler');
const ContributionMonitor = require('../services/contributionMonitor');

// Initialize services
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const contributionRecorder = new ContributionRecorderService();
const retryHandler = new RetryHandler();
const monitor = new ContributionMonitor();

/**
 * GET /api/contributions/status/:transactionHash
 * Get contribution status by transaction hash
 */
router.get('/status/:transactionHash', async (req, res) => {
  try {
    const { transactionHash } = req.params;

    // Validate transaction hash format
    if (!transactionHash.match(/^0x[a-fA-F0-9]{64}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction hash format',
      });
    }

    // Check successful contributions
    const { data: contribution } = await supabase
      .from('contributions')
      .select('*')
      .eq('transaction_hash', transactionHash)
      .single();

    if (contribution) {
      return res.json({
        success: true,
        status: 'successful',
        data: {
          id: contribution.id,
          transactionHash: contribution.transaction_hash,
          walletAddress: contribution.wallet_address,
          amount: contribution.amount_usd,
          campaign: contribution.campaign_name,
          confirmations: contribution.confirmation_count,
          status: contribution.status,
          createdAt: contribution.created_at,
        },
      });
    }

    // Check rejected contributions
    const { data: rejection } = await supabase
      .from('rejected_contributions')
      .select('*')
      .eq('transaction_hash', transactionHash)
      .single();

    if (rejection) {
      return res.json({
        success: true,
        status: 'rejected',
        data: {
          id: rejection.id,
          transactionHash: rejection.transaction_hash,
          walletAddress: rejection.wallet_address,
          amount: rejection.amount_usd,
          rejectionReason: rejection.rejection_reason,
          rejectionMessage: rejection.rejection_message,
          retryAllowed: rejection.retry_allowed,
          retryCount: rejection.retry_count,
          attemptedAt: rejection.attempted_at,
        },
      });
    }

    // Not found
    return res.status(404).json({
      success: false,
      error: 'Transaction not found',
    });
  } catch (error) {
    console.error('Error getting contribution status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get contribution status',
    });
  }
});

/**
 * GET /api/contributions/wallet/:walletAddress
 * Get all contributions for a wallet address
 */
router.get('/wallet/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { status, campaignId, startDate, endDate, page = 1, limit = 20 } = req.query;

    // Validate wallet address
    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address',
      });
    }

    // Build query
    let query = supabase
      .from('contributions')
      .select('*', { count: 'exact' })
      .eq('wallet_address', walletAddress.toLowerCase());

    // Apply filters
    if (status) query = query.eq('status', status);
    if (campaignId) query = query.eq('campaign_id', campaignId);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data: contributions, count, error } = await query;

    if (error) throw error;

    // Get rejected contributions count
    const { count: rejectedCount } = await supabase
      .from('rejected_contributions')
      .select('id', { count: 'exact' })
      .eq('wallet_address', walletAddress.toLowerCase());

    res.json({
      success: true,
      data: {
        contributions,
        totalContributions: count,
        totalRejected: rejectedCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Error getting wallet contributions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wallet contributions',
    });
  }
});

/**
 * GET /api/contributions/rejected
 * Get rejected contributions with filters
 */
router.get('/rejected', async (req, res) => {
  try {
    const {
      walletAddress,
      campaignId,
      reason,
      retryAllowed,
      minRiskScore,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    // Build query
    let query = supabase.from('rejected_contributions').select('*', { count: 'exact' });

    // Apply filters
    if (walletAddress) {
      if (!ethers.isAddress(walletAddress)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid wallet address',
        });
      }
      query = query.eq('wallet_address', walletAddress.toLowerCase());
    }
    if (campaignId) query = query.eq('campaign_id', campaignId);
    if (reason) query = query.eq('rejection_reason', reason);
    if (retryAllowed !== undefined) query = query.eq('retry_allowed', retryAllowed === 'true');
    if (minRiskScore) query = query.gte('risk_score', parseInt(minRiskScore));
    if (startDate) query = query.gte('attempted_at', startDate);
    if (endDate) query = query.lte('attempted_at', endDate);

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1).order('attempted_at', { ascending: false });

    const { data: rejections, count, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: {
        rejections,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Error getting rejected contributions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get rejected contributions',
    });
  }
});

/**
 * GET /api/contributions/statistics
 * Get contribution statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const { campaignId, startDate, endDate } = req.query;

    // Base queries
    let successQuery = supabase.from('contributions').select('amount_usd', { count: 'exact' });

    let rejectedQuery = supabase
      .from('rejected_contributions')
      .select('amount_usd, rejection_reason', { count: 'exact' });

    // Apply filters
    if (campaignId) {
      successQuery = successQuery.eq('campaign_id', campaignId);
      rejectedQuery = rejectedQuery.eq('campaign_id', campaignId);
    }
    if (startDate) {
      successQuery = successQuery.gte('created_at', startDate);
      rejectedQuery = rejectedQuery.gte('attempted_at', startDate);
    }
    if (endDate) {
      successQuery = successQuery.lte('created_at', endDate);
      rejectedQuery = rejectedQuery.lte('attempted_at', endDate);
    }

    // Execute queries
    const [successResult, rejectedResult] = await Promise.all([successQuery, rejectedQuery]);

    // Calculate statistics
    const successfulCount = successResult.count || 0;
    const rejectedCount = rejectedResult.count || 0;
    const totalAttempts = successfulCount + rejectedCount;

    const successfulAmount =
      successResult.data?.reduce((sum, c) => sum + parseFloat(c.amount_usd || 0), 0) || 0;

    const rejectedAmount =
      rejectedResult.data?.reduce((sum, r) => sum + parseFloat(r.amount_usd || 0), 0) || 0;

    // Group rejections by reason
    const rejectionReasons = {};
    rejectedResult.data?.forEach((r) => {
      rejectionReasons[r.rejection_reason] = (rejectionReasons[r.rejection_reason] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalAttempts,
          successfulCount,
          rejectedCount,
          successRate: totalAttempts > 0 ? successfulCount / totalAttempts : 0,
          successfulAmount,
          rejectedAmount,
          averageContribution: successfulCount > 0 ? successfulAmount / successfulCount : 0,
        },
        rejectionReasons,
        filters: {
          campaignId,
          startDate,
          endDate,
        },
      },
    });
  } catch (error) {
    console.error('Error getting contribution statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get contribution statistics',
    });
  }
});

/**
 * POST /api/contributions/retry
 * Manually retry a rejected contribution
 */
router.post('/retry', async (req, res) => {
  try {
    const { rejectionId } = req.body;

    if (!rejectionId) {
      return res.status(400).json({
        success: false,
        error: 'Rejection ID is required',
      });
    }

    // Get rejection details
    const { data: rejection, error } = await supabase
      .from('rejected_contributions')
      .select('*')
      .eq('id', rejectionId)
      .single();

    if (error || !rejection) {
      return res.status(404).json({
        success: false,
        error: 'Rejection not found',
      });
    }

    if (!rejection.retry_allowed) {
      return res.status(400).json({
        success: false,
        error: 'Retry not allowed for this rejection',
      });
    }

    // Prepare contribution data
    const contributionData = {
      walletAddress: rejection.wallet_address,
      amountWei: rejection.amount_wei,
      amountUsd: rejection.amount_usd,
      campaignId: rejection.campaign_id,
      campaignName: rejection.campaign_name,
      transactionHash: rejection.transaction_hash,
      metadata: {
        manualRetry: true,
        originalRejectionId: rejection.id,
        retryRequestedAt: new Date().toISOString(),
      },
    };

    // Attempt to record contribution
    const result = await contributionRecorder.recordContribution(contributionData);

    res.json({
      success: result.success,
      message: result.success ? 'Contribution retry successful' : 'Contribution retry failed',
      data: result,
    });
  } catch (error) {
    console.error('Error retrying contribution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retry contribution',
    });
  }
});

/**
 * GET /api/contributions/retry-queue
 * Get current retry queue status
 */
router.get('/retry-queue', async (req, res) => {
  try {
    // Get pending retries
    const { data: pendingRetries } = await supabase
      .from('rejected_contributions')
      .select('*')
      .eq('retry_allowed', true)
      .lt('retry_count', 5)
      .order('retry_count', { ascending: true })
      .limit(50);

    // Get retry statistics
    const stats = await retryHandler.getStatistics();

    res.json({
      success: true,
      data: {
        queue: pendingRetries || [],
        statistics: stats,
        isRunning: retryHandler.isRunning,
      },
    });
  } catch (error) {
    console.error('Error getting retry queue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get retry queue',
    });
  }
});

/**
 * POST /api/contributions/retry-queue/start
 * Start the retry handler
 */
router.post('/retry-queue/start', async (req, res) => {
  try {
    await retryHandler.start();
    res.json({
      success: true,
      message: 'Retry handler started',
    });
  } catch (error) {
    console.error('Error starting retry handler:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start retry handler',
    });
  }
});

/**
 * POST /api/contributions/retry-queue/stop
 * Stop the retry handler
 */
router.post('/retry-queue/stop', async (req, res) => {
  try {
    retryHandler.stop();
    res.json({
      success: true,
      message: 'Retry handler stopped',
    });
  } catch (error) {
    console.error('Error stopping retry handler:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop retry handler',
    });
  }
});

/**
 * GET /api/contributions/monitoring/dashboard
 * Get monitoring dashboard data
 */
router.get('/monitoring/dashboard', async (req, res) => {
  try {
    const dashboardData = await monitor.getDashboardData();
    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard data',
    });
  }
});

/**
 * GET /api/contributions/monitoring/alerts
 * Get recent monitoring alerts
 */
router.get('/monitoring/alerts', async (req, res) => {
  try {
    const { priority, type, startDate, endDate, limit = 50 } = req.query;

    let query = supabase.from('monitoring_alerts').select('*');

    if (priority) query = query.eq('priority', priority);
    if (type) query = query.eq('type', type);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    query = query.order('created_at', { ascending: false }).limit(limit);

    const { data: alerts, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: alerts || [],
    });
  } catch (error) {
    console.error('Error getting monitoring alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get monitoring alerts',
    });
  }
});

/**
 * POST /api/contributions/monitoring/start
 * Start the contribution monitor
 */
router.post('/monitoring/start', async (req, res) => {
  try {
    await monitor.start();
    res.json({
      success: true,
      message: 'Contribution monitor started',
    });
  } catch (error) {
    console.error('Error starting monitor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start contribution monitor',
    });
  }
});

/**
 * POST /api/contributions/monitoring/stop
 * Stop the contribution monitor
 */
router.post('/monitoring/stop', async (req, res) => {
  try {
    monitor.stop();
    res.json({
      success: true,
      message: 'Contribution monitor stopped',
    });
  } catch (error) {
    console.error('Error stopping monitor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop contribution monitor',
    });
  }
});

/**
 * GET /api/contributions/analytics
 * Get contribution analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    const { campaignId, groupBy = 'day', startDate, endDate } = req.query;

    // Get analytics from the view
    let query = supabase.from('contribution_analytics').select('*');

    if (campaignId) query = query.eq('campaign_id', campaignId);
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    query = query.order('date', { ascending: false });

    const { data: analytics, error } = await query;

    if (error) throw error;

    // Group data if needed
    const grouped = {};
    analytics?.forEach((row) => {
      const key = `${row.date}_${row.type}`;
      if (!grouped[key]) {
        grouped[key] = {
          date: row.date,
          type: row.type,
          count: 0,
          totalAmount: 0,
          avgAmount: 0,
        };
      }
      grouped[key].count += row.count;
      grouped[key].totalAmount += parseFloat(row.total_amount_usd || 0);
    });

    // Calculate averages
    Object.values(grouped).forEach((row) => {
      row.avgAmount = row.count > 0 ? row.totalAmount / row.count : 0;
    });

    res.json({
      success: true,
      data: {
        analytics: Object.values(grouped),
        filters: {
          campaignId,
          groupBy,
          startDate,
          endDate,
        },
      },
    });
  } catch (error) {
    console.error('Error getting contribution analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get contribution analytics',
    });
  }
});

module.exports = router;
