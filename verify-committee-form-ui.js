// Puppeteer test to verify committee form UI works
import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyCommitteeFormUI() {
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 100,
    devtools: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    console.log('🌐 Opening committee setup page...');
    await page.goto('http://localhost:5174/campaigns/auth/setup', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Wait for the page to load
    console.log('⏳ Waiting for form to load...');
    await page.waitForSelector('input[placeholder="Enter committee name or keywords..."]', { timeout: 10000 });

    // Fill in manual committee form
    console.log('📝 Filling out manual committee form...');
    
    // Fill committee name
    await page.type('input[placeholder="Enter your committee name"]', 'Test UI Committee');
    await page.waitForTimeout(500);

    // Fill address
    await page.type('input[placeholder="Committee address"]', '123 UI Test Street');
    await page.waitForTimeout(500);

    // Fill city
    await page.type('input[placeholder="City"]', 'TestCity');
    await page.waitForTimeout(500);

    // Fill state
    await page.type('input[placeholder="State"]', 'TX');
    await page.waitForTimeout(500);

    // Fill ZIP
    await page.type('input[placeholder="ZIP"]', '12345');
    await page.waitForTimeout(500);

    console.log('✅ Form filled out completely');

    // Click the submit button
    console.log('🖱️ Clicking submit button...');
    await page.click('button:has-text("Save Committee Info & Continue")');

    // Wait for success message or navigation
    console.log('⏳ Waiting for form submission...');
    
    try {
      // Wait for either success message or navigation
      await Promise.race([
        page.waitForSelector('div:has-text("Committee Information Saved!")', { timeout: 10000 }),
        page.waitForFunction(() => window.location.pathname === '/BankConnection', { timeout: 10000 }),
        page.waitForSelector('div:has-text("Committee information saved")', { timeout: 10000 })
      ]);
      
      const currentUrl = await page.url();
      console.log('📍 Current URL after submission:', currentUrl);

      if (currentUrl.includes('/BankConnection') || await page.$('div:has-text("Committee Information Saved!")')) {
        console.log('✅ Form submitted successfully!');
        
        // Verify data was saved to database
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('committee_name, committee_address, committee_city')
          .eq('committee_name', 'Test UI Committee')
          .limit(1);

        if (campaigns && campaigns.length > 0) {
          console.log('✅ Data saved to database:', campaigns[0]);
        } else {
          console.log('⚠️ Data not found in database');
        }
      } else {
        console.log('❌ Form did not submit successfully');
      }

    } catch (timeoutError) {
      // Check for error messages
      const errorElements = await page.$$('div[style*="color: hsl(var(--destructive))"]');
      if (errorElements.length > 0) {
        const errorText = await page.evaluate(el => el.textContent, errorElements[0]);
        console.log('❌ Error message found:', errorText);
      } else {
        console.log('❌ Form submission timed out with no clear error');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    
    // Cleanup any test data
    try {
      await supabase.from('campaigns').delete().eq('committee_name', 'Test UI Committee');
    } catch (cleanupError) {
      console.log('Note: Could not clean up test data');
    }
  }
}

verifyCommitteeFormUI();