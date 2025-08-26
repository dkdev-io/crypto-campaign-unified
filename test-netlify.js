import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('🚀 Testing Netlify deployment: https://cryptocampaign.netlify.app/');
    
    // Navigate to the main page
    await page.goto('https://cryptocampaign.netlify.app/', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('✅ Main page loaded successfully');
    
    // Check if sign up buttons exist and get their URLs
    const buttons = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      return allButtons.map(btn => ({
        text: btn.textContent?.trim(),
        onclick: btn.onclick?.toString() || 'no onclick',
        hasOnClick: !!btn.onclick
      })).filter(btn => 
        btn.text && (
          btn.text.includes('Get Started') || 
          btn.text.includes('Sign') ||
          btn.text.toLowerCase().includes('start')
        )
      );
    });
    
    console.log('🔍 Found buttons:', JSON.stringify(buttons, null, 2));
    
    // Try to find and click a Get Started button using different approaches
    let buttonFound = false;
    
    // Try to click a Get Started button
    try {
      const clickResult = await page.evaluate(() => {
        const button = Array.from(document.querySelectorAll('button'))
          .find(btn => btn.textContent.includes('Get Started'));
        if (button) {
          button.click();
          return true;
        }
        return false;
      });
      
    if (clickResult) {
      console.log('📱 Found Get Started button, attempting click...');
      await page.evaluate(() => {
        const button = Array.from(document.querySelectorAll('button'))
          .find(btn => btn.textContent.includes('Get Started'));
        if (button) {
          button.click();
          return true;
        }
        return false;
      });
      buttonFound = true;
    } else {
      console.log('❌ No Get Started button found by text');
    }
    
    // Wait for potential navigation
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('🌐 Current URL after click:', currentUrl);
    
    // Check if we ended up on the setup page
    if (currentUrl.includes('/setup')) {
      console.log('✅ SUCCESS: Sign up button redirected to /setup');
      
      // Check if the setup page loaded content
      const setupContent = await page.$('h2');
      if (setupContent) {
        const heading = await page.evaluate(el => el.textContent, setupContent);
        console.log('📋 Setup page heading:', heading);
      }
    } else if (buttonFound) {
      console.log('❌ Button clicked but no redirect - may be working now');
    }
    
    // Test direct navigation to /setup
    console.log('\n🔗 Testing direct navigation to /setup...');
    await page.goto('https://cryptocampaign.netlify.app/setup', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    const setupUrl = page.url();
    const setupTitle = await page.title();
    const pageContent = await page.content();
    
    console.log('🌐 Setup page URL:', setupUrl);
    console.log('📄 Setup page title:', setupTitle);
    
    // Check if it's a 404 or the actual setup page
    const is404 = pageContent.includes('404') || pageContent.includes('Not Found') || setupTitle.includes('404');
    const hasSetupContent = pageContent.includes('Campaign Setup') || pageContent.includes('setup');
    
    if (setupUrl.includes('/setup') && !is404) {
      console.log('✅ SUCCESS: Direct /setup navigation works');
      if (hasSetupContent) {
        console.log('✅ Setup page has expected content');
      }
    } else {
      console.log('❌ FAILED: Direct /setup navigation shows 404 or error');
    }
    
    // Test /auth route as well
    console.log('\n🔗 Testing direct navigation to /auth...');
    await page.goto('https://cryptocampaign.netlify.app/auth', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    const authUrl = page.url();
    const authTitle = await page.title();
    const authContent = await page.content();
    
    console.log('🌐 Auth page URL:', authUrl);
    console.log('📄 Auth page title:', authTitle);
    
    const authIs404 = authContent.includes('404') || authContent.includes('Not Found') || authTitle.includes('404');
    
    if (authUrl.includes('/auth') && !authIs404) {
      console.log('✅ SUCCESS: Direct /auth navigation works');
    } else {
      console.log('❌ FAILED: Direct /auth navigation shows 404 or error');
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  } finally {
    await browser.close();
  }
})();