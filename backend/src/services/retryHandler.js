/**
 * Retry Handler for Failed Contributions
 * Manages automatic retries for failed contributions with exponential backoff
 */

const { createClient } = require('@supabase/supabase-js');
const ContributionRecorderService = require('./contributionRecorder');

class RetryHandler {
  constructor() {
    this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    this.contributionRecorder = new ContributionRecorderService();
    this.retryIntervals = [
      60000, // 1 minute
      300000, // 5 minutes
      900000, // 15 minutes
      3600000, // 1 hour
      21600000, // 6 hours
    ];
    this.maxRetries = 5;
    this.isRunning = false;
  }

  /**
   * Start the retry handler
   */
  async start() {
    if (this.isRunning) {
      console.log('Retry handler already running');
      return;
    }

    this.isRunning = true;
    console.log('🔄 Retry handler started');

    // Process retries every minute
    this.retryInterval = setInterval(() => {
      this.processRetries();
    }, 60000);

    // Process immediately on start
    await this.processRetries();
  }

  /**
   * Stop the retry handler
   */
  stop() {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
    }
    this.isRunning = false;
    console.log('🛑 Retry handler stopped');
  }

  /**
   * Process all pending retries
   */
  async processRetries() {
    try {
      // Get all rejected contributions that are eligible for retry
      const eligibleContributions = await this.getEligibleRetries();

      console.log(`Found ${eligibleContributions.length} contributions eligible for retry`);

      for (const rejection of eligibleContributions) {
        await this.retryContribution(rejection);
      }

      // Clean up old rejections that exceeded max retries
      await this.cleanupExpiredRetries();
    } catch (error) {
      console.error('Error processing retries:', error);
    }
  }

  /**
   * Get contributions eligible for retry
   * @returns {Array} Eligible rejected contributions
   */
  async getEligibleRetries() {
    try {
      const now = new Date().toISOString();

      const { data, error } = await this.supabase
        .from('rejected_contributions')
        .select('*')
        .eq('retry_allowed', true)
        .lt('retry_count', this.maxRetries)
        .or(`last_retry_at.is.null,last_retry_at.lt.${now}`)
        .order('risk_score', { ascending: true })
        .limit(50); // Process max 50 at a time

      if (error) throw error;

      // Filter based on retry schedule
      return (data || []).filter((rejection) => {
        return this.shouldRetryNow(rejection);
      });
    } catch (error) {
      console.error('Error getting eligible retries:', error);
      return [];
    }
  }

  /**
   * Check if contribution should be retried now
   * @param {Object} rejection - Rejected contribution
   * @returns {boolean} Should retry now
   */
  shouldRetryNow(rejection) {
    const retryCount = rejection.retry_count || 0;

    // No retries yet
    if (retryCount === 0) {
      return true;
    }

    // Calculate time since last retry
    const lastRetry = rejection.last_retry_at
      ? new Date(rejection.last_retry_at)
      : new Date(rejection.created_at);
    const timeSinceLastRetry = Date.now() - lastRetry.getTime();

    // Get appropriate interval based on retry count
    const requiredInterval =
      this.retryIntervals[Math.min(retryCount - 1, this.retryIntervals.length - 1)];

    return timeSinceLastRetry >= requiredInterval;
  }

  /**
   * Retry a rejected contribution
   * @param {Object} rejection - Rejected contribution record
   */
  async retryContribution(rejection) {
    console.log(`🔄 Retrying contribution ${rejection.id} (attempt ${rejection.retry_count + 1})`);

    try {
      // Check if rejection reason might have been resolved
      const canRetry = await this.checkRetryConditions(rejection);

      if (!canRetry.allowed) {
        console.log(`Retry conditions not met: ${canRetry.reason}`);
        await this.updateRetryStatus(rejection.id, {
          retry_allowed: false,
          rejection_message: canRetry.reason,
        });
        return;
      }

      // Prepare contribution data for retry
      const contributionData = {
        walletAddress: rejection.wallet_address,
        amountWei: rejection.amount_wei,
        amountUsd: rejection.amount_usd,
        campaignId: rejection.campaign_id,
        campaignName: rejection.campaign_name,
        transactionHash: rejection.transaction_hash,
        network: rejection.network,
        blockNumber: rejection.block_number,
        contractAddress: rejection.contract_address,
        // Include any additional data from original attempt
        metadata: {
          ...rejection.error_details,
          retryAttempt: rejection.retry_count + 1,
          originalRejectionId: rejection.id,
        },
      };

      // Attempt to record the contribution
      const result = await this.contributionRecorder.recordContribution(contributionData);

      if (result.success) {
        console.log(`✅ Retry successful for ${rejection.id}`);

        // Mark original rejection as resolved
        await this.markRejectionResolved(rejection.id, result.contributionId);

        // Send success notification
        await this.sendRetrySuccessNotification(rejection, result);
      } else {
        console.log(`❌ Retry failed for ${rejection.id}: ${result.message}`);

        // Update retry count and status
        await this.updateRetryStatus(rejection.id, {
          retry_count: rejection.retry_count + 1,
          last_retry_at: new Date().toISOString(),
          rejection_message: result.message,
          error_details: {
            ...rejection.error_details,
            retryErrors: [
              ...(rejection.error_details?.retryErrors || []),
              {
                attempt: rejection.retry_count + 1,
                timestamp: new Date().toISOString(),
                error: result.message,
              },
            ],
          },
        });

        // Check if max retries reached
        if (rejection.retry_count + 1 >= this.maxRetries) {
          await this.handleMaxRetriesReached(rejection);
        }
      }
    } catch (error) {
      console.error(`Error retrying contribution ${rejection.id}:`, error);

      await this.updateRetryStatus(rejection.id, {
        retry_count: rejection.retry_count + 1,
        last_retry_at: new Date().toISOString(),
        error_details: {
          ...rejection.error_details,
          retryErrors: [
            ...(rejection.error_details?.retryErrors || []),
            {
              attempt: rejection.retry_count + 1,
              timestamp: new Date().toISOString(),
              error: error.message,
            },
          ],
        },
      });
    }
  }

  /**
   * Check if retry conditions are met
   * @param {Object} rejection - Rejected contribution
   * @returns {Object} Retry conditions result
   */
  async checkRetryConditions(rejection) {
    // Check based on rejection reason
    switch (rejection.rejection_reason) {
      case 'KYC_NOT_VERIFIED':
        // Check if KYC is now verified
        const kycStatus = await this.checkCurrentKYCStatus(rejection.wallet_address);
        if (!kycStatus.isVerified) {
          return {
            allowed: false,
            reason: 'KYC still not verified',
          };
        }
        break;

      case 'CAMPAIGN_INACTIVE':
      case 'CAMPAIGN_ENDED':
        // Check if campaign is now active
        const campaignStatus = await this.checkCurrentCampaignStatus(rejection.campaign_id);
        if (!campaignStatus.isActive) {
          return {
            allowed: false,
            reason: `Campaign is ${campaignStatus.status}`,
          };
        }
        break;

      case 'INSUFFICIENT_FUNDS':
        // Check if wallet now has sufficient balance
        const balance = await this.checkWalletBalance(rejection.wallet_address);
        if (balance < parseFloat(rejection.amount_wei)) {
          return {
            allowed: false,
            reason: 'Still insufficient funds',
          };
        }
        break;

      case 'NETWORK_ERROR':
      case 'SYSTEM_ERROR':
        // These can be retried
        return { allowed: true };

      case 'BLACKLISTED_ADDRESS':
      case 'DUPLICATE_TRANSACTION':
      case 'COMPLIANCE_VIOLATION':
        // These should never be retried
        return {
          allowed: false,
          reason: 'Permanent rejection - cannot retry',
        };

      default:
        // Allow retry for other reasons
        return { allowed: true };
    }

    return { allowed: true };
  }

  /**
   * Update retry status for a rejection
   * @param {string} rejectionId - Rejection ID
   * @param {Object} updates - Status updates
   */
  async updateRetryStatus(rejectionId, updates) {
    try {
      const { error } = await this.supabase
        .from('rejected_contributions')
        .update(updates)
        .eq('id', rejectionId);

      if (error) throw error;
    } catch (error) {
      console.error(`Error updating retry status for ${rejectionId}:`, error);
    }
  }

  /**
   * Mark rejection as resolved
   * @param {string} rejectionId - Rejection ID
   * @param {string} contributionId - Successful contribution ID
   */
  async markRejectionResolved(rejectionId, contributionId) {
    try {
      const { error } = await this.supabase
        .from('rejected_contributions')
        .update({
          retry_allowed: false,
          error_details: {
            resolved: true,
            resolvedAt: new Date().toISOString(),
            successfulContributionId: contributionId,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', rejectionId);

      if (error) throw error;
    } catch (error) {
      console.error(`Error marking rejection resolved:`, error);
    }
  }

  /**
   * Handle max retries reached
   * @param {Object} rejection - Rejected contribution
   */
  async handleMaxRetriesReached(rejection) {
    console.log(`⚠️ Max retries reached for ${rejection.id}`);

    // Update status
    await this.updateRetryStatus(rejection.id, {
      retry_allowed: false,
      error_details: {
        ...rejection.error_details,
        maxRetriesReached: true,
        finalAttemptAt: new Date().toISOString(),
      },
    });

    // Send alert/notification
    await this.sendMaxRetriesAlert(rejection);

    // Log for manual review
    await this.logForManualReview(rejection);
  }

  /**
   * Clean up expired retries
   */
  async cleanupExpiredRetries() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7); // 7 days old

      const { error } = await this.supabase
        .from('rejected_contributions')
        .update({
          retry_allowed: false,
          error_details: {
            expired: true,
            expiredAt: new Date().toISOString(),
          },
        })
        .eq('retry_allowed', true)
        .gte('retry_count', this.maxRetries)
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;
    } catch (error) {
      console.error('Error cleaning up expired retries:', error);
    }
  }

  /**
   * Check current KYC status
   * @param {string} walletAddress - Ethereum wallet address
   * @returns {Object} KYC status
   */
  async checkCurrentKYCStatus(walletAddress) {
    // Implement KYC status check
    return { isVerified: false };
  }

  /**
   * Check current campaign status
   * @param {string} campaignId - Campaign ID
   * @returns {Object} Campaign status
   */
  async checkCurrentCampaignStatus(campaignId) {
    try {
      const { data } = await this.supabase
        .from('campaigns')
        .select('status')
        .eq('id', campaignId)
        .single();

      return {
        isActive: data?.status === 'active',
        status: data?.status || 'unknown',
      };
    } catch {
      return { isActive: false, status: 'error' };
    }
  }

  /**
   * Check wallet balance
   * @param {string} walletAddress - Ethereum wallet address
   * @returns {number} Balance in wei
   */
  async checkWalletBalance(walletAddress) {
    // Implement balance check via Web3
    return 0;
  }

  /**
   * Send retry success notification
   * @param {Object} rejection - Original rejection
   * @param {Object} result - Successful result
   */
  async sendRetrySuccessNotification(rejection, result) {
    console.log(`📧 Sending retry success notification for ${rejection.id}`);
    // Implement notification logic
  }

  /**
   * Send max retries alert
   * @param {Object} rejection - Rejected contribution
   */
  async sendMaxRetriesAlert(rejection) {
    console.log(`🚨 Sending max retries alert for ${rejection.id}`);
    // Implement alert logic
  }

  /**
   * Log for manual review
   * @param {Object} rejection - Rejected contribution
   */
  async logForManualReview(rejection) {
    try {
      const { error } = await this.supabase.from('manual_review_queue').insert({
        type: 'failed_contribution',
        reference_id: rejection.id,
        priority: rejection.risk_score > 50 ? 'high' : 'medium',
        data: rejection,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging for manual review:', error);
    }
  }

  /**
   * Get retry statistics
   * @returns {Object} Retry statistics
   */
  async getStatistics() {
    try {
      const { data: stats } = await this.supabase.rpc('get_retry_statistics');

      return (
        stats || {
          totalRetries: 0,
          successfulRetries: 0,
          failedRetries: 0,
          pendingRetries: 0,
          averageRetryCount: 0,
        }
      );
    } catch (error) {
      console.error('Error getting retry statistics:', error);
      return null;
    }
  }
}

module.exports = RetryHandler;
