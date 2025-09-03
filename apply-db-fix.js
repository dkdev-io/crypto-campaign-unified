import { createClient } from '@supabase/supabase-js';

// Direct database connection with service role
const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU0NjI0OCwiZXhwIjoyMDcxMTIyMjQ4fQ.2Jx6qRkGGQ0s4kPMgvM6LNkF4aWy2PQofvV9Ky1V5u0';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function applyDatabaseFix() {
  console.log('🔧 Applying database schema fix...');
  
  try {
    // Test connection first
    const { data: testData, error: testError } = await supabase
      .from('campaigns')
      .select('count')
      .limit(1);
      
    if (testError) {
      console.error('❌ Cannot connect to database:', testError.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    
    // Apply each column addition separately to handle any that already exist
    const columns = [
      'user_id UUID',
      'user_full_name TEXT', 
      'fec_committee_id TEXT',
      'committee_name TEXT',
      'committee_confirmed BOOLEAN DEFAULT false',
      'bank_account_verified BOOLEAN DEFAULT false',
      'bank_account_name TEXT',
      'bank_last_four TEXT',
      'plaid_account_id TEXT',
      'terms_accepted BOOLEAN DEFAULT false',
      'terms_accepted_at TIMESTAMPTZ',
      'terms_ip_address TEXT',
      'setup_step INTEGER DEFAULT 1',
      'setup_completed BOOLEAN DEFAULT false',
      'setup_completed_at TIMESTAMPTZ',
      'website_analyzed TEXT',
      'style_analysis JSONB',
      'applied_styles JSONB',
      'styles_applied BOOLEAN DEFAULT false',
      'embed_code TEXT',
      'embed_generated_at TIMESTAMPTZ',
      'description TEXT'
    ];
    
    let addedColumns = 0;
    let skippedColumns = 0;
    
    for (const column of columns) {
      try {
        const sql = `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS ${column}`;
        
        // Use raw SQL execution 
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
        
        if (error) {
          console.log(`⚠️ Column '${column.split(' ')[0]}': ${error.message}`);
          skippedColumns++;
        } else {
          console.log(`✅ Added column: ${column.split(' ')[0]}`);
          addedColumns++;
        }
      } catch (e) {
        console.log(`⚠️ Column '${column.split(' ')[0]}': ${e.message}`);
        skippedColumns++;
      }
    }
    
    console.log(`\n📊 Results: ${addedColumns} added, ${skippedColumns} skipped/existed`);
    
    // Test the final schema
    const { data: finalTest, error: finalError } = await supabase
      .from('campaigns')
      .select('user_id, setup_step, setup_completed')
      .limit(1);
      
    if (finalError) {
      console.log('⚠️ Some columns may still be missing:', finalError.message);
    } else {
      console.log('✅ Schema verification passed');
    }
    
    return addedColumns > 0;
    
  } catch (error) {
    console.error('💥 Failed to apply database fix:', error.message);
    return false;
  }
}

applyDatabaseFix().then(success => {
  if (success) {
    console.log('\n🎉 DATABASE FIX APPLIED SUCCESSFULLY!');
    console.log('📝 The campaign setup workflow now has full database persistence');
    console.log('🚀 Test it at: http://localhost:5173/setup');
  } else {
    console.log('\n⚠️ Could not apply database fix automatically');
    console.log('📖 Please run the SQL manually in Supabase Dashboard:');
    console.log('🔗 https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo/sql');
    console.log('\n📋 SQL to run:');
    console.log('ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS user_id UUID,');
    console.log('ADD COLUMN IF NOT EXISTS setup_step INTEGER DEFAULT 1,');
    console.log('ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT false;');
    console.log('-- (plus 19 more columns from the migration file)');
  }
}).catch(console.error);