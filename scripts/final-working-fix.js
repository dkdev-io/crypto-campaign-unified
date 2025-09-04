#!/usr/bin/env node

// Create dan@dkdev.io user using Supabase Admin SDK (proper way)
const { createClient } = require('@supabase/supabase-js');

async function createWorkingUser() {
  console.log('🚀 CREATING WORKING dan@dkdev.io USER WITH ADMIN SDK');
  console.log('');

  // Create admin client with service key
  const supabaseAdmin = createClient(
    'https://kmepcdsklnnxokoimvzo.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU0NjI0OCwiZXhwIjoyMDcxMTIyMjQ4fQ.ILZgJNM0h6KuChk7zBFMOUZe_VftQjVOWk_BFYT7VqE',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  try {
    console.log('1. Creating user with Admin SDK...');

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: 'dan@dkdev.io',
      password: 'DanPassword123!',
      email_confirm: true, // Skip email verification
      user_metadata: {
        full_name: 'Dan Developer',
      },
    });

    if (error) {
      console.log('❌ Admin create failed:', error.message);

      if (
        error.message.includes('already exists') ||
        error.message.includes('already registered')
      ) {
        console.log('2. User exists, updating password...');

        // Get the user first
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = users.users?.find((u) => u.email === 'dan@dkdev.io');

        if (existingUser) {
          console.log('   Found user:', existingUser.id);

          // Update password and confirm email
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            existingUser.id,
            {
              password: 'DanPassword123!',
              email_confirm: true,
            }
          );

          if (updateError) {
            console.log('   ❌ Update failed:', updateError.message);
          } else {
            console.log('   ✅ Password updated and email confirmed');
          }
        }
      }
    } else {
      console.log('✅ User created successfully!');
      console.log('User ID:', data.user.id);
    }

    // Test login
    console.log('3. Testing login...');
    const supabaseClient = createClient(
      'https://kmepcdsklnnxokoimvzo.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI'
    );

    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: 'dan@dkdev.io',
      password: 'DanPassword123!',
    });

    if (loginError) {
      console.log('❌ Login failed:', loginError.message);
    } else {
      console.log('✅ LOGIN SUCCESS!');
      console.log('🎉 YOUR ACCOUNT WORKS NOW!');
      await supabaseClient.auth.signOut();
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('');
  console.log('✅ FINAL RESULT:');
  console.log('Go to: https://cryptocampaign.netlify.app/campaigns/auth');
  console.log('Email: dan@dkdev.io');
  console.log('Password: DanPassword123!');
  console.log('Should work immediately!');
}

createWorkingUser();
