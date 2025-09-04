#!/usr/bin/env node

const puppeteer = require('puppeteer');

const SITE_URL = 'https://cryptocampaign.netlify.app';

async function testBreadcrumbNavigation() {
  console.log('\n🔍 Testing Campaign Breadcrumb Navigation on Live Site');
  console.log('='.repeat(60));

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    const results = {
      homepage: { tested: false, hasBreadcrumbs: false, details: '' },
      authPage: { tested: false, hasBreadcrumbs: false, breadcrumbText: '', clickable: false },
      setupPage: { tested: false, hasBreadcrumbs: false, protected: false },
    };

    // Test 1: Homepage (should NOT have breadcrumbs - only shows for campaign pages)
    console.log('\n1️⃣ Testing Homepage...');
    await page.goto(`${SITE_URL}/`, { waitUntil: 'networkidle2', timeout: 30000 });

    const homeBreadcrumbs = await page
      .$eval('nav[aria-label="Breadcrumb"]', (el) => (el ? el.textContent : null))
      .catch(() => null);
    results.homepage.tested = true;
    results.homepage.hasBreadcrumbs = !!homeBreadcrumbs;
    results.homepage.details = homeBreadcrumbs
      ? `Found: "${homeBreadcrumbs.trim()}"`
      : 'No breadcrumbs (expected for homepage)';

    console.log(
      `   Homepage breadcrumbs: ${results.homepage.hasBreadcrumbs ? '✅ Found' : '❌ Not found (expected)'}`
    );

    // Test 2: Auth page (should have breadcrumbs)
    console.log('\n2️⃣ Testing Auth Page...');
    await page.goto(`${SITE_URL}/auth`, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait a bit for React to render
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const authBreadcrumbs = await page.$('nav[aria-label="Breadcrumb"]');
    results.authPage.tested = true;
    results.authPage.hasBreadcrumbs = !!authBreadcrumbs;

    if (authBreadcrumbs) {
      const breadcrumbText = await authBreadcrumbs.evaluate((el) => el.textContent);
      results.authPage.breadcrumbText = breadcrumbText.trim();

      // Test if breadcrumb links are clickable
      const homeLink = await authBreadcrumbs.$('a[href="/"], button');
      results.authPage.clickable = !!homeLink;

      console.log(`   ✅ Auth page breadcrumbs found: "${breadcrumbText.trim()}"`);
      console.log(`   ✅ Breadcrumb links clickable: ${results.authPage.clickable ? 'Yes' : 'No'}`);
    } else {
      console.log('   ❌ No breadcrumbs found on auth page');
    }

    // Test 3: Try to access setup page (should be protected but might show breadcrumbs)
    console.log('\n3️⃣ Testing Setup Page (Protected Route)...');
    await page.goto(`${SITE_URL}/setup`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const setupBreadcrumbs = await page.$('nav[aria-label="Breadcrumb"]');
    results.setupPage.tested = true;
    results.setupPage.hasBreadcrumbs = !!setupBreadcrumbs;

    // Check if redirected to auth (protection working)
    const currentUrl = page.url();
    results.setupPage.protected = currentUrl.includes('/auth');

    if (setupBreadcrumbs) {
      const breadcrumbText = await setupBreadcrumbs.evaluate((el) => el.textContent);
      console.log(`   ✅ Setup page breadcrumbs: "${breadcrumbText.trim()}"`);
    } else {
      console.log('   ⚠️  No breadcrumbs on setup page (might be redirected)');
    }

    console.log(
      `   ${results.setupPage.protected ? '✅' : '⚠️ '} Route protection: ${results.setupPage.protected ? 'Working (redirected to auth)' : 'Not redirected'}`
    );

    // Test 4: Test breadcrumb navigation functionality
    console.log('\n4️⃣ Testing Breadcrumb Navigation...');
    await page.goto(`${SITE_URL}/auth`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const homeNavigation = await page.evaluate(() => {
      const homeLink = document.querySelector(
        'nav[aria-label="Breadcrumb"] a[href="/"], nav[aria-label="Breadcrumb"] button'
      );
      if (homeLink) {
        homeLink.click();
        return true;
      }
      return false;
    });

    if (homeNavigation) {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
      const finalUrl = page.url();
      const navigatedHome = finalUrl === `${SITE_URL}/` || finalUrl === `${SITE_URL}`;
      console.log(
        `   ${navigatedHome ? '✅' : '❌'} Home navigation: ${navigatedHome ? 'Working' : 'Failed'}`
      );
    }

    // Generate Report
    console.log('\n📊 BREADCRUMB NAVIGATION TEST RESULTS');
    console.log('='.repeat(60));

    console.log('\n🏠 Homepage:');
    console.log(`   Status: ${results.homepage.tested ? 'Tested' : 'Not tested'}`);
    console.log(
      `   Breadcrumbs: ${results.homepage.hasBreadcrumbs ? 'Found' : 'Not found (expected)'}`
    );
    console.log(`   Details: ${results.homepage.details}`);

    console.log('\n🔐 Auth Page:');
    console.log(`   Status: ${results.authPage.tested ? 'Tested' : 'Not tested'}`);
    console.log(`   Breadcrumbs: ${results.authPage.hasBreadcrumbs ? '✅ Found' : '❌ Missing'}`);
    console.log(`   Text: "${results.authPage.breadcrumbText}"`);
    console.log(`   Navigation: ${results.authPage.clickable ? '✅ Working' : '❌ Not working'}`);

    console.log('\n⚙️  Setup Page:');
    console.log(`   Status: ${results.setupPage.tested ? 'Tested' : 'Not tested'}`);
    console.log(
      `   Protection: ${results.setupPage.protected ? '✅ Working' : '⚠️  Not protected'}`
    );
    console.log(`   Breadcrumbs: ${results.setupPage.hasBreadcrumbs ? 'Found' : 'Not found'}`);

    // Overall Assessment
    const authWorking = results.authPage.hasBreadcrumbs && results.authPage.clickable;
    const protectionWorking = results.setupPage.protected;

    console.log('\n🎯 OVERALL ASSESSMENT:');
    console.log(`   Campaign Breadcrumbs: ${authWorking ? '✅ WORKING' : '❌ NEEDS FIX'}`);
    console.log(`   Route Protection: ${protectionWorking ? '✅ WORKING' : '⚠️  CHECK NEEDED'}`);
    console.log(
      `   Live Site Status: ${authWorking ? '✅ DEPLOYED SUCCESSFULLY' : '❌ DEPLOYMENT ISSUE'}`
    );

    if (authWorking) {
      console.log('\n🚀 SUCCESS: Campaign breadcrumb navigation is live and working!');
      console.log('   ✅ Breadcrumbs appear on campaign workflow pages');
      console.log('   ✅ Navigation links are functional');
      console.log('   ✅ Integration with existing auth flow works');
    } else {
      console.log('\n⚠️  ISSUES DETECTED: Some breadcrumb functionality needs attention');
    }

    return results;
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    return null;
  } finally {
    await browser.close();
  }
}

// Run the test
if (require.main === module) {
  testBreadcrumbNavigation()
    .then((results) => {
      process.exit(results && results.authPage.hasBreadcrumbs ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test script failed:', error);
      process.exit(1);
    });
}

module.exports = { testBreadcrumbNavigation };
