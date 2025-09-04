const puppeteer = require('puppeteer');

(async () => {
  console.log('🔍 Testing Admin Functionality on localhost:5173...\n');

  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });

  try {
    const page = await browser.newPage();
    
    // Test 1: Check admin login page loads
    console.log('📝 Test 1: Loading admin login page...');
    await page.goto('http://localhost:5173/minda');
    await page.waitForSelector('h2', { timeout: 10000 });
    
    const loginTitle = await page.$eval('h2', el => el.textContent);
    console.log(`✅ Login page loaded: "${loginTitle}"`);
    
    // Test 2: Check if credentials are pre-filled
    console.log('\n📝 Test 2: Checking pre-filled credentials...');
    const email = await page.$eval('input[name="email"]', el => el.value);
    const password = await page.$eval('input[name="password"]', el => el.value);
    console.log(`📧 Email: ${email}`);
    console.log(`🔐 Password: ${password ? '*'.repeat(password.length) : 'EMPTY'}`);
    
    // Test 3: Attempt login
    console.log('\n📝 Test 3: Attempting login...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation or error
    try {
      await page.waitForNavigation({ timeout: 5000 });
      const currentUrl = page.url();
      console.log(`🔄 Navigation successful to: ${currentUrl}`);
      
      if (currentUrl.includes('/minda/dashboard')) {
        console.log('✅ Successfully redirected to dashboard!');
        
        // Test 4: Check dashboard content
        console.log('\n📝 Test 4: Checking dashboard content...');
        await page.waitForSelector('h2', { timeout: 5000 });
        const dashboardTitle = await page.$eval('h2', el => el.textContent);
        console.log(`📊 Dashboard title: "${dashboardTitle}"`);
        
        // Check for navigation items
        const navItems = await page.$$eval('nav a', links => links.map(link => link.textContent));
        console.log(`📋 Navigation items: ${navItems.join(', ')}`);
        
      } else {
        console.log('❌ Login failed - not redirected to dashboard');
      }
      
    } catch (navError) {
      console.log('❌ No navigation occurred - checking for errors...');
      
      // Check for error messages
      const errorElement = await page.$('.text-red-800');
      if (errorElement) {
        const errorText = await page.$eval('.text-red-800', el => el.textContent);
        console.log(`❌ Login error: ${errorText}`);
      }
    }
    
    // Test 5: Check protection - try to access dashboard directly
    console.log('\n📝 Test 5: Testing route protection...');
    await page.goto('http://localhost:5173/minda/dashboard');
    await page.waitForSelector('body', { timeout: 5000 });
    
    const protectedUrl = page.url();
    console.log(`🔒 After direct access attempt: ${protectedUrl}`);
    
    if (protectedUrl.includes('/minda/dashboard')) {
      console.log('✅ Dashboard accessible (user is authenticated)');
    } else if (protectedUrl.includes('/minda') && !protectedUrl.includes('/dashboard')) {
      console.log('🔒 Dashboard protected - redirected to login');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n🏁 Admin functionality test complete!');
  await browser.close();
})();