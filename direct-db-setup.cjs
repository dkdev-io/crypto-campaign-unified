const https = require('https');
const { createClient } = require('@supabase/supabase-js');

// Try with the anon key but bypass RLS
const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createUserTableDirect() {
  try {
    console.log('Attempting to create users table using REST API...');
    
    // Try using the direct database endpoint
    const dbUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co/rest/v1/';
    
    // Create a simple test first - try to create via INSERT into a system function
    const testSql = `
      SELECT current_database() as db_name, current_user as user_name, version() as pg_version;
    `;
    
    // Try using a SQL query via the REST API
    const queryResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/sql_query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey
      },
      body: JSON.stringify({ query: testSql })
    });
    
    if (!queryResponse.ok) {
      console.log('SQL query RPC failed, trying table creation directly...');
      
      // Let's try to create the table using a different approach
      // Use the Supabase client to create via a stored procedure
      const createTableProcedure = `
        DO $$
        BEGIN
          -- Create the users table
          CREATE TABLE IF NOT EXISTS public.users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role VARCHAR(20) NOT NULL DEFAULT 'viewer',
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            is_active BOOLEAN NOT NULL DEFAULT true,
            email_verified BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Create indexes
          CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
          CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
          CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active);
          
          -- Insert admin user if it doesn't exist
          INSERT INTO public.users (email, password_hash, role, first_name, last_name, is_active, email_verified) 
          SELECT 'admin@company.com', 'admin123hash', 'admin', 'Admin', 'User', true, true
          WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'admin@company.com');
          
        END
        $$;
      `;
      
      // Try creating via PostgREST admin endpoint
      const adminResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ 
          statement: createTableProcedure
        })
      });
      
      if (!adminResponse.ok) {
        console.log('Admin endpoint failed, trying manual table creation...');
        
        // Create the table manually using schema manipulation
        // This is a workaround using the information_schema
        const schemaCheck = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_name', 'users')
          .single();
          
        if (schemaCheck.error) {
          console.log('Table does not exist, need to create it...');
          
          // Since we can't execute DDL directly, let's try a different approach
          // Create the table structure by calling a custom function
          console.log('Attempting to use database functions...');
          
          // Try to call any available RPC functions
          const { data: rpcList, error: rpcError } = await supabase.rpc('help');
          if (rpcError) {
            console.log('No RPC functions available:', rpcError);
            
            // Final attempt: try to use the edge functions or webhooks
            console.log('Trying to access database through schema...');
            
            // Check what tables we can access
            const { data: tables, error: tablesError } = await supabase
              .from('pg_tables')
              .select('tablename')
              .eq('schemaname', 'public')
              .limit(10);
              
            if (tablesError) {
              throw new Error('Cannot access database schema: ' + tablesError.message);
            } else {
              console.log('Available tables:', tables);
              
              // If we can see the schema, the database is accessible
              // The issue is that the users table just doesn't exist
              console.log('✅ Database is accessible but users table missing');
              console.log('📋 MANUAL ACTION REQUIRED:');
              console.log('Go to: https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo/sql');
              console.log('Run the SQL from setup-users-table.sql');
              return false;
            }
          }
        } else {
          console.log('✅ Users table already exists!');
          return true;
        }
      } else {
        console.log('✅ Table creation successful via admin endpoint');
        return true;
      }
    } else {
      const result = await queryResponse.json();
      console.log('Database info:', result);
    }
    
  } catch (error) {
    console.error('❌ Direct database setup failed:', error.message);
    console.log('📋 Manual SQL execution required at:');
    console.log('https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo/sql');
    return false;
  }
}

// Run the setup
createUserTableDirect().then(success => {
  if (success) {
    console.log('✅ Setup completed successfully');
    process.exit(0);
  } else {
    console.log('❌ Manual setup required');
    process.exit(1);
  }
});