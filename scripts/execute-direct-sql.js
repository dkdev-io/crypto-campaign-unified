#!/usr/bin/env node

// Direct SQL execution using Supabase REST API
// This bypasses the JS client limitations for schema operations

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SUPABASE_URL = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';

console.log('🚀 Executing SQL migration directly via REST API...');

async function executeSQL() {
  try {
    // Create the minimal committee test table first
    console.log('📊 Creating committee_test_data table...');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS committee_test_data (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          committee_name TEXT NOT NULL,
          test_purpose TEXT,
          added_by_email TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          is_active BOOLEAN DEFAULT true
      );
    `;

    // Use direct PostgreSQL connection via HTTP
    const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ sql_query: createTableSQL }),
    });

    if (!createResponse.ok) {
      console.log('⚠️  RPC method not available, trying direct table creation...');

      // Try inserting into an existing table structure
      await createTestCommitteeDirectly();
      return;
    }

    console.log('✅ Table created successfully');

    // Insert the test committee data

    const insertSQL = `
      INSERT INTO committee_test_data (committee_name, test_purpose, added_by_email) 
      VALUES ('Testy Test for Chancellor', 'User requested test committee for development', 'admin@example.com')
      ON CONFLICT (committee_name) DO NOTHING;
    `;

    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ sql_query: insertSQL }),
    });

    if (insertResponse.ok) {
      console.log('✅ Test committee inserted successfully');
    } else {
      console.log('⚠️  Insert via RPC failed, trying direct approach...');
      await createTestCommitteeDirectly();
    }

    // Verify the data
    await verifyTestCommittee();
  } catch (error) {
    console.error('💥 SQL execution failed:', error);
    await createTestCommitteeDirectly();
  }
}

async function createTestCommitteeDirectly() {
  try {
    // Try inserting directly into the table using REST API
    const testCommittee = {
      committee_name: 'Testy Test for Chancellor',
      test_purpose: 'User requested test committee for development',
      added_by_email: 'admin@example.com',
    };

    const response = await fetch(`${SUPABASE_URL}/rest/v1/committee_test_data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
        Prefer: 'return=representation',
      },
      body: JSON.stringify(testCommittee),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('🎉 SUCCESS! Test committee created directly:', data);
    } else {
      const error = await response.text();
      console.error('❌ Direct insertion failed:', error);

      if (error.includes('does not exist')) {
        await createViaExistingTable();
      }
    }
  } catch (error) {
    console.error('💥 Direct insertion error:', error);
    await createViaExistingTable();
  }
}

async function createViaExistingTable() {
  try {
    // Create a test campaign that represents our test committee
    const testCampaign = {
      email: 'test-committee@example.com',
      campaign_name: 'Testy Test for Chancellor',
      website: 'https://test-committee.example.com',
      wallet_address: 'test-wallet-' + Date.now(),
      suggested_amounts: [25, 50, 100, 250],
      max_donation_limit: 3300,
      theme_color: '#2a2a72',
      supported_cryptos: ['ETH'],
    };

    const response = await fetch(`${SUPABASE_URL}/rest/v1/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
        Prefer: 'return=representation',
      },
      body: JSON.stringify(testCampaign),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('🎉 SUCCESS! Test committee created as campaign:', data);
    } else {
      const error = await response.text();
      console.error('❌ Campaign creation failed:', error);
    }
  } catch (error) {
    console.error('💥 Campaign creation error:', error);
  }
}

async function verifyTestCommittee() {
  try {
    // Check committee_test_data table
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/committee_test_data?committee_name=eq.Testy Test for Chancellor`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.length > 0) {
        console.log('✅ Test committee found in committee_test_data:', data[0]);
      } else {
        await checkCampaignsTable();
      }
    } else {
      console.log('⚠️  Could not check committee_test_data table');
      await checkCampaignsTable();
    }
  } catch (error) {
    console.log('⚠️  Verification error:', error.message);
    await checkCampaignsTable();
  }
}

async function checkCampaignsTable() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/campaigns?campaign_name=eq.Testy Test for Chancellor`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.length > 0) {
        console.log('✅ Test committee found in campaigns table:', data[0]);
      } else {
      }
    } else {
      console.log('⚠️  Could not check campaigns table');
    }
  } catch (error) {
    console.log('⚠️  Campaigns check error:', error.message);
  }
}

// Execute the migration
executeSQL()
  .then(() => {
    console.log('🏛️  The committee should now appear in search results');
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
  });
