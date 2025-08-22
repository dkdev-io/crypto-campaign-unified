import express from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '../services/supabaseService.js';
import Web3Service from '../services/web3Service.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const web3Service = new Web3Service();

// Validation middleware
const validateBlockchainWebhook = [
  body('transactionHash')
    .matches(/^0x[a-fA-F0-9]{64}$/)
    .withMessage('Invalid transaction hash format'),
  body('blockNumber')
    .isInt({ min: 0 })
    .withMessage('Block number must be a positive integer'),
  body('from')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid from address format'),
  body('to')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid to address format'),
  body('value')
    .isString()
    .withMessage('Value must be a string (wei amount)')
];

const validateKYCWebhook = [
  body('address')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid Ethereum address format'),
  body('status')
    .isIn(['approved', 'rejected', 'pending'])
    .withMessage('Status must be approved, rejected, or pending'),
  body('kycId')
    .isString()
    .withMessage('KYC ID is required')
];

// Error handler for validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Initialize Web3 service
const initWeb3 = async () => {
  if (!web3Service.initialized) {
    const network = process.env.WEB3_NETWORK || 'localhost';
    await web3Service.initialize(network);
  }
};

// POST /api/webhooks/blockchain/contribution - Handle blockchain contribution events
router.post('/blockchain/contribution', validateBlockchainWebhook, handleValidationErrors, async (req, res) => {
  try {
    const {
      transactionHash,
      blockNumber,
      from,
      to,
      value,
      gasUsed,
      effectiveGasPrice,
      status
    } = req.body;

    logger.info('Blockchain contribution webhook received:', {
      txHash: transactionHash,
      from,
      value
    });

    // Verify transaction on blockchain
    await initWeb3();
    const receipt = await web3Service.waitForTransaction(transactionHash);

    if (!receipt.success) {
      logger.warn('Transaction failed on blockchain:', transactionHash);
      return res.status(400).json({
        error: 'Transaction failed on blockchain'
      });
    }

    // Check if we already processed this transaction
    const { data: existingLog, error: checkError } = await supabase
      .from('contribution_logs')
      .select('id')
      .eq('transaction_hash', transactionHash)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingLog) {
      logger.info('Transaction already processed:', transactionHash);
      return res.json({
        message: 'Transaction already processed',
        transactionHash
      });
    }

    // Convert wei to ETH for storage
    const ethAmount = parseFloat(value) / 1e18;

    // Log the contribution
    const logData = {
      transaction_hash: transactionHash,
      contributor_address: from.toLowerCase(),
      contract_address: to.toLowerCase(),
      amount_wei: value,
      amount_eth: ethAmount.toString(),
      block_number: blockNumber,
      gas_used: gasUsed?.toString(),
      gas_price: effectiveGasPrice?.toString(),
      status: receipt.success ? 'completed' : 'failed',
      webhook_received_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    const { data: logRecord, error: logError } = await supabase
      .from('contribution_logs')
      .insert([logData])
      .select()
      .single();

    if (logError) {
      throw logError;
    }

    // Try to match with existing form submission
    const { data: formSubmission, error: formError } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('wallet_address', from.toLowerCase())
      .eq('transaction_hash', transactionHash)
      .single();

    if (formError && formError.code !== 'PGRST116') {
      logger.warn('Could not find matching form submission:', formError);
    }

    if (formSubmission) {
      logger.info('Matched contribution with form submission:', formSubmission.id);
    }

    logger.info('Contribution logged successfully:', logRecord.id);

    res.json({
      message: 'Contribution webhook processed successfully',
      logId: logRecord.id,
      transactionHash,
      matchedSubmission: !!formSubmission
    });
  } catch (error) {
    logger.error('Failed to process blockchain webhook:', error);
    res.status(500).json({
      error: 'Failed to process blockchain contribution webhook',
      details: error.message
    });
  }
});

