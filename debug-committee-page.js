// Debug what's actually showing on the committee page
import puppeteer from 'puppeteer';

async function debugCommitteePage() {
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 100,
    devtools: true
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    console.log('🌐 Opening committee setup page...');
    await page.goto('http://localhost:5174/campaigns/auth/setup', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });

    // Wait a bit for the page to render
    await page.waitForTimeout(3000);

    // Take a screenshot
    await page.screenshot({ path: 'committee-page-debug.png', fullPage: true });
    console.log('📸 Screenshot saved as committee-page-debug.png');

    // Check what's actually on the page
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('📄 Page content preview:', pageText.substring(0, 500));

    // Check for any error messages
    const hasError = await page.evaluate(() => {
      return document.body.innerText.includes('Campaign ID not found') || 
             document.body.innerText.includes('error') ||
             document.body.innerText.includes('Error');
    });

    console.log('❓ Has error on page:', hasError);

    // Check if we're redirected or on login page
    const currentUrl = await page.url();
    console.log('📍 Current URL:', currentUrl);

    // Wait longer to see if page loads
    console.log('⏳ Waiting 10 seconds to see if page loads...');
    await page.waitForTimeout(10000);

    await page.screenshot({ path: 'committee-page-final.png', fullPage: true });
    console.log('📸 Final screenshot saved');

  } catch (error) {
    console.error('Debug failed:', error.message);
  } finally {
    // Keep browser open to inspect manually
    console.log('🔍 Browser left open for manual inspection');
    // await browser.close();
  }
}

debugCommitteePage();