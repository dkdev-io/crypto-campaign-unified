const puppeteer = require('puppeteer');

async function checkFrontendErrors() {
  console.log('🔍 Checking for Frontend JavaScript Errors');
  console.log('=========================================\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox'],
    slowMo: 100
  });
  
  const page = await browser.newPage();
  
  // Listen for console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  
  // Listen for page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(`PAGE ERROR: ${error.message}`);
  });
  
  // Listen for failed requests
  const failedRequests = [];
  page.on('requestfailed', request => {
    failedRequests.push(`FAILED REQUEST: ${request.url()} - ${request.failure().errorText}`);
  });
  
  try {
    console.log('📍 Navigating to donor auth page...');
    await page.goto('http://localhost:3000/donors/auth/login', { waitUntil: 'networkidle0' });
    
    // Wait a bit more to capture any delayed errors
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n📊 Analysis Results:');
    console.log('==================');
    
    console.log(`\n🟡 Console Messages (${consoleMessages.length}):`);
    consoleMessages.forEach(msg => console.log(`   ${msg}`));
    
    console.log(`\n🔴 Page Errors (${pageErrors.length}):`);
    pageErrors.forEach(error => console.log(`   ${error}`));
    
    console.log(`\n🚫 Failed Requests (${failedRequests.length}):`);
    failedRequests.forEach(req => console.log(`   ${req}`));
    
    // Check what's actually rendered
    const currentUrl = page.url();
    const title = await page.title();
    const bodyText = await page.evaluate(() => document.body.innerText);
    
    console.log(`\n📄 Page Info:`);
    console.log(`   URL: ${currentUrl}`);
    console.log(`   Title: ${title}`);
    console.log(`   Body preview: ${bodyText.substring(0, 200)}...`);
    
    // Check for React components
    const hasReactRoot = await page.evaluate(() => {
      return document.querySelector('#root') !== null;
    });
    
    const reactRootContent = await page.evaluate(() => {
      const root = document.querySelector('#root');
      return root ? root.innerHTML.substring(0, 500) : 'No #root element found';
    });
    
    console.log(`\n⚛️  React Info:`);
    console.log(`   Has #root element: ${hasReactRoot}`);
    console.log(`   Root content preview: ${reactRootContent}...`);
    
    await page.screenshot({ path: 'donor-auth-debug.png' });
    console.log('\n📸 Screenshot saved as donor-auth-debug.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

checkFrontendErrors();