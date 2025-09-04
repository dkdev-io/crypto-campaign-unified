const puppeteer = require('puppeteer');

async function testRouteFix() {
  console.log('🔧 Testing Route Fix with Test Component');
  console.log('========================================\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox'] 
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('📍 Testing /donors/auth/login route...');
    await page.goto('http://localhost:3000/donors/auth/login', { waitUntil: 'networkidle0' });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const currentUrl = page.url();
    const pageContent = await page.evaluate(() => document.body.innerText);
    
    console.log(`Current URL: ${currentUrl}`);
    console.log(`Page content:`, pageContent.substring(0, 200));
    
    if (pageContent.includes('TEST DONOR ROUTE')) {
      console.log('✅ SUCCESS: Route is working! The issue was in the DonorAuth component.');
    } else if (currentUrl === 'http://localhost:3000/') {
      console.log('❌ FAILURE: Still being redirected to home page');
    } else {
      console.log('⚠️  UNCLEAR: Unexpected result');
    }
    
    await page.screenshot({ path: 'route-test-result.png' });
    console.log('📸 Screenshot saved as route-test-result.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testRouteFix();