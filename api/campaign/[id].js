import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

// Enable CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

  const { id } = req.query;

  // GET /api/campaign/[id] - Get campaign details
  if (req.method === 'GET') {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return res.status(400).json({
          error: 'Invalid campaign ID format',
        });
      }

      const { data, error } = await supabase.from('campaigns').select('*').eq('id', id).single();

      if (error) {
        console.error('Error fetching campaign:', error);
        return res.status(404).json({
          error: 'Campaign not found',
        });
      }

      return res.status(200).json({
        success: true,
        campaign: data,
      });
    } catch (error) {
      console.error('Campaign fetch error:', error);
      return res.status(500).json({
        error: 'Failed to fetch campaign',
        message: error.message,
      });
    }
  }

  // PUT /api/campaign/[id] - Update campaign
  if (req.method === 'PUT') {
    try {
      const { campaign_name, email, website, wallet_address } = req.body;

      const updateData = {};
      if (campaign_name) updateData.campaign_name = campaign_name;
      if (email) updateData.email = email;
      if (website) updateData.website = website;
      if (wallet_address) updateData.wallet_address = wallet_address;

      const { data, error } = await supabase
        .from('campaigns')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating campaign:', error);
        return res.status(400).json({
          error: 'Failed to update campaign',
          message: error.message,
        });
      }

      return res.status(200).json({
        success: true,
        campaign: data,
      });
    } catch (error) {
      console.error('Campaign update error:', error);
      return res.status(500).json({
        error: 'Failed to update campaign',
        message: error.message,
      });
    }
  }

  // DELETE /api/campaign/[id] - Delete campaign
  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase.from('campaigns').delete().eq('id', id);

      if (error) {
        console.error('Error deleting campaign:', error);
        return res.status(400).json({
          error: 'Failed to delete campaign',
          message: error.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Campaign deleted successfully',
      });
    } catch (error) {
      console.error('Campaign deletion error:', error);
      return res.status(500).json({
        error: 'Failed to delete campaign',
        message: error.message,
      });
    }
  }

  // Method not allowed
  return res.status(405).json({
    error: `Method ${req.method} not allowed`,
  });
}
