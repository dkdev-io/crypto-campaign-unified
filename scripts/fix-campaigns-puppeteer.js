import puppeteer from 'puppeteer';
import fs from 'fs';

async function fixCampaignsTableDirectly() {
  console.log('🚀 Fixing campaigns table via Puppeteer automation...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to Supabase SQL editor
    console.log('1️⃣ Opening Supabase SQL Editor...');
    await page.goto('https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo/sql', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for page to load
    await new Promise(r => setTimeout(r, 3000));
    
    // Check if we need to login
    const needsLogin = await page.$('input[type="email"]') !== null;
    
    if (needsLogin) {
      console.log('📧 Login required - Please login manually in the browser window');
      console.log('⏳ Waiting for you to complete login...');
      console.log('   (This will timeout in 2 minutes)');
      
      // Wait for navigation away from login page
      try {
        await page.waitForFunction(
          () => !window.location.href.includes('sign-in') && !window.location.href.includes('login'),
          { timeout: 120000 }
        );
        
        console.log('✅ Login detected, continuing...');
        
        // Navigate to SQL editor again
        await page.goto('https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo/sql', {
          waitUntil: 'networkidle2'
        });
      } catch (e) {
        console.log('⏱️ Login timeout - proceeding anyway in case already logged in');
      }
    } else {
      console.log('✅ Already logged in or no login required');
    }
    
    // Wait for SQL editor to load
    console.log('2️⃣ Waiting for SQL editor to load...');
    await page.waitForSelector('[data-state="closed"]', { timeout: 30000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));
    
    // Look for CodeMirror or Monaco editor
    const hasCodeMirror = await page.$('.CodeMirror') !== null;
    const hasMonaco = await page.$('.monaco-editor') !== null;
    const hasTextarea = await page.$('textarea') !== null;
    const hasAceEditor = await page.$('.ace_editor') !== null;
    
    console.log('3️⃣ Found editor:', { hasCodeMirror, hasMonaco, hasTextarea, hasAceEditor });
    
    // Read the SQL
    const sql = fs.readFileSync('FIX_CAMPAIGNS_TABLE.sql', 'utf8');
    
    // Try different methods to input SQL
    if (hasCodeMirror) {
      console.log('4️⃣ Inserting SQL into CodeMirror editor...');
      await page.evaluate((sqlContent) => {
        const cm = document.querySelector('.CodeMirror').CodeMirror;
        cm.setValue(sqlContent);
      }, sql);
    } else if (hasMonaco) {
      console.log('4️⃣ Inserting SQL into Monaco editor...');
      await page.evaluate((sqlContent) => {
        const monaco = window.monaco;
        const model = monaco.editor.getModels()[0];
        model.setValue(sqlContent);
      }, sql);
    } else if (hasAceEditor) {
      console.log('4️⃣ Inserting SQL into Ace editor...');
      await page.evaluate((sqlContent) => {
        const ace = window.ace;
        const editor = ace.edit(document.querySelector('.ace_editor'));
        editor.setValue(sqlContent);
      }, sql);
    } else if (hasTextarea) {
      console.log('4️⃣ Inserting SQL into textarea...');
      const textarea = await page.$('textarea');
      await textarea.click({ clickCount: 3 }); // Select all
      await textarea.type(sql);
    } else {
      // Fallback: Try to click and paste
      console.log('4️⃣ Using keyboard to paste SQL...');
      await page.click('body');
      await page.keyboard.down('Meta');
      await page.keyboard.press('a');
      await page.keyboard.up('Meta');
      await page.keyboard.type(sql);
    }
    
    console.log('5️⃣ SQL inserted, looking for Run button...');
    await new Promise(r => setTimeout(r, 1000));
    
    // Find and click Run button - try multiple selectors
    const runButtonSelectors = [
      'button:has-text("Run")',
      'button:has-text("RUN")',
      'button:has-text("Execute")',
      '[data-testid="run-sql"]',
      'button[type="submit"]',
      'button.bg-brand',
      'button.bg-green-500',
      'button[aria-label*="run"]',
      'button[aria-label*="Run"]'
    ];
    
    let runClicked = false;
    
    // First try evaluating in page context to find run button
    try {
      runClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const runButton = buttons.find(btn => 
          btn.textContent.toLowerCase().includes('run') ||
          btn.textContent.toLowerCase().includes('execute')
        );
        if (runButton) {
          runButton.click();
          return true;
        }
        return false;
      });
      
      if (runClicked) {
        console.log('✅ Clicked Run button via page.evaluate');
      }
    } catch (e) {
      console.log('Could not click via evaluate, trying selectors...');
    }
    
    if (!runClicked) {
      for (const selector of runButtonSelectors) {
        try {
          const button = await page.$(selector);
          if (button) {
            await button.click();
            runClicked = true;
            console.log(`✅ Clicked Run button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Try next selector
        }
      }
    }
    
    if (!runClicked) {
      // Try XPath
      const [runButton] = await page.$x("//button[contains(., 'Run')]");
      if (runButton) {
        await runButton.click();
        runClicked = true;
        console.log('✅ Clicked Run button via XPath');
      }
    }
    
    if (!runClicked) {
      console.log('⚠️ Could not find Run button automatically');
      console.log('📋 Please click the Run button manually in the browser');
      await new Promise(r => setTimeout(r, 10000)); // Give user time to click
    } else {
      // Wait for execution
      console.log('6️⃣ Waiting for SQL execution...');
      await new Promise(r => setTimeout(r, 5000));
      
      // Check for success
      const hasSuccess = await page.$('.text-green-500, .bg-green-100, [data-state="success"]') !== null;
      const hasError = await page.$('.text-red-500, .bg-red-100, [data-state="error"]') !== null;
      
      if (hasSuccess) {
        console.log('🎉 SUCCESS! Campaigns table has been fixed!');
      } else if (hasError) {
        console.log('❌ Error occurred - check the browser for details');
      } else {
        console.log('✅ SQL executed - check browser for results');
      }
    }
    
    console.log('\n✅ COMPLETE - Your campaigns table should now have all required columns');
    console.log('📋 You can close the browser window when ready');
    
    // Keep browser open for user to see results
    await new Promise(r => setTimeout(r, 60000));
    
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\n📋 MANUAL STEPS:');
    console.log('1. The browser window is open to Supabase');
    console.log('2. Paste this SQL and click Run:');
    console.log(fs.readFileSync('FIX_CAMPAIGNS_TABLE.sql', 'utf8'));
  } finally {
    await browser.close();
  }
}

fixCampaignsTableDirectly();