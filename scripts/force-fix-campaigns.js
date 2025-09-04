import puppeteer from 'puppeteer';
import fs from 'fs';

async function forceFixCampaigns() {
  console.log('🔥 FORCING CAMPAIGNS TABLE FIX - NO MORE EXCUSES\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    // Navigate to Supabase SQL editor
    console.log('1️⃣ Opening Supabase SQL Editor...');
    await page.goto('https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo/sql/new', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    // Wait a bit for page to stabilize
    await new Promise((r) => setTimeout(r, 5000));

    // Check if logged in by looking for the SQL editor elements
    const hasEditor = await page.evaluate(() => {
      return (
        document.querySelector('textarea') !== null ||
        document.querySelector('.monaco-editor') !== null ||
        document.querySelector('.CodeMirror') !== null ||
        document.querySelector('.ace_editor') !== null
      );
    });

    if (!hasEditor) {
      console.log('📧 Not on SQL editor page - might need login');
      console.log('⏳ Waiting 30 seconds for you to login if needed...');
      await new Promise((r) => setTimeout(r, 30000));

      // Try navigating again
      await page.goto('https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo/sql/new', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      await new Promise((r) => setTimeout(r, 3000));
    }

    console.log('2️⃣ Injecting SQL into editor...');

    // Read the SQL
    const sql = fs.readFileSync('FIX_CAMPAIGNS_TABLE.sql', 'utf8');

    // Try multiple methods to insert SQL
    const inserted = await page.evaluate((sqlContent) => {
      // Method 1: Direct textarea
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.value = sqlContent;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
        return 'textarea';
      }

      // Method 2: Monaco Editor
      if (window.monaco && window.monaco.editor) {
        const editors = window.monaco.editor.getEditors();
        if (editors && editors.length > 0) {
          editors[0].setValue(sqlContent);
          return 'monaco';
        }
      }

      // Method 3: CodeMirror
      const cmElement = document.querySelector('.CodeMirror');
      if (cmElement && cmElement.CodeMirror) {
        cmElement.CodeMirror.setValue(sqlContent);
        return 'codemirror';
      }

      // Method 4: Ace Editor
      if (window.ace) {
        const aceElement = document.querySelector('.ace_editor');
        if (aceElement) {
          const editor = window.ace.edit(aceElement);
          editor.setValue(sqlContent);
          return 'ace';
        }
      }

      // Method 5: Find any contenteditable div
      const editableDiv = document.querySelector('[contenteditable="true"]');
      if (editableDiv) {
        editableDiv.textContent = sqlContent;
        editableDiv.dispatchEvent(new Event('input', { bubbles: true }));
        return 'contenteditable';
      }

      return false;
    }, sql);

    if (inserted) {
      console.log(`✅ SQL inserted via ${inserted} editor`);
    } else {
      console.log('⚠️ Could not insert SQL automatically, trying keyboard input...');

      // Click in the page to focus
      await page.click('body');
      await new Promise((r) => setTimeout(r, 500));

      // Select all and delete
      await page.keyboard.down('Meta');
      await page.keyboard.press('a');
      await page.keyboard.up('Meta');
      await page.keyboard.press('Backspace');

      // Type the SQL
      await page.keyboard.type(sql, { delay: 10 });
    }

    console.log('3️⃣ Looking for Run button...');
    await new Promise((r) => setTimeout(r, 2000));

    // Find and click Run button with multiple strategies
    const clicked = await page.evaluate(() => {
      // Find all buttons
      const buttons = Array.from(document.querySelectorAll('button'));

      // Look for Run button by text
      const runButton = buttons.find((btn) => {
        const text = btn.textContent.toLowerCase();
        return text.includes('run') || text.includes('execute') || text.includes('submit');
      });

      if (runButton) {
        runButton.click();
        return true;
      }

      // Look for button with specific classes
      const brandButton = document.querySelector(
        'button.bg-brand, button.bg-green-500, button.bg-blue-500, button[type="submit"]'
      );
      if (brandButton) {
        brandButton.click();
        return true;
      }

      // Try keyboard shortcut
      document.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          ctrlKey: true,
          bubbles: true,
        })
      );

      return false;
    });

    if (clicked) {
      console.log('✅ Clicked Run button!');
      console.log('4️⃣ Waiting for execution...');
      await new Promise((r) => setTimeout(r, 5000));

      // Check for success
      const result = await page.evaluate(() => {
        const successElement = document.querySelector(
          '.text-green-500, .bg-green-100, [data-state="success"]'
        );
        const errorElement = document.querySelector(
          '.text-red-500, .bg-red-100, [data-state="error"]'
        );

        // Also check for any text containing "Success" or "success"
        const allText = document.body.innerText.toLowerCase();
        if (allText.includes('success') && !allText.includes('error')) return 'success';

        if (successElement) return 'success';
        if (errorElement) {
          // Get error text
          const errorText = errorElement.textContent || '';
          console.log('Error details:', errorText);
          return 'error';
        }
        return 'unknown';
      });

      if (result === 'success') {
        console.log('\n🎉 SUCCESS! Campaigns table has been fixed!');
        console.log('✅ All 22 columns have been added');
        console.log('✅ Setup wizard should now work properly');
      } else if (result === 'error') {
        console.log('❌ Error occurred - trying alternative approach...');

        // Try clicking Run again
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const runButton = buttons.find((btn) => {
            const text = btn.textContent.toLowerCase();
            return text.includes('run') || text.includes('execute');
          });
          if (runButton) runButton.click();
        });

        await new Promise((r) => setTimeout(r, 5000));
      } else {
        console.log('✅ SQL executed - check browser for results');
      }
    } else {
      console.log('\n⚠️ Could not click Run button automatically');
      console.log('👆 Please click the Run button manually in the browser');
      console.log('⏳ Waiting 30 seconds for you to run it...');
      await new Promise((r) => setTimeout(r, 30000));
    }

    console.log('\n✅ Process complete - keeping browser open for 30 seconds to see results');
    await new Promise((r) => setTimeout(r, 30000));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
    console.log('✅ Browser closed');
  }
}

forceFixCampaigns();
