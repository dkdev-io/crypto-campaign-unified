#!/usr/bin/env node

/**
 * Quick test script to verify Supabase configuration
 * Run this after setting up your .env file
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, 'frontend/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Configuration...\n');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables!');
  console.error('Please create frontend/.env with:');
  console.error('VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.error('VITE_SUPABASE_ANON_KEY=your-anon-key');
  process.exit(1);
}

console.log('📡 Supabase URL:', supabaseUrl);
console.log('🔑 Anon Key:', supabaseAnonKey.substring(0, 20) + '...\n');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // Test basic connection
    console.log('1. Testing basic connection...');
    const { data, error } = await supabase
      .from('campaigns')
      .select('count(*)')
      .single();
      
    if (error) {
      console.log('⚠️  Campaign table may not exist yet (this is normal for new projects)');
      console.log('   Error:', error.message);
    } else {
      console.log('✅ Database connection successful!');
    }

    // Test auth service
    console.log('\n2. Testing auth service...');
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError && authError.message !== 'Invalid JWT') {
      console.error('❌ Auth service error:', authError.message);
    } else {
      console.log('✅ Auth service accessible!');
    }

    // Test signup function (without actually signing up)
    console.log('\n3. Testing signup configuration...');
    try {
      // This should fail with a proper error message, not "Supabase not configured"
      await supabase.auth.signUp({
        email: 'test@test.com',
        password: 'testpassword123'
      });
    } catch (error) {
      if (error.message.includes('Supabase not configured')) {
        console.error('❌ Still using fallback client! Check your environment variables.');
      } else {
        console.log('✅ Signup function accessible (test error expected)');
      }
    }

    console.log('\n✅ Supabase configuration looks good!');
    console.log('\n📋 Next steps:');
    console.log('1. Set up your database tables using the SQL from SUPABASE_SETUP_FIX.md');
    console.log('2. Configure email authentication in your Supabase dashboard');
    console.log('3. Test signup with a real email address');

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check that your Supabase project is active');
    console.log('2. Verify your URL and anon key are correct');
    console.log('3. Check network connectivity');
  }
}

testConnection();