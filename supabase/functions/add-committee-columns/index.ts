import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Adding committee address columns to campaigns table...');

    // Use fetch to hit Supabase SQL endpoint directly
    const response = await fetch('https://kmepcdsklnnxokoimvzo.supabase.co/rest/v1/rpc/exec', {
      method: 'POST',
      headers: {
        apikey:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `
          ALTER TABLE campaigns 
          ADD COLUMN IF NOT EXISTS committee_address TEXT,
          ADD COLUMN IF NOT EXISTS committee_city TEXT,
          ADD COLUMN IF NOT EXISTS committee_state TEXT,
          ADD COLUMN IF NOT EXISTS committee_zip TEXT;
        `,
      }),
    });

    const result = await response.text();

    return new Response(
      JSON.stringify({
        success: !response.ok ? false : true,
        message: 'Attempted to add committee address columns',
        result,
        status: response.status,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
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