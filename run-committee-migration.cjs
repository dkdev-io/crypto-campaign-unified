const { createClient } = require('@supabase/supabase-js');

async function runCommitteeMigration() {
  console.log('🗃️ Running Committee Address Columns Migration...');
  
  // Use production Supabase credentials
  const supabase = createClient(
    'https://kmepcdsklnnxokoimvzo.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI'
  );
  
  try {
    // First check what columns exist
    console.log('1️⃣ Checking existing campaigns table structure...');
    const { data: campaigns, error: fetchError } = await supabase
      .from('campaigns')
      .select('*')
      .limit(1);
      
    if (fetchError) {
      console.error('❌ Could not fetch campaigns:', fetchError);
      return false;
    }
    
    if (campaigns && campaigns.length > 0) {
      console.log('✅ Current campaigns table columns:');
      Object.keys(campaigns[0]).forEach(col => console.log(`   - ${col}`));
      
      // Check if committee address columns exist
      const hasAddressColumns = Object.keys(campaigns[0]).some(col => 
        ['committee_address', 'committee_city', 'committee_state', 'committee_zip'].includes(col)
      );
      
      if (hasAddressColumns) {
        console.log('✅ Committee address columns already exist!');
        return true;
      }
      
      console.log('⚠️ Committee address columns missing - need to be added via SQL migration');
    }
    
    // Try to run the SQL migration using RPC if available
    console.log('2️⃣ Attempting to add committee address columns...');
    
    const migrationSQL = `
      ALTER TABLE campaigns 
      ADD COLUMN IF NOT EXISTS committee_address TEXT,
      ADD COLUMN IF NOT EXISTS committee_city TEXT,
      ADD COLUMN IF NOT EXISTS committee_state TEXT,
      ADD COLUMN IF NOT EXISTS committee_zip TEXT;
    `;
    
    try {
      // Try to execute SQL directly (this may not work with anon key)
      const { data: result, error: sqlError } = await supabase.rpc('exec_sql', {
        sql: migrationSQL
      });
      
      if (sqlError) {
        console.log('⚠️ Direct SQL execution not available with current permissions');
        console.log('   Migration SQL needed:');
        console.log(migrationSQL);
        
        // Check if we can at least verify the structure
        const { data: testData, error: testError } = await supabase
          .from('campaigns')
          .select('committee_address')
          .limit(1);
          
        if (!testError) {
          console.log('✅ Committee address columns appear to exist!');
          return true;
        }
      } else {
        console.log('✅ Committee address columns added successfully!');
        return true;
      }
      
    } catch (rpcError) {
      console.log('⚠️ RPC exec_sql function not available');
    }
    
    // Final verification attempt
    console.log('3️⃣ Final verification...');
    try {
      const { data: testInsert, error: insertError } = await supabase
        .from('campaigns')
        .update({
          committee_address: 'test',
          committee_city: 'test', 
          committee_state: 'CA',
          committee_zip: '90210'
        })
        .eq('id', 'nonexistent-test-id')
        .select();
        
      // If no column error, columns exist
      if (!insertError || !insertError.message.includes('column') && !insertError.message.includes('does not exist')) {
        console.log('✅ Committee address columns confirmed to exist!');
        return true;
      }
      
    } catch (e) {
      // Column doesn't exist
    }
    
    console.log('❌ Committee address columns need to be added manually');
    console.log('   Required SQL migration:');
    console.log(migrationSQL);
    
    return false;
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return false;
  }
}

runCommitteeMigration().then(success => {
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('🎉 COMMITTEE MIGRATION: COMPLETE');
  } else {
    console.log('⚠️ COMMITTEE MIGRATION: MANUAL ACTION REQUIRED');
  }
  console.log('='.repeat(50));
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Migration script failed:', error);
  process.exit(1);
});