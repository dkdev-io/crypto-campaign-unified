const puppeteer = require('puppeteer');

async function testBasicRouting() {
  console.log('🧪 Testing Basic Routing');
  console.log('======================\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox'] 
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('📍 Testing basic test route...');
    await page.goto('http://localhost:3000/test-route', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const currentUrl = page.url();
    const pageContent = await page.evaluate(() => document.body.innerText);
    
    console.log(`Current URL: ${currentUrl}`);
    console.log(`Page content:`, pageContent.substring(0, 200));
    
    if (pageContent.includes('TEST ROUTE WORKING')) {
      console.log('✅ Basic routing works!');
      
      // Now test the donor route
      console.log('\n📍 Now testing donor route...');
      await page.goto('http://localhost:3000/donors/auth/login', { waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const donorUrl = page.url();
      const donorContent = await page.evaluate(() => document.body.innerText);
      
      console.log(`Donor URL: ${donorUrl}`);
      console.log(`Donor content:`, donorContent.substring(0, 200));
      
      if (donorContent.includes('TEST DONOR ROUTE')) {
        console.log('✅ Donor routing works too!');
      } else {
        console.log('❌ Donor routing still failing');
      }
      
    } else {
      console.log('❌ Basic routing not working - deeper React issue');
    }
    
    await page.screenshot({ path: 'routing-test.png' });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testBasicRouting();