import puppeteer from 'puppeteer';

async function testAuthBypass() {
  console.log('🚀 Starting auth bypass verification...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    // Test 1: Donor Auth Bypass
    console.log('\n🔍 Testing DONOR auth bypass...');
    const donorPage = await browser.newPage();
    await donorPage.goto('http://localhost:5173/donors/auth', { waitUntil: 'networkidle0' });
    
    // Wait for the page to fully load
    await donorPage.waitForSelector('button', { timeout: 10000 });
    
    // Look for bypass button by searching through all buttons
    const buttons = await donorPage.$$('button');
    let foundBypassButton = null;
    console.log(`📊 Found ${buttons.length} buttons on donor auth page`);
    
    for (let button of buttons) {
      const text = await button.evaluate(el => el.textContent);
      console.log(`🔍 Button text: "${text}"`);
      if (text.includes('DEV BYPASS') || text.includes('Dashboard')) {
        foundBypassButton = button;
        console.log(`✅ Matched bypass button with text: "${text}"`);
        break;
      }
    }
    
    if (foundBypassButton) {
        console.log('✅ Found donor bypass button');
        
        // Click the button
        await foundBypassButton.click();
        
        // Wait for navigation
        await donorPage.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
        
        const currentUrl = donorPage.url();
        console.log(`📍 Donor navigated to: ${currentUrl}`);
        
        if (currentUrl.includes('/donors/dashboard') && currentUrl.includes('bypass=true')) {
          console.log('✅ DONOR BYPASS WORKS - Correct destination reached!');
        } else {
          console.log('❌ DONOR BYPASS FAILED - Wrong destination or missing bypass parameter');
        }
    } else {
      console.log('❌ Donor bypass button not found');
    }
    
    // Test 2: Campaign Auth Bypass
    console.log('\n🔍 Testing CAMPAIGN auth bypass...');
    const campaignPage = await browser.newPage();
    await campaignPage.goto('http://localhost:5173/campaigns/auth', { waitUntil: 'networkidle0' });
    
    // Wait for the page to fully load
    await campaignPage.waitForSelector('button', { timeout: 10000 });
    
    // Look for bypass button
    const campaignButtons = await campaignPage.$$('button');
    let campaignBypassButton = null;
    for (let button of campaignButtons) {
      const text = await button.evaluate(el => el.textContent);
      if (text.includes('DEV BYPASS') || text.includes('Setup')) {
        campaignBypassButton = button;
        break;
      }
    }
    
    if (campaignBypassButton) {
      console.log('✅ Found campaign bypass button');
      
      // Click the button
      await campaignBypassButton.click();
      
      // Wait for navigation
      await campaignPage.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
      
      const currentUrl = campaignPage.url();
      console.log(`📍 Campaign navigated to: ${currentUrl}`);
      
      if (currentUrl.includes('/campaigns/auth/setup') && currentUrl.includes('bypass=true')) {
        console.log('✅ CAMPAIGN BYPASS WORKS - Correct destination reached!');
      } else {
        console.log('❌ CAMPAIGN BYPASS FAILED - Wrong destination or missing bypass parameter');
      }
    } else {
      console.log('❌ Campaign bypass button not found');
    }
    
    // Test 3: Protected Route Bypass
    console.log('\n🔍 Testing protected route bypass...');
    const testPage = await browser.newPage();
    
    // Enable console logging to see our debug messages
    testPage.on('console', msg => {
      if (msg.text().includes('PROTECTED ROUTE') || msg.text().includes('BYPASS')) {
        console.log(`🔧 Browser Console: ${msg.text()}`);
      }
    });
    
    // Try accessing protected route with bypass
    await testPage.goto('http://localhost:5173/campaigns/auth/setup?bypass=true', { waitUntil: 'networkidle0' });
    
    const finalUrl = testPage.url();
    console.log(`📍 Protected route test URL: ${finalUrl}`);
    
    // Check if we got to the setup wizard (not redirected to auth)
    if (finalUrl.includes('/campaigns/auth/setup')) {
      console.log('✅ PROTECTED ROUTE BYPASS WORKS - No redirect to auth page');
    } else {
      console.log('❌ PROTECTED ROUTE BYPASS FAILED - Redirected to auth');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    console.log('\n🏁 Closing browser...');
    await browser.close();
  }
}

// Run the test
testAuthBypass().catch(console.error);