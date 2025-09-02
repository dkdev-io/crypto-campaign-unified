#!/usr/bin/env node

// Debug authentication flow
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAuth() {
  console.log('🔍 Debugging authentication flow...\n');
  
  try {
    // 1. Test basic auth signup and signin
    console.log('1️⃣ Testing Supabase auth signup...');
    
    const testEmail = 'debug@test.com';
    const testPassword = 'debugpassword123';
    
    // Try signup first
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Debug User'
        }
      }
    });
    
    if (signUpError) {
      console.log('⚠️ Signup error:', signUpError.message);
      // This might be expected if user already exists
      
      // Try signin instead
      console.log('2️⃣ Testing signin...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });
      
      if (signInError) {
        console.log('❌ Signin error:', signInError.message);
        // Try with wrong password to test error handling
        console.log('3️⃣ Testing wrong password...');
        const { data: wrongPwData, error: wrongPwError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: 'wrongpassword'
        });
        
        if (wrongPwError) {
          console.log('✅ Wrong password error (expected):', wrongPwError.message);
        }
        
        // Try with non-existent email
        console.log('4️⃣ Testing non-existent email...');
        const { data: noUserData, error: noUserError } = await supabase.auth.signInWithPassword({
          email: 'nonexistent@test.com', 
          password: 'anypassword'
        });
        
        if (noUserError) {
          console.log('✅ Non-existent email error (expected):', noUserError.message);
        }
        
      } else {
        console.log('✅ Signin successful:', signInData.user?.email);
        
        // Now test the users table access
        console.log('5️⃣ Testing users table access with auth...');
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .limit(1);
          
        if (userError) {
          console.log('❌ Users table error with auth:', userError.message);
        } else {
          console.log('✅ Users table accessible:', userData?.length || 0, 'records');
        }
      }
    } else {
      console.log('✅ Signup successful:', signUpData.user?.email);
    }
    
    console.log('\n6️⃣ Testing users table without auth...');
    // Create a new client to test without auth
    const unauthClient = createClient(supabaseUrl, supabaseKey);
    const { data: unauthData, error: unauthError } = await unauthClient
      .from('users')
      .select('id, email, full_name')
      .limit(5);
      
    if (unauthError) {
      console.log('❌ Unauth users table error:', unauthError.message);
      console.log('   This could be due to RLS policies');
    } else {
      console.log('✅ Users table accessible without auth:', unauthData?.length || 0, 'records');
    }
    
  } catch (error) {
    console.error('💥 Debug failed:', error);
  }
}

debugAuth();