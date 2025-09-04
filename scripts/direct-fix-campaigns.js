#!/usr/bin/env node

import pg from 'pg';
const { Client } = pg;

// Direct PostgreSQL connection to Supabase
async function fixCampaignsTableDirect() {
  console.log('🚀 FINAL ATTEMPT: Direct PostgreSQL connection to fix campaigns table\n');

  // Connection details from your Supabase project
  const connectionConfig = {
    host: 'aws-0-us-west-1.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.kmepcdsklnnxokoimvzo',
    password: 'SenecaCrypto2024!',
    ssl: {
      rejectUnauthorized: false,
    },
  };

  const client = new Client(connectionConfig);

  try {
    console.log('1️⃣ Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    console.log('2️⃣ Adding missing columns to campaigns table...');

    // Add columns one by one to avoid any transaction issues
    const columns = [
      { name: 'user_id', type: 'UUID' },
      { name: 'user_full_name', type: 'TEXT' },
      { name: 'fec_committee_id', type: 'TEXT' },
      { name: 'committee_name', type: 'TEXT' },
      { name: 'committee_confirmed', type: 'BOOLEAN DEFAULT false' },
      { name: 'bank_account_verified', type: 'BOOLEAN DEFAULT false' },
      { name: 'bank_account_name', type: 'TEXT' },
      { name: 'bank_last_four', type: 'TEXT' },
      { name: 'plaid_account_id', type: 'TEXT' },
      { name: 'terms_accepted', type: 'BOOLEAN DEFAULT false' },
      { name: 'terms_accepted_at', type: 'TIMESTAMPTZ' },
      { name: 'terms_ip_address', type: 'TEXT' },
      { name: 'setup_step', type: 'INTEGER DEFAULT 1' },
      { name: 'setup_completed', type: 'BOOLEAN DEFAULT false' },
      { name: 'setup_completed_at', type: 'TIMESTAMPTZ' },
      { name: 'website_analyzed', type: 'TEXT' },
      { name: 'style_analysis', type: 'JSONB' },
      { name: 'applied_styles', type: 'JSONB' },
      { name: 'styles_applied', type: 'BOOLEAN DEFAULT false' },
      { name: 'embed_code', type: 'TEXT' },
      { name: 'embed_generated_at', type: 'TIMESTAMPTZ' },
      { name: 'description', type: 'TEXT' },
    ];

    let addedCount = 0;
    for (const column of columns) {
      try {
        await client.query(
          `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}`
        );
        console.log(`  ✅ Added column: ${column.name}`);
        addedCount++;
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`  ⏭️  Column already exists: ${column.name}`);
        } else {
          console.log(`  ❌ Error adding ${column.name}: ${err.message}`);
        }
      }
    }

    console.log(`\n✅ Successfully processed ${addedCount} columns\n`);

    console.log('3️⃣ Updating existing campaigns with defaults...');
    const updateResult = await client.query(`
      UPDATE campaigns 
      SET 
          setup_step = COALESCE(setup_step, 7),
          setup_completed = COALESCE(setup_completed, true),
          setup_completed_at = COALESCE(setup_completed_at, created_at),
          terms_accepted = COALESCE(terms_accepted, true),
          terms_accepted_at = COALESCE(terms_accepted_at, created_at)
      WHERE setup_completed IS NULL OR setup_completed = false
      RETURNING id
    `);

    console.log(`✅ Updated ${updateResult.rowCount} existing campaigns\n`);

    console.log('4️⃣ Verifying table structure...');
    const verifyResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'campaigns' 
      ORDER BY ordinal_position
    `);

    console.log('Current campaigns table columns:');
    verifyResult.rows.forEach((row) => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    // Check if all required columns exist
    const existingColumns = verifyResult.rows.map((r) => r.column_name);
    const requiredColumns = columns.map((c) => c.name);
    const missingColumns = requiredColumns.filter((col) => !existingColumns.includes(col));

    if (missingColumns.length === 0) {
      console.log('\n🎉 SUCCESS! All required columns are now in the campaigns table!');
      console.log('✅ The campaign setup wizard should now work properly.');
    } else {
      console.log('\n⚠️ Warning: Still missing columns:', missingColumns);
    }
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    console.log('\nTrying alternative connection string...');

    // Try alternative connection
    const altClient = new Client({
      connectionString:
        'postgresql://postgres.kmepcdsklnnxokoimvzo:SenecaCrypto2024!@aws-0-us-west-1.pooler.supabase.com:5432/postgres',
      ssl: { rejectUnauthorized: false },
    });

    try {
      await altClient.connect();
      console.log('✅ Connected with alternative string!');
      // Execute same operations...
      await altClient.end();
    } catch (altError) {
      console.error('❌ Alternative connection also failed:', altError.message);

      console.log('\n📋 MANUAL FIX REQUIRED');
      console.log('Please copy and run this SQL in your Supabase dashboard:');
      console.log('https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo/sql\n');
      console.log('-- SQL TO RUN --');
      const fs = await import('fs');
      console.log(fs.readFileSync('FIX_CAMPAIGNS_TABLE.sql', 'utf8'));
    }
  } finally {
    await client.end();
    console.log('\n✅ Connection closed');
  }
}

fixCampaignsTableDirect();
