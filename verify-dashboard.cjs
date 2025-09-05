const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    // Try dashboard with bypass parameter first
    await page.goto('http://localhost:5173/minda/dashboard?bypass=true', { waitUntil: 'networkidle0', timeout: 10000 });
    await page.screenshot({ path: 'dashboard-layout-verification.png', fullPage: true });
    console.log('✅ Dashboard with bypass screenshot saved');
  } catch (error) {
    console.log('❌ Error with bypass:', error.message);
    
    // Try logging in normally
    try {
      await page.goto('http://localhost:5173/minda', { waitUntil: 'networkidle0' });
      
      // Wait for form elements
      await page.waitForSelector('input[type="email"]', { timeout: 5000 });
      await page.type('input[type="email"]', 'test@dkdev.io');
      await page.type('input[type="password"]', '............');
      
      // Find and click the sign in button
      await page.waitForSelector('button', { timeout: 5000 });
      const buttons = await page.$$('button');
      for (let button of buttons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text.includes('Sign In')) {
          await button.click();
          break;
        }
      }
      
      // Wait and try to go to dashboard
      await new Promise(resolve => setTimeout(resolve, 2000));
      await page.goto('http://localhost:5173/minda/dashboard', { waitUntil: 'networkidle0' });
      
      await page.screenshot({ path: 'dashboard-layout-verification.png', fullPage: true });
      console.log('✅ Dashboard after login screenshot saved');
      
    } catch (loginError) {
      console.log('❌ Login error:', loginError.message);
    }
  } finally {
    await browser.close();
  }
})();