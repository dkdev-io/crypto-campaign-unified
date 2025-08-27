const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Your Supabase credentials
const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Setting up donor system tables...');
    
    // Read the SQL file
    const sqlContent = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/20250827_create_donor_system.sql'),
      'utf8'
    );
    
    // Split SQL content by semicolons and filter out empty statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      // Skip if it's just a comment
      if (statement.trim().startsWith('--')) continue;
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: statement 
      }).single();
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error.message);
        // Continue with other statements even if one fails
      } else {
        console.log(`Statement ${i + 1} executed successfully`);
      }
    }
    
    console.log('Migration completed!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Check if tables exist first
async function checkTables() {
  const { data, error } = await supabase
    .from('donors')
    .select('id')
    .limit(1);
  
  if (error) {
    console.log('Donors table does not exist yet. Running migration...');
    await runMigration();
  } else {
    console.log('Donors table already exists. Skipping migration.');
  }
}

checkTables();