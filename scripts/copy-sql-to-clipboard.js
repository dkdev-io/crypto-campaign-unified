// Copy clean SQL to clipboard for pasting into Supabase
import { spawn } from 'child_process';

const cleanSQL = `DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='campaigns' AND column_name='status') THEN
    ALTER TABLE campaigns ADD COLUMN status TEXT DEFAULT 'active';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  donor_email TEXT,
  donor_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kyc_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  verification_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "campaigns_public_access" ON campaigns;
CREATE POLICY "campaigns_public_access" ON campaigns FOR ALL USING (true);

DROP POLICY IF EXISTS "contributions_public_access" ON contributions;
CREATE POLICY "contributions_public_access" ON contributions FOR ALL USING (true);

DROP POLICY IF EXISTS "kyc_data_public_access" ON kyc_data;
CREATE POLICY "kyc_data_public_access" ON kyc_data FOR ALL USING (true);

CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'total_campaigns', (SELECT COUNT(*) FROM campaigns),
    'active_campaigns', (SELECT COUNT(*) FROM campaigns WHERE status = 'active'),
    'total_contributions', (SELECT COUNT(*) FROM contributions),
    'total_raised', (SELECT COALESCE(SUM(amount), 0) FROM contributions)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Database fixes applied successfully!' as result;`;

function copyToClipboard(text) {
  return new Promise((resolve, reject) => {
    const proc = spawn('pbcopy');
    proc.stdin.write(text);
    proc.stdin.end();
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`pbcopy exited with code ${code}`));
      }
    });
  });
}

async function main() {
  console.log('📋 Copying clean SQL to clipboard...');
  
  try {
    await copyToClipboard(cleanSQL);
    console.log('✅ SQL copied to clipboard!');
    console.log('');
    console.log('🎯 NEXT STEPS:');
    console.log('1. Go to your open Supabase SQL Editor tab');
    console.log('2. Select all text (Cmd+A) and delete it');
    console.log('3. Paste the SQL (Cmd+V)');
    console.log('4. Click the "Run" button');
    console.log('');
    console.log('📊 Expected result: "Database fixes applied successfully!"');
    console.log('');
    console.log('🧪 After running, verify with: node tests/integration/specific-fix-test.js');
    
  } catch (error) {
    console.error('❌ Failed to copy to clipboard:', error.message);
    console.log('');
    console.log('📋 MANUAL COPY - Copy this SQL and paste into Supabase:');
    console.log('=' .repeat(60));
    console.log(cleanSQL);
    console.log('=' .repeat(60));
  }
}

main();