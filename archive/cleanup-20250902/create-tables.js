// Script to create form_submissions table in Supabase
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_KEY_HERE';

// If you don't have the service key, we'll use the anon key with limited permissions
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY);

async function createTables() {
  console.log('🚀 Creating form_submissions table...');

  try {
    // Try using RPC to execute SQL (this requires proper permissions)
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        -- Create form_submissions table if it doesn't exist
        CREATE TABLE IF NOT EXISTS form_submissions (
          id BIGSERIAL PRIMARY KEY,
          campaign_id UUID REFERENCES campaigns(id),
          
          -- Donor Information
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(20),
          
          -- Address Information
          address VARCHAR(255) NOT NULL,
          city VARCHAR(100) NOT NULL,
          state VARCHAR(2) NOT NULL,
          zip_code VARCHAR(10) NOT NULL,
          
          -- Contribution Information
          amount DECIMAL(10,2) NOT NULL,
          payment_method VARCHAR(50) DEFAULT 'crypto',
          contributor_wallet VARCHAR(255),
          transaction_hash VARCHAR(255),
          
          -- Employment Information (FEC Required)
          employer VARCHAR(255),
          occupation VARCHAR(255),
          
          -- FEC Compliance
          contribution_type VARCHAR(50) DEFAULT 'individual',
          is_us_citizen BOOLEAN DEFAULT true,
          is_prohibited_source BOOLEAN DEFAULT false,
          acknowledgment_signed BOOLEAN DEFAULT true,
          
          -- Metadata
          form_version VARCHAR(10) DEFAULT '1.0',
          user_agent TEXT,
          ip_address INET,
          
          -- Timestamps
          submitted_at TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_form_submissions_campaign_id ON form_submissions(campaign_id);
        CREATE INDEX IF NOT EXISTS idx_form_submissions_email ON form_submissions(email);
        CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_at ON form_submissions(submitted_at);
        CREATE INDEX IF NOT EXISTS idx_form_submissions_transaction_hash ON form_submissions(transaction_hash);
      `,
    });

    if (error) {
      console.error('❌ RPC method not available or failed:', error.message);
      console.log('\n⚠️  The table needs to be created manually in Supabase SQL Editor.');
      console.log('\nAlternatively, you can create a database function first:');
      console.log('1. Go to Supabase SQL Editor');
      console.log('2. Run this to create the function:');
      console.log(`
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;
      `);
      console.log('3. Then run this script again');
    } else {
      console.log('✅ Table created successfully!');
    }

    // Test if table exists by trying to query it
    console.log('\n🔍 Testing if table exists...');
    const { data: testData, error: testError } = await supabase
      .from('form_submissions')
      .select('id')
      .limit(1);

    if (
      testError &&
      testError.message.includes('relation "public.form_submissions" does not exist')
    ) {
      console.error('❌ Table does not exist. Please create it manually in Supabase SQL Editor.');
      console.log('\n📋 Copy and run this SQL in your Supabase dashboard:');
      console.log('https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo/sql');
    } else if (testError) {
      console.error('❌ Error testing table:', testError.message);
    } else {
      console.log('✅ Table exists and is accessible!');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n📋 Please create the table manually in Supabase SQL Editor:');
    console.log('1. Go to: https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo/sql');
    console.log('2. Copy the SQL from create_form_submissions_table.sql');
    console.log('3. Paste and run it');
  }
}

createTables();
