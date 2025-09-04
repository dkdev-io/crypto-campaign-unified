#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Use the CORRECT Supabase project that the frontend uses
const SUPABASE_URL = 'https://owjvgdzmmlrdtpjdxgka.supabase.co';
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93anZnZHptbWxyZHRwamR4Z2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY4NTI4MTksImV4cCI6MjA0MjQyODgxOX0.dHyNtZfNzuaeBdrZiDzH4eMGYP4-FVWQd7F1Xf3VKz0';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function testDonorRegistration() {
  console.log('🔍 Testing donor registration with test@dkdev.io...');

  try {
    // Test the actual registration flow that the frontend uses
    console.log('1. Attempting to create user account...');

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'test@dkdev.io',
      password: 'TestDonor123!',
      options: {
        data: {
          full_name: 'Test Donor Account',
          donor_type: 'individual',
        },
      },
    });

    if (signUpError) {
      console.log('❌ SignUp Error:', signUpError.message);

      // If user already exists, try to sign in
      if (signUpError.message.includes('already registered')) {
        console.log('2. User already exists, trying to sign in...');

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: 'test@dkdev.io',
          password: 'TestDonor123!',
        });

        if (signInError) {
          console.log('❌ SignIn Error:', signInError.message);

          if (signInError.message.includes('Email not confirmed')) {
            console.log('ℹ️  Email needs verification - this is expected for new accounts');
            console.log('✅ AUTH SYSTEM IS WORKING - user exists but needs email verification');
            return;
          }
        } else {
          console.log('✅ Successfully signed in existing user!');
          console.log('📧 User Email:', signInData.user.email);
          console.log('🆔 User ID:', signInData.user.id);

          // Try to create donor record
          await testDonorTableCreation(signInData.user);
          return;
        }
      }
    } else {
      console.log('✅ User account created successfully!');
      if (signUpData.user) {
        console.log('📧 User Email:', signUpData.user.email);
        console.log('🆔 User ID:', signUpData.user.id);
        console.log('📋 Email confirmed:', signUpData.user.email_confirmed_at ? 'Yes' : 'No');

        // Try to create donor record
        await testDonorTableCreation(signUpData.user);
      }
    }
  } catch (error) {
    console.error('💥 Fatal error during registration test:', error.message);
  }
}

async function testDonorTableCreation(user) {
  console.log('\n3. Testing donor table access...');

  try {
    // Try to insert a donor record (this will tell us if tables exist)
    const { data: donorData, error: donorError } = await supabase
      .from('donors')
      .insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || 'Test Donor',
        donor_type: 'individual',
      })
      .select();

    if (donorError) {
      console.log('❌ Donor table error:', donorError.message);

      if (donorError.message.includes('does not exist')) {
        console.log('\n🎯 ROOT CAUSE FOUND: The donors table does not exist!');
        console.log('This is why the registration form fails silently.');
        console.log('The frontend tries to create a donor record but the table is missing.');
        return false;
      } else if (
        donorError.message.includes('duplicate key') ||
        donorError.message.includes('already exists')
      ) {
        console.log('ℹ️  Donor record already exists - this is fine');
        return true;
      } else {
        console.log('⚠️  Other donor table issue:', donorError.message);
        return false;
      }
    } else {
      console.log('✅ Donor record created successfully!');
      console.log('📄 Donor data:', donorData);
      return true;
    }
  } catch (error) {
    console.error('💥 Fatal error during donor table test:', error.message);
    return false;
  }
}

console.log('🚀 Testing donor registration system...');
console.log('🎯 Using the CORRECT Supabase project that frontend connects to');
console.log('');

testDonorRegistration()
  .then(() => {
    console.log('\n✅ Donor registration test completed');
    console.log('');
    console.log('📋 Next Steps:');
    console.log(
      '1. If tables are missing, they need to be created in the owjvgdzmmlrdtpjdxgka project'
    );
    console.log('2. If auth works but tables fail, that confirms our diagnosis');
    console.log('3. The frontend should then work properly once tables exist');
  })
  .catch((err) => {
    console.error('\n💥 Test crashed:', err);
  });
