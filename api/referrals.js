import { referralSystem } from '../lib/referralSystem.js';

/**
 * API Routes for Referral System
 * Handles donor creation, referral validation, and statistics
 */

// Enable CORS for all referral routes
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

/**
 * Handle preflight OPTIONS requests
 */
async function handleCORS(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  return null;
}

/**
 * POST /api/referrals/create-donor
 * Create or retrieve a donor with referral code
 * Body: { email, name, walletAddress?, phone? }
 */
export async function createDonor(request) {
  const corsResponse = await handleCORS(request);
  if (corsResponse) return corsResponse;

  try {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { email, name, walletAddress, phone } = body;

    // Validate required fields
    if (!email || !name) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: email and name are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create or get donor
    const donor = await referralSystem.createOrGetDonor({
      email: email.toLowerCase().trim(),
      name: name.trim(),
      walletAddress: walletAddress?.trim() || null,
      phone: phone?.trim() || null
    });

    return new Response(JSON.stringify({
      success: true,
      donor: {
        id: donor.id,
        email: donor.email,
        name: donor.full_name,
        walletAddress: donor.wallet_address,
        referralCode: donor.referral_code,
        totalRaised: donor.total_raised,
        referralCount: donor.referral_count,
        createdAt: donor.created_at
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in createDonor:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

/**
 * GET /api/referrals/validate?code=XXXX
 * Validate a referral code
 */
export async function validateReferral(request) {
  const corsResponse = await handleCORS(request);
  if (corsResponse) return corsResponse;

  try {
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    if (!code) {
      return new Response(JSON.stringify({ error: 'Missing referral code parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const validation = await referralSystem.validateReferralCode(code);

    return new Response(JSON.stringify({
      success: true,
      isValid: validation.isValid,
      donor: validation.donor
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in validateReferral:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

/**
 * GET /api/referrals/stats/[donorId]
 * Get referral statistics for a donor
 */
export async function getReferralStats(request, { params }) {
  const corsResponse = await handleCORS(request);
  if (corsResponse) return corsResponse;

  try {
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const donorId = params?.donorId;
    if (!donorId) {
      return new Response(JSON.stringify({ error: 'Missing donor ID parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(donorId)) {
      return new Response(JSON.stringify({ error: 'Invalid donor ID format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get both referral stats and aggregate stats
    const [referralStats, aggregateStats] = await Promise.all([
      referralSystem.getReferralStats(donorId),
      referralSystem.getDonorAggregateStats(donorId)
    ]);

    return new Response(JSON.stringify({
      success: true,
      referralStats,
      aggregateStats
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in getReferralStats:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

/**
 * GET /api/referrals/candidates
 * Get list of active candidates
 */
export async function getCandidates(request) {
  const corsResponse = await handleCORS(request);
  if (corsResponse) return corsResponse;

  try {
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const candidates = await referralSystem.getCandidates();

    return new Response(JSON.stringify({
      success: true,
      candidates
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in getCandidates:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// For serverless environments like Vercel, export default handler
export default async function handler(request, context) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Route matching for different endpoints
  if (pathname === '/api/referrals/create-donor') {
    return createDonor(request);
  }
  
  if (pathname === '/api/referrals/validate') {
    return validateReferral(request);
  }
  
  if (pathname === '/api/referrals/candidates') {
    return getCandidates(request);
  }

  if (pathname.match(/\/api\/referrals\/stats\/(.+)/)) {
    const donorId = pathname.split('/').pop();
    return getReferralStats(request, { params: { donorId } });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}