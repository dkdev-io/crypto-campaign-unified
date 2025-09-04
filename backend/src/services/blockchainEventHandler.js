/**
 * Blockchain Event Handler
 * Listens to blockchain events and triggers contribution recording
 * Handles both successful and failed blockchain transactions
 */

const { ethers } = require('ethers');
const ContributionRecorderService = require('./contributionRecorder');
const Web3Service = require('./web3Service');

class BlockchainEventHandler {
  constructor() {
    this.contributionRecorder = new ContributionRecorderService();
    this.web3Service = new Web3Service();
    this.provider = null;
    this.contract = null;
    this.eventFilters = {};
    this.processingQueue = new Map();
    this.retryQueue = new Map();
  }

  /**
   * Initialize the event handler
   * @param {string} contractAddress - Smart contract address
   * @param {Object} contractABI - Contract ABI
   */
  async initialize(contractAddress, contractABI) {
    try {
      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);

      // Initialize contract
      this.contract = new ethers.Contract(contractAddress, contractABI, this.provider);

      // Set up event listeners
      this.setupEventListeners();

      // Start processing queues
      this.startQueueProcessing();

      console.log('✅ Blockchain event handler initialized');
      console.log(`📡 Listening to contract: ${contractAddress}`);
    } catch (error) {
      console.error('Failed to initialize blockchain event handler:', error);
      throw error;
    }
  }

  /**
   * Set up event listeners for the smart contract
   */
  setupEventListeners() {
    // Listen for ContributionAccepted events
    this.contract.on(
      'ContributionAccepted',
      async (contributor, amountWei, amountUsd, transactionHash, event) => {
        console.log(`📥 ContributionAccepted event: ${transactionHash}`);
        await this.handleContributionAccepted({
          contributor,
          amountWei: amountWei.toString(),
          amountUsd: ethers.formatUnits(amountUsd, 2),
          transactionHash,
          blockNumber: event.log.blockNumber,
          blockHash: event.log.blockHash,
          transactionIndex: event.log.transactionIndex,
        });
      }
    );

    // Listen for ContributionRejected events (if contract emits them)
    this.contract.on(
      'ContributionRejected',
      async (contributor, amountWei, reason, transactionHash, event) => {
        console.log(`❌ ContributionRejected event: ${transactionHash}`);
        await this.handleContributionRejected({
          contributor,
          amountWei: amountWei.toString(),
          reason,
          transactionHash,
          blockNumber: event.log.blockNumber,
          blockHash: event.log.blockHash,
        });
      }
    );

    // Listen for KYCStatusUpdated events
    this.contract.on('KYCStatusUpdated', async (contributor, isVerified, event) => {
      console.log(`🔐 KYC status updated for ${contributor}: ${isVerified}`);
      // Update KYC status in database
      await this.updateKYCStatus(contributor, isVerified);
    });

    // Listen for failed transactions by monitoring pending transactions
    this.monitorPendingTransactions();
  }

  /**
   * Handle successful contribution event
   * @param {Object} eventData - Event data from blockchain
   */
  async handleContributionAccepted(eventData) {
    try {
      // Prevent duplicate processing
      if (this.processingQueue.has(eventData.transactionHash)) {
        console.log(`Already processing: ${eventData.transactionHash}`);
        return;
      }

      this.processingQueue.set(eventData.transactionHash, true);

      // Get transaction details
      const transaction = await this.provider.getTransaction(eventData.transactionHash);
      const receipt = await this.provider.getTransactionReceipt(eventData.transactionHash);
      const block = await this.provider.getBlock(eventData.blockNumber);

      // Get contributor details from database or KYC service
      const contributorDetails = await this.getContributorDetails(eventData.contributor);

      // Get campaign details
      const campaignDetails = await this.getCampaignDetails(transaction.to);

      // Prepare contribution data
      const contributionData = {
        transactionHash: eventData.transactionHash,
        walletAddress: eventData.contributor,
        amountWei: eventData.amountWei,
        amountUsd: parseFloat(eventData.amountUsd),
        campaignId: campaignDetails.id,
        campaignName: campaignDetails.name,
        contributorName: contributorDetails.name,
        contributorEmail: contributorDetails.email,
        contributorPhone: contributorDetails.phone,
        contributorAddress: contributorDetails.address,
        kycVerificationId: contributorDetails.kycId,
        kycVerifiedAt: contributorDetails.kycVerifiedAt,
        blockNumber: eventData.blockNumber,
        blockTimestamp: new Date(block.timestamp * 1000).toISOString(),
        gasPrice: transaction.gasPrice?.toString(),
        gasUsed: receipt.gasUsed?.toString(),
        contractAddress: transaction.to,
        network: 'ethereum',
        confirmations: 1,
        status: 'confirming',
        employer: contributorDetails.employer,
        occupation: contributorDetails.occupation,
        isUsCitizen: contributorDetails.isUsCitizen,
        metadata: {
          blockHash: eventData.blockHash,
          transactionIndex: eventData.transactionIndex,
          logIndex: receipt.logs.findIndex(
            (log) => log.transactionHash === eventData.transactionHash
          ),
        },
      };

      // Record the contribution
      const result = await this.contributionRecorder.recordContribution(contributionData);

      if (result.success) {
        console.log(`✅ Contribution recorded: ${result.contributionId}`);

        // Monitor for confirmations
        this.monitorConfirmations(
          eventData.transactionHash,
          result.contributionId,
          eventData.blockNumber
        );
      } else {
        console.error(`Failed to record contribution: ${result.message}`);

        // Add to retry queue if allowed
        if (result.retryAllowed) {
          this.addToRetryQueue(contributionData);
        }
      }

      this.processingQueue.delete(eventData.transactionHash);
    } catch (error) {
      console.error('Error handling ContributionAccepted event:', error);
      this.processingQueue.delete(eventData.transactionHash);

      // Record as rejected due to processing error
      await this.contributionRecorder.recordRejectedContribution({
        transactionHash: eventData.transactionHash,
        walletAddress: eventData.contributor,
        amountWei: eventData.amountWei,
        amountUsd: parseFloat(eventData.amountUsd),
        rejectionReason: 'SYSTEM_ERROR',
        rejectionMessage: `Event processing failed: ${error.message}`,
        errorDetails: {
          error: error.toString(),
          stack: error.stack,
          eventData,
        },
      });
    }
  }

  /**
   * Handle rejected contribution event
   * @param {Object} eventData - Event data from blockchain
   */
  async handleContributionRejected(eventData) {
    try {
      // Get transaction details for more context
      const transaction = await this.provider.getTransaction(eventData.transactionHash);

      // Map blockchain rejection reason to our categories
      const rejectionReason = this.mapRejectionReason(eventData.reason);

      // Get contributor and campaign details
      const contributorDetails = await this.getContributorDetails(eventData.contributor);
      const campaignDetails = await this.getCampaignDetails(transaction.to);

      // Record the rejection
      await this.contributionRecorder.recordRejectedContribution({
        transactionHash: eventData.transactionHash,
        walletAddress: eventData.contributor,
        amountWei: eventData.amountWei,
        amountUsd: ethers.formatEther(eventData.amountWei) * 2000, // Estimate USD
        campaignId: campaignDetails.id,
        campaignName: campaignDetails.name,
        rejectionReason: rejectionReason,
        rejectionMessage: eventData.reason,
        errorDetails: {
          blockchainReason: eventData.reason,
          blockNumber: eventData.blockNumber,
          blockHash: eventData.blockHash,
        },
        kycStatus: contributorDetails.kycStatus,
        network: 'ethereum',
        blockNumber: eventData.blockNumber,
        contractAddress: transaction.to,
        gasPrice: transaction.gasPrice?.toString(),
        attemptedAt: new Date().toISOString(),
      });

      console.log(`📝 Rejection recorded for ${eventData.transactionHash}`);
    } catch (error) {
      console.error('Error handling ContributionRejected event:', error);
    }
  }

  /**
   * Monitor pending transactions for failures
   */
  async monitorPendingTransactions() {
    // Check pending transactions every 30 seconds
    setInterval(async () => {
      try {
        const pendingTxs = await this.getPendingTransactions();

        for (const tx of pendingTxs) {
          const receipt = await this.provider.getTransactionReceipt(tx.hash);

          if (receipt && receipt.status === 0) {
            // Transaction failed
            await this.handleFailedTransaction(tx, receipt);
          } else if (receipt && receipt.status === 1) {
            // Transaction succeeded but might not have emitted event
            await this.verifyTransactionRecorded(tx, receipt);
          } else {
            // Still pending - check if stuck
            await this.checkStuckTransaction(tx);
          }
        }
      } catch (error) {
        console.error('Error monitoring pending transactions:', error);
      }
    }, 30000); // 30 seconds
  }

  /**
   * Handle failed transaction
   * @param {Object} transaction - Transaction object
   * @param {Object} receipt - Transaction receipt
   */
  async handleFailedTransaction(transaction, receipt) {
    console.log(`💀 Transaction failed: ${transaction.hash}`);

    try {
      // Decode the transaction to get contribution details
      const decodedData = this.contract.interface.parseTransaction({
        data: transaction.data,
        value: transaction.value,
      });

      // Record as rejected
      await this.contributionRecorder.recordRejectedContribution({
        transactionHash: transaction.hash,
        walletAddress: transaction.from,
        amountWei: transaction.value.toString(),
        amountUsd: ethers.formatEther(transaction.value) * 2000, // Estimate
        rejectionReason: 'TRANSACTION_FAILED',
        rejectionMessage: 'Transaction reverted on blockchain',
        errorDetails: {
          gasUsed: receipt.gasUsed.toString(),
          effectiveGasPrice: receipt.effectiveGasPrice?.toString(),
          cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
          blockNumber: receipt.blockNumber,
          functionName: decodedData?.name,
        },
        network: 'ethereum',
        blockNumber: receipt.blockNumber,
        contractAddress: transaction.to,
        gasPrice: transaction.gasPrice?.toString(),
        gasUsed: receipt.gasUsed.toString(),
        attemptedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error handling failed transaction:', error);
    }
  }

  /**
   * Check if transaction is stuck
   * @param {Object} transaction - Transaction object
   */
  async checkStuckTransaction(transaction) {
    const now = Date.now();
    const txTime = transaction.timestamp || 0;
    const timeDiff = now - txTime;

    // If transaction is pending for more than 10 minutes
    if (timeDiff > 600000) {
      console.log(`⏱️ Transaction stuck: ${transaction.hash}`);

      // Check if gas price is too low
      const currentGasPrice = await this.provider.getFeeData();

      if (BigInt(transaction.gasPrice) < currentGasPrice.gasPrice) {
        await this.contributionRecorder.recordRejectedContribution({
          transactionHash: transaction.hash,
          walletAddress: transaction.from,
          amountWei: transaction.value.toString(),
          rejectionReason: 'TRANSACTION_FAILED',
          rejectionMessage: 'Transaction stuck - gas price too low',
          errorDetails: {
            providedGasPrice: transaction.gasPrice.toString(),
            currentGasPrice: currentGasPrice.gasPrice.toString(),
            timePending: timeDiff,
          },
          network: 'ethereum',
          contractAddress: transaction.to,
          attemptedAt: new Date(txTime).toISOString(),
        });
      }
    }
  }

  /**
   * Monitor transaction confirmations
   * @param {string} transactionHash - Transaction hash
   * @param {string} contributionId - Contribution ID in database
   * @param {number} blockNumber - Block number of transaction
   */
  async monitorConfirmations(transactionHash, contributionId, blockNumber) {
    const checkConfirmations = async () => {
      try {
        const currentBlock = await this.provider.getBlockNumber();
        const confirmations = currentBlock - blockNumber;

        // Update confirmation count
        await this.updateConfirmationCount(contributionId, confirmations);

        // Consider confirmed after 12 blocks
        if (confirmations >= 12) {
          await this.markContributionConfirmed(contributionId);
          return true; // Stop monitoring
        } else if (confirmations >= 6) {
          await this.updateContributionStatus(contributionId, 'confirming');
        }

        return false; // Continue monitoring
      } catch (error) {
        console.error('Error monitoring confirmations:', error);
        return false;
      }
    };

    // Check every 15 seconds for up to 10 minutes
    const interval = setInterval(async () => {
      const isConfirmed = await checkConfirmations();
      if (isConfirmed) {
        clearInterval(interval);
      }
    }, 15000);

    // Stop monitoring after 10 minutes
    setTimeout(() => clearInterval(interval), 600000);
  }

  /**
   * Map blockchain rejection reason to internal categories
   * @param {string} blockchainReason - Reason from smart contract
   * @returns {string} Internal rejection reason
   */
  mapRejectionReason(blockchainReason) {
    const reasonMap = {
      KYC_REQUIRED: 'KYC_NOT_VERIFIED',
      EXCEEDS_LIMIT: 'EXCEEDS_CONTRIBUTION_LIMIT',
      INVALID_AMOUNT: 'INVALID_AMOUNT',
      CAMPAIGN_PAUSED: 'CAMPAIGN_INACTIVE',
      INSUFFICIENT_BALANCE: 'INSUFFICIENT_FUNDS',
      BLACKLISTED: 'BLACKLISTED_ADDRESS',
    };

    return reasonMap[blockchainReason] || 'OTHER';
  }

  /**
   * Add contribution to retry queue
   * @param {Object} contributionData - Contribution data
   */
  addToRetryQueue(contributionData) {
    const retryKey = `${contributionData.walletAddress}_${contributionData.campaignId}`;

    if (!this.retryQueue.has(retryKey)) {
      this.retryQueue.set(retryKey, {
        data: contributionData,
        retryCount: 0,
        nextRetry: Date.now() + 60000, // Retry after 1 minute
      });

      console.log(`Added to retry queue: ${retryKey}`);
    }
  }

  /**
   * Process retry queue
   */
  async startQueueProcessing() {
    setInterval(async () => {
      const now = Date.now();

      for (const [key, item] of this.retryQueue.entries()) {
        if (item.nextRetry <= now && item.retryCount < 3) {
          console.log(`Retrying contribution: ${key}`);

          const result = await this.contributionRecorder.recordContribution(item.data);

          if (result.success) {
            this.retryQueue.delete(key);
            console.log(`✅ Retry successful: ${key}`);
          } else {
            item.retryCount++;
            item.nextRetry = now + 60000 * Math.pow(2, item.retryCount); // Exponential backoff

            if (item.retryCount >= 3) {
              this.retryQueue.delete(key);
              console.log(`❌ Max retries reached: ${key}`);
            }
          }
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Get contributor details
   * @param {string} walletAddress - Ethereum wallet address
   * @returns {Object} Contributor details
   */
  async getContributorDetails(walletAddress) {
    // Implement integration with KYC service or database
    return {
      name: 'Unknown',
      email: null,
      phone: null,
      address: null,
      kycId: null,
      kycStatus: 'unknown',
      kycVerifiedAt: null,
      employer: null,
      occupation: null,
      isUsCitizen: null,
    };
  }

  /**
   * Get campaign details
   * @param {string} contractAddress - Smart contract address
   * @returns {Object} Campaign details
   */
  async getCampaignDetails(contractAddress) {
    // Implement database lookup
    return {
      id: 'unknown',
      name: 'Unknown Campaign',
    };
  }

  /**
   * Get pending transactions
   * @returns {Array} Pending transactions
   */
  async getPendingTransactions() {
    // Implement database query for pending transactions
    return [];
  }

  /**
   * Update KYC status
   * @param {string} walletAddress - Ethereum wallet address
   * @param {boolean} isVerified - Verification status
   */
  async updateKYCStatus(walletAddress, isVerified) {
    // Implement KYC status update
    console.log(`KYC status updated: ${walletAddress} = ${isVerified}`);
  }

  /**
   * Verify transaction was recorded
   * @param {Object} transaction - Transaction object
   * @param {Object} receipt - Transaction receipt
   */
  async verifyTransactionRecorded(transaction, receipt) {
    // Check if transaction exists in database
    // If not, process it
  }

  /**
   * Update confirmation count
   * @param {string} contributionId - Contribution ID
   * @param {number} confirmations - Number of confirmations
   */
  async updateConfirmationCount(contributionId, confirmations) {
    // Update database
    console.log(`Confirmations for ${contributionId}: ${confirmations}`);
  }

  /**
   * Update contribution status
   * @param {string} contributionId - Contribution ID
   * @param {string} status - New status
   */
  async updateContributionStatus(contributionId, status) {
    // Update database
    console.log(`Status update for ${contributionId}: ${status}`);
  }

  /**
   * Mark contribution as confirmed
   * @param {string} contributionId - Contribution ID
   */
  async markContributionConfirmed(contributionId) {
    // Update database
    console.log(`✅ Contribution confirmed: ${contributionId}`);
  }

  /**
   * Stop event listeners
   */
  async stop() {
    if (this.contract) {
      await this.contract.removeAllListeners();
    }
    console.log('Event handler stopped');
  }
}

module.exports = BlockchainEventHandler;
