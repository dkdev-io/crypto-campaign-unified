import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fixing campaigns table schema...');

    // Execute the migration SQL
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        -- Add missing columns for campaign setup workflow
        ALTER TABLE campaigns 
        ADD COLUMN IF NOT EXISTS user_id UUID,
        ADD COLUMN IF NOT EXISTS user_full_name TEXT,
        ADD COLUMN IF NOT EXISTS fec_committee_id TEXT,
        ADD COLUMN IF NOT EXISTS committee_name TEXT,
        ADD COLUMN IF NOT EXISTS committee_confirmed BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS bank_account_verified BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
        ADD COLUMN IF NOT EXISTS bank_last_four TEXT,
        ADD COLUMN IF NOT EXISTS plaid_account_id TEXT,
        ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS terms_ip_address TEXT,
        ADD COLUMN IF NOT EXISTS setup_step INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS setup_completed_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS website_analyzed TEXT,
        ADD COLUMN IF NOT EXISTS style_analysis JSONB,
        ADD COLUMN IF NOT EXISTS applied_styles JSONB,
        ADD COLUMN IF NOT EXISTS styles_applied BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS embed_code TEXT,
        ADD COLUMN IF NOT EXISTS embed_generated_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS description TEXT;
        
        -- Update existing campaigns 
        UPDATE campaigns 
        SET 
            setup_step = 7,
            setup_completed = true,
            setup_completed_at = created_at,
            terms_accepted = true,
            terms_accepted_at = created_at
        WHERE setup_completed IS NULL OR setup_completed = false;
      `,
    });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Campaigns table updated successfully',
        data,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
