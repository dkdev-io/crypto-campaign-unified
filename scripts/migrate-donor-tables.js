#!/usr/bin/env node

const fetch = require('node-fetch');
require('dotenv').config({ path: './.env' });

const SUPABASE_PROJECT_URL = 'https://owjvgdzmmlrdtpjdxgka.supabase.co';
const SERVICE_ROLE_KEY = process.env.MIGRATION_SUPABASE_SERVICE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Missing MIGRATION_SUPABASE_SERVICE_KEY');
  process.exit(1);
}

async function executeSql(sql) {
  // Using Supabase's SQL endpoint with service role key
  const response = await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/rpc`, {
    method: 'POST', 
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      query: sql
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL execution failed: ${error}`);
  }

  return response.json();
}

async function runMigration() {
  console.log('🚀 Creating donor tables...\n');
  
  // Split migration into smaller chunks
  const migrations = [
    // 1. Drop existing tables
    `DROP TABLE IF EXISTS donor_tax_receipts CASCADE;`,
    `DROP TABLE IF EXISTS donor_saved_campaigns CASCADE;`,
    `DROP TABLE IF EXISTS donations CASCADE;`,
    `DROP TABLE IF EXISTS donor_profiles CASCADE;`,
    `DROP TABLE IF EXISTS donors CASCADE;`,
    `DROP TYPE IF EXISTS donor_type CASCADE;`,
    `DROP TYPE IF EXISTS donation_status CASCADE;`,
    
    // 2. Create types
    `CREATE TYPE donor_type AS ENUM ('individual', 'organization');`,
    `CREATE TYPE donation_status AS ENUM ('pending', 'completed', 'failed', 'refunded');`,
    
    // 3. Create donors table
    `CREATE TABLE donors (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT,
      address JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      email_verified BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      donor_type donor_type NOT NULL DEFAULT 'individual'
    );`,
    
    // 4. Create donor_profiles table
    `CREATE TABLE donor_profiles (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      donor_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
      bio TEXT,
      interests TEXT[],
      donation_preferences JSONB DEFAULT '{}',
      tax_id TEXT,
      preferred_payment_methods TEXT[],
      notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": false}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(donor_id)
    );`,
    
    // 5. Create campaigns table if not exists
    `CREATE TABLE IF NOT EXISTS campaigns (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,
    
    // 6. Create donations table
    `CREATE TABLE IF NOT EXISTS donations (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      donor_id UUID REFERENCES donors(id) ON DELETE SET NULL,
      campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
      amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
      currency TEXT NOT NULL DEFAULT 'USD',
      crypto_currency TEXT,
      transaction_hash TEXT,
      status donation_status NOT NULL DEFAULT 'pending',
      donation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      is_anonymous BOOLEAN DEFAULT FALSE,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,
    
    // 7. Create donor_saved_campaigns table
    `CREATE TABLE donor_saved_campaigns (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      donor_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
      campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(donor_id, campaign_id)
    );`,
    
    // 8. Create donor_tax_receipts table
    `CREATE TABLE donor_tax_receipts (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      donor_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
      donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
      receipt_number TEXT UNIQUE NOT NULL,
      issue_date DATE NOT NULL,
      tax_year INTEGER NOT NULL,
      receipt_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(donation_id)
    );`,
    
    // 9. Create indexes
    `CREATE INDEX idx_donors_email ON donors(email);`,
    `CREATE INDEX idx_donors_active ON donors(is_active);`,
    `CREATE INDEX idx_donations_donor ON donations(donor_id);`,
    `CREATE INDEX idx_donations_campaign ON donations(campaign_id);`,
    
    // 10. Enable RLS
    `ALTER TABLE donors ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE donor_profiles ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE donations ENABLE ROW LEVEL SECURITY;`,
    
    // 11. Create policies
    `CREATE POLICY "Enable insert for registration" ON donors FOR INSERT WITH CHECK (true);`,
    `CREATE POLICY "Donors can view own record" ON donors FOR SELECT USING (auth.uid() = id);`,
    `CREATE POLICY "Donors can insert own profile" ON donor_profiles FOR INSERT WITH CHECK (true);`
  ];

  let successCount = 0;
  let failCount = 0;

  for (const sql of migrations) {
    try {
      const shortSql = sql.substring(0, 50).replace(/\n/g, ' ');
      process.stdout.write(`Running: ${shortSql}... `);
      await executeSql(sql);
      console.log('✅');
      successCount++;
    } catch (error) {
      console.log('❌');
      console.error(`  Error: ${error.message}`);
      failCount++;
    }
  }

  console.log(`\n📊 Results: ${successCount} successful, ${failCount} failed`);
  
  if (failCount > 0) {
    console.log('\n⚠️  Some migrations failed. This might be because:');
    console.log('1. Tables already exist (which is fine)');
    console.log('2. Direct SQL execution is not enabled');
    console.log('\n📋 To complete setup manually:');
    console.log('1. Go to: https://app.supabase.com/project/owjvgdzmmlrdtpjdxgka/sql/new');
    console.log('2. Run the SQL from: scripts/apply-donor-migrations.sql');
  }
}

runMigration().catch(console.error);