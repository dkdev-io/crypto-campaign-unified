#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SAMPLE_CANDIDATES = [
  {
    name: 'Senator Jane Doe',
    description: 'Progressive candidate fighting for climate action and economic justice',
    wallet_address: '0x1234567890123456789012345678901234567890',
    campaign_goal: '100000.0',
    is_active: true,
    campaign_start_date: new Date('2024-01-01').toISOString(),
    campaign_end_date: new Date('2024-12-31').toISOString()
  },
  {
    name: 'Mayor John Smith',
    description: 'Local government reform advocate focused on transparency and community development',
    wallet_address: '0x0987654321098765432109876543210987654321',
    campaign_goal: '50000.0',
    is_active: true,
    campaign_start_date: new Date('2024-01-01').toISOString(),
    campaign_end_date: new Date('2024-12-31').toISOString()
  },
  {
    name: 'Representative Maria Garcia',
    description: 'Education reform champion working to improve public schools and make college affordable',
    wallet_address: '0xabcdef1234567890abcdef1234567890abcdef12',
    campaign_goal: '75000.0',
    is_active: true,
    campaign_start_date: new Date('2024-01-01').toISOString(),
    campaign_end_date: new Date('2024-12-31').toISOString()
  }
];

async function addSampleCandidates() {
  console.log('🗳️  Adding sample candidates to database...');
  
  try {
    // First check what columns actually exist in campaigns table
    const { data: existingCampaigns } = await supabase
      .from('campaigns')
      .select('*')
      .limit(1);
    
    console.log('Existing campaigns structure:', existingCampaigns);
    
    // Check if candidates table exists, if not use campaigns table
    const { data: existingCandidates, error: candidatesError } = await supabase
      .from('candidates')
      .select('id, name')
      .limit(1);

    if (candidatesError && candidatesError.code === 'PGRST205') {
      // Candidates table doesn't exist, add to campaigns table instead
      console.log('Candidates table not found, adding to campaigns table...');
      
      for (const candidate of SAMPLE_CANDIDATES) {
        // Use actual schema fields
        const campaignRecord = {
          campaign_name: candidate.name,
          email: 'test@dkdev.io',
          wallet_address: candidate.wallet_address,
          website: 'https://test.com',
          status: 'active',
          suggested_amounts: [25, 50, 100, 250],
          max_donation_limit: 3300,
          theme_color: '#2a2a72',
          supported_cryptos: ['BTC', 'ETH', 'USDC'],
          setup_step: 1,
          setup_completed: true,
          terms_accepted: true
        };

        const { data, error } = await supabase
          .from('campaigns')
          .insert([campaignRecord])
          .select()
          .single();

        if (error) {
          console.error(`Error creating campaign for ${candidate.name}:`, error);
        } else {
          console.log(`✅ Created campaign: ${data.title} (ID: ${data.id})`);
        }
      }
    } else {
      // Candidates table exists
      console.log('Adding to candidates table...');
      
      for (const candidate of SAMPLE_CANDIDATES) {
        const { data, error } = await supabase
          .from('candidates')
          .insert([candidate])
          .select()
          .single();

        if (error) {
          console.error(`Error creating candidate ${candidate.name}:`, error);
        } else {
          console.log(`✅ Created candidate: ${data.name} (ID: ${data.id})`);
        }
      }
    }

    console.log('✅ Sample candidates added successfully!');
  } catch (error) {
    console.error('❌ Error adding sample candidates:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addSampleCandidates();
}

export { addSampleCandidates };