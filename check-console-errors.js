import puppeteer from 'puppeteer';

async function checkConsoleErrors() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  const errors = [];
  const logs = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
    logs.push(`${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', (error) => {
    errors.push(`Page Error: ${error.message}`);
  });

  try {
    console.log('Checking /WebsiteStyle for errors...');
    await page.goto('http://localhost:5173/WebsiteStyle', { waitUntil: 'networkidle0' });

    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log('\n❌ ERRORS:');
    errors.forEach((error) => console.log(`  ${error}`));

    console.log('\n📋 ALL LOGS:');
    logs.slice(-10).forEach((log) => console.log(`  ${log}`));

    await new Promise((resolve) => setTimeout(resolve, 5000));
  } finally {
    await browser.close();
  }
}

checkConsoleErrors().catch(console.error);
