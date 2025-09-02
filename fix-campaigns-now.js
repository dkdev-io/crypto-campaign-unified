import { createClient } from '@supabase/supabase-js';

// Create client with service role if available, otherwise anon key
const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU0NjI0OCwiZXhwIjoyMDcxMTIyMjQ4fQ.2Jx6qRkGGQ0s4kPMgvM6LNkF4aWy2PQofvV9Ky1V5u0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCampaignsTable() {
  try {
    console.log('🔧 Fixing campaigns table schema...');
    
    // Create the missing columns using individual UPDATE operations
    // Since we can't use ALTER TABLE directly, we'll work around it
    
    const testQuery = await supabase
      .from('campaigns')
      .select('user_id')
      .limit(1);
    
    if (testQuery.error && testQuery.error.code === 'PGRST116') {
      console.log('user_id column missing - need to add columns');
      
      // Try using a function to add columns if it exists
      try {
        const { data, error } = await supabase.rpc('add_campaigns_columns');
        if (error) {
          console.log('RPC function not available, trying direct SQL...');
          
          // Create a simple edge function inline
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              sql: `
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
              `
            })
          });
          
          if (response.ok) {
            console.log('✅ Columns added via REST API');
          } else {
            console.log('REST API failed, columns may need manual addition');
          }
        } else {
          console.log('✅ Columns added via RPC function');
        }
      } catch (e) {
        console.log('Manual column addition needed:', e.message);
      }
    } else {
      console.log('✅ user_id column exists, table likely already updated');
    }
    
    // Test the updated table
    const { data: updatedCampaign, error: testError } = await supabase
      .from('campaigns')
      .select('id, user_id, setup_completed, setup_step')
      .limit(1);
      
    if (testError) {
      console.log('❌ Table still has issues:', testError.message);
    } else {
      console.log('✅ Table working! Sample:', updatedCampaign[0]);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixCampaignsTable();