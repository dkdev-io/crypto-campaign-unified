import puppeteer from 'puppeteer';

async function debugDonorAuth() {
  console.log('🔍 DEBUG: Donor Auth Error Investigation\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 100
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    page.on('requestfailed', request => console.log('REQUEST FAILED:', request.failure()));
    
    await page.goto('https://cryptocampaign.netlify.app/donors/auth');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Click Sign Up tab
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const signUpBtn = buttons.find(btn => btn.textContent.includes('Sign Up'));
      if (signUpBtn) signUpBtn.click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('📝 Filling form and submitting...');
    
    // Fill form
    await page.type('input[name="fullName"]', 'Debug Test User');
    await page.type('input[name="email"]', 'test@dkdev.io');
    await page.type('input[name="phone"]', '555-0123');
    await page.type('input[name="password"]', 'TestPassword123!');
    await page.type('input[name="confirmPassword"]', 'TestPassword123!');
    await page.click('input[name="agreeToTerms"]');
    
    console.log('🚀 Submitting form...');
    await page.click('button[type="submit"]');
    
    // Wait and check for errors
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check for error messages
    const errorMessages = await page.evaluate(() => {
      const errorElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent;
        return text.includes('error') || text.includes('Error') || text.includes('failed') || text.includes('Failed');
      });
      
      return errorElements.map(el => ({
        tag: el.tagName,
        text: el.textContent.trim().substring(0, 100),
        className: el.className
      }));
    });
    
    console.log('\n🔍 Error elements found:', errorMessages.length);
    errorMessages.forEach((error, i) => {
      console.log(`${i + 1}. ${error.tag} (${error.className}): ${error.text}`);
    });
    
    // Check network requests
    const networkLogs = [];
    page.on('response', response => {
      if (response.url().includes('supabase') || response.url().includes('auth')) {
        networkLogs.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    // Take screenshot
    await page.screenshot({ path: 'donor-debug.png', fullPage: true });
    console.log('\n📸 Screenshot saved: donor-debug.png');
    
    // Get current URL and page text
    console.log('\n📍 Current URL:', page.url());
    const pageText = await page.evaluate(() => document.body.textContent);
    console.log('📄 Page contains "error":', pageText.toLowerCase().includes('error'));
    console.log('📄 Page contains "failed":', pageText.toLowerCase().includes('failed'));
    
    console.log('\n⏰ Keeping browser open for inspection...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  } finally {
    await browser.close();
  }
}

debugDonorAuth();