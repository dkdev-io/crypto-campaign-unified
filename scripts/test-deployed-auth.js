#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testDeployedAuth() {
  console.log('🚀 TESTING DEPLOYED SITE AUTHENTICATION');
  console.log('Site: https://cryptocampaign.netlify.app/campaigns/auth');
  console.log('');

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 1000,
    defaultViewport: { width: 1200, height: 800 }
  });

  try {
    const page = await browser.newPage();

    console.log('1. Going to deployed auth page...');
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth', { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Take screenshot of auth page
    await page.screenshot({ path: 'deployed-auth-initial.png' });
    console.log('   ✅ Auth page loaded, screenshot saved');

    console.log('2. Filling login form...');
    
    // Wait for and fill email
    const emailInput = await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await emailInput.click({ clickCount: 3 }); // Select all text
    await emailInput.type('dan@dkdev.io');
    console.log('   ✅ Email filled: dan@dkdev.io');

    // Wait for and fill password
    const passwordInput = await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    await passwordInput.click({ clickCount: 3 }); // Select all text
    await passwordInput.type('DanPassword123!');
    console.log('   ✅ Password filled');

    // Take screenshot before submit
    await page.screenshot({ path: 'deployed-auth-filled.png' });

    console.log('3. Submitting login...');
    
    // Find and click login button - try multiple selectors
    let loginButton;
    try {
      loginButton = await page.waitForSelector('button[type="submit"]', { timeout: 3000 });
    } catch (e) {
      try {
        loginButton = await page.waitForSelector('button:has-text("Sign In")', { timeout: 3000 });
      } catch (e2) {
        try {
          loginButton = await page.waitForSelector('button:has-text("Sign")', { timeout: 3000 });
        } catch (e3) {
          loginButton = await page.$('button'); // Just get any button
        }
      }
    }
    await loginButton.click();
    console.log('   ✅ Login button clicked');

    // Wait for response/redirect
    console.log('4. Waiting for login response...');
    await page.waitForTimeout(5000);

    // Take screenshot after submit
    await page.screenshot({ path: 'deployed-auth-result.png' });

    // Check current URL and page content
    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);

    // Check for success/error indicators
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        bodyText: document.body.textContent.toLowerCase(),
        hasError: document.body.textContent.toLowerCase().includes('error'),
        hasInvalid: document.body.textContent.toLowerCase().includes('invalid'),
        hasNotFound: document.body.textContent.toLowerCase().includes('not found'),
        hasWelcome: document.body.textContent.toLowerCase().includes('welcome'),
        hasDashboard: document.body.textContent.toLowerCase().includes('dashboard'),
        hasSignOut: document.body.textContent.toLowerCase().includes('sign out') || document.body.textContent.toLowerCase().includes('logout'),
        urlChanged: window.location.href !== 'https://cryptocampaign.netlify.app/campaigns/auth'
      };
    });

    console.log('   Page title:', pageContent.title);
    console.log('   URL changed:', pageContent.urlChanged);
    console.log('   Has error:', pageContent.hasError);
    console.log('   Has "not found":', pageContent.hasNotFound);
    console.log('   Has welcome:', pageContent.hasWelcome);
    console.log('   Has dashboard:', pageContent.hasDashboard);
    console.log('   Has sign out:', pageContent.hasSignOut);

    // Determine result
    if (pageContent.hasError || pageContent.hasInvalid || pageContent.hasNotFound) {
      console.log('');
      console.log('❌ LOGIN FAILED - Error detected');
      console.log('Error content preview:', pageContent.bodyText.substring(0, 300));
    } else if (pageContent.hasWelcome || pageContent.hasDashboard || pageContent.hasSignOut || pageContent.urlChanged) {
      console.log('');
      console.log('✅ LOGIN SUCCESS! User appears to be authenticated');
      console.log('🎉 AUTHENTICATION FIX WORKED!');
    } else {
      console.log('');
      console.log('⚠️ UNCLEAR RESULT');
      console.log('Page content preview:', pageContent.bodyText.substring(0, 300));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'deployed-auth-error.png' });
  } finally {
    console.log('');
    console.log('📸 Screenshots saved:');
    console.log('   • deployed-auth-initial.png');
    console.log('   • deployed-auth-filled.png');
    console.log('   • deployed-auth-result.png');
    
    await browser.close();
  }
}

testDeployedAuth().catch(console.error);