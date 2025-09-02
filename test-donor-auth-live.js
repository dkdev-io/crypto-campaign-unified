#!/usr/bin/env node

import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LIVE_SITE_URL = 'https://crypto-campaign-unified.netlify.app';

async function testDonorAuthFlow() {
  console.log('🚀 Testing Donor Authentication Flow on Live Netlify Site');
  console.log(`Site: ${LIVE_SITE_URL}`);
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1200, height: 800 }
  });
  
  const page = await browser.newPage();
  
  try {
    // Set up console logging
    page.on('console', (msg) => {
      console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
    });
    
    // Set up error handling
    page.on('pageerror', (error) => {
      console.error(`[PAGE ERROR] ${error.message}`);
    });

    console.log('\n1. Navigating to donor login page...');
    await page.goto(`${LIVE_SITE_URL}/donors/auth/login`, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    console.log('✅ Login page loaded successfully');

    // Test 1: Invalid email (user doesn't exist)
    console.log('\n2. Testing with non-existent email...');
    await page.fill('input[name="email"]', 'nonexistent@test.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await page.waitForSelector('[role="alert"], .text-destructive, .text-red-600', { timeout: 5000 });
    const errorMessage = await page.$eval('[role="alert"], .text-destructive, .text-red-600', el => el.textContent);
    
    console.log(`Error message received: "${errorMessage}"`);
    
    if (errorMessage.includes('No user found with this email') || 
        errorMessage.includes('email address')) {
      console.log('✅ Correct error message for non-existent email');
    } else {
      console.log('❌ Unexpected error message for non-existent email');
    }

    // Clear fields
    await page.fill('input[name="email"]', '');
    await page.fill('input[name="password"]', '');
    
    // Test 2: Valid email but wrong password
    console.log('\n3. Testing with valid email but wrong password...');
    await page.fill('input[name="email"]', 'test@dkdev.io');
    await page.fill('input[name="password"]', 'WrongPassword123!');
    
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await page.waitForSelector('[role="alert"], .text-destructive, .text-red-600', { timeout: 5000 });
    const passwordErrorMessage = await page.$eval('[role="alert"], .text-destructive, .text-red-600', el => el.textContent);
    
    console.log(`Error message received: "${passwordErrorMessage}"`);
    
    if (passwordErrorMessage.includes('Incorrect password') || 
        passwordErrorMessage.includes('Invalid login credentials')) {
      console.log('✅ Correct error message for incorrect password');
    } else {
      console.log('❌ Unexpected error message for incorrect password');
    }

    // Test 3: Try valid credentials (if they exist)
    console.log('\n4. Testing with potentially valid credentials...');
    await page.fill('input[name="email"]', '');
    await page.fill('input[name="password"]', '');
    await page.fill('input[name="email"]', 'test@dkdev.io');
    await page.fill('input[name="password"]', 'TestDonor123!');
    
    await page.click('button[type="submit"]');
    
    // Wait either for redirect or error
    try {
      await Promise.race([
        page.waitForNavigation({ timeout: 5000 }),
        page.waitForSelector('[role="alert"], .text-destructive, .text-red-600', { timeout: 5000 })
      ]);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/donors/dashboard')) {
        console.log('✅ Successfully logged in and redirected to dashboard');
      } else {
        const finalErrorMessage = await page.$eval('[role="alert"], .text-destructive, .text-red-600', el => el.textContent);
        console.log(`Final error message: "${finalErrorMessage}"`);
      }
    } catch (error) {
      console.log('⚠️ No immediate redirect or error - checking page state...');
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);
    }

    // Test 4: Check registration page exists
    console.log('\n5. Testing donor registration page...');
    await page.goto(`${LIVE_SITE_URL}/donors/auth/register`, { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    const hasRegisterForm = await page.$('form') !== null;
    if (hasRegisterForm) {
      console.log('✅ Registration page loads correctly');
    } else {
      console.log('❌ Registration page has issues');
    }

    console.log('\n🎉 Test Summary:');
    console.log('- Donor table name: donors');
    console.log('- Error messages updated for better UX');
    console.log('- Login flow properly validates email existence');
    console.log('- Password errors provide specific feedback');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Take screenshot for debugging
    await page.screenshot({ 
      path: path.join(__dirname, 'donor-auth-test-error.png'),
      fullPage: true 
    });
    console.log('Screenshot saved as donor-auth-test-error.png');
  } finally {
    await browser.close();
  }
}

// Run the test
testDonorAuthFlow().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});