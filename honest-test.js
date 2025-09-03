import puppeteer from 'puppeteer';

async function honestTest() {
  console.log('🔍 HONEST TEST: Does signup actually work?');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  // Log all network requests
  page.on('request', request => {
    console.log(`📤 ${request.method()} ${request.url()}`);
  });
  
  page.on('response', response => {
    console.log(`📥 ${response.status()} ${response.url()}`);
  });
  
  try {
    console.log('\n1. Load page');
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth/setup');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n2. Click Sign Up tab');
    const buttons = await page.$$('button');
    for (let button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('Sign Up')) {
        await button.click();
        break;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n3. Fill form');
    await page.type('input[name="fullName"]', 'Honest Test');
    await page.type('input[name="email"]', 'honest@test.com');  
    await page.type('input[name="password"]', 'TestPass123!');
    await page.type('input[name="confirmPassword"]', 'TestPass123!');
    
    console.log('\n4. Submit');
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log('\n5. Check what happened');
    const text = await page.evaluate(() => document.body.textContent);
    
    const hasSuccess = text.includes('Account created') || text.includes('check your email');
    const hasError = text.includes('error') || text.includes('Error') || text.includes('failed');
    
    console.log(`Success message: ${hasSuccess}`);
    console.log(`Error message: ${hasError}`);
    console.log(`Current URL: ${page.url()}`);
    
    // Take screenshot
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/honest-test-result.png',
      fullPage: true 
    });
    
    return { success: hasSuccess, error: hasError };
    
  } catch (error) {
    console.error('Test failed:', error.message);
    return { success: false, error: true, exception: error.message };
  } finally {
    // Keep open for inspection
    console.log('\nBrowser staying open...');
  }
}

honestTest().then(result => {
  console.log('\n🎯 HONEST RESULT:');
  console.log(`Does signup work? ${result.success ? 'YES' : 'NO'}`);
  console.log(`Any errors? ${result.error ? 'YES' : 'NO'}`);
  if (result.exception) {
    console.log(`Exception: ${result.exception}`);
  }
});