const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  try {
    // Test with a simple query first
    const { data, error } = await supabase
      .from('campaign_prospects')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('✅ Connection successful! Row count:', data);
    }

    // Test with actual data fetch
    const { data: rows, error: fetchError } = await supabase
      .from('campaign_prospects')
      .select('*')
      .limit(1);

    if (fetchError) {
      console.error('❌ Fetch error:', fetchError);
    } else {
      console.log('✅ Data fetch successful! Rows:', rows.length);
    }
  } catch (error) {
    console.error('💥 Connection failed:', error.message);
    console.error('Details:', error);
  }
}

testConnection();
