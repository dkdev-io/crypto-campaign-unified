import { createClient } from '@supabase/supabase-js';

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

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeaders(corsHeaders).end();
  }

  // Set CORS headers for all responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // GET /api/campaign - List all campaigns
  if (req.method === 'GET') {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('campaigns')
        .select('*', { count: 'exact' });

      if (search) {
        query = query.or(`campaign_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching campaigns:', error);
        return res.status(400).json({
          error: 'Failed to fetch campaigns',
          message: error.message
        });
      }

      return res.status(200).json({
        success: true,
        campaigns: data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('Campaign list error:', error);
      return res.status(500).json({
        error: 'Failed to fetch campaigns',
        message: error.message
      });
    }
  }

  // POST /api/campaign - Create new campaign
  if (req.method === 'POST') {
    try {
      const { campaign_name, email, website, wallet_address } = req.body;

      // Validate required fields
      if (!campaign_name || !email) {
        return res.status(400).json({
          error: 'Missing required fields',
          details: {
            campaign_name: !campaign_name ? 'Campaign name is required' : null,
            email: !email ? 'Email is required' : null
          }
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Invalid email format'
        });
      }

      // Validate website URL if provided
      if (website) {
        try {
          new URL(website);
        } catch {
          return res.status(400).json({
            error: 'Invalid website URL'
          });
        }
      }

      const { data, error } = await supabase
        .from('campaigns')
        .insert([{
          campaign_name,
          email,
          website,
          wallet_address,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating campaign:', error);
        return res.status(400).json({
          error: 'Failed to create campaign',
          message: error.message
        });
      }

      return res.status(201).json({
        success: true,
        campaign: data
      });
    } catch (error) {
      console.error('Campaign creation error:', error);
      return res.status(500).json({
        error: 'Failed to create campaign',
        message: error.message
      });
    }
  }

  // Method not allowed
  return res.status(405).json({
    error: `Method ${req.method} not allowed`
  });
}