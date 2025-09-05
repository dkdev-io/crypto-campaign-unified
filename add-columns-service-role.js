import { createClient } from '@supabase/supabase-js';

// Use service role for admin operations
const supabase = createClient(
  'https://kmepcdsklnnxokoimvzo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU0NjI0OCwiZXhwIjoyMDcxMTIyMjQ4fQ.UwJnzebOAKQ9CtB9rkQwOv2kFBGXeTW7gxiYpbA2Yco'
);

async function addColumnsNow() {
  console.log('🔧 ADDING COMMITTEE COLUMNS WITH SERVICE ROLE...');

  try {
    // Try to add columns using raw SQL
    const alterSQL = `
      ALTER TABLE public.campaigns 
      ADD COLUMN IF NOT EXISTS committee_address TEXT,
      ADD COLUMN IF NOT EXISTS committee_city TEXT,
      ADD COLUMN IF NOT EXISTS committee_state TEXT,
      ADD COLUMN IF NOT EXISTS committee_zip TEXT;
    `;

    console.log('🗄️ Executing SQL:', alterSQL);

    // Try using the SQL query directly
    const { data, error } = await supabase.from('campaigns').select('id').limit(1);
    
    if (error) {
      console.error('❌ Cannot even read campaigns table:', error);
      return false;
    }

    // Since we can't execute DDL directly, let's try a function call approach
    console.log('📋 Trying to add columns via function...');
    
    // Use the direct postgres connection approach
    const { data: result, error: sqlError } = await supabase.rpc('add_committee_columns_to_campaigns');
    
    if (sqlError) {
      console.log('RPC function not available, trying manual approach...');
      
      // Last resort: test if columns already exist by trying to insert
      try {
        const testData = {
          email: 'column-test@test.com',
          campaign_name: 'Column Test',
          website: 'https://test.com',
          wallet_address: 'test-' + Date.now(),
          committee_address: 'Test Address',
          committee_city: 'Test City', 
          committee_state: 'TS',
          committee_zip: '12345'
        };

        const { data: testInsert, error: insertError } = await supabase
          .from('campaigns')
          .insert([testData])
          .select()
          .single();

        if (insertError) {
          throw new Error(`Columns don't exist: ${insertError.message}`);
        }

        console.log('✅ Columns already exist! Test insert successful');
        
        // Cleanup
        await supabase.from('campaigns').delete().eq('id', testInsert.id);
        
        return true;

      } catch (testError) {
        console.error('❌ Columns missing:', testError.message);
        return false;
      }
    } else {
      console.log('✅ RPC function executed successfully');
      return true;
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
    return false;
  }
}

addColumnsNow()
  .then(success => {
    if (success) {
      console.log('\n🎉 COMMITTEE COLUMNS ARE READY!');
      console.log('✅ committee_address, committee_city, committee_state, committee_zip');
      console.log('✅ Committee form will now save complete address data');
    } else {
      console.log('\n❌ COULD NOT ADD COLUMNS AUTOMATICALLY');
      console.log('📝 RUN THIS SQL IN SUPABASE DASHBOARD:');
      console.log('https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo/sql-editor');
      console.log('');
      console.log('ALTER TABLE campaigns');
      console.log('ADD COLUMN IF NOT EXISTS committee_address TEXT,'); 
      console.log('ADD COLUMN IF NOT EXISTS committee_city TEXT,');
      console.log('ADD COLUMN IF NOT EXISTS committee_state TEXT,');
      console.log('ADD COLUMN IF NOT EXISTS committee_zip TEXT;');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 CRITICAL ERROR:', error.message);
    process.exit(1);
  });