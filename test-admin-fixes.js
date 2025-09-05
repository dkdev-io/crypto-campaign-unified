import puppeteer from 'puppeteer';

async function testAdminFixes() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Clear any existing authentication state
    console.log('🔍 Clearing authentication state...');
    await page.goto('http://localhost:5173');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    console.log('🔍 Testing /minda route authentication...');
    
    // Test 1: /minda should redirect to login when not authenticated
    await page.goto('http://localhost:5173/minda');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const currentUrl = page.url();
    console.log('Current URL after /minda redirect:', currentUrl);
    
    if (currentUrl.includes('/minda/login')) {
      console.log('✅ /minda correctly redirects to login page');
    } else {
      console.log('❌ /minda did not redirect to login page');
    }
    
    // Test 2: Login with test credentials
    console.log('🔍 Testing login...');
    
    await page.type('input[name="email"]', 'test@dkdev.io');
    await page.type('input[name="password"]', 'TestDonor123!');
    await page.click('button[type="submit"]');
    
    // Wait for navigation or dashboard to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const dashboardUrl = page.url();
    console.log('URL after login:', dashboardUrl);
    
    if (dashboardUrl.includes('/minda/dashboard')) {
      console.log('✅ Login successful, redirected to dashboard');
      
      // Test 3: Check dashboard layout
      console.log('🔍 Testing dashboard layout...');
      
      // Wait for dashboard content to load
      await page.waitForSelector('.crypto-card', { timeout: 10000 });
      
      // Check if sidebar is visible
      const sidebar = await page.$('.fixed.inset-y-0.left-0');
      if (sidebar) {
        console.log('✅ Sidebar is present');
      }
      
      // Check if main content is properly positioned
      const mainContent = await page.$('main');
      if (mainContent) {
        const mainBounds = await mainContent.boundingBox();
        console.log('Main content position:', { x: mainBounds.x, y: mainBounds.y });
        
        if (mainBounds.x > 200) { // Should be positioned after sidebar
          console.log('✅ Main content is properly positioned after sidebar');
        } else {
          console.log('❌ Main content may be overlapping with sidebar');
        }
      }
      
      // Check if dashboard header is visible and properly positioned
      const dashboardHeader = await page.textContent('h2');
      if (dashboardHeader && dashboardHeader.includes('Dashboard')) {
        console.log('✅ Dashboard header is visible');
      }
      
      // Test 4: Test /minda redirect when authenticated
      console.log('🔍 Testing /minda redirect when authenticated...');
      
      await page.goto('http://localhost:5173/minda');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const authenticatedRedirectUrl = page.url();
      console.log('URL after /minda when authenticated:', authenticatedRedirectUrl);
      
      if (authenticatedRedirectUrl.includes('/minda/dashboard')) {
        console.log('✅ /minda correctly redirects to dashboard when authenticated');
      } else {
        console.log('❌ /minda did not redirect to dashboard when authenticated');
      }
      
    } else {
      console.log('❌ Login failed or did not redirect to dashboard');
    }
    
    console.log('🎉 Admin fixes verification complete!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await browser.close();
  }
}

testAdminFixes().catch(console.error);