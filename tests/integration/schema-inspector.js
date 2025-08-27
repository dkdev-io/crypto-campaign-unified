// Schema Inspector - Checks actual database structure
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectSchema() {

  const tables = ['campaigns', 'contributions', 'kyc_data'];

  for (const table of tables) {
    
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
        columns.forEach(col => {
          const value = data[0][col];
          const type = Array.isArray(value) ? 'array' : typeof value;
        });
        
      } else {
        // Try getting table structure anyway
        const { error: structError } = await supabase
          .from(table)
          .select('*')
          .limit(0);
        
        if (!structError) {
        }
      }
    } catch (err) {
      console.log(`  ❌ Unexpected error: ${err.message}`);
    }
  }
}

inspectSchema().catch(console.error);