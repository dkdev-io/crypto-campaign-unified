#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testAdminDashboard() {
  console.log('🚀 Testing Admin Dashboard on Production');
  console.log('==========================================');
  
  let browser;
  let page;
  
  try {
    // Launch browser
    console.log('🔧 Launching Puppeteer...');
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 50,
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('🔴 Browser Error:', msg.text());
      } else if (msg.text().includes('ADMIN') || msg.text().includes('BYPASS')) {
        console.log('📝 Browser Log:', msg.text());
      }
    });

    // Test 1: Navigate to admin login page
    console.log('\n1️⃣ Testing Admin Login Page...');
    const loginUrl = 'https://cryptocampaign.netlify.app/minda';
    console.log(`   Navigating to: ${loginUrl}`);
    
    await page.goto(loginUrl, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    // Check if login page loads
    const loginPageTitle = await page.title();
    console.log(`   ✅ Page loaded: ${loginPageTitle}`);

    // Look for login form elements
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    const passwordInput = await page.$('input[type="password"], input[name="password"]');
    const loginButton = await page.$('button[type="submit"]') || await page.$('button');

    if (emailInput && passwordInput) {
      console.log('   ✅ Login form found');
      
      // Test 2: Attempt login with admin credentials
      console.log('\n2️⃣ Testing Admin Login...');
      await page.type('input[type="email"], input[name="email"]', 'test@dkdev.io');
      await page.type('input[type="password"], input[name="password"]', 'TestDonor123!');
      
      console.log('   📝 Credentials entered: test@dkdev.io');
      
      if (loginButton) {
        await loginButton.click();
        console.log('   🔄 Login button clicked');
        
        // Wait for navigation or dashboard to load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check current URL
        const currentUrl = page.url();
        console.log(`   📍 Current URL: ${currentUrl}`);
        
        // Test 3: Check if redirected to dashboard
        if (currentUrl.includes('/minda/dashboard') || currentUrl.includes('dashboard')) {
          console.log('   ✅ Successfully redirected to dashboard!');
          
          console.log('\n3️⃣ Testing Dashboard Content...');
          
          // Check for dashboard elements
          const dashboardTitle = await page.$eval('h1, h2, [class*="dashboard"], [class*="Dashboard"]', el => el.textContent).catch(() => null);
          if (dashboardTitle) {
            console.log(`   ✅ Dashboard title found: ${dashboardTitle}`);
          }
          
          // Look for stat cards or dashboard widgets
          const statCards = await page.$$('[class*="card"], [class*="stat"], [class*="widget"]');
          console.log(`   📊 Found ${statCards.length} dashboard widgets/cards`);
          
          // Check for navigation sidebar
          const sidebar = await page.$('[class*="sidebar"], nav, [class*="navigation"]');
          if (sidebar) {
            console.log('   ✅ Navigation sidebar found');
          }
          
          // Take screenshot
          console.log('\n4️⃣ Taking Screenshots...');
          await page.screenshot({ 
            path: 'admin-dashboard-production-test.png',
            fullPage: true
          });
          console.log('   📸 Screenshot saved: admin-dashboard-production-test.png');
          
        } else if (currentUrl.includes('/minda')) {
          console.log('   ⚠️  Still on login page - checking for error messages');
          
          const errorMessage = await page.$eval('[class*="error"], [class*="alert"], .text-red', el => el.textContent).catch(() => null);
          if (errorMessage) {
            console.log(`   🔴 Error message: ${errorMessage}`);
          }
          
          // Check if auth bypass is working
          console.log('   🔍 Checking auth bypass configuration...');
          const authBypassStatus = await page.evaluate(() => {
            return {
              skipAuth: import.meta?.env?.VITE_SKIP_AUTH || 'undefined',
              isDev: import.meta?.env?.DEV || 'undefined',
              mode: import.meta?.env?.MODE || 'undefined'
            };
          }).catch(() => ({ error: 'Could not access env variables' }));
          
          console.log('   🔧 Auth bypass status:', authBypassStatus);
        }
        
      } else {
        console.log('   ❌ Login button not found');
      }
      
    } else {
      console.log('   ❌ Login form not found');
      
      // Check if already logged in or auth bypass active
      const currentUrl = page.url();
      if (currentUrl.includes('dashboard')) {
        console.log('   ✅ Appears to be already logged in via auth bypass!');
      }
    }

    // Test 4: Direct dashboard access test
    console.log('\n5️⃣ Testing Direct Dashboard Access...');
    const dashboardUrl = 'https://cryptocampaign.netlify.app/minda/dashboard';
    console.log(`   Navigating directly to: ${dashboardUrl}`);
    
    await page.goto(dashboardUrl, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    const finalUrl = page.url();
    console.log(`   📍 Final URL: ${finalUrl}`);
    
    if (finalUrl.includes('dashboard')) {
      console.log('   ✅ Direct dashboard access successful!');
      
      // Take final screenshot
      await page.screenshot({ 
        path: 'admin-dashboard-direct-access-test.png',
        fullPage: true
      });
      console.log('   📸 Screenshot saved: admin-dashboard-direct-access-test.png');
      
    } else {
      console.log('   ⚠️  Redirected away from dashboard - auth may be required');
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    if (page) {
      await page.screenshot({ 
        path: 'admin-dashboard-error.png',
        fullPage: true
      });
      console.log('📸 Error screenshot saved: admin-dashboard-error.png');
    }
  } finally {
    if (browser) {
      console.log('\n🏁 Closing browser...');
      await browser.close();
    }
  }

  console.log('\n📋 TEST SUMMARY:');
  console.log('- Admin login page accessibility');
  console.log('- Login form functionality');
  console.log('- Dashboard access and content');
  console.log('- Auth bypass configuration');
  console.log('- Screenshots captured for review');
  
  console.log('\n✅ Admin dashboard production test completed!');
}

// Run the test
testAdminDashboard().catch(console.error);