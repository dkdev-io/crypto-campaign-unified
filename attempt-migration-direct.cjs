const { createClient } = require('@supabase/supabase-js');

async function attemptDirectMigration() {
  console.log('🔧 ATTEMPTING DIRECT DATABASE MIGRATION...');
  
  // Use service role key from .env
  const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU0NjI0OCwiZXhwIjoyMDcxMTIyMjQ4fQ.WLMp2ynE4gAWOb3MFZnWBbIBmMWEv-z_ej9KyaBmYQE';
  
  const supabase = createClient(
    'https://kmepcdsklnnxokoimvzo.supabase.co',
    serviceKey
  );
  
  // Method 1: Try using raw SQL via fetch with correct service role
  console.log('1️⃣ Attempting via direct Supabase API call...');
  
  try {
    const response = await fetch('https://kmepcdsklnnxokoimvzo.supabase.co/rest/v1/rpc/sql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: `
          ALTER TABLE campaigns 
          ADD COLUMN IF NOT EXISTS committee_address TEXT,
          ADD COLUMN IF NOT EXISTS committee_city TEXT,
          ADD COLUMN IF NOT EXISTS committee_state TEXT,
          ADD COLUMN IF NOT EXISTS committee_zip TEXT;
        `
      })
    });
    
    if (response.ok) {
      console.log('✅ Migration successful via direct API!');
      return true;
    } else {
      const errorText = await response.text();
      console.log('⚠️ Direct API failed:', response.status, errorText);
    }
  } catch (e) {
    console.log('⚠️ Direct API exception:', e.message);
  }
  
  // Method 2: Try creating a function first, then calling it
  console.log('2️⃣ Creating migration function...');
  
  try {
    const createFunctionResponse = await fetch('https://kmepcdsklnnxokoimvzo.supabase.co/rest/v1/rpc/sql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `
          CREATE OR REPLACE FUNCTION migrate_committee_columns()
          RETURNS void AS $$
          BEGIN
            ALTER TABLE campaigns 
            ADD COLUMN IF NOT EXISTS committee_address TEXT,
            ADD COLUMN IF NOT EXISTS committee_city TEXT,
            ADD COLUMN IF NOT EXISTS committee_state TEXT,
            ADD COLUMN IF NOT EXISTS committee_zip TEXT;
          END;
          $$ LANGUAGE plpgsql;
        `
      })
    });
    
    if (createFunctionResponse.ok) {
      console.log('✅ Migration function created');
      
      // Now call the function
      const { data, error } = await supabase.rpc('migrate_committee_columns');
      
      if (!error) {
        console.log('✅ Migration executed successfully!');
        return true;
      } else {
        console.log('⚠️ Function execution error:', error);
      }
    } else {
      console.log('⚠️ Function creation failed:', await createFunctionResponse.text());
    }
  } catch (e) {
    console.log('⚠️ Function approach exception:', e.message);
  }
  
  // Method 3: Test if columns already exist by trying to query them
  console.log('3️⃣ Testing if columns already exist...');
  
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('committee_address, committee_city, committee_state, committee_zip')
      .limit(1);
      
    if (!error) {
      console.log('✅ Committee address columns already exist and are queryable!');
      return true;
    } else if (error.message.includes('column') && error.message.includes('does not exist')) {
      console.log('❌ Columns confirmed to not exist');
      return false;
    } else {
      console.log('⚠️ Unexpected error:', error.message);
      return false;
    }
  } catch (e) {
    console.log('⚠️ Column test exception:', e.message);
    return false;
  }
}

attemptDirectMigration().then(success => {
  console.log('\n' + '='.repeat(60));
  if (success) {
    console.log('🎉 DATABASE MIGRATION: SUCCESSFUL');
    console.log('✅ Committee address columns are now available');
  } else {
    console.log('⚠️ DATABASE MIGRATION: REQUIRES MANUAL SQL');
    console.log('📝 Please run the SQL from MANUAL_100_PERCENT_COMPLETION.md');
  }
  console.log('='.repeat(60));
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Migration attempt failed:', error);
  process.exit(1);
});