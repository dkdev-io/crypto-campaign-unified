#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env.local' });

// Get service role key from environment or use admin key if available
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  console.log('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createDonorTables() {
  console.log('📋 Instructions for creating donor tables:\n');
  console.log('Since we need admin access to create tables, please follow these steps:\n');

  console.log('1. Go to your Supabase Dashboard:');
  console.log(
    `   ${supabaseUrl.replace('.supabase.co', '.supabase.com/project/').replace('https://', 'https://app.')}\n`
  );

  console.log('2. Navigate to the SQL Editor (left sidebar)\n');

  console.log('3. Copy and paste the migration script from:');
  console.log('   scripts/apply-donor-migrations.sql\n');

  console.log('4. Click "Run" to execute the migration\n');

  console.log('5. After running, verify the tables were created by checking the Table Editor\n');

  console.log('Alternative: Use Supabase CLI');
  console.log('   supabase db push --db-url "postgresql://..."');
  console.log('   (Get the connection string from Settings > Database in Supabase Dashboard)\n');

  // Test if tables exist
  console.log('Testing current state of tables...\n');

  try {
    const { data: donors, error: donorsError } = await supabase
      .from('donors')
      .select('count')
      .limit(1);

    if (!donorsError) {
      console.log('✅ Donors table exists!');
    } else {
      console.log('❌ Donors table not found:', donorsError.message);
    }
  } catch (e) {
    console.log('❌ Error checking donors table:', e.message);
  }

  try {
    const { data: profiles, error: profilesError } = await supabase
      .from('donor_profiles')
      .select('count')
      .limit(1);

    if (!profilesError) {
      console.log('✅ Donor_profiles table exists!');
    } else {
      console.log('❌ Donor_profiles table not found:', profilesError.message);
    }
  } catch (e) {
    console.log('❌ Error checking donor_profiles table:', e.message);
  }
}

createDonorTables()
  .then(() => {
    console.log('\n✨ Done');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Error:', err);
    process.exit(1);
  });
