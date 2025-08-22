import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createTableViaFunction() {
  console.log('🔧 Attempting to create form_submissions table...\n');
  
  // Step 1: Create a function that creates the table
  // This function needs to be created first in Supabase
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION create_form_submissions_table()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
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

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_form_submissions_campaign_id ON form_submissions(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_form_submissions_email ON form_submissions(email);
      
      -- Enable RLS
      ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
      
      -- Create policies
      CREATE POLICY IF NOT EXISTS "Anyone can insert form submissions" ON form_submissions
        FOR INSERT WITH CHECK (true);
      
      CREATE POLICY IF NOT EXISTS "Allow read form submissions" ON form_submissions
        FOR SELECT USING (true);
    END;
    $$;
  `;

  console.log('📋 STEP 1: Create this function in Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo/sql/new\n');
  console.log(createFunctionSQL);
  console.log('\n' + '='.repeat(80) + '\n');

  // Step 2: Try to call the function
  console.log('📋 STEP 2: After creating the function above, run this command:\n');
  console.log('node create-table-via-function.js --execute\n');

  if (process.argv.includes('--execute')) {
    console.log('🚀 Attempting to execute the function...\n');
    
    try {
      // Try to call the function
      const { data, error } = await supabase.rpc('create_form_submissions_table');
      
      if (error) {
        console.error('❌ Error calling function:', error.message);
        console.log('\nMake sure you created the function in Step 1 first!');
      } else {
        console.log('✅ Function executed successfully!');
        
        // Test if table exists
        const { data: testData, error: testError } = await supabase
          .from('form_submissions')
          .select('count')
          .limit(1);
        
        if (!testError) {
          console.log('✅ Table form_submissions created and accessible!');
        } else {
          console.log('⚠️ Table might have been created but needs verification');
        }
      }
    } catch (err) {
      console.error('Error:', err.message);
    }
  }
}

createTableViaFunction();