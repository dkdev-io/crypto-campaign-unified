const puppeteer = require('puppeteer');

async function testRoute() {
  console.log('Testing route rendering...\n');
  
  const browser = await puppeteer.launch({
    headless: true
  });
  
  const page = await browser.newPage();
  
  // First try the test route
  console.log('1. Testing /test route:');
  await page.goto('http://localhost:5173/test', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  
  let content = await page.evaluate(() => document.body?.innerText || 'EMPTY');
  console.log('   Content:', content.substring(0, 100));
  
  // Try root
  console.log('\n2. Testing / route:');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  
  content = await page.evaluate(() => document.body?.innerText || 'EMPTY');
  console.log('   Content:', content.substring(0, 100));
  
  // Try analytics-demo
  console.log('\n3. Testing /analytics-demo route:');
  await page.goto('http://localhost:5173/analytics-demo', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  
  content = await page.evaluate(() => {
    return {
      bodyText: document.body?.innerText || 'EMPTY',
      pathname: window.location.pathname,
      rootDiv: document.getElementById('root')?.innerHTML || 'NO ROOT'
    };
  });
  console.log('   Body text:', content.bodyText.substring(0, 100));
  console.log('   Pathname:', content.pathname);
  console.log('   Root div:', content.rootDiv.substring(0, 100));
  
  await browser.close();
}

testRoute();