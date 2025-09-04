#!/usr/bin/env node

/**
 * Browser test to verify auth bypass actually works
 */

import puppeteer from 'puppeteer';

async function testAuthBypass() {
  console.log('🧪 TESTING AUTH BYPASS IN BROWSER');
  console.log('='.repeat(50));

  const browser = await puppeteer.launch({
    headless: false, // Show browser so you can see it working
    slowMo: 1000, // Slow down for visibility
    devtools: true, // Open devtools to see console
  });

  try {
    const page = await browser.newPage();

    // Enable console logging
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('BYPASS') || text.includes('test@dkdev.io')) {
        console.log('🚨 CONSOLE:', text);
      }
    });

    console.log('🌐 Navigating to http://localhost:5173');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

    // Wait a moment for React to load and auth context to initialize
    await page.waitForTimeout(3000);

    console.log('🔍 Checking if user is authenticated...');

    // Check if there are any auth bypass console messages
    const consoleMessages = await page.evaluate(() => {
      return window.console._messages || [];
    });

    // Look for user indication in the DOM
    const userIndicators = await page.evaluate(() => {
      const results = [];

      // Common places where user info might appear
      const selectors = [
        '[data-testid="user-email"]',
        '.user-email',
        '.user-name',
        '[aria-label*="user"]',
        'nav [href*="profile"]',
        'nav [href*="dashboard"]',
        '.auth-user',
        '.user-info',
      ];

      selectors.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
          if (
            el.textContent.includes('test@dkdev.io') ||
            el.textContent.includes('Test User') ||
            el.textContent.includes('Bypass')
          ) {
            results.push({
              selector,
              text: el.textContent.trim(),
            });
          }
        });
      });

      // Also check if we can find any sign-in/sign-up forms (shouldn't be there)
      const authForms = document.querySelectorAll(
        'form[action*="auth"], form[action*="login"], form[action*="signin"]'
      );

      return {
        userIndicators: results,
        hasAuthForms: authForms.length > 0,
        title: document.title,
        url: window.location.href,
        localStorageAdmin: localStorage.getItem('admin_user'),
      };
    });

    console.log('📊 Test Results:');
    console.log('  URL:', userIndicators.url);
    console.log('  Title:', userIndicators.title);
    console.log('  Auth forms present:', userIndicators.hasAuthForms ? '❌' : '✅');
    console.log('  Admin in localStorage:', userIndicators.localStorageAdmin ? '✅' : '❌');

    if (userIndicators.userIndicators.length > 0) {
      console.log('  User indicators found:');
      userIndicators.userIndicators.forEach((indicator) => {
        console.log(`    ✅ ${indicator.selector}: "${indicator.text}"`);
      });
    } else {
      console.log('  ❌ No obvious user indicators found');
    }

    // Try to navigate to a protected route
    console.log('\\n🔒 Testing protected route access...');
    try {
      await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2' });
      await page.waitForTimeout(2000);

      const finalUrl = page.url();
      if (finalUrl.includes('/dashboard')) {
        console.log('  ✅ Successfully accessed /dashboard (not redirected to login)');
      } else if (finalUrl.includes('/auth') || finalUrl.includes('/login')) {
        console.log('  ❌ Redirected to auth page - bypass may not be working');
      } else {
        console.log(`  ⚠️  Unexpected redirect to: ${finalUrl}`);
      }
    } catch (error) {
      console.log('  ❌ Error accessing dashboard:', error.message);
    }

    // Take screenshot for evidence
    await page.screenshot({ path: 'auth-bypass-test.png', fullPage: true });
    console.log('\\n📸 Screenshot saved as: auth-bypass-test.png');

    console.log('\\n🎯 MANUAL VERIFICATION:');
    console.log('1. Check the browser window - are you logged in?');
    console.log('2. Look at DevTools console - do you see bypass warnings?');
    console.log('3. Can you access protected routes?');
    console.log('4. Does the UI show test@dkdev.io as the logged-in user?');

    // Keep browser open for manual inspection
    console.log('\\n⏳ Browser will stay open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('\\n✅ Browser test completed');
  }
}

testAuthBypass().catch(console.error);
