const puppeteer = require('puppeteer');

async function testAdminDashboard() {
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    const testResults = {
      loginTest: false,
      dashboardLoad: false,
      supabaseConnection: false,
      dataDisplay: false,
      navigationLinks: {},
      quickActions: {},
      errors: []
    };
    
    console.log('🚀 Starting Admin Dashboard Testing...');
    
    // Test 1: Navigate to admin login
    console.log('\n1. Testing admin login access...');
    await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle0' });
    
    // Check if login page loads
    const loginForm = await page.$('form');
    if (loginForm) {
      console.log('✅ Admin login page loads correctly');
      testResults.loginTest = true;
    } else {
      console.log('❌ Admin login page failed to load');
      testResults.errors.push('Login form not found');
    }
    
    // Test 2: Attempt login with credentials
    console.log('\n2. Testing admin login functionality...');
    try {
      await page.type('input[name="email"]', 'dan@dkdev.io');
      await page.type('input[name="password"]', 'admin123');
      await page.click('button[type="submit"]');
      
      // Wait for navigation to dashboard
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin/dashboard')) {
        console.log('✅ Login successful, redirected to dashboard');
        testResults.dashboardLoad = true;
      } else {
        console.log('❌ Login failed or redirect failed');
        testResults.errors.push('Login/redirect failed');
      }
    } catch (error) {
      console.log('❌ Login test failed:', error.message);
      testResults.errors.push(`Login error: ${error.message}`);
    }
    
    // Test 3: Check dashboard content and Supabase connectivity
    console.log('\n3. Testing dashboard content and Supabase...');
    try {
      // Check for stat cards
      const statCards = await page.$$('.crypto-card');
      console.log(`Found ${statCards.length} stat cards`);
      
      // Check for database error messages
      const databaseError = await page.$text => {
        return document.body.innerText.includes('Database not configured') || 
               document.body.innerText.includes('Error loading data');
      });
      
      if (databaseError) {
        console.log('❌ Database connection issues detected');
        testResults.supabaseConnection = false;
        testResults.errors.push('Supabase connection error');
      } else {
        console.log('✅ No database errors visible');
        testResults.supabaseConnection = true;
      }
      
      // Check if data is displaying (not just zeros)
      const statsData = await page.evaluate(() => {
        const statElements = document.querySelectorAll('.crypto-card .text-3xl');
        return Array.from(statElements).map(el => el.textContent.trim());
      });
      
      console.log('Stats displayed:', statsData);
      const hasRealData = statsData.some(stat => stat !== '0' && stat !== '$0');
      
      if (hasRealData) {
        console.log('✅ Dashboard showing real data');
        testResults.dataDisplay = true;
      } else {
        console.log('⚠️ Dashboard showing zero values (may indicate connection issues)');
        testResults.dataDisplay = false;
      }
      
    } catch (error) {
      console.log('❌ Dashboard content test failed:', error.message);
      testResults.errors.push(`Dashboard error: ${error.message}`);
    }
    
    // Test 4: Test navigation links
    console.log('\n4. Testing navigation links...');
    const navigationItems = [
      { name: 'Dashboard', href: '/admin/dashboard' },
      { name: 'Users', href: '/admin/users' },
      { name: 'Campaigns', href: '/admin/campaigns' },
      { name: 'Transactions', href: '/admin/transactions' },
      { name: 'Analytics', href: '/admin/analytics' },
      { name: 'Settings', href: '/admin/settings' }
    ];
    
    for (const item of navigationItems) {
      try {
        console.log(`Testing ${item.name} link...`);
        await page.click(`a[href="${item.href}"]`);
        await page.waitForTimeout(2000); // Wait for page to load
        
        const currentUrl = page.url();
        if (currentUrl.includes(item.href)) {
          console.log(`✅ ${item.name} navigation works`);
          testResults.navigationLinks[item.name] = true;
        } else {
          console.log(`❌ ${item.name} navigation failed`);
          testResults.navigationLinks[item.name] = false;
        }
      } catch (error) {
        console.log(`❌ ${item.name} link test failed:`, error.message);
        testResults.navigationLinks[item.name] = false;
        testResults.errors.push(`${item.name} nav error: ${error.message}`);
      }
    }
    
    // Test 5: Test quick action buttons
    console.log('\n5. Testing quick action buttons...');
    await page.goto('http://localhost:5173/admin/dashboard', { waitUntil: 'networkidle0' });
    
    const quickActions = ['New Campaign', 'Add User', 'Export Report', 'Settings'];
    for (const action of quickActions) {
      try {
        const button = await page.$(`button:contains("${action}")`);
        if (button) {
          console.log(`✅ ${action} button found`);
          testResults.quickActions[action] = true;
        } else {
          console.log(`❌ ${action} button not found`);
          testResults.quickActions[action] = false;
        }
      } catch (error) {
        console.log(`❌ ${action} button test failed:`, error.message);
        testResults.quickActions[action] = false;
      }
    }
    
    // Test 6: Check console errors
    console.log('\n6. Checking for console errors...');
    const logs = await page.evaluate(() => {
      return window.console._logs || [];
    });
    
    // Listen for console errors during testing
    page.on('console', message => {
      if (message.type() === 'error') {
        console.log('🔴 Console Error:', message.text());
        testResults.errors.push(`Console: ${message.text()}`);
      }
    });
    
    // Final results
    console.log('\n📊 TEST RESULTS SUMMARY:');
    console.log('========================');
    console.log(`Login Test: ${testResults.loginTest ? '✅' : '❌'}`);
    console.log(`Dashboard Load: ${testResults.dashboardLoad ? '✅' : '❌'}`);
    console.log(`Supabase Connection: ${testResults.supabaseConnection ? '✅' : '❌'}`);
    console.log(`Data Display: ${testResults.dataDisplay ? '✅' : '❌'}`);
    console.log('\nNavigation Links:');
    Object.entries(testResults.navigationLinks).forEach(([name, working]) => {
      console.log(`  ${name}: ${working ? '✅' : '❌'}`);
    });
    console.log('\nQuick Actions:');
    Object.entries(testResults.quickActions).forEach(([name, working]) => {
      console.log(`  ${name}: ${working ? '✅' : '❌'}`);
    });
    
    if (testResults.errors.length > 0) {
      console.log('\n🔴 ERRORS FOUND:');
      testResults.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    return testResults;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    return { error: error.message };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testAdminDashboard().then(results => {
  console.log('\n✅ Admin Dashboard Testing Complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Testing failed:', error);
  process.exit(1);
});