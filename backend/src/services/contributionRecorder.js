/**
 * Contribution Recorder Service
 * Handles recording of both successful and rejected contributions
 * Ensures all contribution attempts are properly logged for compliance
 */

const { createClient } = require('@supabase/supabase-js');
const { ethers } = require('ethers');
const Web3Service = require('./web3Service');

class ContributionRecorderService {
  constructor() {
    this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    this.web3Service = new Web3Service();
    this.rejectionReasons = {
      KYC_NOT_VERIFIED: 'KYC_NOT_VERIFIED',
      EXCEEDS_CONTRIBUTION_LIMIT: 'EXCEEDS_CONTRIBUTION_LIMIT',
      EXCEEDS_TRANSACTION_LIMIT: 'EXCEEDS_TRANSACTION_LIMIT',
      INVALID_WALLET_ADDRESS: 'INVALID_WALLET_ADDRESS',
      INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
      TRANSACTION_FAILED: 'TRANSACTION_FAILED',
      SMART_CONTRACT_ERROR: 'SMART_CONTRACT_ERROR',
      NETWORK_ERROR: 'NETWORK_ERROR',
      DUPLICATE_TRANSACTION: 'DUPLICATE_TRANSACTION',
      BLACKLISTED_ADDRESS: 'BLACKLISTED_ADDRESS',
      SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
      COMPLIANCE_VIOLATION: 'COMPLIANCE_VIOLATION',
      INVALID_AMOUNT: 'INVALID_AMOUNT',
      CAMPAIGN_INACTIVE: 'CAMPAIGN_INACTIVE',
      CAMPAIGN_ENDED: 'CAMPAIGN_ENDED',
      SYSTEM_ERROR: 'SYSTEM_ERROR',
      OTHER: 'OTHER',
    };
  }

  /**
   * Main entry point for recording a contribution attempt
   * @param {Object} contributionData - Contribution details
   * @returns {Object} Result of the recording attempt
   */
  async recordContribution(contributionData) {
    try {
      // Validate contribution data
      const validation = await this.validateContribution(contributionData);

      if (!validation.isValid) {
        // Record rejected contribution
        return await this.recordRejectedContribution({
          ...contributionData,
          rejectionReason: validation.rejectionReason,
          rejectionMessage: validation.message,
          errorDetails: validation.details,
        });
      }

      // Process successful contribution
      return await this.recordSuccessfulContribution(contributionData);
    } catch (error) {
      console.error('Error recording contribution:', error);

      // Record as system error
      return await this.recordRejectedContribution({
        ...contributionData,
        rejectionReason: this.rejectionReasons.SYSTEM_ERROR,
        rejectionMessage: error.message,
        errorDetails: {
          stack: error.stack,
          originalError: error.toString(),
        },
      });
    }
  }

