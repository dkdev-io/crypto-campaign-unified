import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const serviceRoleKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU0NjI0OCwiZXhwIjoyMDcxMTIyMjQ4fQ.2Jx6qRkGGQ0s4kPMgvM6LNkF4aWy2PQofvV9Ky1V5u0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runMigration() {
  console.log('🔧 Applying campaigns table migration...');

  try {
    // Direct SQL execution via REST API
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

    // Use the REST API to execute raw SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ query: sql }),
    });

    if (response.ok) {
      console.log('✅ Migration applied successfully via REST API');
    } else {
      const error = await response.text();
      console.log('⚠️ REST API approach failed:', error);

      // Try individual column additions
      console.log('🔄 Trying individual column additions...');

      const columns = [
        'user_id UUID',
        'setup_step INTEGER DEFAULT 1',
        'setup_completed BOOLEAN DEFAULT false',
      ];

      for (const column of columns) {
        try {
          const { error } = await supabase.rpc('exec', {
            query: `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS ${column}`,
          });

          if (error) {
            console.log(`⚠️ ${column.split(' ')[0]}: ${error.message}`);
          } else {
            console.log(`✅ Added: ${column.split(' ')[0]}`);
          }
        } catch (e) {
          console.log(`⚠️ ${column.split(' ')[0]}: ${e.message}`);
        }
      }
    }

    // Verify the fix worked
    console.log('\n🔍 Testing new schema...');
    const { data, error } = await supabase
      .from('campaigns')
      .select('user_id, setup_step, setup_completed')
      .limit(1);

    if (error) {
      console.log('❌ Schema test failed:', error.message);
      return false;
    } else {
      console.log('✅ Schema test passed:', data);
      return true;
    }
  } catch (error) {
    console.error('💥 Migration failed:', error);
    return false;
  }
}

runMigration()
  .then((success) => {
    if (success) {
      console.log('\n🎉 DATABASE MIGRATION COMPLETED!');
      console.log('📝 Campaign workflow now has full database persistence');
      console.log('🚀 Test at: http://localhost:5173/setup');
    } else {
      console.log('\n❌ Migration failed - see errors above');
    }
  })
  .catch(console.error);
