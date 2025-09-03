import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI'

// Create supabase client with service key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createUsersTable() {
  console.log('🚀 Creating users table in Supabase...')
  
  const createTableSQL = `
    -- Create users table for admin dashboard
    CREATE TABLE IF NOT EXISTS public.users (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      full_name VARCHAR(255),
      role VARCHAR(50) DEFAULT 'user',
      permissions TEXT[] DEFAULT '{}',
      email_confirmed BOOLEAN DEFAULT false,
      last_login_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
    CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

    -- Insert admin user
    INSERT INTO public.users (id, email, full_name, role, permissions, email_confirmed, last_login_at)
    VALUES (
      'admin-user-id',
      'dan@dkdev.io',
      'Dan Kovacs',
      'super_admin',
      ARRAY['admin', 'export', 'view', 'manage', 'super_admin'],
      true,
      NOW()
    ) ON CONFLICT (email) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      permissions = EXCLUDED.permissions,
      last_login_at = EXCLUDED.last_login_at;

    -- Grant necessary permissions
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

    -- Allow anon access to read users for admin dashboard
    CREATE POLICY IF NOT EXISTS "Allow anon read access" ON public.users
        FOR SELECT USING (true);
  `
  
  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: createTableSQL
    })
    
    if (error) {
      console.error('❌ Error creating table via RPC:', error)
      
      // Try alternative method - direct query
      console.log('Trying direct SQL execution...')
      const { data: queryData, error: queryError } = await supabase
        .from('_supabase_admin')
        .select('*')
      
      if (queryError) {
        console.error('❌ Direct query also failed:', queryError)
      }
    } else {
      console.log('✅ Successfully created users table and admin user')
      console.log('Data:', data)
    }
    
    // Test if table exists now
    console.log('\nTesting table access...')
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.error('❌ Table still not accessible:', testError)
    } else {
      console.log('✅ Users table is now accessible!')
      console.log('Admin user:', testData)
    }
    
  } catch (error) {
    console.error('💥 Script execution failed:', error)
  }
}

// Run the script
createUsersTable().then(() => {
  console.log('🎉 Script completed')
  process.exit(0)
}).catch(error => {
  console.error('💥 Script failed:', error)
  process.exit(1)
})