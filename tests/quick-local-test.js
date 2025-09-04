import puppeteer from 'puppeteer';

async function quickLocalTest() {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Enable console logging
    page.on('console', (message) => {
      console.log(`🔍 CONSOLE: ${message.text()}`);
    });

    console.log('🧪 TESTING LOCAL WITH DEBUG LOGGING');
    console.log('===================================');

    // Test login
    await page.goto('http://localhost:5173/minda', { waitUntil: 'networkidle0' });

    await page.type('input[name="email"]', 'dan@dkdev.io');
    await page.type('input[name="password"]', 'admin123');

    console.log('Clicking submit...');
    await page.click('button[type="submit"]');

    // Wait and see what happens
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log('Current URL after login:', page.url());

    return { success: true };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { error: error.message };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

quickLocalTest();
