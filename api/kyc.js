import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

// Enable CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeaders(corsHeaders).end();
  }

  // Set CORS headers for all responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // POST /api/kyc - Submit KYC information
  if (req.method === 'POST') {
    try {
      const {
        contribution_id,
        full_name,
        email,
        address,
        city,
        state,
        zip_code,
        country,
        occupation,
        employer,
      } = req.body;

      // Validate required fields
      const errors = {};
      if (!contribution_id) errors.contribution_id = 'Contribution ID is required';
      if (!full_name) errors.full_name = 'Full name is required';
      if (!email) errors.email = 'Email is required';
      if (!address) errors.address = 'Address is required';
      if (!city) errors.city = 'City is required';
      if (!state) errors.state = 'State is required';
      if (!zip_code) errors.zip_code = 'ZIP code is required';
      if (!country) errors.country = 'Country is required';

      // FEC compliance: occupation and employer required for contributions over $200
      const { data: contribution } = await supabase
        .from('contributions')
        .select('amount')
        .eq('id', contribution_id)
        .single();

      if (contribution && contribution.amount > 200) {
        if (!occupation) errors.occupation = 'Occupation is required for contributions over $200';
        if (!employer) errors.employer = 'Employer is required for contributions over $200';
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors,
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Invalid email format',
        });
      }

      // Create KYC record
      const kycData = {
        contribution_id,
        full_name,
        email,
        address,
        city,
        state,
        zip_code,
        country,
        occupation: occupation || null,
        employer: employer || null,
        verification_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('kyc_records')
        .insert([kycData])
        .select()
        .single();

      if (error) {
        console.error('Error creating KYC record:', error);
        return res.status(400).json({
          error: 'Failed to submit KYC information',
          message: error.message,
        });
      }

      // Update contribution status
      await supabase
        .from('contributions')
        .update({
          status: 'kyc_submitted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', contribution_id);

      return res.status(201).json({
        success: true,
        kyc_record: data,
      });
    } catch (error) {
      console.error('KYC submission error:', error);
      return res.status(500).json({
        error: 'Failed to submit KYC information',
        message: error.message,
      });
    }
  }

  // GET /api/kyc - Get KYC status
  if (req.method === 'GET') {
    try {
      const { contribution_id } = req.query;

      if (!contribution_id) {
        return res.status(400).json({
          error: 'Contribution ID is required',
        });
      }

      const { data, error } = await supabase
        .from('kyc_records')
        .select('*')
        .eq('contribution_id', contribution_id)
        .single();

      if (error) {
        console.error('Error fetching KYC record:', error);
        return res.status(404).json({
          error: 'KYC record not found',
        });
      }

      return res.status(200).json({
        success: true,
        kyc_record: data,
      });
    } catch (error) {
      console.error('KYC fetch error:', error);
      return res.status(500).json({
        error: 'Failed to fetch KYC information',
        message: error.message,
      });
    }
  }

  // PUT /api/kyc - Update KYC verification status (admin only)
  if (req.method === 'PUT') {
    try {
      const { kyc_id, verification_status, notes } = req.body;

      // In production, add proper authentication check here
      // For now, we'll accept the update

      if (!kyc_id || !verification_status) {
        return res.status(400).json({
          error: 'KYC ID and verification status are required',
        });
      }

      const validStatuses = ['pending', 'verified', 'rejected', 'requires_additional_info'];
      if (!validStatuses.includes(verification_status)) {
        return res.status(400).json({
          error: 'Invalid verification status',
        });
      }

      const updateData = {
        verification_status,
        updated_at: new Date().toISOString(),
      };

      if (notes) {
        updateData.verification_notes = notes;
      }

      const { data, error } = await supabase
        .from('kyc_records')
        .update(updateData)
        .eq('id', kyc_id)
        .select()
        .single();

      if (error) {
        console.error('Error updating KYC record:', error);
        return res.status(400).json({
          error: 'Failed to update KYC record',
          message: error.message,
        });
      }

      // Update contribution status if KYC is verified
      if (verification_status === 'verified') {
        await supabase
          .from('contributions')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.contribution_id);
      }

      return res.status(200).json({
        success: true,
        kyc_record: data,
      });
    } catch (error) {
      console.error('KYC update error:', error);
      return res.status(500).json({
        error: 'Failed to update KYC record',
        message: error.message,
      });
    }
  }

  // Method not allowed
  return res.status(405).json({
    error: `Method ${req.method} not allowed`,
  });
}
