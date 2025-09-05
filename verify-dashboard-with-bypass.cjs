const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    // Set localStorage to bypass auth
    await page.evaluateOnNewDocument(() => {
      // Set the bypass auth environment
      window.VITE_SKIP_AUTH = 'true';
      // Set admin user in localStorage
      localStorage.setItem('admin_user', JSON.stringify({
        id: 'test-admin-bypass-id',
        email: 'test@dkdev.io',
        full_name: 'Test Admin (Bypass)',
        role: 'super_admin',
        permissions: ['admin', 'export', 'view', 'manage', 'super_admin']
      }));
    });

    // Navigate to dashboard
    await page.goto('http://localhost:5173/minda/dashboard', { waitUntil: 'networkidle0', timeout: 15000 });
    
    // Take screenshot
    await page.screenshot({ path: 'dashboard-layout-verification.png', fullPage: true });
    console.log('✅ Dashboard screenshot with bypass saved');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();