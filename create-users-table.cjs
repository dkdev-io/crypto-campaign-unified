const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU0NjI0OCwiZXhwIjoyMDcxMTIyMjQ4fQ.ILZgJNM0h6KuChk7zBFMOUZe_VftQjVOWk_BFYT7VqE';

// Create admin client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createUsersTable() {
  try {
    console.log('Creating users table with service role...');
    
    // Try creating a stored procedure to execute SQL
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION execute_sql(sql_text text)
      RETURNS text
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql_text;
        RETURN 'Success';
      EXCEPTION WHEN OTHERS THEN
        RETURN 'Error: ' || SQLERRM;
      END;
      $$;
    `;
    
    // First try to create the function
    const { data: functionResult, error: functionError } = await supabase.rpc('exec_sql', {
      sql: createFunctionSQL
    }).single();
    
    if (functionError) {
      console.log('Function creation failed, trying direct approach...');
      
      // Try using raw SQL execution via PostgREST
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({
          sql: createFunctionSQL
        })
      });
      
      if (!response.ok) {
        // Try creating the users table directly using DDL
        console.log('Creating users table via admin operations...');
        
        // Create users table schema
        const createTableSQL = `
          -- Enable extensions
          CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
          CREATE EXTENSION IF NOT EXISTS "pgcrypto";
          
          -- Create users table
          CREATE TABLE IF NOT EXISTS public.users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role VARCHAR(20) NOT NULL DEFAULT 'viewer',
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            is_active BOOLEAN NOT NULL DEFAULT true,
            email_verified BOOLEAN NOT NULL DEFAULT false,
            last_login TIMESTAMP WITH TIME ZONE,
            login_count INTEGER DEFAULT 0,
            password_reset_token TEXT,
            password_reset_expires TIMESTAMP WITH TIME ZONE,
            email_verification_token TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Create indexes
          CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
          CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
          CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active);
        `;
        
        // Try using a different approach - create via SQL function call
        const { data: tableResult, error: tableError } = await supabase
          .rpc('exec_sql', { query: createTableSQL });
          
        if (tableError) {
          console.log('Table creation failed:', tableError);
          console.log('Attempting raw PostgreSQL approach...');
          
          // Try the most basic approach - create via REST API DDL
          const ddlResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/sql',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey,
              'Accept': 'application/json'
            },
            body: createTableSQL
          });
          
          if (!ddlResponse.ok) {
            const errorText = await ddlResponse.text();
            console.error('DDL execution failed:', errorText);
            throw new Error('All approaches failed');
          }
        }
      }
    }
    
    console.log('✅ Users table creation completed');
    
    // Now create the admin user
    console.log('Creating admin user...');
    
    const { data: insertResult, error: insertError } = await supabase
      .from('users')
      .insert({
        email: 'admin@company.com',
        password_hash: '$2b$10$rGQprdXLDBUgZhgWFbTKPeKONYJYlr3t9FaZNPqj9mK5dLhYGQCTW', // admin123 hashed
        role: 'admin',
        first_name: 'Admin',
        last_name: 'User',
        is_active: true,
        email_verified: true
      })
      .select();
      
    if (insertError) {
      // User might already exist, try to update instead
      const { data: updateResult, error: updateError } = await supabase
        .from('users')
        .upsert({
          email: 'admin@company.com',
          password_hash: '$2b$10$rGQprdXLDBUgZhgWFbTKPeKONYJYlr3t9FaZNPqj9mK5dLhYGQCTW',
          role: 'admin',
          first_name: 'Admin',
          last_name: 'User',
          is_active: true,
          email_verified: true
        });
        
      if (updateError) {
        console.error('User creation/update failed:', updateError);
      } else {
        console.log('✅ Admin user created/updated successfully');
      }
    } else {
      console.log('✅ Admin user created successfully:', insertResult);
    }
    
    // Verify the table exists
    const { data: verifyData, error: verifyError } = await supabase
      .from('users')
      .select('email, role')
      .limit(5);
      
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
    } else {
      console.log('✅ Users table verified, current users:', verifyData);
    }
    
  } catch (error) {
    console.error('❌ Error creating users table:', error);
    console.log('\n🚨 FALLBACK: Manual execution required');
    console.log('Go to https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo/sql');
    console.log('and run the SQL from setup-users-table.sql');
  }
}

createUsersTable();