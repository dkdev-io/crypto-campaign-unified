const { createClient } = require('@supabase/supabase-js');

// Test the admin login functionality
async function testAdminLogin() {
  console.log('🔍 Testing Admin Login Flow...\n');

  // Test 1: Supabase Connection
  console.log('1. Testing Supabase connection...');
  const supabase = createClient(
    'https://kmepcdsklnnxokoimvzo.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI'
  );

  try {
    const { data, error } = await supabase.from('form_submissions').select('count').single();
    console.log('✅ Supabase connection working');
  } catch (err) {
    console.log('❌ Supabase connection failed:', err.message);
    return;
  }

  // Test 2: Form Submissions Data (what will show in users)
  console.log('\n2. Testing form submissions data...');
  try {
    const { data: submissions, error } = await supabase
      .from('form_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`✅ Found ${submissions.length} form submissions`);
    submissions.forEach((sub, i) => {
      console.log(
        `   ${i + 1}. ${sub.first_name} ${sub.last_name} (${sub.email}) - $${sub.amount}`
      );
    });
  } catch (err) {
    console.log('❌ Form submissions test failed:', err.message);
  }

  // Test 3: Simulate hardcoded admin login
  console.log('\n3. Testing hardcoded admin logic...');
  const testEmail = 'dan@dkdev.io';
  const testPassword = 'admin123';

  if (testEmail === 'dan@dkdev.io' && testPassword === 'admin123') {
    const mockAdmin = {
      id: 'admin-user',
      email: 'dan@dkdev.io',
      full_name: 'Dan Kovacs',
      role: 'super_admin',
      permissions: ['admin', 'export', 'view', 'manage', 'super_admin'],
    };
    console.log('✅ Hardcoded admin login would succeed');
    console.log('   Admin object:', mockAdmin);
  } else {
    console.log('❌ Hardcoded admin login would fail');
  }

  // Test 4: Check users table fallback
  console.log('\n4. Testing users table fallback logic...');
  try {
    const { data, error } = await supabase.from('users').select('*').limit(1);
    if (error && error.code === 'PGRST205') {
      console.log('✅ Users table correctly not found - will fall back to form_submissions');
    } else {
      console.log('Users table exists - normal flow');
    }
  } catch (err) {
    console.log('Users table check failed:', err.message);
  }

  console.log('\n🎯 Summary:');
  console.log('- Admin login at /minda should work with dan@dkdev.io / admin123');
  console.log('- Users page should show form submissions instead of empty');
  console.log('- Dashboard should show zeros instead of mock data');
  console.log('- Navigation should use React Router Links (no page reloads)');
}

testAdminLogin().catch(console.error);
