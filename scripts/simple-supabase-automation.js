// Simple Supabase Automation - Fixed Version
import puppeteer from 'puppeteer';

const cleanSQL = `DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='campaigns' AND column_name='status') THEN
    ALTER TABLE campaigns ADD COLUMN status TEXT DEFAULT 'active';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name='campaigns_status_check') THEN
    ALTER TABLE campaigns ADD CONSTRAINT campaigns_status_check 
      CHECK (status IN ('active', 'inactive', 'paused', 'completed', 'deleted'));
  END IF;
  
  UPDATE campaigns SET status = 'active' WHERE status IS NULL;
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
DROP POLICY IF EXISTS "contributions_public_access" ON contributions;
DROP POLICY IF EXISTS "kyc_data_public_access" ON kyc_data;

CREATE POLICY "campaigns_public_access" ON campaigns FOR ALL USING (true);
CREATE POLICY "contributions_public_access" ON contributions FOR ALL USING (true);
CREATE POLICY "kyc_data_public_access" ON kyc_data FOR ALL USING (true);

CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'total_campaigns', (SELECT COUNT(*) FROM campaigns),
    'active_campaigns', (SELECT COUNT(*) FROM campaigns WHERE status = 'active'),
    'total_contributions', (SELECT COUNT(*) FROM contributions),
    'total_raised', (SELECT COALESCE(SUM(amount), 0) FROM contributions),
    'last_updated', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

INSERT INTO kyc_data (user_id, full_name, email, verification_status)
VALUES 
  ('sample-user-1', 'John Doe', 'john.doe@example.com', 'approved'),
  ('sample-user-2', 'Jane Smith', 'jane.smith@example.com', 'approved')
ON CONFLICT (user_id) DO NOTHING;

SELECT 'Database fixes applied successfully!' as result;`;

async function applyFixes() {
  console.log('🚀 Starting Supabase automation...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 },
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  
  try {
    console.log('📝 Navigating to Supabase SQL Editor...');
    await page.goto('https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo/sql/e2827ec9-0ebc-492f-8083-a39d0fb23fb8');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    console.log('⏳ Waiting for editor...');
    await page.waitForTimeout(3000);
    
    // Take initial screenshot
    await page.screenshot({ path: 'supabase-initial.png' });
    console.log('📸 Initial screenshot saved');
    
    // Find and clear editor
    console.log('🔍 Looking for editor...');
    
    // Try multiple strategies
    const strategies = [
      // Strategy 1: Monaco editor
      async () => {
        const editor = await page.$('.monaco-editor');
        if (editor) {
          console.log('📝 Found Monaco editor');
          await page.click('.monaco-editor');
          await page.keyboard.press('Control+a');
          await page.keyboard.press('Delete');
          await page.keyboard.type(cleanSQL);
          return true;
        }
        return false;
      },
      
      // Strategy 2: Textarea
      async () => {
        const textarea = await page.$('textarea');
        if (textarea) {
          console.log('📝 Found textarea');
          await textarea.click();
          await textarea.selectText();
          await textarea.type(cleanSQL);
          return true;
        }
        return false;
      },
      
      // Strategy 3: Any input/contenteditable
      async () => {
        const editable = await page.$('[contenteditable="true"]');
        if (editable) {
          console.log('📝 Found contenteditable');
          await editable.click();
          await page.keyboard.press('Control+a');
          await editable.type(cleanSQL);
          return true;
        }
        return false;
      }
    ];
    
    let success = false;
    for (const strategy of strategies) {
      try {
        success = await strategy();
        if (success) break;
      } catch (err) {
        console.log(`Strategy failed: ${err.message}`);
      }
    }
    
    if (!success) {
      console.log('❌ Could not find editor, manual intervention needed');
      await page.screenshot({ path: 'supabase-no-editor.png' });
      
      // Keep browser open for manual entry
      console.log('🖱️  Browser will stay open - please paste SQL manually and click Run');
      console.log('📋 SQL to paste:');
      console.log(cleanSQL);
      
      // Wait 60 seconds for manual intervention
      await page.waitForTimeout(60000);
      return;
    }
    
    console.log('✅ SQL entered successfully');
    
    // Look for Run button
    console.log('🏃 Looking for Run button...');
    
    const runSelectors = [
      'button[data-testid="run-sql"]',
      '.run-button',
      'button:has-text("Run")',
      '[data-test="run"]'
    ];
    
    let runClicked = false;
    for (const selector of runSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        await page.click(selector);
        console.log(`✅ Clicked Run button: ${selector}`);
        runClicked = true;
        break;
      } catch (err) {
        // Continue to next selector
      }
    }
    
    // Try keyboard shortcut as fallback
    if (!runClicked) {
      console.log('🎹 Using keyboard shortcut...');
      await page.keyboard.press('Control+Enter');
      runClicked = true;
    }
    
    if (runClicked) {
      console.log('⏳ Waiting for execution...');
      await page.waitForTimeout(5000);
      
      // Take final screenshot
      await page.screenshot({ path: 'supabase-result.png' });
      console.log('📸 Result screenshot saved');
      
      console.log('🎉 SQL execution completed!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'supabase-error.png' });
  } finally {
    // Keep open for 15 seconds to see results
    console.log('⏳ Keeping browser open for 15 seconds...');
    await page.waitForTimeout(15000);
    await browser.close();
  }
}

applyFixes().catch(console.error);