// POST /api/webhooks/kyc/status - Handle KYC status updates from external service
router.post('/kyc/status', validateKYCWebhook, handleValidationErrors, async (req, res) => {
  try {
    const {
      address,
      status,
      kycId,
      reason,
      documents,
      metadata
    } = req.body;

    logger.info('KYC webhook received:', {
      address,
      status,
      kycId
    });

    const addressLower = address.toLowerCase();

    // Update KYC record in database
    const updateData = {
      status,
      updated_at: new Date().toISOString(),
      webhook_received_at: new Date().toISOString()
    };

    if (status === 'approved') {
      updateData.approved_at = new Date().toISOString();
      updateData.approved_by = 'external_service';
    } else if (status === 'rejected') {
      updateData.rejected_at = new Date().toISOString();
      updateData.rejected_by = 'external_service';
      updateData.rejection_reason = reason;
    }

    if (documents) {
      updateData.verified_documents = documents;
    }

    if (metadata) {
      updateData.verification_metadata = metadata;
    }

    const { data: updatedKYC, error: updateError } = await supabase
      .from('kyc_verifications')
      .update(updateData)
      .eq('wallet_address', addressLower)
      .eq('external_kyc_id', kycId)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        logger.warn('KYC record not found for webhook:', { address, kycId });
        return res.status(404).json({
          error: 'KYC record not found'
        });
      }
      throw updateError;
    }

    // If approved, update on-chain KYC status (requires admin privileges)
    if (status === 'approved') {
      try {
        await initWeb3();
        // Note: This would require admin private key to call setKYCVerified
        logger.info('KYC approved, on-chain update needed:', address);
      } catch (web3Error) {
        logger.warn('Failed to update on-chain KYC status:', web3Error.message);
      }
    }

    logger.info('KYC webhook processed successfully:', updatedKYC.id);

    res.json({
      message: 'KYC webhook processed successfully',
      kycId: updatedKYC.id,
      address,
      status
    });
  } catch (error) {
    logger.error('Failed to process KYC webhook:', error);
    res.status(500).json({
      error: 'Failed to process KYC status webhook',
      details: error.message
    });
  }
});

// POST /api/webhooks/plaid/bank-verification - Handle Plaid bank verification webhooks
router.post('/plaid/bank-verification', async (req, res) => {
  try {
    const {
      item_id,
      webhook_type,
      webhook_code,
      error,
      new_webhook_url
    } = req.body;

    logger.info('Plaid webhook received:', {
      webhook_type,
      webhook_code,
      item_id
    });

    // Handle different Plaid webhook types
    if (webhook_type === 'ITEM') {
      switch (webhook_code) {
        case 'WEBHOOK_UPDATE_ACKNOWLEDGED':
          logger.info('Plaid webhook URL updated:', new_webhook_url);
          break;
        case 'ERROR':
          logger.error('Plaid item error:', error);
          // Update campaign bank verification status
          break;
        case 'PENDING_EXPIRATION':
          logger.warn('Plaid item expiring soon:', item_id);
          // Notify campaign owner
          break;
        default:
          logger.info('Unhandled Plaid webhook code:', webhook_code);
      }
    } else if (webhook_type === 'AUTH') {
      switch (webhook_code) {
        case 'AUTOMATICALLY_VERIFIED':
          logger.info('Bank account automatically verified:', item_id);
          // Update verification status in database
          break;
        case 'VERIFICATION_EXPIRED':
          logger.warn('Bank verification expired:', item_id);
          // Update status and notify user
          break;
        default:
          logger.info('Unhandled Auth webhook code:', webhook_code);
      }
    }

    res.json({
      message: 'Plaid webhook processed successfully'
    });
  } catch (error) {
    logger.error('Failed to process Plaid webhook:', error);
    res.status(500).json({
      error: 'Failed to process Plaid webhook',
      details: error.message
    });
  }
});

// GET /api/webhooks/health - Health check for webhook endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    webhookTypes: [
      'blockchain/contribution',
      'kyc/status',
      'plaid/bank-verification'
    ]
  });
});

export default router;