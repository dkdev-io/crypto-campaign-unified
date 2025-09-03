import puppeteer from 'puppeteer';

async function testLoginExisting() {
  console.log('Testing login with existing account...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  try {
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth/setup');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try login with the account we just created
    await page.click('input[name="email"]', { clickCount: 3 });
    await page.type('input[name="email"]', 'test456@dkdev.io');
    
    await page.click('input[name="password"]', { clickCount: 3 });
    await page.type('input[name="password"]', 'TestPassword123!');
    
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check if we reach setup wizard
    const pageText = await page.evaluate(() => document.body.textContent);
    const hasSetupWizard = pageText.includes('Campaign Setup') || 
                          pageText.includes('Step') ||
                          pageText.includes('Committee');
    
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    console.log(`Reached setup wizard: ${hasSetupWizard}`);
    
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/login-test-result.png',
      fullPage: true 
    });
    
    return hasSetupWizard;
    
  } catch (error) {
    console.error('Login test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testLoginExisting().then(success => {
  console.log(`Login test: ${success ? 'WORKING' : 'BROKEN'}`);
  process.exit(success ? 0 : 1);
});