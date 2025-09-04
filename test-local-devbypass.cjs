const puppeteer = require('puppeteer');

async function testLocalDonorDevbypass() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  // Enable console logging from the page
  page.on('console', msg => {
    console.log('PAGE LOG:', msg.text());
  });
  
  try {
    console.log('1. Navigating to LOCAL donor auth page...');
    await page.goto('http://localhost:5173/donors/auth');
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try to find the title element
    let title = 'Not found';
    try {
      const titleElement = await page.$('h1, h2');
      if (titleElement) {
        title = await titleElement.evaluate(el => el.textContent);
      }
    } catch (e) {
      console.log('   Could not find title element');
    }
    console.log(`   Page title: "${title}"`);
    
    console.log('2. Looking for DEV BYPASS button...');
    
    // Wait a bit for any dynamic content
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if button exists using different selectors
    const allButtons = await page.$$('button');
    let devBypassButtons = [];
    
    for (let button of allButtons) {
      const text = await button.evaluate(el => el.textContent || '');
      if (text.includes('DEV BYPASS')) {
        devBypassButtons.push(button);
      }
    }
    
    console.log(`   Found ${devBypassButtons.length} DEV BYPASS buttons`);
    console.log(`   Total buttons on page: ${allButtons.length}`);
    
    // Try to click the first DEV BYPASS button
    if (devBypassButtons.length > 0) {
      console.log('3. Clicking first DEV BYPASS button...');
      
      const initialUrl = page.url();
      console.log(`   Current URL: ${initialUrl}`);
      
      // Click the button
      await devBypassButtons[0].click();
      console.log('   Button clicked');
      
      // Wait for navigation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const finalUrl = page.url();
      console.log(`   Final URL: ${finalUrl}`);
      
      if (finalUrl.includes('/donors/dashboard')) {
        console.log('✅ SUCCESS: Navigated to donor dashboard');
        
        // Check if bypass parameter is present
        if (finalUrl.includes('bypass=true')) {
          console.log('✅ SUCCESS: Bypass parameter present');
        } else {
          console.log('⚠️  WARNING: Bypass parameter missing');
        }
        
        // Wait for page to load and check content
        await new Promise(resolve => setTimeout(resolve, 2000));
        const pageContent = await page.content();
        if (pageContent.includes('Donor Dashboard') || pageContent.includes('Welcome')) {
          console.log('✅ SUCCESS: Dashboard page loaded successfully');
        } else {
          console.log('❌ FAIL: Dashboard page did not load properly');
        }
        
      } else {
        console.log('❌ FAIL: Did not navigate to donor dashboard');
        console.log(`   Expected URL to contain: /donors/dashboard`);
        console.log(`   Actual URL: ${finalUrl}`);
      }
      
    } else {
      console.log('❌ FAIL: No DEV BYPASS button found');
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
  
  console.log('4. Test completed. Closing browser...');
  await browser.close();
}

testLocalDonorDevbypass().catch(console.error);