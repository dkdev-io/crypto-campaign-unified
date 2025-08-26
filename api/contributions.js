import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

// Enable CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Rate limiting storage (in production, use Redis or similar)
const rateLimitStore = new Map();

// Simple rate limiter
function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const maxRequests = 10;
  
  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  const limit = rateLimitStore.get(ip);
  if (now > limit.resetTime) {
    limit.count = 1;
    limit.resetTime = now + windowMs;
    return true;
  }
  
  if (limit.count >= maxRequests) {
    return false;
  }
  
  limit.count++;
  return true;
}

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeaders(corsHeaders).end();
  }

  // Set CORS headers for all responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Apply rate limiting for POST requests
  if (req.method === 'POST') {
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({
        error: 'Too many contribution attempts, please try again later.',
        retryAfter: '5 minutes'
      });
    }
  }

  // GET /api/contributions - List contributions
  if (req.method === 'GET') {
    try {
      const { campaign_id, page = 1, limit = 10, status } = req.query;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('contributions')
        .select('*', { count: 'exact' });

      if (campaign_id) {
        query = query.eq('campaign_id', campaign_id);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching contributions:', error);
        return res.status(400).json({
          error: 'Failed to fetch contributions',
          message: error.message
        });
      }

      return res.status(200).json({
        success: true,
        contributions: data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('Contributions list error:', error);
      return res.status(500).json({
        error: 'Failed to fetch contributions',
        message: error.message
      });
    }
  }

  // POST /api/contributions - Create new contribution
  if (req.method === 'POST') {
    try {
      const {
        campaign_id,
        amount,
        currency,
        transaction_hash,
        wallet_address,
        donor_info
      } = req.body;

      // Validate required fields
      const errors = {};
      if (!campaign_id) errors.campaign_id = 'Campaign ID is required';
      if (!amount || amount <= 0) errors.amount = 'Valid amount is required';
      if (!currency) errors.currency = 'Currency is required';
      if (!wallet_address) errors.wallet_address = 'Wallet address is required';

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors
        });
      }

      // Validate wallet address format
      if (!ethers.isAddress(wallet_address)) {
        return res.status(400).json({
          error: 'Invalid wallet address format'
        });
      }

      // Validate transaction hash if provided
      if (transaction_hash && !/^0x[a-fA-F0-9]{64}$/.test(transaction_hash)) {
        return res.status(400).json({
          error: 'Invalid transaction hash format'
        });
      }

      // Check if campaign exists
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('id')
        .eq('id', campaign_id)
        .single();

      if (campaignError || !campaign) {
        return res.status(404).json({
          error: 'Campaign not found'
        });
      }

      // Create contribution
      const contributionData = {
        campaign_id,
        amount: parseFloat(amount),
        currency: currency.toUpperCase(),
        transaction_hash,
        wallet_address: wallet_address.toLowerCase(),
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Add donor info if provided
      if (donor_info) {
        contributionData.donor_info = donor_info;
      }

      const { data, error } = await supabase
        .from('contributions')
        .insert([contributionData])
        .select()
        .single();

      if (error) {
        console.error('Error creating contribution:', error);
        return res.status(400).json({
          error: 'Failed to create contribution',
          message: error.message
        });
      }

      return res.status(201).json({
        success: true,
        contribution: data
      });
    } catch (error) {
      console.error('Contribution creation error:', error);
      return res.status(500).json({
        error: 'Failed to create contribution',
        message: error.message
      });
    }
  }

  // Method not allowed
  return res.status(405).json({
    error: `Method ${req.method} not allowed`
  });
}