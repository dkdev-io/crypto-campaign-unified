// Schema Inspector - Checks actual database structure
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectSchema() {
  console.log('🔍 Inspecting Database Schema...\n');

  const tables = ['campaigns', 'contributions', 'kyc_data'];

  for (const table of tables) {
    console.log(`\n📊 Table: ${table}`);
    console.log('=' .repeat(40));
    
    try {
      // Get one record to see column structure
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`  ❌ Error: ${error.message}`);
        continue;
      }

      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log('  Columns:');
        columns.forEach(col => {
          const value = data[0][col];
          const type = Array.isArray(value) ? 'array' : typeof value;
          console.log(`    - ${col}: ${type}`);
        });
        
        console.log('\n  Sample data:');
        console.log(JSON.stringify(data[0], null, 2).split('\n').map(line => '    ' + line).join('\n'));
      } else {
        console.log('  ⚠️ Table exists but is empty');
        // Try getting table structure anyway
        const { error: structError } = await supabase
          .from(table)
          .select('*')
          .limit(0);
        
        if (!structError) {
          console.log('  ✅ Table structure is valid');
        }
      }
    } catch (err) {
      console.log(`  ❌ Unexpected error: ${err.message}`);
    }
  }
}

inspectSchema().catch(console.error);