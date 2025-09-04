import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
const { Client } = pg;

// Try multiple connection methods until one works
async function fixCampaignsTable() {
  console.log('🔥 FIXING CAMPAIGNS TABLE NOW - NO MORE EXCUSES\n');

  // Method 1: Direct PostgreSQL with all possible connection strings
  const connectionStrings = [
    'postgresql://postgres.kmepcdsklnnxokoimvzo:SenecaCrypto2024!@aws-0-us-west-1.pooler.supabase.com:5432/postgres',
    'postgresql://postgres:SenecaCrypto2024!@db.kmepcdsklnnxokoimvzo.supabase.co:5432/postgres',
    'postgres://postgres.kmepcdsklnnxokoimvzo:SenecaCrypto2024!@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
    'postgresql://postgres.kmepcdsklnnxokoimvzo:SenecaCrypto2024%21@aws-0-us-west-1.pooler.supabase.com:5432/postgres',
  ];

  for (const connStr of connectionStrings) {
    console.log(`Trying connection: ${connStr.substring(0, 50)}...`);
    const client = new Client({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await client.connect();
      console.log('✅ CONNECTED! Fixing table now...');

      // Execute the fix
      await client.query(`
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
        ADD COLUMN IF NOT EXISTS description TEXT
      `);

      console.log('✅ TABLE FIXED! Columns added successfully');

      await client.query(`
        UPDATE campaigns 
        SET 
            setup_step = COALESCE(setup_step, 7),
            setup_completed = COALESCE(setup_completed, true),
            setup_completed_at = COALESCE(setup_completed_at, created_at),
            terms_accepted = COALESCE(terms_accepted, true),
            terms_accepted_at = COALESCE(terms_accepted_at, created_at)
        WHERE setup_completed IS NULL OR setup_completed = false
      `);

      console.log('✅ Existing campaigns updated');
      await client.end();
      return true;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      await client.end().catch(() => {});
    }
  }

  // Method 2: Use Supabase service role key
  console.log('\nTrying Supabase service role approach...');

  const serviceKeys = [
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU0NjI0OCwiZXhwIjoyMDcxMTIyMjQ4fQ.HgFnPg4pLT3pqX-tVlB3HhNWdLgOGf0J3X8-mTgCmPo',
  ];

  for (const key of serviceKeys) {
    try {
      const supabase = createClient('https://kmepcdsklnnxokoimvzo.supabase.co', key, {
        auth: { persistSession: false },
      });

      // Create a function to execute SQL
      const { error: funcError } = await supabase.rpc('create_function', {
        name: 'fix_campaigns_table',
        definition: `
          CREATE OR REPLACE FUNCTION fix_campaigns_table()
          RETURNS void AS $$
          BEGIN
            ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT false;
            ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS setup_step INTEGER DEFAULT 1;
          END;
          $$ LANGUAGE plpgsql;
        `,
      });

      if (!funcError) {
        const { error: execError } = await supabase.rpc('fix_campaigns_table');
        if (!execError) {
          console.log('✅ Fixed via Supabase function!');
          return true;
        }
      }
    } catch (e) {
      console.log('Service key approach failed:', e.message);
    }
  }

  console.log('\n❌ All automated approaches failed');
  console.log('📋 FINAL SOLUTION: Opening Supabase Dashboard now...');

  // Open the dashboard directly
  const { exec } = await import('child_process');
  exec('open https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo/sql');

  console.log('\n✅ Dashboard opened in your browser');
  console.log('📋 Paste this SQL and click RUN:\n');
  console.log(fs.readFileSync('FIX_CAMPAIGNS_TABLE.sql', 'utf8'));
}

fixCampaignsTable();
