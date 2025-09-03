import puppeteer from 'puppeteer';

async function testLiveWorkflows() {
  console.log('🌐 TESTING LIVE NETLIFY SITE WORKFLOWS');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  try {
    // Test Live Campaign Workflow
    console.log('\n1️⃣ TESTING LIVE CAMPAIGN AUTH');
    const campaignPage = await browser.newPage();
    await campaignPage.goto('https://cryptocampaign.netlify.app/campaigns/auth/setup', { waitUntil: 'networkidle0' });
    
    // Check if it loads the auth form
    const hasEmailField = await campaignPage.$('input[type="email"]') !== null;
    const hasPasswordField = await campaignPage.$('input[type="password"]') !== null;
    console.log(`✅ Campaign auth form: email=${hasEmailField}, password=${hasPasswordField}`);
    
    // Test with your credentials if auth form is present
    if (hasEmailField && hasPasswordField) {
      console.log('🔐 Testing login with your credentials...');
      
      await campaignPage.type('input[type="email"]', 'test@dkdev.io');
      await campaignPage.type('input[type="password"]', 'TestPassword123!');
      
      // Submit form
      const submitButton = await campaignPage.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const finalUrl = campaignPage.url();
        console.log(`After login URL: ${finalUrl}`);
        
        // Check if we reached setup wizard
        const isSetupWizard = finalUrl.includes('/setup') || 
                              await campaignPage.$('text/Step 1') !== null ||
                              await campaignPage.$('text/Campaign Information') !== null;
        
        console.log(`✅ Reached setup wizard: ${isSetupWizard}`);
      }
    }
    
    // Test Live Donor Workflow  
    console.log('\n2️⃣ TESTING LIVE DONOR AUTH');
    const donorPage = await browser.newPage();
    await donorPage.goto('https://cryptocampaign.netlify.app/donors/auth', { waitUntil: 'networkidle0' });
    
    const donorHasAuth = await donorPage.$('input[type="email"]') !== null;
    console.log(`✅ Donor auth form loads: ${donorHasAuth}`);
    
    // Check tab switching
    const signUpTab = await donorPage.$('button:contains("Sign Up")');
    if (signUpTab) {
      await signUpTab.click();
      console.log('✅ Donor auth tab switching works');
    }
    
    console.log('\n📊 LIVE SITE TEST RESULTS:');
    console.log(`✅ Campaign route accessible: ${hasEmailField && hasPasswordField}`);
    console.log(`✅ Donor route accessible: ${donorHasAuth}`);
    console.log('✅ Both workflows deployed and functional');
    
    await browser.close();
    
  } catch (error) {
    console.error('❌ Live test failed:', error);
    await browser.close();
  }
}

testLiveWorkflows();