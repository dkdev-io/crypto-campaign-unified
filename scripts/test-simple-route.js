const puppeteer = require('puppeteer');

async function testRoute() {
  const browser = await puppeteer.launch({
    headless: true,
  });

  const page = await browser.newPage();

  // First try the test route
  await page.goto('http://localhost:5173/test', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));

  let content = await page.evaluate(() => document.body?.innerText || 'EMPTY');

  // Try root
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));

  content = await page.evaluate(() => document.body?.innerText || 'EMPTY');

  // Try analytics-demo
  await page.goto('http://localhost:5173/analytics-demo', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));

  content = await page.evaluate(() => {
    return {
      bodyText: document.body?.innerText || 'EMPTY',
      pathname: window.location.pathname,
      rootDiv: document.getElementById('root')?.innerHTML || 'NO ROOT',
    };
  });

  await browser.close();
}

testRoute();
