#!/usr/bin/env node

// Check what tables exist in Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('🔍 Checking what tables exist...');

  const tablesToCheck = [
    'users',
    'campaigns',
    'campaign_members',
    'invitations',
    'donors',
    'form_submissions',
    'user_sessions',
    'login_attempts',
  ];

  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: exists (count: ${data ? data.length : 'unknown'})`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }

  // Check auth.users (Supabase's built-in auth table)
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.log('🔐 Auth system:', error.message);
    } else {
      console.log('✅ Auth system: working');
    }
  } catch (err) {
    console.log('🔐 Auth system error:', err.message);
  }
}

checkTables();
