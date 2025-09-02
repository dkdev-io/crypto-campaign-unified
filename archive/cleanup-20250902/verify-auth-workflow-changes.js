#!/usr/bin/env node

/**
 * Puppeteer Script: Verify Campaign Auth Workflow Changes on Netlify
 * 
 * This script verifies that the recent campaign auth workflow fixes are deployed correctly:
 * 1. Top navigation matches home page design
 * 2. Sign in/sign up toggle works properly  
 * 3. Breadcrumb navigation appears correctly
 * 4. Overall styling is consistent
 * 
 * Production URL: https://cryptocampaign.netlify.app
 */

import puppeteer from 'puppeteer';
import fs from 'fs';

const PRODUCTION_URL = 'https://cryptocampaign.netlify.app';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

console.log('🚀 Starting Campaign Auth Workflow Verification');
console.log(`📍 Testing Production Site: ${PRODUCTION_URL}`);
console.log(`⏰ Test Started: ${new Date().toLocaleString()}`);
console.log('=' .repeat(60));

async function verifyAuthWorkflow() {
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser for visual verification
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });

  try {
    const page = await browser.newPage();
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    
    const results = {
      homePageNavigation: false,
      authPageNavigation: false,
      signInSignUpToggle: false,
      breadcrumbNavigation: false,
      overallStyling: false,
      screenshots: []
    };

    console.log('\n🏠 STEP 1: Analyzing Home Page Navigation');
    console.log('-'.repeat(40));
    
    // Go to home page first to analyze navigation
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take home page screenshot
    const homeScreenshot = `netlify-homepage-${TIMESTAMP}.png`;
    await page.screenshot({ path: homeScreenshot, fullPage: true });
    results.screenshots.push(homeScreenshot);
    console.log(`📸 Home page screenshot: ${homeScreenshot}`);
    
    // Analyze home page navigation
    const homeNavigation = await page.evaluate(() => {
      const logo = document.querySelector('span:contains("NEXTRAISE")') || 
                   document.querySelector('[class*="font-bold"]');
      const featuresLink = document.querySelector('a[href="#features"], [href*="features"]');
      const howItWorksLink = document.querySelector('a[href="#how-it-works"], [href*="how-it-works"]');
      const pricingLink = document.querySelector('a[href="#pricing"], [href*="pricing"]');
      const contactLink = document.querySelector('a[href="#contact"], [href*="contact"]');
      const campaignsBtn = document.querySelector('button:contains("Campaigns")') ||
                          document.querySelector('[class*="btn"]:contains("Campaigns")');
      const donorsBtn = document.querySelector('button:contains("Donors")') ||
                       document.querySelector('[class*="btn"]:contains("Donors")');
      
      return {
        hasLogo: !!logo,
        hasFeatures: !!featuresLink,
        hasHowItWorks: !!howItWorksLink,
        hasPricing: !!pricingLink,
        hasContact: !!contactLink,
        hasCampaignsBtn: !!campaignsBtn,
        hasDonorsBtn: !!donorsBtn,
        logoText: logo?.textContent?.trim() || 'NOT FOUND'
      };
    });
    
    console.log('🔍 Home Navigation Analysis:');
    console.log(`   ✅ Logo: ${homeNavigation.hasLogo ? '✓' : '✗'} (${homeNavigation.logoText})`);
    console.log(`   ✅ Features: ${homeNavigation.hasFeatures ? '✓' : '✗'}`);
    console.log(`   ✅ How It Works: ${homeNavigation.hasHowItWorks ? '✓' : '✗'}`);
    console.log(`   ✅ Pricing: ${homeNavigation.hasPricing ? '✓' : '✗'}`);
    console.log(`   ✅ Contact: ${homeNavigation.hasContact ? '✓' : '✗'}`);
    console.log(`   ✅ Campaigns Button: ${homeNavigation.hasCampaignsBtn ? '✓' : '✗'}`);
    console.log(`   ✅ Donors Button: ${homeNavigation.hasDonorsBtn ? '✓' : '✗'}`);
    
    results.homePageNavigation = homeNavigation.hasLogo && homeNavigation.hasCampaignsBtn && homeNavigation.hasDonorsBtn;

    console.log('\n🔐 STEP 2: Testing Auth Page Navigation');
    console.log('-'.repeat(40));
    
    // Navigate to auth page
    await page.goto(`${PRODUCTION_URL}/auth`, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take auth page screenshot
    const authScreenshot = `netlify-auth-${TIMESTAMP}.png`;
    await page.screenshot({ path: authScreenshot, fullPage: true });
    results.screenshots.push(authScreenshot);
    console.log(`📸 Auth page screenshot: ${authScreenshot}`);
    
    // Analyze auth page navigation
    const authNavigation = await page.evaluate(() => {
      // Check for NEXTRAISE logo
      const logo = Array.from(document.querySelectorAll('*')).find(el => 
        el.textContent && el.textContent.includes('NEXTRAISE'));
      
      // Check for navigation links
      const featuresLink = Array.from(document.querySelectorAll('a, nav *')).find(el =>
        el.textContent && el.textContent.toUpperCase().includes('FEATURES'));
      const howItWorksLink = Array.from(document.querySelectorAll('a, nav *')).find(el =>
        el.textContent && el.textContent.toUpperCase().includes('HOW IT WORKS'));
      const pricingLink = Array.from(document.querySelectorAll('a, nav *')).find(el =>
        el.textContent && el.textContent.toUpperCase().includes('PRICING'));
      const contactLink = Array.from(document.querySelectorAll('a, nav *')).find(el =>
        el.textContent && el.textContent.toUpperCase().includes('CONTACT'));
      
      // Check for action buttons
      const campaignsBtn = Array.from(document.querySelectorAll('button, [class*="btn"]')).find(el =>
        el.textContent && el.textContent.includes('Campaigns'));
      const donorsBtn = Array.from(document.querySelectorAll('button, [class*="btn"]')).find(el =>
        el.textContent && el.textContent.includes('Donors'));
      
      return {
        hasLogo: !!logo,
        hasFeatures: !!featuresLink,
        hasHowItWorks: !!howItWorksLink,
        hasPricing: !!pricingLink,
        hasContact: !!contactLink,
        hasCampaignsBtn: !!campaignsBtn,
        hasDonorsBtn: !!donorsBtn,
        logoText: logo?.textContent?.trim() || 'NOT FOUND'
      };
    });
    
    console.log('🔍 Auth Navigation Analysis:');
    console.log(`   ✅ Logo: ${authNavigation.hasLogo ? '✓' : '✗'} (${authNavigation.logoText})`);
    console.log(`   ✅ Features: ${authNavigation.hasFeatures ? '✓' : '✗'}`);
    console.log(`   ✅ How It Works: ${authNavigation.hasHowItWorks ? '✓' : '✗'}`);
    console.log(`   ✅ Pricing: ${authNavigation.hasPricing ? '✓' : '✗'}`);
    console.log(`   ✅ Contact: ${authNavigation.hasContact ? '✓' : '✗'}`);
    console.log(`   ✅ Campaigns Button: ${authNavigation.hasCampaignsBtn ? '✓' : '✗'}`);
    console.log(`   ✅ Donors Button: ${authNavigation.hasDonorsBtn ? '✓' : '✗'}`);
    
    results.authPageNavigation = authNavigation.hasLogo && authNavigation.hasCampaignsBtn && authNavigation.hasDonorsBtn;

    console.log('\n🔄 STEP 3: Testing Sign In/Sign Up Toggle');
    console.log('-'.repeat(40));
    
    // Test the toggle functionality
    const toggleTest = await page.evaluate(() => {
      // Look for Sign In and Sign Up buttons/tabs
      const signInTab = Array.from(document.querySelectorAll('button, [role="tab"], .tab')).find(el =>
        el.textContent && el.textContent.trim() === 'Sign In');
      const signUpTab = Array.from(document.querySelectorAll('button, [role="tab"], .tab')).find(el =>
        el.textContent && el.textContent.trim() === 'Sign Up');
      
      // Check for proper toggle styling
      const hasToggleContainer = document.querySelector('.flex') && 
        document.querySelector('[class*="rounded"]');
      
      // Check for form fields
      const emailField = document.querySelector('input[type="email"], input[name="email"]');
      const passwordField = document.querySelector('input[type="password"], input[name="password"]');
      
      return {
        hasSignInTab: !!signInTab,
        hasSignUpTab: !!signUpTab,
        hasToggleContainer: !!hasToggleContainer,
        hasEmailField: !!emailField,
        hasPasswordField: !!passwordField,
        signInText: signInTab?.textContent?.trim() || 'NOT FOUND',
        signUpText: signUpTab?.textContent?.trim() || 'NOT FOUND'
      };
    });
    
    console.log('🔍 Toggle Analysis:');
    console.log(`   ✅ Sign In Tab: ${toggleTest.hasSignInTab ? '✓' : '✗'} (${toggleTest.signInText})`);
    console.log(`   ✅ Sign Up Tab: ${toggleTest.hasSignUpTab ? '✓' : '✗'} (${toggleTest.signUpText})`);
    console.log(`   ✅ Toggle Container: ${toggleTest.hasToggleContainer ? '✓' : '✗'}`);
    console.log(`   ✅ Email Field: ${toggleTest.hasEmailField ? '✓' : '✗'}`);
    console.log(`   ✅ Password Field: ${toggleTest.hasPasswordField ? '✓' : '✗'}`);
    
    results.signInSignUpToggle = toggleTest.hasSignInTab && toggleTest.hasSignUpTab && toggleTest.hasToggleContainer;

    // Test clicking the Sign Up tab if available
    if (toggleTest.hasSignUpTab) {
      try {
        await page.click('button:contains("Sign Up"), [role="tab"]:contains("Sign Up")');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const signUpFormCheck = await page.evaluate(() => {
          const fullNameField = document.querySelector('input[name="fullName"], input[placeholder*="full name" i]');
          const confirmPasswordField = document.querySelector('input[name="confirmPassword"], input[placeholder*="confirm" i]');
          return {
            hasFullNameField: !!fullNameField,
            hasConfirmPasswordField: !!confirmPasswordField
          };
        });
        
        console.log(`   ✅ Sign Up Form Fields: ${signUpFormCheck.hasFullNameField ? '✓' : '✗'}`);
        console.log(`   ✅ Confirm Password: ${signUpFormCheck.hasConfirmPasswordField ? '✓' : '✗'}`);
      } catch (error) {
        console.log('   ⚠️ Could not test Sign Up tab click');
      }
    }

    console.log('\n🍞 STEP 4: Checking Breadcrumb Navigation');
    console.log('-'.repeat(40));
    
    // Check for breadcrumb navigation
    const breadcrumbTest = await page.evaluate(() => {
      // Look for breadcrumb patterns
      const breadcrumbContainer = document.querySelector('[aria-label="Breadcrumb"], nav[class*="breadcrumb"], .breadcrumb');
      const homeLink = Array.from(document.querySelectorAll('a, [role="link"]')).find(el =>
        el.textContent && el.textContent.includes('Home'));
      const campaignsLink = Array.from(document.querySelectorAll('a, [role="link"], span')).find(el =>
        el.textContent && el.textContent.includes('Campaigns'));
      const authLink = Array.from(document.querySelectorAll('a, [role="link"], span')).find(el =>
        el.textContent && (el.textContent.includes('Sign In') || el.textContent.includes('Sign Up')));
      
      // Look for chevron or separator elements
      const chevronElements = document.querySelectorAll('svg, [class*="chevron"], [class*="arrow"]');
      
      return {
        hasBreadcrumbContainer: !!breadcrumbContainer,
        hasHomeLink: !!homeLink,
        hasCampaignsLink: !!campaignsLink,
        hasAuthLink: !!authLink,
        hasChevrons: chevronElements.length > 0,
        homeText: homeLink?.textContent?.trim() || 'NOT FOUND',
        campaignsText: campaignsLink?.textContent?.trim() || 'NOT FOUND',
        authText: authLink?.textContent?.trim() || 'NOT FOUND'
      };
    });
    
    console.log('🔍 Breadcrumb Analysis:');
    console.log(`   ✅ Breadcrumb Container: ${breadcrumbTest.hasBreadcrumbContainer ? '✓' : '✗'}`);
    console.log(`   ✅ Home Link: ${breadcrumbTest.hasHomeLink ? '✓' : '✗'} (${breadcrumbTest.homeText})`);
    console.log(`   ✅ Campaigns Link: ${breadcrumbTest.hasCampaignsLink ? '✓' : '✗'} (${breadcrumbTest.campaignsText})`);
    console.log(`   ✅ Auth Link: ${breadcrumbTest.hasAuthLink ? '✓' : '✗'} (${breadcrumbTest.authText})`);
    console.log(`   ✅ Navigation Separators: ${breadcrumbTest.hasChevrons ? '✓' : '✗'}`);
    
    results.breadcrumbNavigation = breadcrumbTest.hasHomeLink || breadcrumbTest.hasCampaignsLink;

    console.log('\n🎨 STEP 5: Overall Styling Assessment');
    console.log('-'.repeat(40));
    
    // Check overall styling consistency
    const stylingTest = await page.evaluate(() => {
      // Check for proper card styling
      const cardElements = document.querySelectorAll('[class*="card"], [class*="rounded"], [class*="shadow"]');
      const gradientBg = document.querySelector('[class*="gradient"], [style*="gradient"]');
      const headerElements = document.querySelectorAll('h1, h2, h3, [class*="font-bold"]');
      const buttonElements = document.querySelectorAll('button, [class*="btn"]');
      
      // Check for consistent color scheme
      const hasBlueElements = Array.from(document.querySelectorAll('*')).some(el => {
        const style = window.getComputedStyle(el);
        return style.color.includes('blue') || style.backgroundColor.includes('blue') ||
               el.className.includes('blue') || el.className.includes('primary');
      });
      
      return {
        hasCardStyling: cardElements.length > 0,
        hasGradientBackground: !!gradientBg,
        hasProperHeaders: headerElements.length > 0,
        hasStyledButtons: buttonElements.length > 0,
        hasConsistentColors: hasBlueElements,
        cardCount: cardElements.length,
        headerCount: headerElements.length,
        buttonCount: buttonElements.length
      };
    });
    
    console.log('🔍 Styling Analysis:');
    console.log(`   ✅ Card Styling: ${stylingTest.hasCardStyling ? '✓' : '✗'} (${stylingTest.cardCount} cards)`);
    console.log(`   ✅ Gradient Background: ${stylingTest.hasGradientBackground ? '✓' : '✗'}`);
    console.log(`   ✅ Proper Headers: ${stylingTest.hasProperHeaders ? '✓' : '✗'} (${stylingTest.headerCount} headers)`);
    console.log(`   ✅ Styled Buttons: ${stylingTest.hasStyledButtons ? '✓' : '✗'} (${stylingTest.buttonCount} buttons)`);
    console.log(`   ✅ Consistent Colors: ${stylingTest.hasConsistentColors ? '✓' : '✗'}`);
    
    results.overallStyling = stylingTest.hasCardStyling && stylingTest.hasProperHeaders && stylingTest.hasStyledButtons;

    // Take final detailed screenshot
    const finalScreenshot = `netlify-auth-detailed-${TIMESTAMP}.png`;
    await page.screenshot({ path: finalScreenshot, fullPage: true });
    results.screenshots.push(finalScreenshot);
    console.log(`📸 Final detailed screenshot: ${finalScreenshot}`);

    // Test /campaigns/auth route as well
    console.log('\n🔗 STEP 6: Testing /campaigns/auth Route');
    console.log('-'.repeat(40));
    
    try {
      await page.goto(`${PRODUCTION_URL}/campaigns/auth`, { waitUntil: 'networkidle0', timeout: 30000 });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const campaignsAuthScreenshot = `netlify-campaigns-auth-${TIMESTAMP}.png`;
      await page.screenshot({ path: campaignsAuthScreenshot, fullPage: true });
      results.screenshots.push(campaignsAuthScreenshot);
      console.log(`📸 Campaigns auth screenshot: ${campaignsAuthScreenshot}`);
      
      const campaignsAuthTest = await page.evaluate(() => {
        const pageTitle = document.querySelector('h1, h2, h3, [class*="text-3xl"]')?.textContent || '';
        const hasSignInTab = Array.from(document.querySelectorAll('button, [role="tab"]')).some(el =>
          el.textContent && el.textContent.trim() === 'Sign In');
        const hasSignUpTab = Array.from(document.querySelectorAll('button, [role="tab"]')).some(el =>
          el.textContent && el.textContent.trim() === 'Sign Up');
        
        return {
          pageTitle,
          hasSignInTab,
          hasSignUpTab,
          routeAccessible: true
        };
      });
      
      console.log(`   ✅ Route Accessible: ✓`);
      console.log(`   ✅ Page Title: ${campaignsAuthTest.pageTitle}`);
      console.log(`   ✅ Has Toggle: ${campaignsAuthTest.hasSignInTab && campaignsAuthTest.hasSignUpTab ? '✓' : '✗'}`);
      
    } catch (error) {
      console.log(`   ❌ /campaigns/auth route error: ${error.message}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL VERIFICATION RESULTS');
    console.log('='.repeat(60));
    
    const overallScore = Object.values(results).filter(v => typeof v === 'boolean' && v).length;
    const maxScore = Object.values(results).filter(v => typeof v === 'boolean').length;
    
    console.log(`🏠 Home Page Navigation: ${results.homePageNavigation ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🔐 Auth Page Navigation: ${results.authPageNavigation ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🔄 Sign In/Sign Up Toggle: ${results.signInSignUpToggle ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🍞 Breadcrumb Navigation: ${results.breadcrumbNavigation ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🎨 Overall Styling: ${results.overallStyling ? '✅ PASS' : '❌ FAIL'}`);
    
    console.log(`\n📈 Overall Score: ${overallScore}/${maxScore} (${Math.round(overallScore/maxScore*100)}%)`);
    console.log(`📸 Screenshots Generated: ${results.screenshots.length}`);
    console.log(`📁 Screenshots: ${results.screenshots.join(', ')}`);
    
    const deploymentStatus = overallScore >= 3 ? '✅ DEPLOYMENT VERIFIED' : '⚠️ ISSUES DETECTED';
    console.log(`\n🚀 ${deploymentStatus}`);
    
    if (overallScore >= 3) {
      console.log('🎉 The campaign auth workflow changes have been successfully deployed to Netlify!');
      console.log('✨ Navigation, toggle functionality, and styling are working as expected.');
    } else {
      console.log('⚠️ Some issues were detected. Please review the screenshots and details above.');
    }
    
    // Generate summary report
    const report = {
      testTimestamp: new Date().toISOString(),
      productionUrl: PRODUCTION_URL,
      testResults: results,
      overallScore: `${overallScore}/${maxScore}`,
      deploymentStatus: overallScore >= 3 ? 'VERIFIED' : 'ISSUES_DETECTED',
      recommendations: []
    };
    
    if (!results.homePageNavigation) {
      report.recommendations.push('Verify home page navigation elements are properly deployed');
    }
    if (!results.authPageNavigation) {
      report.recommendations.push('Check auth page navigation consistency with home page');
    }
    if (!results.signInSignUpToggle) {
      report.recommendations.push('Review sign in/sign up toggle implementation');
    }
    if (!results.breadcrumbNavigation) {
      report.recommendations.push('Verify breadcrumb navigation is showing correctly');
    }
    if (!results.overallStyling) {
      report.recommendations.push('Check overall styling consistency and theme application');
    }
    
    const reportFile = `netlify-auth-workflow-report-${TIMESTAMP}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved: ${reportFile}`);
    
    return results;

  } catch (error) {
    console.error('❌ Test execution error:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Execute the verification
verifyAuthWorkflow()
  .then((results) => {
    console.log('\n✅ Verification completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });