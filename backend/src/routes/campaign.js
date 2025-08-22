import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { supabase } from '../services/supabaseService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Validation middleware
const validateCampaignCreate = [
  body('campaign_name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Campaign name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .withMessage('Valid email is required'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Valid website URL required')
];

const validateCampaignId = [
  param('id')
    .isUUID()
    .withMessage('Invalid campaign ID format')
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

// GET /api/campaign/:id - Get campaign details
router.get('/:id', validateCampaignId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Campaign not found'
        });
      }
      throw error;
    }

    // Remove sensitive fields before sending to client
    const {
      email,
      setup_step,
      setup_completed_at,
      terms_accepted_at,
      terms_ip_address,
      ...publicCampaign
    } = campaign;

    res.json({
      campaign: publicCampaign
    });
  } catch (error) {
    logger.error('Failed to get campaign:', error);
    res.status(500).json({
      error: 'Failed to retrieve campaign',
      details: error.message
    });
  }
});

// POST /api/campaign - Create new campaign
router.post('/', validateCampaignCreate, handleValidationErrors, async (req, res) => {
  try {
    const campaignData = {
      ...req.body,
      setup_step: 1,
      setup_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert([campaignData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    logger.info('Campaign created:', campaign.id);

    res.status(201).json({
      campaign,
      message: 'Campaign created successfully'
    });
  } catch (error) {
    logger.error('Failed to create campaign:', error);
    res.status(500).json({
      error: 'Failed to create campaign',
      details: error.message
    });
  }
});

// PUT /api/campaign/:id - Update campaign
router.put('/:id', validateCampaignId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Campaign not found'
        });
      }
      throw error;
    }

    logger.info('Campaign updated:', id);

    res.json({
      campaign,
      message: 'Campaign updated successfully'
    });
  } catch (error) {
    logger.error('Failed to update campaign:', error);
    res.status(500).json({
      error: 'Failed to update campaign',
      details: error.message
    });
  }
});

// GET /api/campaign/:id/stats - Get campaign statistics
router.get('/:id/stats', validateCampaignId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    // Get campaign basic info
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, campaign_name, created_at')
      .eq('id', id)
      .single();

    if (campaignError) {
      if (campaignError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Campaign not found'
        });
      }
      throw campaignError;
    }

    // Get contribution statistics
    const { data: contributions, error: contributionsError } = await supabase
      .from('form_submissions')
      .select('amount_usd, created_at')
      .eq('campaign_id', id);

    if (contributionsError) {
      logger.warn('Failed to fetch contributions:', contributionsError);
    }

    const stats = {
      campaignId: id,
      campaignName: campaign.campaign_name,
      totalContributions: contributions?.length || 0,
      totalAmount: contributions?.reduce((sum, c) => sum + (c.amount_usd || 0), 0) || 0,
      lastContribution: contributions?.length > 0 
        ? Math.max(...contributions.map(c => new Date(c.created_at).getTime()))
        : null,
      createdAt: campaign.created_at
    };

    res.json(stats);
  } catch (error) {
    logger.error('Failed to get campaign stats:', error);
    res.status(500).json({
      error: 'Failed to retrieve campaign statistics',
      details: error.message
    });
  }
});

// GET /api/campaign/:id/contributions - Get campaign contributions
router.get('/:id/contributions', validateCampaignId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    if (limit > 100) {
      return res.status(400).json({
        error: 'Limit cannot exceed 100'
      });
    }

    const { data: contributions, error } = await supabase
      .from('form_submissions')
      .select('id, donor_full_name, amount_usd, cryptocurrency, created_at, transaction_hash')
      .eq('campaign_id', id)
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
    logger.error('Failed to get campaign contributions:', error);
    res.status(500).json({
      error: 'Failed to retrieve campaign contributions',
      details: error.message
    });
  }
});

export default router;