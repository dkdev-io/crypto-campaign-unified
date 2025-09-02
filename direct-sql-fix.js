import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kmepcdsklnnxokoimvzo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI'
);

async function addColumnsUsingInsert() {
  console.log('🔧 Working around column limitations by updating campaigns table...');
  
  try {
    // First, let's get an existing campaign to work with
    const { data: existingCampaigns, error: fetchError } = await supabase
      .from('campaigns')
      .select('*')
      .limit(1);
      
    if (fetchError) {
      throw fetchError;
    }
    
    if (existingCampaigns.length === 0) {
      console.log('No existing campaigns found');
      return;
    }
    
    console.log('Current campaign structure:', Object.keys(existingCampaigns[0]));
    
    // Try to update one campaign with the new fields to see what's missing
    const testUpdate = {
      user_id: existingCampaigns[0].id, // Use campaign ID as placeholder
      user_full_name: 'Test User',
      setup_step: 7,
      setup_completed: true,
      terms_accepted: true
    };
    
    const { data, error } = await supabase
      .from('campaigns')
      .update(testUpdate)
      .eq('id', existingCampaigns[0].id)
      .select();
      
    if (error) {
      console.log('❌ Missing columns detected:', error.message);
      
      // Parse which columns are missing from the error
      const missingColumns = [];
      if (error.message.includes('user_id')) missingColumns.push('user_id');
      if (error.message.includes('user_full_name')) missingColumns.push('user_full_name');
      if (error.message.includes('setup_step')) missingColumns.push('setup_step');
      if (error.message.includes('setup_completed')) missingColumns.push('setup_completed');
      if (error.message.includes('terms_accepted')) missingColumns.push('terms_accepted');
      
      console.log('Missing columns identified:', missingColumns);
      
      // Try to create them using a workaround
      const { error: rpcError } = await supabase.rpc('add_missing_campaign_columns');
      if (rpcError) {
        console.log('RPC not available:', rpcError.message);
        
        console.log('📧 SOLUTION: You need to manually add these columns to your campaigns table:');
        console.log(`
ALTER TABLE campaigns 
ADD COLUMN user_id UUID,
ADD COLUMN user_full_name TEXT,
ADD COLUMN fec_committee_id TEXT,
ADD COLUMN committee_name TEXT,
ADD COLUMN committee_confirmed BOOLEAN DEFAULT false,
ADD COLUMN bank_account_verified BOOLEAN DEFAULT false,
ADD COLUMN bank_account_name TEXT,
ADD COLUMN bank_last_four TEXT,
ADD COLUMN plaid_account_id TEXT,
ADD COLUMN terms_accepted BOOLEAN DEFAULT false,
ADD COLUMN terms_accepted_at TIMESTAMPTZ,
ADD COLUMN terms_ip_address TEXT,
ADD COLUMN setup_step INTEGER DEFAULT 1,
ADD COLUMN setup_completed BOOLEAN DEFAULT false,
ADD COLUMN setup_completed_at TIMESTAMPTZ,
ADD COLUMN website_analyzed TEXT,
ADD COLUMN style_analysis JSONB,
ADD COLUMN applied_styles JSONB,
ADD COLUMN styles_applied BOOLEAN DEFAULT false,
ADD COLUMN embed_code TEXT,
ADD COLUMN embed_generated_at TIMESTAMPTZ,
ADD COLUMN description TEXT;
        `);
        
      } else {
        console.log('✅ Columns added via RPC function');
      }
    } else {
      console.log('✅ Test update successful - columns already exist or were added');
      console.log('Updated campaign:', data);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

addColumnsUsingInsert();