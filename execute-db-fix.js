import { Client } from 'pg';
import fs from 'fs';

const client = new Client({
  connectionString:
    'postgres://postgres.kmepcdsklnnxokoimvzo:SenecaCrypto2024!@aws-0-us-west-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false },
});

async function executeFix() {
  try {
    console.log('🔌 Connecting to Supabase...');
    await client.connect();
    console.log('✅ Connected!');

    console.log('🔧 Adding missing columns to campaigns table...');

    const sql = fs.readFileSync('fix-db-direct.sql', 'utf8');
    const result = await client.query(sql);

    console.log('✅ CAMPAIGNS TABLE FIXED!');
    console.log('Result:', result);

    // Verify columns were added
    const { rows } = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'campaigns' 
      AND table_schema = 'public'
      ORDER BY column_name
    `);

    console.log('\n📋 Campaigns table now has these columns:');
    rows.forEach((row) => console.log('  ✓ ' + row.column_name));
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

executeFix();
