import puppeteer from 'puppeteer';

async function testAdminLogin() {
  console.log('🚀 Testing Admin Portal with Puppeteer...\n');

  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Test 1: Navigate to /minda
    console.log('1. Navigating to /minda...');
    await page.goto('https://cryptocampaign.netlify.app/minda', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Check if admin portal loaded
    const title = await page.title();
    console.log(`   Page title: ${title}`);
    
    // Look for admin login form
    const hasAdminPortal = await page.evaluate(() => {
      return document.querySelector('h2') && document.querySelector('h2').textContent.includes('Admin Portal');
    });
    const hasEmailField = await page.$('input[name="email"]') !== null;
    const hasPasswordField = await page.$('input[name="password"]') !== null;
    
    console.log(`   Admin Portal heading: ${hasAdminPortal ? '✅ Found' : '❌ Missing'}`);
    console.log(`   Email field: ${hasEmailField ? '✅ Found' : '❌ Missing'}`);
    console.log(`   Password field: ${hasPasswordField ? '✅ Found' : '❌ Missing'}`);
    
    if (!hasEmailField || !hasPasswordField) {
      console.log('❌ Login form not properly loaded');
      return;
    }

    // Test 2: Fill and submit login form
    console.log('\n2. Testing admin login...');
    
    // Fill in credentials
    await page.type('input[name="email"]', 'dan@dkdev.io');
    await page.type('input[name="password"]', 'admin123');
    
    console.log('   ✅ Filled in credentials');
    
    // Click login button
    await page.click('button[type="submit"]');
    console.log('   ✅ Clicked login button');
    
    // Wait for navigation or error
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/admin/dashboard')) {
      console.log('   ✅ Successfully redirected to dashboard');
      
      // Test 3: Check dashboard content
      console.log('\n3. Testing dashboard content...');
      
      const dashboardText = await page.$eval('body', el => el.textContent);
      
      if (dashboardText.includes('Dashboard Overview')) {
        console.log('   ✅ Dashboard loaded correctly');
      } else {
        console.log('   ❌ Dashboard content missing');
      }
      
      // Test 4: Test Users navigation
      console.log('\n4. Testing Users navigation...');
      
      const usersLink = await page.$('a[href="/admin/users"]');
      if (usersLink) {
        await usersLink.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const usersUrl = page.url();
        console.log(`   Users page URL: ${usersUrl}`);
        
        if (usersUrl.includes('/admin/users')) {
          console.log('   ✅ Users navigation working');
          
          // Check for user data
          const usersPageText = await page.$eval('body', el => el.textContent);
          
          if (usersPageText.includes('Daniel Kelly') || usersPageText.includes('dpeterkelly@gmail.com')) {
            console.log('   ✅ User data displayed correctly');
          } else if (usersPageText.includes('form submission data')) {
            console.log('   ✅ Showing form submission fallback message');
          } else {
            console.log('   ❌ No user data found');
            console.log('   First 200 chars of users page:', usersPageText.substring(0, 200));
          }
        } else {
          console.log('   ❌ Users navigation failed');
        }
      } else {
        console.log('   ❌ Users link not found in sidebar');
      }
      
    } else {
      console.log('   ❌ Login failed - still on login page');
      
      // Check for error messages
      const pageText = await page.$eval('body', el => el.textContent);
      
      // Look for specific error messages
      if (pageText.includes('Failed to fetch')) {
        console.log('   🔍 Found error: Failed to fetch');
      }
      if (pageText.includes('Invalid credentials')) {
        console.log('   🔍 Found error: Invalid credentials');
      }
      if (pageText.includes('Login failed')) {
        console.log('   🔍 Found error: Login failed');
      }
      
      // Check console logs
      const consoleLogs = [];
      page.on('console', msg => consoleLogs.push(msg.text()));
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'login-error.png', fullPage: true });
      console.log('   📸 Screenshot saved as login-error.png');
      
      // Show any console errors
      if (consoleLogs.length > 0) {
        console.log('   📋 Console messages:');
        consoleLogs.forEach(log => console.log('     ', log));
      }
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }

  console.log('\n🎯 Test Complete');
}

testAdminLogin().catch(console.error);