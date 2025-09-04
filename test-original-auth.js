import puppeteer from 'puppeteer';

async function testOriginalAuth() {
  console.log('🔍 TESTING ORIGINAL AUTH (BYPASS DISABLED)');
  console.log('=' * 50);
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Capture console messages
    page.on('console', msg => {
      console.log(`BROWSER: ${msg.text()}`);
    });
    
    // Capture errors
    page.on('pageerror', error => {
      console.log('PAGE ERROR:', error.message);
    });
    
    console.log('\n1. Testing /donors/auth...');
    await page.goto('http://localhost:5174/donors/auth', { 
      waitUntil: 'networkidle2',
      timeout: 15000 
    });
    
    // Wait for page to settle
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const donorUrl = page.url();
    console.log('Current URL:', donorUrl);
    
    // Check if we can access the form now
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    const submitButton = await page.$('button[type="submit"]');
    
    console.log(`Email input: ${!!emailInput ? '✅' : '❌'}`);
    console.log(`Password input: ${!!passwordInput ? '✅' : '❌'}`);  
    console.log(`Submit button: ${!!submitButton ? '✅' : '❌'}`);
    
    if (emailInput && passwordInput && submitButton) {
      console.log('\n2. Attempting login with original auth...');
      
      // Clear any existing values
      await page.evaluate(() => {
        document.querySelectorAll('input').forEach(input => input.value = '');
      });
      
      await page.type('input[type="email"]', 'test@dkdev.io', { delay: 50 });
      await page.type('input[type="password"]', 'TestDonor123!', { delay: 50 });
      
      console.log('✅ Entered credentials');
      
      // Take screenshot before submit
      await page.screenshot({ path: 'before-original-login.png', fullPage: true });
      
      // Submit form
      await submitButton.click();
      
      // Wait for result
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const afterUrl = page.url();
      console.log('After login URL:', afterUrl);
      
      // Take screenshot after submit
      await page.screenshot({ path: 'after-original-login.png', fullPage: true });
      
      if (afterUrl.includes('/donors/dashboard')) {
        console.log('🎉 LOGIN SUCCESS - Redirected to dashboard');
        return { success: true, reason: 'Original auth working' };
      } else if (afterUrl === donorUrl) {
        // Check for error messages
        const errorElement = await page.$('.text-destructive');
        if (errorElement) {
          const errorText = await page.evaluate(el => el.textContent, errorElement);
          console.log('❌ LOGIN FAILED:', errorText);
          return { success: false, reason: `Login error: ${errorText}` };
        } else {
          console.log('❌ LOGIN FAILED - No redirect, no error');
          return { success: false, reason: 'Silent login failure' };
        }
      } else {
        console.log('⚠️ Unexpected redirect to:', afterUrl);
        return { success: false, reason: `Unexpected redirect: ${afterUrl}` };
      }
    } else {
      console.log('❌ Form elements still missing');
      
      // Check what's actually on the page
      const h1 = await page.$eval('h1', el => el?.textContent).catch(() => 'No H1');
      const h2 = await page.$eval('h2', el => el?.textContent).catch(() => 'No H2');
      const bodyText = await page.$eval('body', el => el.innerText.substring(0, 200));
      
      console.log('Page content:');
      console.log('H1:', h1);
      console.log('H2:', h2);
      console.log('Body:', bodyText);
      
      return { success: false, reason: 'Auth form not rendering' };
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { success: false, reason: `Test error: ${error.message}` };
  } finally {
    console.log('\nClosing browser in 10 seconds...');
    setTimeout(() => browser.close(), 10000);
  }
}

testOriginalAuth().then(result => {
  console.log('\n' + '=' * 60);
  if (result.success) {
    console.log('🎉 ORIGINAL AUTH TEST: SUCCESS');
    console.log(`✅ ${result.reason}`);
  } else {
    console.log('💥 ORIGINAL AUTH TEST: FAILED');
    console.log(`❌ ${result.reason}`);
  }
  console.log('=' * 60);
  
  // Restore bypass after test
  console.log('\n⚠️  Remember to restore VITE_SKIP_AUTH=true for continued development');
}).catch(console.error);