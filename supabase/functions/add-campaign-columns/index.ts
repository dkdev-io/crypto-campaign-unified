import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const connString = `postgres://postgres:SenecaCrypto2024!@db.kmepcdsklnnxokoimvzo.supabase.co:5432/postgres`;
    
    console.log('Adding missing columns to campaigns table...');
    
    // Use fetch to hit Supabase SQL endpoint directly
    const response = await fetch('https://kmepcdsklnnxokoimvzo.supabase.co/rest/v1/rpc/exec', {
      method: 'POST',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sql: `
          ALTER TABLE campaigns 
          ADD COLUMN IF NOT EXISTS user_id UUID,
          ADD COLUMN IF NOT EXISTS user_full_name TEXT,
          ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT false;
        `
      })
    });
    
    const result = await response.text();
    
    return new Response(
      JSON.stringify({ 
        success: !response.ok ? false : true, 
        message: 'Attempted to add columns',
        result,
        status: response.status
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
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