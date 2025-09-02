#!/usr/bin/env node

// Direct Supabase authentication test
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  console.log('🔗 Testing Supabase Connection...');
  
  try {
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
      
    if (connectionError) {
      console.error('❌ Connection Error:', connectionError);
      return;
    }
    console.log('✅ Supabase connection successful');

    // Test user table structure
    const { data: tableTest, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
      
    if (tableError) {
      console.error('❌ Users table error:', tableError);
      return;
    }
    console.log('✅ Users table accessible');

    // Test sign in with a test email
    console.log('\n🔐 Testing Authentication...');
    
    const testEmail = 'test@example.com';
    const testPassword = 'testpassword123';

    // Try to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.log('📝 Sign in error (expected):', signInError.message);
      
      // Try to sign up instead
      console.log('🆕 Trying sign up...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            full_name: 'Test User'
          }
        }
      });

      if (signUpError) {
        console.error('❌ Sign up error:', signUpError.message);
      } else {
        console.log('✅ Sign up successful:', signUpData);
      }
    } else {
      console.log('✅ Sign in successful:', signInData);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAuth();