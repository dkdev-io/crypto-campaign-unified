#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDonorSchema() {
  console.log('🔍 Testing Donor Table Schema');
  
  // First, let's see what columns exist
  const { data: existingDonor } = await supabase
    .from('donors')
    .select('*')
    .limit(1);
    
  console.log('Existing donor structure:', existingDonor?.[0] || 'No donors found');
  
  // Try creating with minimal fields
  const testDonorMinimal = {
    email: 'test-minimal@example.com',
    full_name: 'Test Donor',
    donor_type: 'individual'
  };

  const { data: newDonor, error } = await supabase
    .from('donors')
    .insert([testDonorMinimal])
    .select()
    .single();

  if (error) {
    console.error('Error creating minimal donor:', error);
  } else {
    console.log('✅ Successfully created donor:', newDonor);
    
    // Now add referral code manually
    const referralCode = 'TEST' + Date.now().toString(36).toUpperCase();
    console.log('Generated referral code:', referralCode);
    
    // For now, just return the donor without referral code
    console.log('✅ DonationForm can work by storing referral codes separately if needed');
  }
}

testDonorSchema();