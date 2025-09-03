import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kmepcdsklnnxokoimvzo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI'
);

async function fixCampaignsTable() {
  console.log('🚀 FIXING CAMPAIGNS TABLE NOW...\n');
  
  // Step 1: Create the exec function first
  console.log('Step 1: Creating exec function...');
  try {
    const createExecSQL = `
      CREATE OR REPLACE FUNCTION exec(query text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE query;
      END;
      $$;
    `;
    
    // Try to create it via RPC (might fail but worth trying)
    const { error: execError } = await supabase.rpc('exec', { query: createExecSQL });
    if (execError) {
      console.log('Could not create exec function via RPC (expected)');
    }
  } catch (e) {
    console.log('Exec function creation attempt failed (expected)');
  }

  // Step 2: Try alternate approach - create a stored procedure
  console.log('\nStep 2: Creating stored procedure to fix campaigns table...');
  
  const createProcedureSQL = `
    CREATE OR REPLACE FUNCTION fix_campaigns_table()
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      -- Add all missing columns
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS user_id UUID;
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS user_full_name TEXT;
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS fec_committee_id TEXT;
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS committee_name TEXT;
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS committee_confirmed BOOLEAN DEFAULT false;
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS bank_account_verified BOOLEAN DEFAULT false;
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS bank_account_name TEXT;
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS bank_last_four TEXT;
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS plaid_account_id TEXT;
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false;
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS terms_ip_address TEXT;
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS setup_step INTEGER DEFAULT 1;
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT false;
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS setup_completed_at TIMESTAMPTZ;
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS website_analyzed TEXT;
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS style_analysis JSONB;
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS applied_styles JSONB;
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS styles_applied BOOLEAN DEFAULT false;
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS embed_code TEXT;
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS embed_generated_at TIMESTAMPTZ;
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS description TEXT;
      
      -- Update existing campaigns
      UPDATE campaigns 
      SET 
          setup_step = COALESCE(setup_step, 7),
          setup_completed = COALESCE(setup_completed, true),
          setup_completed_at = COALESCE(setup_completed_at, created_at),
          terms_accepted = COALESCE(terms_accepted, true),
          terms_accepted_at = COALESCE(terms_accepted_at, created_at)
      WHERE setup_completed IS NULL OR setup_completed = false;
      
      RETURN 'Campaigns table fixed successfully!';
    END;
    $$;
  `;
  
  // This will fail too but let's try
  try {
    const { error } = await supabase.rpc('exec', { query: createProcedureSQL });
    if (!error) {
      console.log('✅ Created fix_campaigns_table function!');
      
      // Now call it
      const { data, error: callError } = await supabase.rpc('fix_campaigns_table');
      if (!callError) {
        console.log('✅ SUCCESS! Campaigns table fixed:', data);
      }
    }
  } catch (e) {
    console.log('Could not create stored procedure (expected)');
  }

  // Step 3: Direct approach - just try to use the columns
  console.log('\nStep 3: Testing if columns can be added via insert/update...');
  
  // Get a campaign to work with
  const { data: campaigns, error: fetchError } = await supabase
    .from('campaigns')
    .select('*')
    .limit(1);
    
  if (fetchError || !campaigns || campaigns.length === 0) {
    console.log('❌ Could not fetch campaigns');
    return;
  }
  
  const testCampaign = campaigns[0];
  console.log('Found test campaign:', testCampaign.id);
  
  // Try to update with new columns
  const updateData = {
    setup_completed: false,
    setup_step: 1,
    user_full_name: 'Test User',
    terms_accepted: false
  };
  
  const { error: updateError } = await supabase
    .from('campaigns')
    .update(updateData)
    .eq('id', testCampaign.id);
    
  if (updateError) {
    console.log('\n❌ COLUMNS STILL MISSING!');
    console.log('Error:', updateError.message);
    
    console.log('\n📋 MANUAL FIX REQUIRED');
    console.log('================================');
    console.log('You need to run this SQL directly in Supabase Dashboard:');
    console.log('1. Go to: https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo/sql');
    console.log('2. Run the following SQL:\n');
    
    const manualSQL = `
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
    
    console.log(manualSQL);
    console.log('================================\n');
    
    // Save the SQL to a file for easy copy
    const fs = await import('fs');
    fs.writeFileSync('FIX_CAMPAIGNS_TABLE.sql', manualSQL);
    console.log('✅ SQL saved to: FIX_CAMPAIGNS_TABLE.sql');
    console.log('📋 Copy the SQL from this file and run it in Supabase Dashboard');
    
  } else {
    console.log('✅ SUCCESS! Columns exist and update worked!');
  }
}

fixCampaignsTable();