import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { supabase } from '../services/supabaseService.js';
import Web3Service from '../services/web3Service.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const web3Service = new Web3Service();

// Validation middleware
const validateAddress = [
  param('address')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid Ethereum address format')
];

const validateKYCSubmission = [
  body('address')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid Ethereum address format'),
  body('fullName')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .withMessage('Valid email is required'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number required'),
  body('documentType')
    .isIn(['passport', 'drivers_license', 'national_id'])
    .withMessage('Document type must be passport, drivers_license, or national_id'),
  body('documentNumber')
    .isLength({ min: 5, max: 50 })
    .withMessage('Document number must be between 5 and 50 characters')
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

// GET /api/kyc/status/:address - Check KYC status for an address
router.get('/status/:address', validateAddress, handleValidationErrors, async (req, res) => {
  try {
    const { address } = req.params;
    const addressLower = address.toLowerCase();

    // Check database KYC status
    const { data: kycRecord, error: dbError } = await supabase
      .from('kyc_verifications')
      .select('*')
      .eq('wallet_address', addressLower)
      .single();

    if (dbError && dbError.code !== 'PGRST116') {
      logger.warn('Database KYC check failed:', dbError);
    }

    // Check on-chain KYC status
    let onChainVerified = false;
    try {
      await initWeb3();
      onChainVerified = await web3Service.isKYCVerified(address);
    } catch (web3Error) {
      logger.warn('Web3 KYC check failed:', web3Error.message);
    }

    const response = {
      address: address,
      isVerified: onChainVerified || (kycRecord?.status === 'approved'),
      onChainVerified,
      databaseStatus: kycRecord?.status || 'not_submitted',
      submissionDate: kycRecord?.created_at || null,
      lastUpdated: kycRecord?.updated_at || null
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to check KYC status:', error);
    res.status(500).json({
      error: 'Failed to check KYC status',
      details: error.message
    });
  }
});

// POST /api/kyc/submit - Submit KYC information
router.post('/submit', validateKYCSubmission, handleValidationErrors, async (req, res) => {
  try {
    const {
      address,
      fullName,
      email,
      phone,
      documentType,
      documentNumber,
      documentImages,
      selfieImage
    } = req.body;

    const addressLower = address.toLowerCase();

    // Check if KYC already exists
    const { data: existingKYC, error: checkError } = await supabase
      .from('kyc_verifications')
      .select('id, status')
      .eq('wallet_address', addressLower)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingKYC && existingKYC.status === 'approved') {
      return res.status(400).json({
        error: 'KYC already approved for this address'
      });
    }

    // Store KYC submission
    const kycData = {
      wallet_address: addressLower,
      full_name: fullName,
      email: email,
      phone: phone,
      document_type: documentType,
      document_number: documentNumber,
      document_images: documentImages || [],
      selfie_image: selfieImage,
      status: 'pending',
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let kycRecord;
    if (existingKYC) {
      // Update existing submission
      const { data, error } = await supabase
        .from('kyc_verifications')
        .update(kycData)
        .eq('id', existingKYC.id)
        .select()
        .single();

      if (error) throw error;
      kycRecord = data;
    } else {
      // Create new submission
      const { data, error } = await supabase
        .from('kyc_verifications')
        .insert([kycData])
        .select()
        .single();

      if (error) throw error;
      kycRecord = data;
    }

    logger.info('KYC submitted:', { id: kycRecord.id, address: addressLower });

    // In a real implementation, you would:
    // 1. Upload documents to secure storage
    // 2. Send to KYC verification service
    // 3. Return verification ID for tracking

    res.status(201).json({
      kycId: kycRecord.id,
      status: 'pending',
      message: 'KYC submission received and is being processed',
      estimatedProcessingTime: '24-48 hours'
    });
  } catch (error) {
    logger.error('Failed to submit KYC:', error);
    res.status(500).json({
      error: 'Failed to submit KYC verification',
      details: error.message
    });
  }
});

// PUT /api/kyc/:id/approve - Approve KYC (admin only)
router.put('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approved_by } = req.body;

    // Get KYC record
    const { data: kycRecord, error: fetchError } = await supabase
      .from('kyc_verifications')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'KYC record not found'
        });
      }
      throw fetchError;
    }

    if (kycRecord.status === 'approved') {
      return res.status(400).json({
        error: 'KYC already approved'
      });
    }

    // Update status to approved
    const { data: updatedKYC, error: updateError } = await supabase
      .from('kyc_verifications')
      .update({
        status: 'approved',
        approved_by: approved_by || 'admin',
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // TODO: Update on-chain KYC verification
    // This would require admin private key and contract interaction
    logger.info('KYC approved:', { id, address: kycRecord.wallet_address });

    res.json({
      kycId: id,
      status: 'approved',
      address: kycRecord.wallet_address,
      message: 'KYC verification approved'
    });
  } catch (error) {
    logger.error('Failed to approve KYC:', error);
    res.status(500).json({
      error: 'Failed to approve KYC verification',
      details: error.message
    });
  }
});

// PUT /api/kyc/:id/reject - Reject KYC (admin only)
router.put('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, rejected_by } = req.body;

    const { data: updatedKYC, error } = await supabase
      .from('kyc_verifications')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        rejected_by: rejected_by || 'admin',
        rejected_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'KYC record not found'
        });
      }
      throw error;
    }

    logger.info('KYC rejected:', { id, reason });

    res.json({
      kycId: id,
      status: 'rejected',
      reason: reason,
      message: 'KYC verification rejected'
    });
  } catch (error) {
    logger.error('Failed to reject KYC:', error);
    res.status(500).json({
      error: 'Failed to reject KYC verification',
      details: error.message
    });
  }
});

// GET /api/kyc/pending - Get pending KYC verifications (admin only)
router.get('/pending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const { data: pendingKYCs, error } = await supabase
      .from('kyc_verifications')
      .select('id, wallet_address, full_name, email, document_type, submitted_at, status')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      pending: pendingKYCs || [],
      count: pendingKYCs?.length || 0,
      limit,
      offset
    });
  } catch (error) {
    logger.error('Failed to get pending KYCs:', error);
    res.status(500).json({
      error: 'Failed to retrieve pending KYC verifications',
      details: error.message
    });
  }
});

export default router;