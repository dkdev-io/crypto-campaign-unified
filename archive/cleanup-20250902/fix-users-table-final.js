#!/usr/bin/env node

// Final approach to create users table using legitimate signup
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUsersTableFinal() {
  console.log('🔧 Final approach: Creating users table via legitimate user signup...');

  try {
    // Step 1: Create a legitimate user with proper email format
    const testEmail = 'setup.test@gmail.com';
    console.log('1️⃣ Creating legitimate user:', testEmail);

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'SetupTest123!',
      options: {
        data: {
          full_name: 'Setup Test User',
        },
      },
    });

    if (signupError) {
      console.log('⚠️ Signup error (might be expected):', signupError.message);

      // If user already exists, try signing in
      if (
        signupError.message.includes('already registered') ||
        signupError.message.includes('exists')
      ) {
        console.log('2️⃣ User exists, trying signin...');

        const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: 'SetupTest123!',
        });

        if (signinError) {
          console.log('⚠️ Signin error:', signinError.message);
        } else {
          console.log('✅ Signed in successfully');
        }
      }
    } else {
      console.log('✅ User created successfully:', signupData.user?.email);
    }

    // Step 2: Wait a moment for any triggers to fire
    console.log('3️⃣ Waiting for database triggers...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Step 3: Test users table access
    console.log('4️⃣ Testing users table access...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .limit(1);

    if (usersError) {
      console.log('❌ Users table still not accessible:', usersError.message);

      // Step 4: Try creating the table manually through direct insert
      console.log('5️⃣ Attempting manual table creation via insert...');

      const { data: insertData, error: insertError } = await supabase.from('users').insert([
        {
          email: testEmail,
          full_name: 'Setup Test User',
          role: 'user',
        },
      ]);

      if (insertError) {
        console.log('❌ Manual insert failed:', insertError.message);
        console.log('\n💡 The users table does not exist in the database.');
        console.log('This is why the authentication is failing.');
        console.log('\n🔧 SOLUTION NEEDED:');
        console.log('The table needs to be created in your Supabase project.');
        console.log("Since I don't have service role access, the table must be created through:");
        console.log('1. Supabase Dashboard > SQL Editor');
        console.log('2. Or through a migration with proper service role key');
        console.log('3. Or by configuring the database to auto-create on auth signup');
      } else {
        console.log('✅ Manual insert successful - users table working!');
      }
    } else {
      console.log('✅ Users table accessible!', usersData?.length || 0, 'records');
      console.log('🎉 Authentication should now work!');
    }

    // Step 5: Final verification
    console.log('\n6️⃣ Final verification test...');
    const { data: finalTest, error: finalError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .limit(5);

    if (finalError) {
      console.log('❌ FINAL RESULT: Users table not working');
      console.log('Error:', finalError.message);
      console.log('\n🚨 AUTHENTICATION WILL FAIL until users table is created');
    } else {
      console.log('✅ FINAL RESULT: Users table working!');
      console.log('Records found:', finalTest?.length || 0);
      console.log('\n🎉 AUTHENTICATION SHOULD NOW WORK!');
      console.log('🔗 Test at: https://cryptocampaign.netlify.app/auth');
    }
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
  }
}

fixUsersTableFinal();
