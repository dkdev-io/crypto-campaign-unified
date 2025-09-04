import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU0NjI0OCwiZXhwIjoyMDcxMTIyMjQ4fQ.2Jx6qRkGGQ0s4kPMgvM6LNkF4aWy2PQofvV9Ky1V5u0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🔄 Running database migration...');

    const sql = `
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

    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('❌ Migration failed:', error);
      return false;
    }

    console.log('✅ Migration completed successfully!');

    // Test the new schema
    const { data: testData, error: testError } = await supabase
      .from('campaigns')
      .select('setup_step, setup_completed')
      .limit(1);

    if (testError) {
      console.warn('⚠️ Test query failed:', testError.message);
    } else {
      console.log('✅ New columns accessible:', testData);
    }

    return true;
  } catch (error) {
    console.error('💥 Migration error:', error);
    return false;
  }
}

runMigration().then((success) => {
  console.log(
    success ? '\n🎉 Database migration completed!' : '\n❌ Migration failed - manual SQL required'
  );
});
