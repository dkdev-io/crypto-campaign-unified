#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Use the correct Supabase configuration
const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function registerTestDonor() {
  console.log('🚀 Registering test donor account\n');
  console.log('═'.repeat(60));

  const email = 'test@dkdev.io';
  const password = 'TestDonor123!';
  const fullName = 'Test Donor Account';
  const phone = '555-0123';

  console.log('📧 Registration Details:');
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Name: ${fullName}`);
  console.log(`   Phone: ${phone}`);
  console.log('═'.repeat(60) + '\n');

  try {
    // Step 1: Register the user
    console.log('1️⃣ Creating authentication account...');

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
          user_type: 'donor',
          donor_type: 'individual',
        },
        emailRedirectTo: `http://localhost:5173/donors/dashboard`,
      },
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('   ⚠️  User already exists, attempting to sign in...');

        // Try to sign in instead
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          console.error('   ❌ Sign in failed:', signInError.message);
          return;
        }

        console.log('   ✅ Successfully signed in!');
        authData.user = signInData.user;
      } else {
        console.error('   ❌ Registration failed:', authError.message);
        return;
      }
    } else {
      console.log('   ✅ Auth account created successfully!');
      console.log(`   • User ID: ${authData.user.id}`);
      console.log(`   • Email confirmation required: ${!authData.user.confirmed_at}`);
    }

    // Step 2: Create or check donor record
    if (authData.user) {
      console.log('\n2️⃣ Creating donor profile...');

      // Check if donor record already exists
      const { data: existingDonor, error: checkError } = await supabase
        .from('donors')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (existingDonor) {
        console.log('   ✅ Donor record already exists');
        console.log(`   • Donor ID: ${existingDonor.id}`);
        console.log(`   • Name: ${existingDonor.full_name}`);
        console.log(`   • Type: ${existingDonor.donor_type}`);
      } else {
        // Create new donor record
        const { data: donorData, error: donorError } = await supabase
          .from('donors')
          .insert({
            id: authData.user.id,
            email: email,
            full_name: fullName,
            phone: phone,
            donor_type: 'individual',
            email_verified: authData.user.confirmed_at ? true : false,
          })
          .select()
          .single();

        if (donorError) {
          console.error('   ❌ Failed to create donor record:', donorError.message);
        } else {
          console.log('   ✅ Donor record created!');
          console.log(`   • Donor ID: ${donorData.id}`);
        }

        // Create donor profile
        console.log('\n3️⃣ Creating donor profile...');
        const { data: profileData, error: profileError } = await supabase
          .from('donor_profiles')
          .insert({
            donor_id: authData.user.id,
            bio: 'Test donor account for development',
            interests: ['technology', 'education'],
            notification_preferences: {
              email: true,
              sms: false,
              push: false,
            },
          })
          .select()
          .single();

        if (profileError) {
          if (profileError.message.includes('duplicate')) {
            console.log('   ⚠️  Profile already exists');
          } else {
            console.error('   ❌ Failed to create profile:', profileError.message);
          }
        } else {
          console.log('   ✅ Donor profile created!');
          console.log(`   • Profile ID: ${profileData.id}`);
        }
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✅ REGISTRATION COMPLETE!\n');
    console.log('Next steps:');
    console.log('1. Check email test@dkdev.io for verification link');
    console.log('2. Click the link to verify the email');
    console.log('3. Sign in at: http://localhost:5173/donors/auth/login');
    console.log('4. Access dashboard at: http://localhost:5173/donors/dashboard');
    console.log('\nCredentials to remember:');
    console.log(`• Email: ${email}`);
    console.log(`• Password: ${password}`);

    // Test sign in
    console.log('\n4️⃣ Testing sign in...');
    const { data: signInTest, error: signInTestError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInTestError) {
      console.log('   ❌ Sign in test failed:', signInTestError.message);
    } else {
      console.log('   ✅ Sign in successful!');
      console.log('   • Session established');
      console.log('   • User can now access protected routes');

      // Sign out to clean up
      await supabase.auth.signOut();
      console.log('   • Signed out (cleanup)');
    }
  } catch (e) {
    console.error('\n❌ Unexpected error:', e.message);
    console.error(e.stack);
  }
}

// Run the registration
registerTestDonor()
  .then(() => {
    console.log('\n✨ Process complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
  });
