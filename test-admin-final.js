#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testAdminFinal() {
  console.log('🚀 Final Admin Login Test with Proper Field Clearing');
  console.log('==================================================');
  
  let browser;
  let page;
  
  try {
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 200,
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    
    page.on('console', msg => {
      if (msg.text().includes('ADMIN') || msg.text().includes('LOGIN') || msg.text().includes('dashboard')) {
        console.log('📝 Browser:', msg.text());
      }
    });

    console.log('\n1️⃣ Loading Admin Login Page...');
    await page.goto('https://cryptocampaign.netlify.app/minda', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    console.log('   ✅ Login form ready');

    console.log('\n2️⃣ Clearing and Entering Credentials...');
    
    // Clear email field completely and enter correct email
    const emailInput = await page.$('input[type="email"]');
    await emailInput.click({ clickCount: 3 }); // Triple click to select all
    await page.keyboard.press('Backspace');
    await page.type('input[type="email"]', 'test@dkdev.io', { delay: 100 });
    
    // Clear password field and enter password
    const passwordInput = await page.$('input[type="password"]');
    await passwordInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('input[type="password"]', 'TestDonor123!', { delay: 100 });
    
    // Verify the values are correct
    const emailValue = await page.$eval('input[type="email"]', el => el.value);
    const passwordLength = await page.$eval('input[type="password"]', el => el.value.length);
    
    console.log(`   📧 Email entered: "${emailValue}"`);
    console.log(`   🔐 Password length: ${passwordLength}`);
    
    if (emailValue !== 'test@dkdev.io') {
      throw new Error(`Email field contains wrong value: "${emailValue}"`);
    }

    console.log('\n3️⃣ Attempting Login...');
    
    const loginButton = await page.$('button[type="submit"]');
    await loginButton.click();
    console.log('   🔄 Login submitted');

    // Wait longer for potential redirect
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    const finalUrl = page.url();
    console.log(`   📍 Final URL: ${finalUrl}`);

    if (finalUrl.includes('/dashboard')) {
      console.log('   🎉 SUCCESS! Logged into admin dashboard!');
      
      // Take success screenshot
      await page.screenshot({ 
        path: 'admin-dashboard-logged-in.png',
        fullPage: true
      });
      console.log('   📸 Dashboard screenshot: admin-dashboard-logged-in.png');
      
      // Explore dashboard content
      const dashboardInfo = await page.evaluate(() => {
        const title = document.querySelector('h1, h2, [class*="dashboard"]')?.textContent || 'No title';
        const statsCards = document.querySelectorAll('[class*="stat"], [class*="card"]').length;
        const sidebarItems = document.querySelectorAll('nav a, [class*="sidebar"] a').length;
        return { title, statsCards, sidebarItems };
      });
      
      console.log('   📊 Dashboard info:', dashboardInfo);
      
    } else {
      console.log('   ❌ Login failed - still on login page');
      
      await page.screenshot({ 
        path: 'admin-login-final-failed.png',
        fullPage: true
      });
      console.log('   📸 Failed state screenshot: admin-login-final-failed.png');
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
    
    if (page) {
      await page.screenshot({ 
        path: 'admin-test-final-error.png',
        fullPage: true
      });
    }
  } finally {
    if (browser) {
      console.log('\n⏰ Keeping browser open for 10 seconds to observe...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      await browser.close();
    }
  }
}

testAdminFinal().catch(console.error);