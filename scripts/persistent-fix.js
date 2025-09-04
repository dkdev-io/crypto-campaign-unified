import puppeteer from 'puppeteer';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';

async function checkColumns() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data } = await supabase.from('campaigns').select('*').limit(1);
  const columns = data && data.length > 0 ? Object.keys(data[0]) : [];

  const required = ['setup_completed', 'setup_step', 'user_id', 'user_full_name'];
  const missing = required.filter((col) => !columns.includes(col));

  return missing.length === 0;
}

async function persistentFix() {
  console.log('🔥 PERSISTENT FIX - Will keep trying until columns are added\n');

  let fixed = await checkColumns();
  if (fixed) {
    console.log('✅ Columns already exist! No fix needed.');
    return;
  }

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();

  // Set longer timeout
  page.setDefaultTimeout(60000);

  try {
    console.log('1️⃣ Navigating to Supabase...');

    // First, go to the main dashboard to ensure we're logged in
    await page.goto('https://supabase.com/dashboard', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    await new Promise((r) => setTimeout(r, 3000));

    // Check if we need to login
    const needsLogin = await page.evaluate(() => {
      return (
        window.location.href.includes('sign-in') ||
        window.location.href.includes('login') ||
        document.querySelector('input[type="email"]') !== null
      );
    });

    if (needsLogin) {
      console.log('📧 Login required - waiting for you to login...');
      await page
        .waitForFunction(
          () =>
            !window.location.href.includes('sign-in') && !window.location.href.includes('login'),
          { timeout: 120000 }
        )
        .catch(() => console.log('Login timeout - continuing anyway'));
    }

    // Now navigate to SQL editor for our specific project
    console.log('2️⃣ Opening SQL Editor...');
    await page.goto('https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo/sql/new', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    await new Promise((r) => setTimeout(r, 5000));

    // Wait for editor to be ready
    await page
      .waitForSelector('textarea, .monaco-editor, .CodeMirror, .ace_editor', {
        timeout: 30000,
      })
      .catch(() => console.log('Editor selector timeout'));

    console.log('3️⃣ Clearing editor and inserting SQL...');

    const sql = fs.readFileSync('FIX_CAMPAIGNS_TABLE.sql', 'utf8');

    // Clear and insert SQL
    const editorReady = await page.evaluate((sqlContent) => {
      // Clear any existing content first
      const clearEditor = () => {
        // Try textarea
        const textarea = document.querySelector('textarea');
        if (textarea) {
          textarea.value = '';
          textarea.value = sqlContent;
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          textarea.dispatchEvent(new Event('change', { bubbles: true }));
          // Force React to update
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            'value'
          ).set;
          nativeInputValueSetter.call(textarea, sqlContent);
          const evt = new Event('input', { bubbles: true });
          textarea.dispatchEvent(evt);
          return true;
        }

        // Try Monaco
        if (window.monaco && window.monaco.editor) {
          const editors = window.monaco.editor.getEditors();
          if (editors && editors.length > 0) {
            editors[0].setValue('');
            editors[0].setValue(sqlContent);
            return true;
          }
        }

        // Try CodeMirror
        const cm = document.querySelector('.CodeMirror');
        if (cm && cm.CodeMirror) {
          cm.CodeMirror.setValue('');
          cm.CodeMirror.setValue(sqlContent);
          return true;
        }

        return false;
      };

      return clearEditor();
    }, sql);

    if (!editorReady) {
      console.log('⚠️ Could not insert SQL via DOM, trying keyboard...');

      // Click to focus
      await page.click('body');

      // Clear all
      await page.keyboard.down('Control');
      await page.keyboard.press('a');
      await page.keyboard.up('Control');
      await page.keyboard.press('Delete');

      // Type SQL
      await page.keyboard.type(sql, { delay: 5 });
    } else {
      console.log('✅ SQL inserted successfully');
    }

    await new Promise((r) => setTimeout(r, 2000));

    console.log('4️⃣ Running SQL...');

    // Try multiple methods to run
    let attempts = 0;
    while (attempts < 5) {
      attempts++;
      console.log(`  Attempt ${attempts}/5...`);

      // Method 1: Click Run button
      const clicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const runButton = buttons.find((btn) => {
          const text = (btn.textContent || '').toLowerCase();
          return text === 'run' || text.includes('run query') || text.includes('execute');
        });

        if (runButton && !runButton.disabled) {
          runButton.click();
          return true;
        }
        return false;
      });

      if (clicked) {
        console.log('  ✅ Clicked Run button');
      } else {
        // Method 2: Keyboard shortcut
        await page.keyboard.down('Control');
        await page.keyboard.press('Enter');
        await page.keyboard.up('Control');
        console.log('  ⌨️ Tried Ctrl+Enter');
      }

      // Wait for execution
      await new Promise((r) => setTimeout(r, 8000));

      // Check if columns were added
      fixed = await checkColumns();
      if (fixed) {
        console.log('\n🎉 SUCCESS! All columns have been added!');
        console.log('✅ Campaign setup wizard will now work properly');
        break;
      } else {
        console.log('  ⚠️ Columns not added yet, retrying...');
      }
    }

    if (!fixed) {
      console.log('\n⚠️ Automated attempts failed');
      console.log('📋 Please manually click the Run button in the browser');
      console.log('⏳ Keeping browser open for manual execution...');

      // Keep checking every 5 seconds
      for (let i = 0; i < 12; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        fixed = await checkColumns();
        if (fixed) {
          console.log('\n🎉 SUCCESS! Columns detected!');
          break;
        }
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (fixed) {
      console.log('\n✅ Fix confirmed - closing browser');
      await browser.close();
    } else {
      console.log('\n⚠️ Keeping browser open for manual intervention');
      console.log('Close the browser window when done');
    }
  }
}

persistentFix();
