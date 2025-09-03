import puppeteer from 'puppeteer';

async function testTermsCheckbox() {
  console.log('Testing terms checkbox validation...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.text().includes('error') || msg.text().includes('validation')) {
      console.log(`BROWSER: ${msg.text()}`);
    }
  });
  
  try {
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth/setup');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Click Sign Up tab
    const buttons = await page.$$('button');
    for (let button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.trim() === 'Sign Up') {
        await button.click();
        break;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Fill form but leave terms unchecked
    await page.type('input[name="fullName"]', 'Test User');
    await page.type('input[name="email"]', 'test456@dkdev.io');
    await page.type('input[name="password"]', 'TestPassword123!');
    await page.type('input[name="confirmPassword"]', 'TestPassword123!');
    
    console.log('Form filled, terms unchecked');
    
    // Try to submit without checking terms
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/terms-unchecked.png',
      fullPage: true 
    });
    
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for validation error message
    const pageText = await page.evaluate(() => document.body.textContent);
    const hasTermsError = pageText.includes('must agree to the terms') || 
                         pageText.includes('terms and conditions');
    
    console.log(`Terms validation error shown: ${hasTermsError}`);
    
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/terms-error.png',
      fullPage: true 
    });
    
    if (!hasTermsError) {
      console.log('ERROR: Terms validation not working');
      return false;
    }
    
    // Now check the checkbox and try again
    console.log('Checking terms checkbox...');
    await page.click('input[name="agreeToTerms"]');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Submit again with terms checked
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    const finalText = await page.evaluate(() => document.body.textContent);
    const hasSuccess = finalText.includes('Account created') || 
                      finalText.includes('check your email');
    
    console.log(`Account creation successful: ${hasSuccess}`);
    
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/terms-checked.png',
      fullPage: true 
    });
    
    return hasSuccess;
    
  } catch (error) {
    console.error('Test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testTermsCheckbox().then(success => {
  console.log(`Terms checkbox test: ${success ? 'WORKING' : 'BROKEN'}`);
  process.exit(success ? 0 : 1);
});