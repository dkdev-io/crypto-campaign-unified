// Direct SQL Entry - Use existing logged-in Supabase window
import puppeteer from 'puppeteer';

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

async function connectToExistingBrowser() {
  console.log('🔗 Connecting to existing browser...');
  
  try {
    // Connect to existing Chrome instance
    const browser = await puppeteer.connect({
      browserURL: 'http://localhost:9222', // Default Chrome DevTools port
      defaultViewport: null
    });

    const pages = await browser.pages();
    console.log(`📄 Found ${pages.length} open tabs`);
    
    // Look for Supabase tab
    let supabasePage = null;
    for (const page of pages) {
      const url = page.url();
      if (url.includes('supabase.com') && url.includes('sql')) {
        supabasePage = page;
        console.log('✅ Found Supabase SQL editor tab');
        break;
      }
    }

    if (!supabasePage) {
      // Navigate to the provided URL
      const page = pages[0] || await browser.newPage();
      console.log('📝 Navigating to Supabase SQL editor...');
      await page.goto('https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo/sql/e2827ec9-0ebc-492f-8083-a39d0fb23fb8');
      supabasePage = page;
    }

    await supabasePage.bringToFront();
    console.log('🎯 Focusing on Supabase tab');

    // Wait a moment for page to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Clear and enter SQL
    console.log('📝 Entering SQL...');
    
    // Try to find and click in editor area
    try {
      // Look for Monaco editor or any code editor
      const editorSelectors = [
        '.monaco-editor .view-lines',
        '.monaco-editor',
        '.CodeMirror',
        'textarea',
        '[role="textbox"]',
        '.sql-editor',
        '[contenteditable="true"]'
      ];

      let success = false;
      for (const selector of editorSelectors) {
        try {
          await supabasePage.waitForSelector(selector, { timeout: 2000 });
          
          // Click in editor
          await supabasePage.click(selector);
          
          // Select all and replace
          await supabasePage.keyboard.down('Meta'); // Cmd on Mac
          await supabasePage.keyboard.press('a');
          await supabasePage.keyboard.up('Meta');
          
          // Type the SQL
          await supabasePage.keyboard.type(cleanSQL, { delay: 5 });
          
          console.log(`✅ SQL entered using selector: ${selector}`);
          success = true;
          break;
          
        } catch (err) {
          console.log(`❌ Selector ${selector} failed: ${err.message}`);
          continue;
        }
      }

      if (!success) {
        console.log('❌ Could not find editor - please paste manually');
        console.log('📋 SQL to paste:');
        console.log(cleanSQL);
        return;
      }

    } catch (err) {
      console.log('❌ Error entering SQL:', err.message);
      return;
    }

    // Look for and click Run button
    console.log('🏃 Looking for Run button...');
    
    const runSelectors = [
      'button[data-testid="run-sql"]',
      'button:has-text("Run")',
      '.run-button',
      '[data-test="run"]',
      'button[title="Run query"]'
    ];

    let runSuccess = false;
    for (const selector of runSelectors) {
      try {
        await supabasePage.waitForSelector(selector, { timeout: 1000 });
        await supabasePage.click(selector);
        console.log(`✅ Clicked Run button: ${selector}`);
        runSuccess = true;
        break;
      } catch (err) {
        continue;
      }
    }

    // Fallback to keyboard shortcut
    if (!runSuccess) {
      console.log('🎹 Using keyboard shortcut (Cmd+Enter)...');
      await supabasePage.keyboard.down('Meta');
      await supabasePage.keyboard.press('Enter');
      await supabasePage.keyboard.up('Meta');
    }

    console.log('⏳ Waiting for execution to complete...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🎉 SQL execution initiated! Check the Supabase interface for results.');
    
    // Don't close the browser - let user see results
    console.log('✅ Automation complete - browser stays open for you to verify results');

  } catch (error) {
    console.error('❌ Failed to connect to existing browser:', error.message);
    console.log('💡 Make sure Chrome is running with --remote-debugging-port=9222');
    console.log('   Or paste this SQL manually in your open Supabase tab:');
    console.log('📋 SQL:');
    console.log(cleanSQL);
  }
}

connectToExistingBrowser();