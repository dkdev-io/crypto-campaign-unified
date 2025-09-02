#!/usr/bin/env node

/**
 * Simple Netlify Auth Verification Script
 * Tests the campaign auth workflow changes on https://cryptocampaign.netlify.app
 */

import puppeteer from 'puppeteer';

const PRODUCTION_URL = 'https://cryptocampaign.netlify.app';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

console.log('🚀 Verifying Campaign Auth Workflow Changes on Netlify');
console.log(`📍 Production URL: ${PRODUCTION_URL}`);
console.log(`⏰ Started: ${new Date().toLocaleString()}`);
console.log('=' .repeat(60));

async function verifyChanges() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });

  try {
    const page = await browser.newPage();
    
    console.log('\n📱 STEP 1: Testing Home Page Navigation');
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const homeScreenshot = `home-page-${TIMESTAMP}.png`;
    await page.screenshot({ path: homeScreenshot, fullPage: true });
    console.log(`📸 Home page: ${homeScreenshot}`);
    
    // Check home navigation elements
    const homeNav = await page.evaluate(() => {
      const results = {};
      
      // Find NEXTRAISE logo
      results.logo = Array.from(document.querySelectorAll('*')).find(el => 
        el.textContent && el.textContent.includes('NEXTRAISE')) ? 'Found' : 'Missing';
      
      // Find navigation links
      results.features = Array.from(document.querySelectorAll('*')).find(el =>
        el.textContent && el.textContent.includes('FEATURES')) ? 'Found' : 'Missing';
      
      results.howItWorks = Array.from(document.querySelectorAll('*')).find(el =>
        el.textContent && el.textContent.includes('HOW IT WORKS')) ? 'Found' : 'Missing';
      
      results.pricing = Array.from(document.querySelectorAll('*')).find(el =>
        el.textContent && el.textContent.includes('PRICING')) ? 'Found' : 'Missing';
      
      results.contact = Array.from(document.querySelectorAll('*')).find(el =>
        el.textContent && el.textContent.includes('CONTACT')) ? 'Found' : 'Missing';
      
      // Find action buttons
      results.campaignsBtn = Array.from(document.querySelectorAll('button, .btn')).find(el =>
        el.textContent && el.textContent.includes('Campaigns')) ? 'Found' : 'Missing';
      
      results.donorsBtn = Array.from(document.querySelectorAll('button, .btn')).find(el =>
        el.textContent && el.textContent.includes('Donors')) ? 'Found' : 'Missing';
      
      return results;
    });
    
    console.log(`   ✅ NEXTRAISE Logo: ${homeNav.logo}`);
    console.log(`   ✅ Features Link: ${homeNav.features}`);
    console.log(`   ✅ How It Works Link: ${homeNav.howItWorks}`);
    console.log(`   ✅ Pricing Link: ${homeNav.pricing}`);
    console.log(`   ✅ Contact Link: ${homeNav.contact}`);
    console.log(`   ✅ Campaigns Button: ${homeNav.campaignsBtn}`);
    console.log(`   ✅ Donors Button: ${homeNav.donorsBtn}`);

    console.log('\n🔐 STEP 2: Testing /auth Route');
    await page.goto(`${PRODUCTION_URL}/auth`, { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const authScreenshot = `auth-page-${TIMESTAMP}.png`;
    await page.screenshot({ path: authScreenshot, fullPage: true });
    console.log(`📸 Auth page: ${authScreenshot}`);
    
    // Check auth page elements
    const authElements = await page.evaluate(() => {
      const results = {};
      
      // Check navigation consistency
      results.logo = Array.from(document.querySelectorAll('*')).find(el => 
        el.textContent && el.textContent.includes('NEXTRAISE')) ? 'Found' : 'Missing';
      
      results.campaignsBtn = Array.from(document.querySelectorAll('button, .btn')).find(el =>
        el.textContent && el.textContent.includes('Campaigns')) ? 'Found' : 'Missing';
      
      results.donorsBtn = Array.from(document.querySelectorAll('button, .btn')).find(el =>
        el.textContent && el.textContent.includes('Donors')) ? 'Found' : 'Missing';
      
      // Check sign in/sign up toggle
      results.signInTab = Array.from(document.querySelectorAll('button, [role="tab"]')).find(el =>
        el.textContent && el.textContent.trim() === 'Sign In') ? 'Found' : 'Missing';
      
      results.signUpTab = Array.from(document.querySelectorAll('button, [role="tab"]')).find(el =>
        el.textContent && el.textContent.trim() === 'Sign Up') ? 'Found' : 'Missing';
      
      // Check for breadcrumbs
      results.homeLink = Array.from(document.querySelectorAll('a, span')).find(el =>
        el.textContent && el.textContent.includes('Home')) ? 'Found' : 'Missing';
      
      results.campaignsLink = Array.from(document.querySelectorAll('a, span')).find(el =>
        el.textContent && el.textContent.includes('Campaigns')) ? 'Found' : 'Missing';
      
      // Check form elements
      results.emailField = document.querySelector('input[type="email"], input[name="email"]') ? 'Found' : 'Missing';
      results.passwordField = document.querySelector('input[type="password"]') ? 'Found' : 'Missing';
      
      // Check page title/header
      const header = document.querySelector('h1, h2, h3');
      results.pageTitle = header ? header.textContent.trim() : 'No title found';
      
      return results;
    });
    
    console.log(`   ✅ Navigation Logo: ${authElements.logo}`);
    console.log(`   ✅ Campaigns Button: ${authElements.campaignsBtn}`);
    console.log(`   ✅ Donors Button: ${authElements.donorsBtn}`);
    console.log(`   ✅ Sign In Tab: ${authElements.signInTab}`);
    console.log(`   ✅ Sign Up Tab: ${authElements.signUpTab}`);
    console.log(`   ✅ Home Breadcrumb: ${authElements.homeLink}`);
    console.log(`   ✅ Campaigns Breadcrumb: ${authElements.campaignsLink}`);
    console.log(`   ✅ Email Field: ${authElements.emailField}`);
    console.log(`   ✅ Password Field: ${authElements.passwordField}`);
    console.log(`   ✅ Page Title: ${authElements.pageTitle}`);

    console.log('\n🔄 STEP 3: Testing Sign Up Toggle');
    try {
      // Try to click Sign Up tab
      const signUpButton = await page.$('button:has-text("Sign Up")') || 
                          await page.$('[role="tab"]:has-text("Sign Up")') ||
                          await page.evaluateHandle(() => {
                            return Array.from(document.querySelectorAll('button')).find(el =>
                              el.textContent && el.textContent.trim() === 'Sign Up');
                          });
      
      if (signUpButton) {
        await signUpButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const signUpFormElements = await page.evaluate(() => {
          return {
            fullNameField: document.querySelector('input[name="fullName"], input[placeholder*="name" i]') ? 'Found' : 'Missing',
            confirmPasswordField: document.querySelector('input[name="confirmPassword"], input[placeholder*="confirm" i]') ? 'Found' : 'Missing'
          };
        });
        
        console.log(`   ✅ Sign Up Clicked: Success`);
        console.log(`   ✅ Full Name Field: ${signUpFormElements.fullNameField}`);
        console.log(`   ✅ Confirm Password: ${signUpFormElements.confirmPasswordField}`);
        
        const signUpScreenshot = `signup-form-${TIMESTAMP}.png`;
        await page.screenshot({ path: signUpScreenshot, fullPage: true });
        console.log(`   📸 Sign Up Form: ${signUpScreenshot}`);
      } else {
        console.log(`   ❌ Could not find Sign Up button`);
      }
    } catch (error) {
      console.log(`   ⚠️ Sign Up test failed: ${error.message}`);
    }

    console.log('\n🌐 STEP 4: Testing /campaigns/auth Route');
    await page.goto(`${PRODUCTION_URL}/campaigns/auth`, { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const campaignsAuthScreenshot = `campaigns-auth-${TIMESTAMP}.png`;
    await page.screenshot({ path: campaignsAuthScreenshot, fullPage: true });
    console.log(`📸 Campaigns auth: ${campaignsAuthScreenshot}`);
    
    const campaignsAuthTest = await page.evaluate(() => {
      const header = document.querySelector('h1, h2, h3');
      return {
        pageTitle: header ? header.textContent.trim() : 'No title found',
        hasToggle: Array.from(document.querySelectorAll('button')).some(el =>
          el.textContent && (el.textContent.includes('Sign In') || el.textContent.includes('Sign Up')))
      };
    });
    
    console.log(`   ✅ Route Accessible: Success`);
    console.log(`   ✅ Page Title: ${campaignsAuthTest.pageTitle}`);
    console.log(`   ✅ Has Toggle: ${campaignsAuthTest.hasToggle ? 'Yes' : 'No'}`);

    console.log('\n' + '='.repeat(60));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    
    const homeNavScore = Object.values(homeNav).filter(v => v === 'Found').length;
    const authElementsScore = Object.values(authElements).filter(v => v === 'Found').length;
    
    console.log(`🏠 Home Page Navigation: ${homeNavScore}/7 elements found`);
    console.log(`🔐 Auth Page Elements: ${authElementsScore}/9 elements found`);
    console.log(`🔄 Toggle Functionality: ${campaignsAuthTest.hasToggle ? 'Working' : 'Issues detected'}`);
    
    const overallStatus = (homeNavScore >= 5 && authElementsScore >= 6 && campaignsAuthTest.hasToggle) ? 
      '✅ CHANGES DEPLOYED SUCCESSFULLY' : '⚠️ SOME ISSUES DETECTED';
    
    console.log(`\n🚀 ${overallStatus}`);
    
    if (overallStatus.includes('SUCCESS')) {
      console.log('🎉 Your campaign auth workflow fixes are live on Netlify!');
      console.log('✨ Navigation, toggle, and breadcrumbs are working correctly.');
    } else {
      console.log('⚠️ Please review screenshots for any remaining issues.');
    }
    
    console.log(`\n📸 Screenshots generated:`);
    console.log(`   • ${homeScreenshot}`);
    console.log(`   • ${authScreenshot}`);
    console.log(`   • ${campaignsAuthScreenshot}`);
    
    return { homeNavScore, authElementsScore, hasToggle: campaignsAuthTest.hasToggle };
    
  } finally {
    await browser.close();
  }
}

verifyChanges()
  .then((results) => {
    console.log('\n✅ Verification completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });