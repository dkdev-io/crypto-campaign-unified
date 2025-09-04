import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testStyleColumns() {
  try {
    console.log('Testing style columns...');
    
    const { data, error } = await supabase
      .from('campaigns')
      .select('applied_styles, styles_applied, style_method')
      .limit(1);
    
    if (error) {
      console.log('❌ Error checking columns:', error.message);
      return false;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Style columns exist:', Object.keys(data[0]));
      return true;
    } else {
      console.log('📝 No campaigns found, but columns accessible');
      return true;
    }
  } catch (err) {
    console.log('❌ Connection error:', err.message);
    return false;
  }
}

testStyleColumns().then(success => {
  console.log(success ? '✅ Database ready for styles' : '❌ Style columns missing');
  process.exit(0);
});