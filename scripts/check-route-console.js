const puppeteer = require('puppeteer');

async function checkRoute() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();

  // Capture ALL console logs
  const logs = [];
  page.on('console', (msg) => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Navigate
  await page.goto('http://localhost:5173/analytics-demo', {
    waitUntil: 'domcontentloaded',
  });

  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Get the actual content
  const pageContent = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const title = document.title;
    const pathname = window.location.pathname;
    const bodyText = document.body ? document.body.innerText.substring(0, 500) : 'No body';

    return {
      h1Text: h1 ? h1.textContent : 'No H1',
      title,
      pathname,
      bodyText,
    };
  });

  console.log('📋 PAGE INFO:');

  logs.forEach((log, i) => {});

  await browser.close();
}

checkRoute();
