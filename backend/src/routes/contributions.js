import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import web3Service from '../services/web3Service.js';
import { supabase } from '../services/supabaseService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Initialize Web3 service
const initWeb3 = async () => {
  if (!web3Service.initialized) {
    const network = process.env.WEB3_NETWORK || 'localhost';
    await web3Service.initialize(network);
  }
};

// Validation middleware
const validateAddress = [
  param('address')
    .isEthereumAddress()
    .withMessage('Invalid Ethereum address')
];

const validateContributionCheck = [
  body('address')
    .isEthereumAddress()
    .withMessage('Invalid Ethereum address'),
  body('amount')
    .isNumeric()
    .isFloat({ min: 0.0001, max: 10 })
    .withMessage('Amount must be between 0.0001 and 10 ETH')
];

const validateTransactionHash = [
  body('transactionHash')
    .matches(/^0x[a-fA-F0-9]{64}$/)
    .withMessage('Invalid transaction hash format')
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

// GET /api/contributions/stats - Get campaign contribution statistics
router.get('/stats', async (req, res) => {
  try {
    await initWeb3();
    const stats = await web3Service.getCampaignStats();
    
    // Get additional stats from database
    const { data: dbStats, error: dbError } = await supabase
      .from('contribution_logs')
      .select('status')
      .eq('status', 'completed');

    if (dbError) {
      logger.warn('Failed to fetch database stats:', dbError);
    }

    const response = {
      ...stats,
      databaseRecords: dbStats?.length || 0,
      lastUpdated: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get contribution stats:', error);
    res.status(500).json({
      error: 'Failed to retrieve contribution statistics',
      details: error.message
    });
  }
});

// GET /api/contributions/contributor/:address - Get contributor information
router.get('/contributor/:address', validateAddress, handleValidationErrors, async (req, res) => {
  try {
    await initWeb3();
    const { address } = req.params;
    
    const contributorInfo = await web3Service.getContributorInfo(address);
    
    // Get contribution history from database
    const { data: history, error: historyError } = await supabase
      .from('contribution_logs')
      .select('*')
      .eq('contributor_address', address.toLowerCase())
      .order('created_at', { ascending: false });

    if (historyError) {
      logger.warn('Failed to fetch contribution history:', historyError);
    }

    const response = {
      ...contributorInfo,
      history: history || [],
      historyCount: history?.length || 0
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get contributor info:', error);
    res.status(500).json({
      error: 'Failed to retrieve contributor information',
      details: error.message
    });
  }
});

// POST /api/contributions/check - Check if contribution is allowed
router.post('/check', validateContributionCheck, handleValidationErrors, async (req, res) => {
  try {
    await initWeb3();
    const { address, amount } = req.body;
    
    const eligibility = await web3Service.canContribute(address, amount);
    const contributorInfo = await web3Service.getContributorInfo(address);
    const maxContribution = await web3Service.getMaxContributionWei();

    const response = {
      ...eligibility,
      contributorInfo,
      maxContribution,
      checkTimestamp: new Date().toISOString()
    };

    // Log the eligibility check
    try {
      await supabase.from('contribution_checks').insert({
        contributor_address: address.toLowerCase(),
        amount_eth: amount.toString(),
        can_contribute: eligibility.canContribute,
        reason: eligibility.reason,
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      logger.warn('Failed to log contribution check:', logError);
    }

    res.json(response);
  } catch (error) {
    logger.error('Failed to check contribution eligibility:', error);
    res.status(500).json({
      error: 'Failed to check contribution eligibility',
      details: error.message
    });
  }
});

// GET /api/contributions/max-amount - Get maximum contribution amount
router.get('/max-amount', async (req, res) => {
  try {
    await initWeb3();
    const maxContribution = await web3Service.getMaxContributionWei();
    
    res.json({
      ...maxContribution,
      fecLimit: 3300,
      currency: 'USD',
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get max contribution amount:', error);
    res.status(500).json({
      error: 'Failed to retrieve maximum contribution amount',
      details: error.message
    });
  }
});

// POST /api/contributions/transaction/monitor - Start monitoring a transaction
router.post('/transaction/monitor', validateTransactionHash, handleValidationErrors, async (req, res) => {
  try {
    await initWeb3();
    const { transactionHash, contributorAddress, expectedAmount } = req.body;
    
    // Start monitoring the transaction
    const receipt = await web3Service.waitForTransaction(transactionHash);
    
    // Log the transaction monitoring
    const logData = {
      transaction_hash: transactionHash,
      contributor_address: contributorAddress?.toLowerCase(),
      expected_amount_eth: expectedAmount?.toString(),
      status: receipt.success ? 'completed' : 'failed',
      block_number: receipt.blockNumber,
      gas_used: receipt.gasUsed,
      gas_price: receipt.effectiveGasPrice,
      created_at: new Date().toISOString()
    };

    const { error: logError } = await supabase
      .from('contribution_logs')
      .insert(logData);

    if (logError) {
      logger.warn('Failed to log transaction:', logError);
    }

    res.json({
      transactionHash,
      success: receipt.success,
      receipt,
      logged: !logError
    });
  } catch (error) {
    logger.error('Failed to monitor transaction:', error);
    res.status(500).json({
      error: 'Failed to monitor transaction',
      details: error.message
    });
  }
});

// GET /api/contributions/recent - Get recent contributions
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    
    if (limit > 100) {
      return res.status(400).json({
        error: 'Limit cannot exceed 100'
      });
    }

    const { data: contributions, error } = await supabase
      .from('contribution_logs')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    res.json({
      contributions: contributions || [],
      count: contributions?.length || 0,
      limit,
      offset
    });
  } catch (error) {
    logger.error('Failed to get recent contributions:', error);
    res.status(500).json({
      error: 'Failed to retrieve recent contributions',
      details: error.message
    });
  }
});

// GET /api/contributions/network - Get network information
router.get('/network', async (req, res) => {
  try {
    await initWeb3();
    const networkInfo = await web3Service.getNetworkInfo();
    
    res.json(networkInfo);
  } catch (error) {
    logger.error('Failed to get network info:', error);
    res.status(500).json({
      error: 'Failed to retrieve network information',
      details: error.message
    });
  }
});

export default router;