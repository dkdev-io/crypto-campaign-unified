const puppeteer = require('puppeteer');

async function testNetlifyDonorDevbypass() {
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
    console.log('1. Navigating to Netlify donor auth page...');
    await page.goto('https://cryptocampaign.netlify.app/donors/auth');
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000)); // Give page time to load
    
    // Try to find the title element (could be h1 or h2)
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
    
    if (devBypassButtons.length === 0) {
      // Try to find yellow buttons
      const yellowButtons = await page.$$('.bg-yellow-500, [class*="bg-yellow"]');
      console.log(`   Found ${yellowButtons.length} yellow buttons`);
      
      if (yellowButtons.length > 0) {
        const buttonText = await yellowButtons[0].evaluate(el => el.textContent);
        console.log(`   First yellow button text: "${buttonText}"`);
      }
      
      // List all button texts for debugging
      console.log('   All button texts on page:');
      for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
        const text = await allButtons[i].evaluate(el => el.textContent || '');
        console.log(`     Button ${i}: "${text.substring(0, 50)}"`);
      }
    }
    
    // Try to click the first DEV BYPASS button
    if (devBypassButtons.length > 0) {
      console.log('3. Clicking first DEV BYPASS button...');
      
      const initialUrl = page.url();
      console.log(`   Current URL: ${initialUrl}`);
      
      // Click the button
      await devBypassButtons[0].click();
      console.log('   Button clicked');
      
      // Wait for potential navigation
      try {
        await page.waitForNavigation({ timeout: 5000 });
        console.log('   Navigation detected');
      } catch (e) {
        console.log('   No navigation detected within 5 seconds');
      }
      
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
        
        // Check if page loaded successfully
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
      
      // Debug: Check the page structure
      const pageHTML = await page.content();
      if (pageHTML.includes('DEV BYPASS')) {
        console.log('   "DEV BYPASS" text found in page HTML');
      } else {
        console.log('   "DEV BYPASS" text NOT found in page HTML');
      }
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
  
  console.log('4. Test completed. Closing browser...');
  await browser.close();
}

testNetlifyDonorDevbypass().catch(console.error);