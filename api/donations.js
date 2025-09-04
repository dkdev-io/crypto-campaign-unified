import { referralSystem } from '../lib/referralSystem.js';

/**
 * API Routes for Donation Management
 * Handles donation creation and status updates
 */

// Enable CORS for all donation routes
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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
 * POST /api/donations/create
 * Record a new donation with referral attribution
 * Body: { 
 *   donorData: { email, name, walletAddress?, phone? },
 *   candidateId, 
 *   amount, 
 *   transactionHash?, 
 *   referralCode?,
 *   network?,
 *   currency?
 * }
 */
export async function createDonation(request) {
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
    const { 
      donorData, 
      candidateId, 
      amount, 
      transactionHash, 
      referralCode, 
      network = 'ethereum',
      currency = 'ETH'
    } = body;

    // Validate required fields
    if (!donorData || !candidateId || !amount) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: donorData, candidateId, and amount are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate donor data
    if (!donorData.email || !donorData.name) {
      return new Response(JSON.stringify({ 
        error: 'donorData must include email and name' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate amount is positive number
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return new Response(JSON.stringify({ error: 'Amount must be a positive number' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate candidate ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(candidateId)) {
      return new Response(JSON.stringify({ error: 'Invalid candidate ID format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Record the donation
    const donation = await referralSystem.recordDonation({
      donorData: {
        email: donorData.email.toLowerCase().trim(),
        name: donorData.name.trim(),
        walletAddress: donorData.walletAddress?.trim() || null,
        phone: donorData.phone?.trim() || null
      },
      candidateId,
      amount: amount.toString(),
      transactionHash: transactionHash?.trim() || null,
      referralCode: referralCode?.trim().toUpperCase() || null,
      network,
      currency
    });

    return new Response(JSON.stringify({
      success: true,
      donation: {
        id: donation.id,
        donorId: donation.donor_id,
        candidateId: donation.candidate_id,
        referrerId: donation.referrer_id,
        amount: donation.amount,
        currency: donation.currency,
        transactionHash: donation.transaction_hash,
        status: donation.status,
        referralCode: donation.referral_code,
        network: donation.network,
        donationDate: donation.donation_date,
        createdAt: donation.created_at
      }
    }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in createDonation:', error);
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
 * PUT /api/donations/[donationId]/status
 * Update donation status (e.g., when blockchain transaction is confirmed)
 * Body: { status, blockNumber?, gasUsed?, gasPrice? }
 */
export async function updateDonationStatus(request, { params }) {
  const corsResponse = await handleCORS(request);
  if (corsResponse) return corsResponse;

  try {
    if (request.method !== 'PUT') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const donationId = params?.donationId;
    if (!donationId) {
      return new Response(JSON.stringify({ error: 'Missing donation ID parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(donationId)) {
      return new Response(JSON.stringify({ error: 'Invalid donation ID format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { status, blockNumber, gasUsed, gasPrice } = body;

    // Validate status
    const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
    if (!status || !validStatuses.includes(status)) {
      return new Response(JSON.stringify({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare additional data
    const additionalData = {};
    if (blockNumber !== undefined) additionalData.block_number = blockNumber;
    if (gasUsed !== undefined) additionalData.gas_used = gasUsed;
    if (gasPrice !== undefined) additionalData.gas_price = gasPrice.toString();

    // Update donation status
    const updatedDonation = await referralSystem.updateDonationStatus(
      donationId, 
      status, 
      additionalData
    );

    return new Response(JSON.stringify({
      success: true,
      donation: {
        id: updatedDonation.id,
        donorId: updatedDonation.donor_id,
        candidateId: updatedDonation.candidate_id,
        referrerId: updatedDonation.referrer_id,
        amount: updatedDonation.amount,
        currency: updatedDonation.currency,
        transactionHash: updatedDonation.transaction_hash,
        status: updatedDonation.status,
        referralCode: updatedDonation.referral_code,
        network: updatedDonation.network,
        blockNumber: updatedDonation.block_number,
        gasUsed: updatedDonation.gas_used,
        gasPrice: updatedDonation.gas_price,
        donationDate: updatedDonation.donation_date,
        confirmedAt: updatedDonation.confirmed_at,
        updatedAt: updatedDonation.updated_at
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in updateDonationStatus:', error);
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
 * GET /api/donations/[donationId]
 * Get donation details by ID
 */
export async function getDonation(request, { params }) {
  const corsResponse = await handleCORS(request);
  if (corsResponse) return corsResponse;

  try {
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const donationId = params?.donationId;
    if (!donationId) {
      return new Response(JSON.stringify({ error: 'Missing donation ID parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(donationId)) {
      return new Response(JSON.stringify({ error: 'Invalid donation ID format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // This would require adding a getDonation method to the referral system
    // For now, we'll return a not implemented error
    return new Response(JSON.stringify({ 
      error: 'Not implemented yet - getDonation method needs to be added to referralSystem' 
    }), {
      status: 501,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in getDonation:', error);
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
  if (pathname === '/api/donations/create') {
    return createDonation(request);
  }

  if (pathname.match(/\/api\/donations\/(.+)\/status$/)) {
    const donationId = pathname.split('/')[3];
    return updateDonationStatus(request, { params: { donationId } });
  }

  if (pathname.match(/\/api\/donations\/(.+)$/)) {
    const donationId = pathname.split('/').pop();
    return getDonation(request, { params: { donationId } });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}