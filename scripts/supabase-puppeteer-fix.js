// Supabase SQL Editor Automation with Puppeteer
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Clean SQL without comments that might cause parsing issues
const cleanSQL = `
DO $$ 
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

DO $$
BEGIN
  ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
  ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE kyc_data ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN others THEN
    NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "campaigns_public_access" ON campaigns;
  DROP POLICY IF EXISTS "contributions_public_access" ON contributions;
  DROP POLICY IF EXISTS "kyc_data_public_access" ON kyc_data;
  
  CREATE POLICY "campaigns_public_access" ON campaigns FOR ALL USING (true);
  CREATE POLICY "contributions_public_access" ON contributions FOR ALL USING (true);
  CREATE POLICY "kyc_data_public_access" ON kyc_data FOR ALL USING (true);
END $$;

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

SELECT 'Database fixes applied successfully!' as result;
`.trim();

async function applySupabaseFixes() {
  console.log('🚀 Launching Puppeteer to apply Supabase database fixes...');
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser for debugging
    defaultViewport: { width: 1200, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  try {
    
    // Navigate to the exact SQL editor URL provided
    await page.goto('https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo/sql/e2827ec9-0ebc-492f-8083-a39d0fb23fb8', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    
    // Wait for the SQL editor to be present
    await page.waitForSelector('.monaco-editor, .sql-editor, textarea, [role="textbox"]', { 
      timeout: 15000 
    });


    // Multiple strategies to find and interact with the SQL editor
    let editorFound = false;

    // Strategy 1: Monaco Editor (most common)
    try {
      await page.waitForSelector('.monaco-editor', { timeout: 5000 });
      
      // Click in the editor area
      await page.click('.monaco-editor .view-lines');
      
      // Select all and delete
      await page.keyboard.down('Meta'); // Cmd on Mac
      await page.keyboard.press('a');
      await page.keyboard.up('Meta');
      await page.keyboard.press('Backspace');
      
      // Type the SQL
      await page.keyboard.type(cleanSQL, { delay: 10 });
      editorFound = true;
      
    } catch (err) {
      console.log('⚠️  Monaco editor not found, trying other methods...');
    }

    // Strategy 2: Direct textarea
    if (!editorFound) {
      try {
        const textarea = await page.$('textarea');
        if (textarea) {
          await textarea.click();
          await page.keyboard.down('Meta');
          await page.keyboard.press('a');
          await page.keyboard.up('Meta');
          await textarea.type(cleanSQL);
          editorFound = true;
        }
      } catch (err) {
        console.log('⚠️  Textarea method failed...');
      }
    }

    // Strategy 3: Any contenteditable or role=textbox
    if (!editorFound) {
      try {
        const editableElements = await page.$$('[contenteditable="true"], [role="textbox"]');
        if (editableElements.length > 0) {
          await editableElements[0].click();
          await page.keyboard.down('Meta');
          await page.keyboard.press('a');  
          await page.keyboard.up('Meta');
          await page.keyboard.type(cleanSQL, { delay: 10 });
          editorFound = true;
        }
      } catch (err) {
        console.log('⚠️  Editable element method failed...');
      }
    }

    if (!editorFound) {
      console.log('❌ Could not find SQL editor input area');
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'supabase-editor-debug.png', fullPage: true });
      
      // Print page content selectors for debugging
      const selectors = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const selectorList = [];
        elements.forEach(el => {
          if (el.className && (
            el.className.includes('editor') || 
            el.className.includes('monaco') || 
            el.className.includes('sql') ||
            el.tagName === 'TEXTAREA'
          )) {
            selectorList.push(`${el.tagName}.${el.className}`);
          }
        });
        return selectorList.slice(0, 10); // First 10 matches
      });
      
      throw new Error('SQL editor not found');
    }

    console.log('✅ SQL entered successfully!');
    
    // Look for and click the Run button
    
    const runButtonSelectors = [
      'button[data-testid="run-sql"]',
      'button:contains("Run")',
      '.run-button',
      '[data-test="run-sql"]',
      'button[title="Run"]',
      'button[aria-label="Run"]'
    ];

    let runButtonFound = false;
    for (const selector of runButtonSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        await page.click(selector);
        runButtonFound = true;
        break;
      } catch (err) {
        // Try next selector
      }
    }

    // Alternative: Look for any button containing "Run" text
    if (!runButtonFound) {
      try {
        const runButton = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(btn => 
            btn.textContent.toLowerCase().includes('run') ||
            btn.textContent.toLowerCase().includes('execute')
          );
        });
        
        if (runButton) {
          await runButton.click();
          console.log('✅ Clicked Run button found by text content');
          runButtonFound = true;
        }
      } catch (err) {
        console.log('⚠️  Text-based run button search failed');
      }
    }

    // Alternative: Use keyboard shortcut
    if (!runButtonFound) {
      await page.keyboard.down('Meta');
      await page.keyboard.press('Enter');
      await page.keyboard.up('Meta');
      runButtonFound = true;
    }

    if (runButtonFound) {
      
      // Wait a bit for execution
      await page.waitForTimeout(5000);
      
      // Look for success/error indicators
      try {
        const resultElements = await page.$$('.result, .success, .error, .output');
        if (resultElements.length > 0) {
          const results = await page.evaluate(() => {
            const resultEls = document.querySelectorAll('.result, .success, .error, .output');
            return Array.from(resultEls).map(el => el.textContent).join('\n');
          });
          console.log('📊 Execution results:', results);
        }
      } catch (err) {
        console.log('⚠️  Could not read execution results');
      }
      
      
    } else {
      console.log('❌ Could not find or click Run button');
      throw new Error('Run button not found');
    }

    // Take final screenshot
    await page.screenshot({ path: 'supabase-final-result.png', fullPage: true });
    console.log('📸 Final screenshot saved as supabase-final-result.png');

  } catch (error) {
    console.error('❌ Error during automation:', error.message);
    
    // Take error screenshot
    await page.screenshot({ path: 'supabase-error.png', fullPage: true });
    console.log('📸 Error screenshot saved as supabase-error.png');
    
    throw error;
    
  } finally {
    // Keep browser open for 10 seconds to see results
    console.log('⏳ Keeping browser open for 10 seconds to see results...');
    await page.waitForTimeout(10000);
    
    await browser.close();
  }
}

// Run the automation
applySupabaseFixes()
  .then(() => {
    console.log('✅ Automation completed successfully!');
  })
  .catch((error) => {
    console.error('❌ Automation failed:', error);
    process.exit(1);
  });