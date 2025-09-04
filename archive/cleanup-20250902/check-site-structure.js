#!/usr/bin/env node

import puppeteer from 'puppeteer';

const LIVE_SITE_URL = 'https://cryptocampaign.netlify.app';

async function checkSiteStructure() {
  console.log('🔍 Checking site structure and donor auth pages...');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1200, height: 800 },
  });

  const page = await browser.newPage();

  try {
    // Check main page first
    console.log('\n1. Checking main page...');
    await page.goto(LIVE_SITE_URL, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    const title = await page.title();
    console.log(`✅ Main page loaded: "${title}"`);

    // Look for donor-related links
    const donorLinks = await page.$$eval('a[href*="donor"]', (links) =>
      links.map((link) => ({ href: link.href, text: link.textContent.trim() }))
    );

    if (donorLinks.length > 0) {
      console.log('\n📋 Found donor-related links:');
      donorLinks.forEach((link) => {
        console.log(`- "${link.text}" -> ${link.href}`);
      });
    } else {
      console.log('\n⚠️ No donor-related links found on main page');
    }

    // Try common donor paths
    const pathsToTry = [
      '/donors',
      '/donors/login',
      '/donors/auth',
      '/donors/auth/login',
      '/donor/login',
      '/auth/donor-login',
    ];

    console.log('\n2. Testing potential donor auth paths...');
    for (const path of pathsToTry) {
      try {
        const response = await page.goto(`${LIVE_SITE_URL}${path}`, {
          waitUntil: 'networkidle2',
          timeout: 10000,
        });

        if (response.status() === 200) {
          console.log(`✅ ${path} - Status 200, checking for login form...`);

          const hasEmailInput = (await page.$('input[name="email"], input[type="email"]')) !== null;
          const hasPasswordInput =
            (await page.$('input[name="password"], input[type="password"]')) !== null;
          const hasLoginForm = (await page.$('form')) !== null;

          console.log(`   Email input: ${hasEmailInput}`);
          console.log(`   Password input: ${hasPasswordInput}`);
          console.log(`   Form present: ${hasLoginForm}`);

          if (hasEmailInput && hasPasswordInput) {
            console.log(`🎯 FOUND WORKING DONOR LOGIN at: ${LIVE_SITE_URL}${path}`);

            // Test the auth flow here
            console.log('\n3. Testing donor auth on found page...');
            await testAuthOnCurrentPage(page, path);
            break;
          }
        } else {
          console.log(`❌ ${path} - Status ${response.status()}`);
        }
      } catch (error) {
        console.log(`❌ ${path} - Failed to load: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('❌ Site check failed:', error.message);
  } finally {
    await browser.close();
  }
}

async function testAuthOnCurrentPage(page, foundPath) {
  try {
    // Test 1: Invalid email
    console.log('\n   Testing invalid email...');
    await page.fill('input[name="email"], input[type="email"]', 'nonexistent@test.com');
    await page.fill('input[name="password"], input[type="password"]', 'TestPassword123!');

    await page.click('button[type="submit"]');

    // Wait for error message
    await page.waitForTimeout(3000); // Give time for error to appear

    const errorSelectors = [
      '[role="alert"]',
      '.text-destructive',
      '.text-red-600',
      '.error',
      '.alert-error',
      'div[class*="error"]',
      'p[class*="error"]',
    ];

    let errorMessage = null;
    for (const selector of errorSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          errorMessage = await element.textContent();
          if (errorMessage && errorMessage.trim().length > 0) {
            console.log(`   ✅ Error message found: "${errorMessage.trim()}"`);
            break;
          }
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }

    if (!errorMessage) {
      console.log('   ⚠️ No error message found - checking page content...');
      const bodyText = await page.$eval('body', (el) => el.textContent);
      if (
        bodyText.includes('error') ||
        bodyText.includes('invalid') ||
        bodyText.includes('incorrect')
      ) {
        console.log('   📝 Error text appears to be present in page');
      }
    }

    // Clear and test with correct credentials
    console.log('\n   Testing with test credentials...');
    await page.fill('input[name="email"], input[type="email"]', '');
    await page.fill('input[name="password"], input[type="password"]', '');
    await page.fill('input[name="email"], input[type="email"]', 'test@dkdev.io');
    await page.fill('input[name="password"], input[type="password"]', 'TestDonor123!');

    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    if (
      currentUrl.includes('dashboard') ||
      currentUrl !== `https://cryptocampaign.netlify.app${foundPath}`
    ) {
      console.log(`   ✅ Appeared to redirect or change page: ${currentUrl}`);
    } else {
      console.log(`   📍 Still on login page: ${currentUrl}`);
    }
  } catch (error) {
    console.error('   ❌ Auth test failed:', error.message);
  }
}

checkSiteStructure().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
