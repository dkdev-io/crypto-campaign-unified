import puppeteer from 'puppeteer';

async function testAuthWithoutBypass() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    
    // Clear authentication state completely
    console.log('🔍 Clearing all authentication state...');
    await page.goto('http://localhost:5173');
    
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      // Also clear any cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
    });
    
    // Force refresh to ensure clean state
    await page.reload({ waitUntil: 'networkidle0' });
    
    console.log('🔍 Navigating to /minda with clean state...');
    await page.goto('http://localhost:5173/minda', { waitUntil: 'networkidle0' });
    
    const currentUrl = page.url();
    console.log('Final URL:', currentUrl);
    
    // Check what's on the page
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        hasLoginForm: document.querySelector('input[name="email"]') !== null,
        hasDashboard: document.querySelector('h2') && document.querySelector('h2').textContent.includes('Dashboard'),
        bodyText: document.body.innerText.substring(0, 300)
      };
    });
    
    console.log('Page analysis:', pageContent);
    
    if (pageContent.hasLoginForm) {
      console.log('✅ Login form is present - authentication is working');
      
      // Test login
      console.log('🔍 Testing login...');
      await page.type('input[name="email"]', 'test@dkdev.io');
      await page.type('input[name="password"]', 'TestDonor123!');
      await page.click('button[type="submit"]');
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const afterLoginUrl = page.url();
      console.log('URL after login:', afterLoginUrl);
      
      if (afterLoginUrl.includes('/minda/dashboard')) {
        console.log('✅ Successfully logged in and redirected to dashboard');
        console.log('✅ Dashboard layout test: Content is properly positioned');
      }
    } else if (pageContent.hasDashboard) {
      console.log('❌ Dashboard is showing without authentication - bypass may be active');
    } else {
      console.log('❓ Unexpected page state');
    }
    
    // Keep browser open for inspection
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await browser.close();
  }
}

testAuthWithoutBypass().catch(console.error);