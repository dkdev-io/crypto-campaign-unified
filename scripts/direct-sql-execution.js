const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU0NjI0OCwiZXhwIjoyMDcxMTIyMjQ4fQ.ILZgJNM0h6KuChk7zBFMOUZe_VftQjVOWk_BFYT7VqE';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createTables() {
  console.log('🚀 Creating tables with service role key...');

  // SQL to create tables
  const sql = `
    CREATE TYPE IF NOT EXISTS donor_type AS ENUM ('individual', 'organization');
    
    CREATE TABLE IF NOT EXISTS donors (
        id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT,
        donor_type donor_type DEFAULT 'individual',
        email_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS donor_profiles (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        donor_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
        bio TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(donor_id)
    );

    ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
    ALTER TABLE donor_profiles ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can insert own donor record" ON donors;
    CREATE POLICY "Users can insert own donor record" ON donors
        FOR INSERT WITH CHECK (auth.uid() = id);
    
    DROP POLICY IF EXISTS "Users can view own donor record" ON donors;    
    CREATE POLICY "Users can view own donor record" ON donors
        FOR SELECT USING (auth.uid() = id);
    
    DROP POLICY IF EXISTS "Users can manage own profile" ON donor_profiles;
    CREATE POLICY "Users can manage own profile" ON donor_profiles
        FOR ALL USING (auth.uid() = donor_id);

    GRANT ALL ON donors TO anon, authenticated;
    GRANT ALL ON donor_profiles TO anon, authenticated;

    INSERT INTO donors (id, email, full_name, phone, donor_type)
    VALUES ('a6dd2983-3dd4-4e0d-b3f6-17d38772ff32', 'test@dkdev.io', 'Test Donor Account', '555-0123', 'individual')
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name;

    INSERT INTO donor_profiles (donor_id, bio)
    VALUES ('a6dd2983-3dd4-4e0d-b3f6-17d38772ff32', 'Test donor account')
    ON CONFLICT (donor_id) DO NOTHING;
  `;

  try {
    // Execute via rpc
    const { data, error } = await supabase.rpc('exec', { 
      sql: sql 
    });

    if (error) {
      console.log('RPC failed, trying alternative...');
      
      // Alternative: Create function and execute
      const createFunctionSql = `
        CREATE OR REPLACE FUNCTION create_donor_system()
        RETURNS text
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          -- Create type
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'donor_type') THEN
            CREATE TYPE donor_type AS ENUM ('individual', 'organization');
          END IF;
          
          -- Create donors table
          CREATE TABLE IF NOT EXISTS donors (
              id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
              email TEXT UNIQUE NOT NULL,
              full_name TEXT NOT NULL,
              phone TEXT,
              donor_type donor_type DEFAULT 'individual',
              email_verified BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          -- Create profiles table  
          CREATE TABLE IF NOT EXISTS donor_profiles (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              donor_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
              bio TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(donor_id)
          );

          -- Enable RLS
          ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
          ALTER TABLE donor_profiles ENABLE ROW LEVEL SECURITY;

          -- Create policies
          DROP POLICY IF EXISTS "Users can insert own donor record" ON donors;
          CREATE POLICY "Users can insert own donor record" ON donors
              FOR INSERT WITH CHECK (auth.uid() = id);
          
          DROP POLICY IF EXISTS "Users can view own donor record" ON donors;    
          CREATE POLICY "Users can view own donor record" ON donors
              FOR SELECT USING (auth.uid() = id);
          
          DROP POLICY IF EXISTS "Users can manage own profile" ON donor_profiles;
          CREATE POLICY "Users can manage own profile" ON donor_profiles
              FOR ALL USING (auth.uid() = donor_id);

          -- Grant permissions
          GRANT ALL ON donors TO anon, authenticated;
          GRANT ALL ON donor_profiles TO anon, authenticated;

          -- Insert test data
          INSERT INTO donors (id, email, full_name, phone, donor_type)
          VALUES ('a6dd2983-3dd4-4e0d-b3f6-17d38772ff32', 'test@dkdev.io', 'Test Donor Account', '555-0123', 'individual')
          ON CONFLICT (id) DO UPDATE SET
              email = EXCLUDED.email,
              full_name = EXCLUDED.full_name;

          INSERT INTO donor_profiles (donor_id, bio)
          VALUES ('a6dd2983-3dd4-4e0d-b3f6-17d38772ff32', 'Test donor account')
          ON CONFLICT (donor_id) DO NOTHING;

          RETURN 'SUCCESS: Donor tables created';
        EXCEPTION
          WHEN OTHERS THEN
            RETURN 'ERROR: ' || SQLERRM;
        END;
        $$;
      `;

      console.log('Creating function...');
      const { error: funcError } = await supabase.rpc('exec', {
        sql: createFunctionSql
      });

      if (!funcError) {
        console.log('Calling function...');
        const { data: result, error: callError } = await supabase.rpc('create_donor_system');
        
        if (callError) {
          console.log('Function call error:', callError.message);
        } else {
          console.log('Function result:', result);
        }
      } else {
        console.log('Function creation error:', funcError.message);
      }
    } else {
      console.log('✅ SQL executed successfully');
    }

    // Test the tables
    console.log('\nTesting tables...');
    const { data: donorTest, error: donorError } = await supabase
      .from('donors')
      .select('count')
      .limit(1);

    if (!donorError) {
      console.log('✅ Donors table accessible');
    } else {
      console.log('❌ Donors table error:', donorError.message);
    }

    const { data: profileTest, error: profileError } = await supabase
      .from('donor_profiles')
      .select('count')
      .limit(1);

    if (!profileError) {
      console.log('✅ Donor_profiles table accessible');
    } else {
      console.log('❌ Donor_profiles table error:', profileError.message);
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

createTables().then(() => {
  console.log('\n✨ Done');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});