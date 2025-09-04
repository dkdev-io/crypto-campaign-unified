import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU0NjI0OCwiZXhwIjoyMDcxMTIyMjQ4fQ.F9qiZ2F3guzO8FUC8V6W7Z7Q8b_UiP5oHVeGK4-YwDk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addStyleColumns() {
  try {
    console.log('Adding style columns to campaigns table...');
    
    const { data, error } = await supabase.rpc('sql', {
      query: `
        ALTER TABLE campaigns 
        ADD COLUMN IF NOT EXISTS applied_styles JSONB,
        ADD COLUMN IF NOT EXISTS styles_applied BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS style_method TEXT;
      `
    });
    
    if (error) {
      console.log('❌ SQL execution error:', error.message);
      return false;
    }
    
    console.log('✅ Style columns added successfully');
    return true;
    
  } catch (err) {
    console.log('❌ Error:', err.message);
    return false;
  }
}

addStyleColumns().then(success => {
  if (success) {
    console.log('🎉 Database is ready for style preferences!');
  } else {
    console.log('❌ Failed to add style columns');
  }
  process.exit(0);
});