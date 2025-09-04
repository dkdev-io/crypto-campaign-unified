// Verify committee form works on port 5173
import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify5173() {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
  });

  try {
    const page = await browser.newPage();

    console.log('🌐 Navigating to http://localhost:5173/campaigns/auth/setup');
    await page.goto('http://localhost:5173/campaigns/auth/setup', {
      waitUntil: 'domcontentloaded',
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    await page.screenshot({ path: 'port-5173-test.png', fullPage: true });
    console.log('📸 Screenshot saved');

    // Check if manual committee form exists
    const hasManualForm = await page.$('input[placeholder="Enter your committee name"]');
    console.log('📋 Manual committee form found:', !!hasManualForm);

    if (hasManualForm) {
      // Fill and submit form
      await page.type('input[placeholder="Enter your committee name"]', 'Port 5173 Test Committee');
      await page.type('input[placeholder="Committee address"]', '123 Port Street');
      await page.type('input[placeholder="City"]', 'ServerTown');
      await page.type('input[placeholder="State"]', 'NY');
      await page.type('input[placeholder="ZIP"]', '10001');

      console.log('📝 Form filled, clicking submit...');
      await page.click(
        'button[style*="Save Committee Info & Continue"], button:has-text("Save Committee Info & Continue")'
      );

      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Check result
      const finalUrl = await page.url();
      const content = await page.evaluate(() => document.body.innerText);

      console.log('📍 Final URL:', finalUrl);

      if (content.includes('Committee Information Saved') || finalUrl.includes('/BankConnection')) {
        console.log('🎉 SUCCESS: Committee form submitted and navigated correctly!');
      } else if (content.includes('Campaign ID not found')) {
        console.log('❌ FAILED: Still getting Campaign ID error');
      } else {
        console.log('❓ UNKNOWN: Check manually - content preview:', content.substring(0, 200));
      }

      // Verify in database
      const { data } = await supabase
        .from('campaigns')
        .select('committee_name')
        .eq('committee_name', 'Port 5173 Test Committee');

      console.log('💾 Database check:', data?.length > 0 ? 'Data saved!' : 'No data found');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Don't close browser automatically for inspection
  console.log('🔍 Browser left open for manual inspection');
}

verify5173();
