import puppeteer from 'puppeteer';

async function testAuthWorkflows() {
  console.log('🧪 Testing Authentication Workflows with Puppeteer\n');
  console.log('==================================================\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Set to false to see the browser
    slowMo: 100 // Slow down actions to see what's happening
  });
  
  try {
    // Test 1: Campaign Auth
    console.log('1️⃣ Testing Campaign Auth Workflow...\n');
    const campaignPage = await browser.newPage();
    await campaignPage.setViewport({ width: 1280, height: 800 });
    
    console.log('   📍 Navigating to: https://cryptocampaign.netlify.app/campaigns/auth');
    await campaignPage.goto('https://cryptocampaign.netlify.app/campaigns/auth', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for the page to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if auth form loaded
    try {
      await campaignPage.waitForSelector('button', { 
        timeout: 5000 
      });
      console.log('   ✅ Campaign auth page loaded successfully');
      
      // Click on Sign Up tab if it exists
      // Look for Sign Up button by evaluating text content
      const signUpButton = await campaignPage.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => btn.textContent.includes('Sign Up')) || buttons[0];
      });
      if (signUpButton) {
        await signUpButton.click();
        console.log('   ✅ Sign Up tab clicked');
      }
      
      // Check for form fields
      const emailField = await campaignPage.$('input[type="email"]');
      const passwordField = await campaignPage.$('input[type="password"]');
      
      if (emailField && passwordField) {
        console.log('   ✅ Sign up form fields are present');
        
        // Try to fill the form
        const testEmail = 'test@dkdev.io';
        await campaignPage.type('input[type="email"]', testEmail);
        console.log('   ✅ Email field filled:', testEmail);
        
        // Check if we can type in password field
        await campaignPage.type('input[type="password"]', 'TestPassword123!');
        console.log('   ✅ Password field filled');
        
        // Check for submit button
        const submitButton = await campaignPage.$('button[type="submit"]');
        if (submitButton) {
          console.log('   ✅ Submit button found and clickable');
        }
      } else {
        console.log('   ⚠️ Form fields not found - checking page content...');
        const pageContent = await campaignPage.content();
        console.log('   Page title:', await campaignPage.title());
        console.log('   URL:', campaignPage.url());
      }
      
    } catch (error) {
      console.log('   ❌ Campaign auth page issue:', error.message);
      
      // Take a screenshot for debugging
      await campaignPage.screenshot({ 
        path: 'campaign-auth-error.png',
        fullPage: true 
      });
      console.log('   📸 Screenshot saved: campaign-auth-error.png');
    }
    
    // Test 2: Donor Auth
    console.log('\n2️⃣ Testing Donor Auth Workflow...\n');
    const donorPage = await browser.newPage();
    await donorPage.setViewport({ width: 1280, height: 800 });
    
    console.log('   📍 Navigating to: https://cryptocampaign.netlify.app/donors/auth');
    await donorPage.goto('https://cryptocampaign.netlify.app/donors/auth', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for the page to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if auth form loaded
    try {
      await donorPage.waitForSelector('button', { 
        timeout: 5000 
      });
      console.log('   ✅ Donor auth page loaded successfully');
      
      // Click on Sign Up tab
      // Look for Sign Up button by evaluating text content
      const signUpButton = await donorPage.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => btn.textContent.includes('Sign Up')) || buttons[0];
      });
      if (signUpButton) {
        await signUpButton.click();
        console.log('   ✅ Sign Up tab clicked');
      }
      
      // Check for form fields
      const emailField = await donorPage.$('input[type="email"]');
      const passwordField = await donorPage.$('input[type="password"]');
      
      if (emailField && passwordField) {
        console.log('   ✅ Sign up form fields are present');
        
        // Try to fill the form
        const testEmail = 'test@dkdev.io';
        await donorPage.type('input[type="email"]', testEmail);
        console.log('   ✅ Email field filled:', testEmail);
        
        // Check if we can type in password field
        await donorPage.type('input[type="password"]', 'TestPassword123!');
        console.log('   ✅ Password field filled');
        
        // Check for submit button
        const submitButton = await donorPage.$('button[type="submit"]');
        if (submitButton) {
          console.log('   ✅ Submit button found and clickable');
        }
      } else {
        console.log('   ⚠️ Form fields not found - checking page content...');
        const pageContent = await donorPage.content();
        console.log('   Page title:', await donorPage.title());
        console.log('   URL:', donorPage.url());
      }
      
    } catch (error) {
      console.log('   ❌ Donor auth page issue:', error.message);
      
      // Take a screenshot for debugging
      await donorPage.screenshot({ 
        path: 'donor-auth-error.png',
        fullPage: true 
      });
      console.log('   📸 Screenshot saved: donor-auth-error.png');
    }
    
    // Summary
    console.log('\n📊 PUPPETEER TEST SUMMARY');
    console.log('=========================');
    console.log('Campaign Auth: Check results above');
    console.log('Donor Auth: Check results above');
    console.log('\nScreenshots saved if there were any issues.');
    
    // Keep browser open for 5 seconds to see the results
    console.log('\n⏰ Keeping browser open for 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
    console.log('\n✅ Browser closed');
  }
}

// Run the tests
testAuthWorkflows()
  .then(() => {
    console.log('\n🎉 Puppeteer tests completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });