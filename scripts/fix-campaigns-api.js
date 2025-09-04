#!/usr/bin/env node

import fetch from 'node-fetch';
import fs from 'fs';

// Supabase connection details
const SUPABASE_URL = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1NDYyNDgsImV4cCI6MjA1MTEyMjI0OH0.nJHF3rG3N6kGyzDD_vq2D4t9gLCLBNDVsLqHs9EbKfE';
const SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTU0NjI0OCwiZXhwIjoyMDUxMTIyMjQ4fQ.HgFnPg4pLT3pqX-tVlB3HhNWdLgOGf0J3X8-mTgCmPo';

async function executeSQLViaAPI() {
  console.log('🚀 Fixing campaigns table via Supabase API...\n');

  try {
    // First, try to create a database function that will add the columns
    const functionSQL = `
      CREATE OR REPLACE FUNCTION fix_campaigns_table()
      RETURNS void AS $$
      BEGIN
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS user_id UUID;
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS user_full_name TEXT;
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS fec_committee_id TEXT;
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS committee_name TEXT;
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS committee_confirmed BOOLEAN DEFAULT false;
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS bank_account_verified BOOLEAN DEFAULT false;
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS bank_account_name TEXT;
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS bank_last_four TEXT;
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS plaid_account_id TEXT;
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false;
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS terms_ip_address TEXT;
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS setup_step INTEGER DEFAULT 1;
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT false;
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS setup_completed_at TIMESTAMPTZ;
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS website_analyzed TEXT;
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS style_analysis JSONB;
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS applied_styles JSONB;
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS styles_applied BOOLEAN DEFAULT false;
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS embed_code TEXT;
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS embed_generated_at TIMESTAMPTZ;
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS description TEXT;
        
        -- Update existing campaigns
        UPDATE campaigns 
        SET 
            setup_step = COALESCE(setup_step, 7),
            setup_completed = COALESCE(setup_completed, true),
            setup_completed_at = COALESCE(setup_completed_at, created_at),
            terms_accepted = COALESCE(terms_accepted, true),
            terms_accepted_at = COALESCE(terms_accepted_at, created_at)
        WHERE setup_completed IS NULL OR setup_completed = false;
      END;
      $$ LANGUAGE plpgsql;
    `;

    // Try using the service role key to create the function
    console.log('1️⃣ Creating database function using service role key...');
    const createFunctionResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        apikey: SERVICE_KEY,
      },
      body: JSON.stringify({ query: functionSQL }),
    });

    if (createFunctionResponse.ok) {
      console.log('✅ Function created successfully');

      // Now execute the function
      console.log('2️⃣ Executing fix_campaigns_table function...');
      const executeFunctionResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/rpc/fix_campaigns_table`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json',
            apikey: SERVICE_KEY,
          },
          body: '{}',
        }
      );

      if (executeFunctionResponse.ok) {
        console.log('✅ Function executed successfully!');
        console.log('🎉 Campaigns table has been fixed!');
        return true;
      } else {
        const error = await executeFunctionResponse.text();
        console.log('❌ Function execution failed:', error);
      }
    } else {
      const error = await createFunctionResponse.text();
      console.log('❌ Function creation failed:', error);
    }

    // Alternative: Try to check if columns exist by querying the table
    console.log('\n3️⃣ Verifying table structure...');
    const tableCheckResponse = await fetch(`${SUPABASE_URL}/rest/v1/campaigns?select=*&limit=1`, {
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY,
      },
    });

    if (tableCheckResponse.ok) {
      const data = await tableCheckResponse.json();
      console.log('Current table columns:', Object.keys(data[0] || {}));

      // Check if our columns exist
      const requiredColumns = ['setup_completed', 'setup_step', 'user_id', 'user_full_name'];
      const existingColumns = Object.keys(data[0] || {});
      const missingColumns = requiredColumns.filter((col) => !existingColumns.includes(col));

      if (missingColumns.length > 0) {
        console.log('❌ Still missing columns:', missingColumns);
        console.log('\n📋 Manual fix required. Please run this SQL in Supabase dashboard:');
        console.log(fs.readFileSync('FIX_CAMPAIGNS_TABLE.sql', 'utf8'));
      } else {
        console.log('✅ All required columns exist!');
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\n📋 Please run this SQL manually in Supabase dashboard:');
    console.log(fs.readFileSync('FIX_CAMPAIGNS_TABLE.sql', 'utf8'));
  }
}

executeSQLViaAPI();
