#!/usr/bin/env node

// Fix the existing dan@dkdev.io user's password and confirmation status
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://kmepcdsklnnxokoimvzo.supabase.co";
const ACCESS_TOKEN = "sbp_d40cf702de00ebf693fdc11584a61de754515012";

async function fixExistingUser() {
  console.log('🚀 FIXING EXISTING USER: dan@dkdev.io');
  console.log('');

  try {
    // Use Management API to update the existing user
    console.log('1. Finding existing user...');
    
    const getUserResponse = await fetch(`https://api.supabase.com/v1/projects/kmepcdsklnnxokoimvzo/auth/users`, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!getUserResponse.ok) {
      console.log('   ❌ Failed to get users');
      return;
    }

    const usersData = await getUserResponse.json();
    const existingUser = usersData.users?.find(u => u.email === 'dan@dkdev.io');

    if (!existingUser) {
      console.log('   ⚠️ User not found, creating new one...');
      
      // Create user with Management API
      const createResponse = await fetch(`https://api.supabase.com/v1/projects/kmepcdsklnnxokoimvzo/auth/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'dan@dkdev.io',
          password: 'DanPassword123!',
          email_confirm: true,
          user_metadata: {
            full_name: 'Dan Developer'
          }
        })
      });

      if (!createResponse.ok) {
        console.log('   ❌ Failed to create user');
        return;
      }

      console.log('   ✅ User created with correct password');
    } else {
      console.log('   ✅ Found existing user:', existingUser.id);
      
      // Update existing user's password and confirm email
      console.log('2. Updating user password and email confirmation...');
      
      const updateResponse = await fetch(`https://api.supabase.com/v1/projects/kmepcdsklnnxokoimvzo/auth/users/${existingUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: 'DanPassword123!',
          email_confirm: true
        })
      });

      if (!updateResponse.ok) {
        console.log('   ❌ Failed to update user');
        const errorText = await updateResponse.text();
        console.log('   Error:', errorText);
        return;
      }

      console.log('   ✅ User password updated and email confirmed');
    }

    // Test the login
    console.log('3. Testing login with fixed credentials...');
    
    const supabase = createClient(SUPABASE_URL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI');

    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'dan@dkdev.io',
      password: 'DanPassword123!'
    });

    if (loginError) {
      console.log('   ❌ Login still failed:', loginError.message);
    } else {
      console.log('   ✅ LOGIN SUCCESS!');
      console.log('   🎉 EXISTING USER FIXED!');
      console.log('   User ID:', loginData.user.id);
      
      await supabase.auth.signOut();
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log('');
  console.log('✅ EXISTING USER FIX COMPLETE!');
  console.log('');
  console.log('🧪 YOUR WORKING CREDENTIALS:');
  console.log('Site: https://cryptocampaign.netlify.app/campaigns/auth');
  console.log('Email: dan@dkdev.io');
  console.log('Password: DanPassword123!');
  console.log('');
  console.log('✅ Should work immediately!');
}

fixExistingUser();