  /**
   * Validate contribution before processing
   * @param {Object} data - Contribution data to validate
   * @returns {Object} Validation result
   */
  async validateContribution(data) {
    const validationResult = {
      isValid: true,
      rejectionReason: null,
      message: null,
      details: {},
    };

    // 1. Validate wallet address
    if (!ethers.isAddress(data.walletAddress)) {
      return {
        isValid: false,
        rejectionReason: this.rejectionReasons.INVALID_WALLET_ADDRESS,
        message: 'Invalid Ethereum wallet address',
        details: { providedAddress: data.walletAddress },
      };
    }

    // 2. Check if address is blacklisted
    const blacklistCheck = await this.checkBlacklist(data.walletAddress);
    if (blacklistCheck.isBlacklisted) {
      return {
        isValid: false,
        rejectionReason: this.rejectionReasons.BLACKLISTED_ADDRESS,
        message: 'Wallet address is blacklisted',
        details: blacklistCheck,
      };
    }

    // 3. Verify KYC status
    const kycStatus = await this.checkKYCStatus(data.walletAddress);
    if (!kycStatus.isVerified) {
      return {
        isValid: false,
        rejectionReason: this.rejectionReasons.KYC_NOT_VERIFIED,
        message: 'KYC verification required',
        details: { kycStatus: kycStatus.status, kycId: kycStatus.id },
      };
    }

    // 4. Validate amount
    const amountValidation = await this.validateAmount(data);
    if (!amountValidation.isValid) {
      return {
        isValid: false,
        rejectionReason: amountValidation.reason,
        message: amountValidation.message,
        details: amountValidation.details,
      };
    }

    // 5. Check campaign status
    const campaignStatus = await this.checkCampaignStatus(data.campaignId);
    if (!campaignStatus.isActive) {
      return {
        isValid: false,
        rejectionReason: campaignStatus.reason,
        message: campaignStatus.message,
        details: { campaignId: data.campaignId, status: campaignStatus.status },
      };
    }

    // 6. Check for duplicate transactions
    if (data.transactionHash) {
      const isDuplicate = await this.checkDuplicateTransaction(data.transactionHash);
      if (isDuplicate) {
        return {
          isValid: false,
          rejectionReason: this.rejectionReasons.DUPLICATE_TRANSACTION,
          message: 'Transaction already processed',
          details: { transactionHash: data.transactionHash },
        };
      }
    }

    // 7. Perform risk assessment
    const riskAssessment = await this.assessRisk(data);
    if (riskAssessment.score > 75) {
      return {
        isValid: false,
        rejectionReason: this.rejectionReasons.SUSPICIOUS_ACTIVITY,
        message: 'Transaction flagged as suspicious',
        details: riskAssessment,
      };
    }

    return validationResult;
  }

  /**
   * Record a successful contribution
   * @param {Object} data - Contribution data
   * @returns {Object} Recorded contribution
   */
  async recordSuccessfulContribution(data) {
    const contributionRecord = {
      transaction_hash: data.transactionHash,
      wallet_address: data.walletAddress.toLowerCase(),
      amount_wei: data.amountWei,
      amount_usd: data.amountUsd,
      campaign_id: data.campaignId,
      campaign_name: data.campaignName,
      contributor_name: data.contributorName,
      contributor_email: data.contributorEmail,
      contributor_phone: data.contributorPhone,
      contributor_address: data.contributorAddress,
      kyc_verified: true,
      kyc_verification_id: data.kycVerificationId,
      kyc_verified_at: data.kycVerifiedAt || new Date().toISOString(),
      block_number: data.blockNumber,
      block_timestamp: data.blockTimestamp,
      gas_price: data.gasPrice,
      gas_used: data.gasUsed,
      contract_address: data.contractAddress,
      network: data.network || 'ethereum',
      confirmation_count: data.confirmations || 0,
      status: data.status || 'pending',
      employer: data.employer,
      occupation: data.occupation,
      is_us_citizen: data.isUsCitizen,
      contribution_type: data.contributionType || 'crypto',
      metadata: data.metadata || {},
      notes: data.notes,
    };

    try {
      // Start a database transaction
      const { data: contribution, error } = await this.supabase
        .from('contributions')
        .insert(contributionRecord)
        .select()
        .single();

      if (error) throw error;

      // Update campaign statistics
      await this.updateCampaignStats(data.campaignId, data.amountUsd);

      // Log successful contribution
      console.log(`✅ Contribution recorded: ${contribution.id}`);

      // Send confirmation webhook
      await this.sendWebhook('contribution.successful', contribution);

      return {
        success: true,
        contributionId: contribution.id,
        data: contribution,
      };
    } catch (error) {
      console.error('Failed to record successful contribution:', error);

      // Attempt to record as rejected due to system error
      return await this.recordRejectedContribution({
        ...data,
        rejectionReason: this.rejectionReasons.SYSTEM_ERROR,
        rejectionMessage: `Failed to record contribution: ${error.message}`,
        errorDetails: { originalError: error },
      });
    }
  }

