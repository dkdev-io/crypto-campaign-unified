import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    console.log('Adding style columns to campaigns table...');

    // Execute SQL directly using admin client
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        ALTER TABLE campaigns 
        ADD COLUMN IF NOT EXISTS applied_styles JSONB,
        ADD COLUMN IF NOT EXISTS styles_applied BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS style_method TEXT;
      `
    });

    if (error) {
      // Try alternative approach - create function first
      console.log('Creating exec_sql function...');
      
      await supabaseAdmin.rpc('sql', {
        query: `
          CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
          RETURNS VOID AS $$
          BEGIN
            EXECUTE sql;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `
      });

      // Now try again
      const { data: retryData, error: retryError } = await supabaseAdmin.rpc('exec_sql', {
        sql: `
          ALTER TABLE campaigns 
          ADD COLUMN IF NOT EXISTS applied_styles JSONB,
          ADD COLUMN IF NOT EXISTS styles_applied BOOLEAN DEFAULT false,
          ADD COLUMN IF NOT EXISTS style_method TEXT;
        `
      });

      if (retryError) {
        throw retryError;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Style columns added successfully to campaigns table'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})