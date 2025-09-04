import fetch from 'node-fetch';

async function fixCampaignsViaAPI() {
  console.log('🚀 Using Supabase Management API to fix campaigns table...\n');

  const PROJECT_REF = 'kmepcdsklnnxokoimvzo';
  const ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';

  // SQL to fix the table
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
  `;

  try {
    // Try SQL Editor endpoint
    console.log('Attempting SQL execution via API...');
    const response = await fetch(`https://${PROJECT_REF}.supabase.co/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ query: sql }),
    });

    const result = await response.text();
    console.log('API Response:', result);

    if (response.ok) {
      console.log('✅ SUCCESS! Table fixed via API');
    } else {
      console.log('❌ API execution failed');

      // Alternative: Create a migration file
      console.log('\n📁 Creating migration file instead...');
      const migrationName = `20250903_fix_campaigns_table`;
      const migrationPath = `supabase/migrations/${migrationName}.sql`;

      const fs = await import('fs');
      fs.writeFileSync(migrationPath, sql);

      console.log(`✅ Migration created: ${migrationPath}`);
      console.log('\n🎯 NEXT STEPS:');
      console.log('1. Run: npx supabase db push --no-verify-emails');
      console.log('   OR');
      console.log(
        '2. Go to Supabase Dashboard SQL Editor and run the SQL from FIX_CAMPAIGNS_TABLE.sql'
      );
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

fixCampaignsViaAPI();
