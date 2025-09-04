#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

// Use the correct Supabase project with service role key
const SUPABASE_URL = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.MIGRATION_SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing MIGRATION_SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createDonorTables() {
  console.log('🚀 Creating donor tables directly in Supabase...\n');

  // First, let's create a simple SQL execution function if it doesn't exist
  const createExecFunction = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;
  `;

  // SQL to create all donor tables
  const createTablesSQL = `
    -- Drop existing tables if any
    DROP TABLE IF EXISTS donor_tax_receipts CASCADE;
    DROP TABLE IF EXISTS donor_saved_campaigns CASCADE;
    DROP TABLE IF EXISTS donations CASCADE;
    DROP TABLE IF EXISTS donor_profiles CASCADE;
    DROP TABLE IF EXISTS donors CASCADE;
    DROP TYPE IF EXISTS donor_type CASCADE;
    DROP TYPE IF EXISTS donation_status CASCADE;

    -- Create types
    CREATE TYPE donor_type AS ENUM ('individual', 'organization');
    CREATE TYPE donation_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

    -- Create donors table
    CREATE TABLE donors (
        id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT,
        address JSONB,
        donor_type donor_type NOT NULL DEFAULT 'individual',
        email_verified BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Create donor_profiles table
    CREATE TABLE donor_profiles (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        donor_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
        bio TEXT,
        interests TEXT[],
        donation_preferences JSONB DEFAULT '{}',
        tax_id TEXT,
        preferred_payment_methods TEXT[],
        notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": false}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(donor_id)
    );

    -- Create campaigns table if not exists
    CREATE TABLE IF NOT EXISTS campaigns (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Create donations table
    CREATE TABLE donations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        donor_id UUID REFERENCES donors(id) ON DELETE SET NULL,
        campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
        amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
        currency TEXT NOT NULL DEFAULT 'USD',
        crypto_currency TEXT,
        transaction_hash TEXT,
        status donation_status NOT NULL DEFAULT 'pending',
        donation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_anonymous BOOLEAN DEFAULT FALSE,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Create donor_saved_campaigns table
    CREATE TABLE donor_saved_campaigns (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        donor_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
        campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(donor_id, campaign_id)
    );

    -- Create donor_tax_receipts table
    CREATE TABLE donor_tax_receipts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        donor_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
        donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
        receipt_number TEXT UNIQUE NOT NULL,
        issue_date DATE NOT NULL,
        tax_year INTEGER NOT NULL,
        receipt_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(donation_id)
    );

    -- Enable RLS
    ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
    ALTER TABLE donor_profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE donor_saved_campaigns ENABLE ROW LEVEL SECURITY;
    ALTER TABLE donor_tax_receipts ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies
    CREATE POLICY "Users can insert own donor record" ON donors
        FOR INSERT WITH CHECK (auth.uid() = id);
    CREATE POLICY "Donors can view own record" ON donors
        FOR SELECT USING (auth.uid() = id);
    CREATE POLICY "Donors can update own record" ON donors
        FOR UPDATE USING (auth.uid() = id);

    CREATE POLICY "Users can insert own profile" ON donor_profiles
        FOR INSERT WITH CHECK (auth.uid() = donor_id);
    CREATE POLICY "Donors can view own profile" ON donor_profiles
        FOR SELECT USING (auth.uid() = donor_id);
    CREATE POLICY "Donors can update own profile" ON donor_profiles
        FOR UPDATE USING (auth.uid() = donor_id);

    CREATE POLICY "Anyone can insert donations" ON donations
        FOR INSERT WITH CHECK (true);
    CREATE POLICY "Donors can view own donations" ON donations
        FOR SELECT USING (auth.uid() = donor_id);

    CREATE POLICY "Donors manage own saved campaigns" ON donor_saved_campaigns
        FOR ALL USING (auth.uid() = donor_id);
    CREATE POLICY "Donors view own tax receipts" ON donor_tax_receipts
        FOR SELECT USING (auth.uid() = donor_id);

    -- Grant permissions
    GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
  `;

  try {
    // Try Method 1: Direct RPC call
    console.log('Method 1: Trying RPC exec_sql...');

    // First create the function
    const { error: funcError } = await supabase
      .rpc('exec_sql', {
        sql: createExecFunction,
      })
      .catch((err) => ({ error: err }));

    if (!funcError) {
      // Now execute the table creation
      const { error: tableError } = await supabase.rpc('exec_sql', {
        sql: createTablesSQL,
      });

      if (!tableError) {
        console.log('✅ Tables created successfully via RPC!');
      } else {
        console.log('❌ RPC exec failed:', tableError.message);
      }
    } else {
      console.log('❌ RPC not available:', funcError.message);
    }

    // Method 2: Try using REST API directly with service role
    console.log('\nMethod 2: Using direct REST API calls...');

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        query: createTablesSQL,
      }),
    });

    if (response.ok) {
      console.log('✅ Tables created via REST API!');
    } else {
      console.log('❌ REST API method not available');

      // Method 3: Since we can't execute raw SQL directly, let's at least insert the test donor
      console.log('\nMethod 3: Creating donor record for test@dkdev.io...');

      // Insert donor record for our test user
      const { data: donorData, error: donorError } = await supabase
        .from('donors')
        .insert({
          id: 'a6dd2983-3dd4-4e0d-b3f6-17d38772ff32',
          email: 'test@dkdev.io',
          full_name: 'Test Donor Account',
          phone: '555-0123',
          donor_type: 'individual',
          email_verified: false,
        })
        .select()
        .single();

      if (donorError) {
        if (donorError.message.includes('does not exist')) {
          console.log('❌ Donors table does not exist');
          console.log('\n🔧 Using Supabase CLI as fallback...');

          // Method 4: Try using npx supabase
          const { exec } = require('child_process');
          const util = require('util');
          const execPromise = util.promisify(exec);

          // Save SQL to file
          const fs = require('fs');
          fs.writeFileSync('/tmp/create-donor-tables.sql', createTablesSQL);

          try {
            const { stdout, stderr } = await execPromise(
              `SUPABASE_ACCESS_TOKEN="${SUPABASE_SERVICE_KEY}" npx supabase db execute --db-url "postgresql://postgres:${SUPABASE_SERVICE_KEY}@db.kmepcdsklnnxokoimvzo.supabase.co:5432/postgres" --file /tmp/create-donor-tables.sql`
            );

            if (stderr) {
              console.log('⚠️ CLI stderr:', stderr);
            }
            if (stdout) {
              console.log('✅ Tables created via Supabase CLI!');
              console.log(stdout);
            }
          } catch (cliError) {
            console.log('❌ CLI method failed:', cliError.message);
          }
        } else if (donorError.message.includes('duplicate')) {
          console.log('✅ Donor record already exists');
        } else {
          console.log('❌ Error:', donorError.message);
        }
      } else {
        console.log('✅ Donor record created!');
        console.log('   ID:', donorData.id);
        console.log('   Email:', donorData.email);
      }

      // Try to create profile
      const { error: profileError } = await supabase.from('donor_profiles').insert({
        donor_id: 'a6dd2983-3dd4-4e0d-b3f6-17d38772ff32',
        bio: 'Test donor account',
      });

      if (profileError) {
        if (profileError.message.includes('does not exist')) {
          console.log('❌ Donor_profiles table does not exist');
        } else if (profileError.message.includes('duplicate')) {
          console.log('✅ Profile already exists');
        }
      } else {
        console.log('✅ Profile created!');
      }
    }

    // Final verification
    console.log('\n📊 Final Table Status Check:');
    const tables = [
      'donors',
      'donor_profiles',
      'donations',
      'donor_saved_campaigns',
      'donor_tax_receipts',
    ];

    for (const table of tables) {
      const { error } = await supabase.from(table).select('count').limit(1);
      if (!error) {
        console.log(`✅ ${table} - EXISTS`);
      } else {
        console.log(`❌ ${table} - NOT FOUND`);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createDonorTables()
  .then(() => {
    console.log('\n✨ Process complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
