const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU0NjI0OCwiZXhwIjoyMDcxMTIyMjQ4fQ.ILZgJNM0h6KuChk7zBFMOUZe_VftQjVOWk_BFYT7VqE';

// Note: Using service key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('Applying users table migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250826_create_multiuser_access_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Apply the migration using RPC call to execute SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      console.error('Migration failed:', error);
      console.log('Trying alternative approach - direct SQL execution...');
      
      // Alternative: Apply parts of the migration step by step
      const userTableSQL = `
        -- Enable necessary extensions
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        CREATE EXTENSION IF NOT EXISTS "pgcrypto";
        
        -- Create users table
        CREATE TABLE IF NOT EXISTS public.users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role VARCHAR(20) NOT NULL DEFAULT 'viewer' 
            CHECK (role IN ('admin', 'viewer')),
          
          -- Hierarchical account structure
          account_owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
          
          -- Profile information
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          
          -- Account status and tracking
          is_active BOOLEAN NOT NULL DEFAULT true,
          email_verified BOOLEAN NOT NULL DEFAULT false,
          last_login TIMESTAMP WITH TIME ZONE,
          login_count INTEGER DEFAULT 0,
          
          -- Security fields
          password_reset_token TEXT,
          password_reset_expires TIMESTAMP WITH TIME ZONE,
          email_verification_token TEXT,
          
          -- Audit fields
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_by UUID REFERENCES public.users(id)
        );
        
        -- Index for performance
        CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
        CREATE INDEX IF NOT EXISTS idx_users_account_owner ON public.users(account_owner_id);
        CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
        CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active);
      `;
      
      // Try with a direct approach using service key
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ sql: userTableSQL })
      });
      
      if (!response.ok) {
        console.log('Direct SQL also failed, trying raw SQL execution...');
        
        // Try using the Postgres connection directly
        const { Pool } = require('pg');
        
        // Extract connection details from URL
        const pool = new Pool({
          connectionString: `postgresql://postgres:${process.env.DB_PASSWORD || '[NEED_DB_PASSWORD]'}@db.kmepcdsklnnxokoimvzo.supabase.co:5432/postgres`,
          ssl: { rejectUnauthorized: false }
        });
        
        try {
          const result = await pool.query(userTableSQL);
          console.log('✅ Migration applied successfully via direct Postgres connection');
        } catch (pgError) {
          console.error('❌ Postgres connection failed:', pgError.message);
          console.log('Creating manual setup script instead...');
          createManualSetupInstructions();
          return;
        }
      } else {
        console.log('✅ Migration applied successfully');
      }
    } else {
      console.log('✅ Migration applied successfully');
    }
    
    // Test that the table was created
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Users table test failed:', testError);
    } else {
      console.log('✅ Users table is accessible');
    }
    
  } catch (err) {
    console.error('❌ Error applying migration:', err);
    createManualSetupInstructions();
  }
}

function createManualSetupInstructions() {
  console.log(`
📋 MANUAL SETUP REQUIRED
========================

The automatic migration failed. Please follow these steps:

1. Go to https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo
2. Navigate to SQL Editor
3. Copy and paste the following SQL:

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'viewer' 
    CHECK (role IN ('admin', 'viewer')),
  
  -- Profile information
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  
  -- Account status
  is_active BOOLEAN NOT NULL DEFAULT true,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  last_login TIMESTAMP WITH TIME ZONE,
  login_count INTEGER DEFAULT 0,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active);

-- Create first admin user (replace with your details)
INSERT INTO public.users (email, password_hash, role, first_name, last_name, is_active, email_verified) 
VALUES (
  'admin@company.com',
  crypt('admin123', gen_salt('bf')),
  'admin',
  'Admin',
  'User',
  true,
  true
) ON CONFLICT (email) DO NOTHING;

4. Run this SQL in the Supabase dashboard
5. The admin page should then work with email: admin@company.com, password: admin123
`);
}

// Run the migration
applyMigration();