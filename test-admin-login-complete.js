#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testAdminLoginComplete() {
  console.log('🚀 Testing Complete Admin Login Flow');
  console.log('=====================================');
  
  let browser;
  let page;
  
  try {
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 100,
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('🔴 Browser Error:', msg.text());
      } else if (msg.text().includes('ADMIN') || msg.text().includes('LOGIN') || msg.text().includes('dashboard')) {
        console.log('📝 Browser Log:', msg.text());
      }
    });

    console.log('\n1️⃣ Navigating to Admin Login...');
    await page.goto('https://cryptocampaign.netlify.app/minda', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    console.log('   ✅ Login page loaded');

    // Wait for form to be fully loaded
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    console.log('   ✅ Login form detected');

    console.log('\n2️⃣ Entering Admin Credentials...');
    
    // Clear any existing text and type credentials carefully
    await page.click('input[type="email"]');
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await page.type('input[type="email"]', 'test@dkdev.io', { delay: 50 });
    
    await page.click('input[type="password"]');
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await page.type('input[type="password"]', 'TestDonor123!', { delay: 50 });
    
    console.log('   📝 Credentials entered');

    // Take screenshot before login attempt
    await page.screenshot({ 
      path: 'before-login-attempt.png',
      fullPage: true
    });
    console.log('   📸 Screenshot before login: before-login-attempt.png');

    console.log('\n3️⃣ Attempting Login...');
    
    // Find and click the login button
    const loginButton = await page.waitForSelector('button[type="submit"]', { timeout: 5000 });
    await loginButton.click();
    console.log('   🔄 Login button clicked');

    // Wait for potential navigation or error messages
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const currentUrl = page.url();
    console.log(`   📍 URL after login attempt: ${currentUrl}`);

    if (currentUrl.includes('/dashboard')) {
      console.log('   ✅ SUCCESS: Redirected to dashboard!');
      
      console.log('\n4️⃣ Exploring Dashboard...');
      
      // Wait for dashboard to fully load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Look for dashboard elements
      const dashboardContent = await page.evaluate(() => {
        const title = document.querySelector('h1, h2, [class*="dashboard"]')?.textContent || 'No title found';
        const cards = document.querySelectorAll('[class*="card"], [class*="stat"]').length;
        const sidebar = document.querySelector('[class*="sidebar"], nav') ? 'Present' : 'Not found';
        
        return { title, cards, sidebar };
      });
      
      console.log('   📊 Dashboard content:', dashboardContent);
      
      // Take dashboard screenshot
      await page.screenshot({ 
        path: 'admin-dashboard-success.png',
        fullPage: true
      });
      console.log('   📸 Dashboard screenshot: admin-dashboard-success.png');
      
    } else {
      console.log('   ⚠️  Still on login page - checking for issues');
      
      // Check for error messages
      const errorElement = await page.$('[class*="error"], [class*="alert"], [role="alert"]');
      if (errorElement) {
        const errorText = await errorElement.evaluate(el => el.textContent);
        console.log(`   🔴 Error message: ${errorText}`);
      } else {
        console.log('   ℹ️  No visible error messages');
      }
      
      // Take screenshot of current state
      await page.screenshot({ 
        path: 'login-failed-state.png',
        fullPage: true
      });
      console.log('   📸 Current state screenshot: login-failed-state.png');
      
      // Check if we need to investigate further
      console.log('\n5️⃣ Investigating Login Issue...');
      
      // Check form validation
      const emailInput = await page.$('input[type="email"]');
      const emailValue = await emailInput.evaluate(el => el.value);
      const emailValid = await emailInput.evaluate(el => el.validity.valid);
      
      console.log(`   📧 Email value: "${emailValue}"`);
      console.log(`   ✅ Email valid: ${emailValid}`);
      
      const passwordInput = await page.$('input[type="password"]');
      const passwordValue = await passwordInput.evaluate(el => el.value.length);
      
      console.log(`   🔐 Password length: ${passwordValue}`);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    
    if (page) {
      await page.screenshot({ 
        path: 'admin-test-error.png',
        fullPage: true
      });
      console.log('📸 Error screenshot: admin-test-error.png');
    }
  } finally {
    if (browser) {
      console.log('\n🏁 Test completed - closing browser in 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      await browser.close();
    }
  }
}

testAdminLoginComplete().catch(console.error);