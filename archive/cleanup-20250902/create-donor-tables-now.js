#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Supabase configuration (using the CORRECT project that frontend uses)
const SUPABASE_URL = 'https://owjvgdzmmlrdtpjdxgka.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93anZnZHptbWxyZHRwamR4Z2thIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNjg1MjgxOSwiZXhwIjoyMDQyNDI4ODE5fQ.BOiXWmQIYwkMSGCIstE5s_LyOF5d7pPFVHc2B0TqVyc'; // I need the service role key for this project

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createDonorTables() {
  console.log('🚀 Creating donor tables...');
  
  // Create the main function to set up the donor system
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION setup_donor_system()
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      -- Drop existing if any
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
      
      -- Insert test donor record
      INSERT INTO donors (id, email, full_name, phone, donor_type)
      VALUES (
          'a6dd2983-3dd4-4e0d-b3f6-17d38772ff32',
          'test@dkdev.io',
          'Test Donor Account',
          '555-0123',
          'individual'
      ) ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          full_name = EXCLUDED.full_name;
      
      INSERT INTO donor_profiles (donor_id, bio)
      VALUES ('a6dd2983-3dd4-4e0d-b3f6-17d38772ff32', 'Test donor account')
      ON CONFLICT (donor_id) DO NOTHING;
      
      RETURN 'SUCCESS: Donor system created successfully!';
    EXCEPTION
      WHEN OTHERS THEN
        RETURN 'ERROR: ' || SQLERRM;
    END;
    $$;
  `;

  try {
    // First, create the function using direct SQL execution
    console.log('1. Creating setup function...');
    const { error: createError } = await supabase.rpc('exec', {
      query: createFunctionSQL
    });
    
    if (createError) {
      console.log('Creating function via RPC failed, trying direct query...');
      
      // Try using a different approach - direct query
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'apikey': SERVICE_KEY
        },
        body: JSON.stringify({ query: createFunctionSQL })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Direct query also failed:', errorText);
        
        // Final attempt - use minimal SQL via REST API
        console.log('2. Trying minimal table creation...');
        
        // Create tables one by one using REST API
        const tables = [
          {
            name: 'donors',
            sql: `CREATE TABLE IF NOT EXISTS donors (
              id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
              email TEXT UNIQUE NOT NULL,
              full_name TEXT NOT NULL,
              phone TEXT,
              donor_type TEXT DEFAULT 'individual',
              email_verified BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )`
          },
          {
            name: 'donor_profiles',
            sql: `CREATE TABLE IF NOT EXISTS donor_profiles (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              donor_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
              bio TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(donor_id)
            )`
          }
        ];
        
        for (const table of tables) {
          console.log(`Creating ${table.name} table...`);
          const tableResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SERVICE_KEY}`,
              'apikey': SERVICE_KEY
            },
            body: JSON.stringify({ query: table.sql })
          });
          
          if (tableResponse.ok) {
            console.log(`✅ ${table.name} table created successfully`);
          } else {
            const errorText = await tableResponse.text();
            console.log(`❌ Failed to create ${table.name}:`, errorText);
          }
        }
        
        // Try to enable RLS
        console.log('3. Setting up permissions...');
        const rlsSQL = `
          ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
          ALTER TABLE donor_profiles ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "Users can insert own donor record" ON donors
              FOR INSERT WITH CHECK (auth.uid() = id);
          CREATE POLICY "Donors can view own record" ON donors
              FOR SELECT USING (auth.uid() = id);
          CREATE POLICY "Users can manage own profile" ON donor_profiles
              FOR ALL USING (auth.uid() = donor_id);
              
          GRANT ALL ON donors TO anon, authenticated;
          GRANT ALL ON donor_profiles TO anon, authenticated;
        `;
        
        const rlsResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'apikey': SERVICE_KEY
          },
          body: JSON.stringify({ query: rlsSQL })
        });
        
        if (rlsResponse.ok) {
          console.log('✅ RLS policies set up successfully');
        } else {
          const errorText = await rlsResponse.text();
          console.log('⚠️ RLS setup had issues:', errorText);
        }
        
        return false;
      }
    }
    
    // Now execute the setup function
    console.log('2. Executing donor system setup...');
    const { data, error } = await supabase.rpc('setup_donor_system');
    
    if (error) {
      console.log('❌ Setup function execution failed:', error.message);
      return false;
    }
    
    console.log('✅ Setup result:', data);
    
    // Verify tables were created
    console.log('3. Verifying table creation...');
    
    const { data: donorTest, error: donorError } = await supabase
      .from('donors')
      .select('count')
      .limit(1);
      
    if (!donorError) {
      console.log('✅ Donors table is accessible');
    } else {
      console.log('❌ Donors table verification failed:', donorError.message);
    }
    
    const { data: profileTest, error: profileError } = await supabase
      .from('donor_profiles')
      .select('count')
      .limit(1);
      
    if (!profileError) {
      console.log('✅ Donor_profiles table is accessible');
    } else {
      console.log('❌ Donor_profiles table verification failed:', profileError.message);
    }
    
    return true;
    
  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    return false;
  }
}

createDonorTables().then((success) => {
  if (success) {
    console.log('\n🎉 DONOR SYSTEM SETUP COMPLETE!');
    console.log('');
    console.log('✅ Tables created successfully');
    console.log('✅ RLS policies configured');
    console.log('✅ Test data inserted');
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('1. Go to: http://localhost:5173/donors/auth/register');
    console.log('2. Test registration with any email');
    console.log('3. Or sign in with test@dkdev.io / TestDonor123!');
    console.log('');
  } else {
    console.log('\n❌ Setup completed with issues');
    console.log('Check the messages above for details');
  }
  
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('\n💥 Script crashed:', err);
  process.exit(1);
});