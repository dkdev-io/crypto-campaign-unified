const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function executeSQLDirectly() {
    try {
        console.log('Creating users table via individual SQL commands...');
        
        // Create users table with basic structure (simplified for compatibility)
        const userTableSQL = `
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
          )
        `;

        // Use direct HTTP request with proper headers
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'apikey': supabaseAnonKey,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ 
                sql: userTableSQL 
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.log('RPC failed, trying alternative approach...');
            console.log('Error:', error);
            
            // Try using Supabase client SQL function if available
            const { data, error: rpcError } = await supabase
                .rpc('exec', {
                    sql: userTableSQL
                });
                
            if (rpcError) {
                console.log('Alternative approach also failed:', rpcError);
                console.log('Using simpler approach - creating via REST API...');
                
                // Just try to create a simple test to see if we can access the database
                const { data: testData, error: testError } = await supabase
                    .from('information_schema.tables')
                    .select('table_name')
                    .eq('table_schema', 'public')
                    .limit(5);
                    
                if (testError) {
                    console.error('❌ Cannot access database:', testError);
                } else {
                    console.log('✅ Database is accessible, existing tables:', testData);
                    
                    // Let's try a more direct approach using psql if available
                    console.log('\n🔧 MANUAL SQL EXECUTION REQUIRED');
                    console.log('Please run the following in your Supabase SQL Editor:');
                    console.log('\n' + fs.readFileSync('setup-users-table.sql', 'utf8'));
                }
            } else {
                console.log('✅ Table creation successful via alternative RPC');
            }
        } else {
            console.log('✅ Table creation successful');
        }
        
        // Test if users table now exists
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .limit(1);
            
        if (usersError) {
            console.log('❌ Users table not accessible:', usersError.message);
        } else {
            console.log('✅ Users table is now accessible!');
            console.log('Current users:', users);
        }
        
    } catch (err) {
        console.error('❌ Error:', err.message);
        console.log('\n🔧 MANUAL SQL EXECUTION REQUIRED');
        console.log('Go to: https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo');
        console.log('Navigate to SQL Editor and run the SQL from setup-users-table.sql');
    }
}

executeSQLDirectly();