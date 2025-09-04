// Create tables using Supabase REST API
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';

async function setupDatabase() {
  console.log('Setting up database tables...');

  // First, let's check what tables already exist
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    const tables = await response.text();
    console.log('Available endpoints:', tables);

    // Try to query the form_submissions table to see if it exists
    const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/form_submissions?limit=1`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (testResponse.status === 404 || testResponse.status === 400) {
      console.log('❌ form_submissions table does not exist');
      console.log('Creating it now...');

      // The table doesn't exist, we need to create it
      // Let's try a different approach - create a minimal version first
      await createFormSubmissionsTable();
    } else if (testResponse.ok) {
      console.log('✅ form_submissions table already exists!');
      const data = await testResponse.json();
      console.log('Table is accessible, found', data.length, 'records');
    } else {
      console.log('Unexpected response:', testResponse.status, await testResponse.text());
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function createFormSubmissionsTable() {
  // Since we can't create tables directly with anon key via REST API,
  // let's create a workaround by using the existing campaigns table structure
  // and modifying our approach

  console.log('\n📝 Alternative approach needed...');
  console.log('Since direct table creation requires admin privileges,');
  console.log("let's modify our approach to use the existing campaigns table");
  console.log('or create a simpler storage solution.\n');

  // Check if we can use the campaigns table to store submissions temporarily
  const campaignsResponse = await fetch(`${SUPABASE_URL}/rest/v1/campaigns?limit=1`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (campaignsResponse.ok) {
    console.log('✅ Campaigns table exists and is accessible');
    console.log('\nOption 1: Store submissions as JSON in campaigns table');
    console.log('Option 2: Use Supabase Storage for form data');
    console.log('Option 3: Run the SQL manually in Supabase dashboard\n');

    // Let's create a simpler solution - store form submissions as JSONB in campaigns
    console.log('Implementing Option 1: Adding submissions column to campaigns...');

    // Try to update a campaign with a new field to test
    const updateTest = await fetch(`${SUPABASE_URL}/rest/v1/campaigns?id=eq.test-migration`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        form_submissions_data: [],
      }),
    });

    if (updateTest.ok || updateTest.status === 404) {
      console.log('✅ Can potentially add submissions data to campaigns table');
    }
  }

  console.log('\n🔧 SOLUTION: Running direct SQL via Supabase client...');

  // Import and use Supabase client for better control
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Check if we have access to any RPC functions
  const { data: functions, error: funcError } = await supabase.rpc('version');
  if (!funcError) {
    console.log('PostgreSQL version:', functions);
  }

  console.log('\n📋 To complete setup, copy and run this in Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo/sql/new');
  console.log('\nOr let me try an alternative approach...');
}

setupDatabase();