  /**
   * Record a rejected contribution
   * @param {Object} data - Rejected contribution data
   * @returns {Object} Recorded rejection
   */
  async recordRejectedContribution(data) {
    const rejectionRecord = {
      transaction_hash: data.transactionHash || null,
      wallet_address: data.walletAddress?.toLowerCase(),
      amount_wei: data.amountWei || '0',
      amount_usd: data.amountUsd || 0,
      campaign_id: data.campaignId,
      campaign_name: data.campaignName,
      rejection_reason: data.rejectionReason,
      rejection_message: data.rejectionMessage,
      error_code: data.errorCode,
      error_details: data.errorDetails || {},
      kyc_status: data.kycStatus,
      contribution_limits: data.contributionLimits,
      user_total_contributions: data.userTotalContributions,
      network: data.network,
      block_number: data.blockNumber,
      gas_price: data.gasPrice,
      gas_used: data.gasUsed,
      contract_address: data.contractAddress,
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
      referrer: data.referrer,
      session_id: data.sessionId,
      risk_score: data.riskScore,
      risk_factors: data.riskFactors,
      compliance_checks: data.complianceChecks,
      retry_count: data.retryCount || 0,
      retry_allowed: this.isRetryAllowed(data.rejectionReason),
      attempted_at: data.attemptedAt || new Date().toISOString(),
    };

    try {
      const { data: rejection, error } = await this.supabase
        .from('rejected_contributions')
        .insert(rejectionRecord)
        .select()
        .single();

      if (error) throw error;

      // Log rejection
      console.warn(`⚠️ Contribution rejected: ${rejection.id} - ${data.rejectionReason}`);

      // Send alert for high-risk rejections
      if (
        data.riskScore > 80 ||
        data.rejectionReason === this.rejectionReasons.SUSPICIOUS_ACTIVITY
      ) {
        await this.sendSecurityAlert(rejection);
      }

      // Send webhook
      await this.sendWebhook('contribution.rejected', rejection);

      return {
        success: false,
        rejectionId: rejection.id,
        reason: data.rejectionReason,
        message: data.rejectionMessage,
        retryAllowed: rejection.retry_allowed,
        data: rejection,
      };
    } catch (error) {
      console.error('Failed to record rejected contribution:', error);

      // Last resort: log to file system
      await this.logToFailsafe({
        type: 'rejected_contribution',
        data: rejectionRecord,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      return {
        success: false,
        error: 'Failed to record rejection',
        details: error.message,
      };
    }
  }

  /**
   * Check if wallet address is blacklisted
   * @param {string} walletAddress - Ethereum wallet address
   * @returns {Object} Blacklist check result
   */
  async checkBlacklist(walletAddress) {
    try {
      const { data, error } = await this.supabase
        .from('blacklisted_addresses')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single();

      return {
        isBlacklisted: !!data,
        reason: data?.reason,
        addedAt: data?.created_at,
      };
    } catch {
      return { isBlacklisted: false };
    }
  }

  /**
   * Check KYC verification status
   * @param {string} walletAddress - Ethereum wallet address
   * @returns {Object} KYC status
   */
  async checkKYCStatus(walletAddress) {
    try {
      // Check smart contract first
      const onChainKYC = await this.web3Service.checkKYCStatus(walletAddress);

      if (onChainKYC) {
        return { isVerified: true, status: 'verified', source: 'blockchain' };
      }

      // Check database
      const { data } = await this.supabase
        .from('kyc_verifications')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .eq('status', 'approved')
        .single();

      return {
        isVerified: !!data,
        status: data?.status || 'not_verified',
        id: data?.id,
      };
    } catch (error) {
      console.error('KYC check failed:', error);
      return { isVerified: false, status: 'error' };
    }
  }

  /**
   * Validate contribution amount
   * @param {Object} data - Contribution data
   * @returns {Object} Validation result
   */
  async validateAmount(data) {
    const amountUsd = parseFloat(data.amountUsd);

    // Check minimum amount
    if (amountUsd < 1) {
      return {
        isValid: false,
        reason: this.rejectionReasons.INVALID_AMOUNT,
        message: 'Contribution below minimum amount ($1)',
        details: { amount: amountUsd, minimum: 1 },
      };
    }

    // Check FEC limits
    const fecLimit = 3300; // 2024 individual contribution limit
    if (amountUsd > fecLimit) {
      return {
        isValid: false,
        reason: this.rejectionReasons.EXCEEDS_TRANSACTION_LIMIT,
        message: `Contribution exceeds FEC limit ($${fecLimit})`,
        details: { amount: amountUsd, limit: fecLimit },
      };
    }

    // Check cumulative contributions
    const totalContributions = await this.getTotalContributions(
      data.walletAddress,
      data.campaignId
    );

    if (totalContributions + amountUsd > fecLimit) {
      return {
        isValid: false,
        reason: this.rejectionReasons.EXCEEDS_CONTRIBUTION_LIMIT,
        message: 'Total contributions would exceed FEC limit',
        details: {
          currentTotal: totalContributions,
          attemptedAmount: amountUsd,
          wouldBe: totalContributions + amountUsd,
          limit: fecLimit,
        },
      };
    }

    return { isValid: true };
  }

  /**
   * Check campaign status
   * @param {string} campaignId - Campaign UUID
   * @returns {Object} Campaign status
   */
  async checkCampaignStatus(campaignId) {
    try {
      const { data } = await this.supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (!data) {
        return {
          isActive: false,
          reason: this.rejectionReasons.CAMPAIGN_INACTIVE,
          message: 'Campaign not found',
          status: 'not_found',
        };
      }

      if (data.status !== 'active') {
        return {
          isActive: false,
          reason: this.rejectionReasons.CAMPAIGN_INACTIVE,
          message: `Campaign is ${data.status}`,
          status: data.status,
        };
      }

      if (data.end_date && new Date(data.end_date) < new Date()) {
        return {
          isActive: false,
          reason: this.rejectionReasons.CAMPAIGN_ENDED,
          message: 'Campaign has ended',
          status: 'ended',
        };
      }

      return { isActive: true, status: 'active' };
    } catch (error) {
      return {
        isActive: false,
        reason: this.rejectionReasons.SYSTEM_ERROR,
        message: 'Failed to check campaign status',
        status: 'error',
      };
    }
  }

  /**
   * Check for duplicate transaction
   * @param {string} transactionHash - Transaction hash
   * @returns {boolean} Is duplicate
   */
  async checkDuplicateTransaction(transactionHash) {
    try {
      const { data } = await this.supabase
        .from('contributions')
        .select('id')
        .eq('transaction_hash', transactionHash)
        .single();

      return !!data;
    } catch {
      return false;
    }
  }

  /**
   * Assess risk of contribution
   * @param {Object} data - Contribution data
   * @returns {Object} Risk assessment
   */
  async assessRisk(data) {
    let riskScore = 0;
    const riskFactors = [];

    // Large amount
    if (data.amountUsd > 1000) {
      riskScore += 20;
      riskFactors.push('large_amount');
    }

    // New wallet
    const walletAge = await this.getWalletAge(data.walletAddress);
    if (walletAge < 30) {
      riskScore += 15;
      riskFactors.push('new_wallet');
    }

    // Multiple rapid contributions
    const recentContributions = await this.getRecentContributions(data.walletAddress);
    if (recentContributions > 5) {
      riskScore += 25;
      riskFactors.push('rapid_contributions');
    }

    // Unusual pattern
    if (data.amountUsd % 1000 === 0 || data.amountUsd === 3300) {
      riskScore += 10;
      riskFactors.push('round_amount');
    }

    // VPN/Proxy detection (if IP provided)
    if (data.ipAddress && (await this.isVpnOrProxy(data.ipAddress))) {
      riskScore += 20;
      riskFactors.push('vpn_proxy_detected');
    }

    return {
      score: Math.min(riskScore, 100),
      factors: riskFactors,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get total contributions from address to campaign
   * @param {string} walletAddress - Ethereum wallet address
   * @param {string} campaignId - Campaign UUID
   * @returns {number} Total contributions in USD
   */
  async getTotalContributions(walletAddress, campaignId) {
    try {
      const { data } = await this.supabase
        .from('contributions')
        .select('amount_usd')
        .eq('wallet_address', walletAddress.toLowerCase())
        .eq('campaign_id', campaignId)
        .eq('status', 'confirmed');

      return data?.reduce((sum, c) => sum + parseFloat(c.amount_usd), 0) || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get wallet age in days
   * @param {string} walletAddress - Ethereum wallet address
   * @returns {number} Age in days
   */
  async getWalletAge(walletAddress) {
    try {
      const { data } = await this.supabase
        .from('contributions')
        .select('created_at')
        .eq('wallet_address', walletAddress.toLowerCase())
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (data) {
        const firstSeen = new Date(data.created_at);
        const now = new Date();
        return Math.floor((now - firstSeen) / (1000 * 60 * 60 * 24));
      }
      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get recent contributions count
   * @param {string} walletAddress - Ethereum wallet address
   * @returns {number} Recent contribution count
   */
  async getRecentContributions(walletAddress) {
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const { data } = await this.supabase
        .from('contributions')
        .select('id')
        .eq('wallet_address', walletAddress.toLowerCase())
        .gte('created_at', oneDayAgo.toISOString());

      return data?.length || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Check if IP is VPN or proxy
   * @param {string} ipAddress - IP address
   * @returns {boolean} Is VPN/proxy
   */
  async isVpnOrProxy(ipAddress) {
    // Placeholder - integrate with IP quality service
    return false;
  }

  /**
   * Check if retry is allowed for rejection reason
   * @param {string} reason - Rejection reason
   * @returns {boolean} Retry allowed
   */
  isRetryAllowed(reason) {
    const noRetryReasons = [
      this.rejectionReasons.BLACKLISTED_ADDRESS,
      this.rejectionReasons.DUPLICATE_TRANSACTION,
      this.rejectionReasons.COMPLIANCE_VIOLATION,
      this.rejectionReasons.CAMPAIGN_ENDED,
    ];

    return !noRetryReasons.includes(reason);
  }

  /**
   * Update campaign statistics
   * @param {string} campaignId - Campaign UUID
   * @param {number} amount - Contribution amount in USD
   */
  async updateCampaignStats(campaignId, amount) {
    try {
      const { data: campaign } = await this.supabase
        .from('campaigns')
        .select('total_raised, contributor_count')
        .eq('id', campaignId)
        .single();

      if (campaign) {
        await this.supabase
          .from('campaigns')
          .update({
            total_raised: (campaign.total_raised || 0) + amount,
            contributor_count: (campaign.contributor_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', campaignId);
      }
    } catch (error) {
      console.error('Failed to update campaign stats:', error);
    }
  }

  /**
   * Send webhook notification
   * @param {string} event - Event type
   * @param {Object} data - Event data
   */
  async sendWebhook(event, data) {
    // Implement webhook sending logic
    console.log(`Webhook: ${event}`, data.id);
  }

  /**
   * Send security alert
   * @param {Object} rejection - Rejection data
   */
  async sendSecurityAlert(rejection) {
    console.error(`🚨 Security Alert: High-risk rejection detected`, {
      id: rejection.id,
      reason: rejection.rejection_reason,
      riskScore: rejection.risk_score,
    });
    // Implement actual alerting (email, Slack, etc.)
  }

  /**
   * Log to failsafe storage
   * @param {Object} data - Data to log
   */
  async logToFailsafe(data) {
    // Implement file system or external logging
    console.error('Failsafe log:', data);
  }
}

module.exports = ContributionRecorderService;
