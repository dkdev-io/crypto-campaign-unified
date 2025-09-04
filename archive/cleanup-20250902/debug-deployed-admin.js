import puppeteer from 'puppeteer';

async function debugDeployedAdmin() {
  console.log('🔍 Debugging Deployed Admin Login...\n');

  const browser = await puppeteer.launch({ headless: false, devtools: true });
  const page = await browser.newPage();

  // Capture console logs and errors
  const logs = [];
  const errors = [];

  page.on('console', (msg) => {
    logs.push(`${msg.type()}: ${msg.text()}`);
    console.log(`📋 Console ${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', (error) => {
    errors.push(error.message);
    console.log(`❌ Page Error: ${error.message}`);
  });

  try {
    console.log('1. Loading /minda page...');
    await page.goto('https://cryptocampaign.netlify.app/minda', {
      waitUntil: 'networkidle0',
      timeout: 15000,
    });

    // Check if the page loaded properly
    await page.waitForSelector('h2', { timeout: 5000 });
    const heading = await page.$eval('h2', (el) => el.textContent);
    console.log(`✅ Page loaded, heading: "${heading}"`);

    // Check form fields
    await page.waitForSelector('input[name="email"]', { timeout: 5000 });
    await page.waitForSelector('input[name="password"]', { timeout: 5000 });
    console.log('✅ Form fields found');

    // Pre-fill fields and check values
    await page.evaluate(() => {
      const emailField = document.querySelector('input[name="email"]');
      const passwordField = document.querySelector('input[name="password"]');
      console.log('Email field value:', emailField?.value);
      console.log('Password field value:', passwordField?.value);
    });

    console.log('\n2. Filling and submitting form...');

    // Clear and fill fields
    await page.click('input[name="email"]', { clickCount: 3 });
    await page.type('input[name="email"]', 'dan@dkdev.io');

    await page.click('input[name="password"]', { clickCount: 3 });
    await page.type('input[name="password"]', 'admin123');

    console.log('✅ Fields filled');

    // Add a listener for form submission
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) {
        form.addEventListener('submit', (e) => {
          console.log('Form submit event fired!');
        });
      }
    });

    // Click submit and wait
    console.log('🔄 Submitting form...');
    await page.click('button[type="submit"]');

    // Wait and check what happened
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const finalUrl = page.url();
    console.log(`Final URL: ${finalUrl}`);

    if (finalUrl.includes('/admin/dashboard')) {
      console.log('✅ SUCCESS: Redirected to dashboard!');
    } else {
      console.log('❌ FAILED: Still on login page');

      // Check for error messages
      const pageText = await page.$eval('body', (el) => el.textContent);
      if (pageText.includes('Failed to fetch')) console.log('🔍 Error: Failed to fetch found');
      if (pageText.includes('Invalid credentials'))
        console.log('🔍 Error: Invalid credentials found');
      if (pageText.includes('Login failed')) console.log('🔍 Error: Login failed found');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('\\n📋 Summary:');
  console.log(`Console messages: ${logs.length}`);
  console.log(`JavaScript errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\\n❌ JavaScript Errors:');
    errors.forEach((err) => console.log(`  - ${err}`));
  }

  await browser.close();
}

debugDeployedAdmin().catch(console.error);
