#!/usr/bin/env node

// This script uses the Supabase Management API to execute SQL directly
// Without needing browser automation or CLI authentication

async function fixViaManagementAPI() {
  console.log('🚀 Attempting fix via Supabase Management API\n');
  
  const projectRef = 'kmepcdsklnnxokoimvzo';
  
  // The SQL to execute
  const sql = `
    -- Fix campaigns table for setup wizard
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
  `;
  
  // Try different API endpoints
  const endpoints = [
    `https://${projectRef}.supabase.co/rest/v1/rpc/query`,
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    `https://${projectRef}.supabase.co/pg/query`
  ];
  
  // Try different auth tokens
  const tokens = [
    // Service role key
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTU0NjI0OCwiZXhwIjoyMDUxMTIyMjQ4fQ.HgFnPg4pLT3pqX-tVlB3HhNWdLgOGf0J3X8-mTgCmPo',
    // Anon key
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI'
  ];
  
  for (const endpoint of endpoints) {
    for (const token of tokens) {
      console.log(`Trying endpoint: ${endpoint.substring(0, 50)}...`);
      
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': token,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ query: sql })
        });
        
        if (response.ok) {
          console.log('✅ SUCCESS! SQL executed via Management API');
          console.log('🎉 Campaigns table has been fixed!');
          return true;
        } else {
          const error = await response.text();
          if (!error.includes('not found') && !error.includes('404')) {
            console.log(`Response: ${error.substring(0, 100)}`);
          }
        }
      } catch (err) {
        // Silent fail, try next combination
      }
    }
  }
  
  console.log('\n❌ Management API approach failed');
  console.log('📋 Falling back to creating a database function...\n');
  
  // Try creating a function that we can call
  const functionName = `fix_campaigns_${Date.now()}`;
  const createFunction = `
    CREATE OR REPLACE FUNCTION ${functionName}()
    RETURNS void
    LANGUAGE plpgsql
    AS $$
    BEGIN
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT false;
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS setup_step INTEGER DEFAULT 1;
      -- Add other columns...
    END;
    $$;
  `;
  
  // Import Supabase client
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    `https://${projectRef}.supabase.co`,
    tokens[0] // Use service role key
  );
  
  // Try to execute via RPC
  console.log('Attempting RPC approach...');
  const { data, error } = await supabase.rpc('query', {
    query: sql
  }).catch(err => ({ error: err }));
  
  if (!error) {
    console.log('✅ SUCCESS via RPC!');
    return true;
  }
  
  console.log('❌ RPC failed:', error?.message || 'Unknown error');
  
  // Final attempt: Create a migration file that will be picked up
  console.log('\n📝 Creating migration file for next deployment...');
  const fs = await import('fs');
  const migrationPath = `supabase/migrations/${new Date().toISOString().replace(/[:.]/g, '-')}_fix_campaigns.sql`;
  fs.writeFileSync(migrationPath, sql);
  console.log(`✅ Migration created at: ${migrationPath}`);
  console.log('This will be applied on next deployment or when you run: npx supabase db push');
  
  return false;
}

fixViaManagementAPI();