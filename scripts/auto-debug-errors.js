#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function autoDebugErrors() {
  console.log('🔍 Auto-Debugging JavaScript Errors');
  console.log('='.repeat(40));
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  const warnings = [];
  const networkIssues = [];
  
  // Capture all console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    
    if (type === 'error') {
      errors.push(text);
      console.log(`❌ ERROR: ${text}`);
    } else if (type === 'warn') {
      warnings.push(text);
      console.log(`⚠️  WARN: ${text}`);
    }
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    errors.push(`PAGE ERROR: ${error.message}`);
    console.log(`💥 PAGE ERROR: ${error.message}`);
  });
  
  // Capture network failures
  page.on('requestfailed', request => {
    networkIssues.push(`${request.url()} - ${request.failure().errorText}`);
    console.log(`🌐 NETWORK FAIL: ${request.url()}`);
  });
  
  try {
    console.log('\n📍 Testing homepage...');
    await page.goto('https://cryptocampaign.netlify.app/', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const homeResults = await page.evaluate(() => ({
      rootHasContent: document.getElementById('root')?.children.length > 0,
      reactLoaded: typeof window.React !== 'undefined',
      hasReactElements: document.querySelectorAll('[class*="bg-"], [class*="text-"], [class*="flex"]').length > 0,
      bodyText: document.body.textContent?.trim() || 'Empty'
    }));
    
    console.log('\n🏠 Homepage Results:');
    Object.entries(homeResults).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    
    console.log('\n📍 Testing auth page...');
    await page.goto('https://cryptocampaign.netlify.app/auth', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const authResults = await page.evaluate(() => ({
      rootHasContent: document.getElementById('root')?.children.length > 0,
      hasBreadcrumbs: document.querySelectorAll('nav').length > 0,
      hasAuthForm: document.querySelectorAll('form, input[type="email"], input[type="password"]').length > 0,
      hasButtons: document.querySelectorAll('button').length > 0,
      bodyText: document.body.textContent?.trim().slice(0, 100) || 'Empty'
    }));
    
    console.log('\n🔐 Auth Page Results:');
    Object.entries(authResults).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    
    console.log('\n📊 SUMMARY:');
    console.log(`   Errors: ${errors.length}`);
    console.log(`   Warnings: ${warnings.length}`);
    console.log(`   Network Issues: ${networkIssues.length}`);
    console.log(`   React Loading: ${homeResults.reactLoaded || homeResults.rootHasContent ? 'PARTIAL' : 'FAILED'}`);
    console.log(`   Breadcrumbs: ${authResults.hasBreadcrumbs ? 'FOUND' : 'MISSING'}`);
    
    if (errors.length > 0) {
      console.log('\n🚨 ERRORS FOUND:');
      errors.forEach((error, i) => console.log(`   ${i + 1}. ${error}`));
    }
    
    if (networkIssues.length > 0) {
      console.log('\n🌐 NETWORK ISSUES:');
      networkIssues.forEach((issue, i) => console.log(`   ${i + 1}. ${issue}`));
    }
    
    return { errors, warnings, networkIssues, homeResults, authResults };
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    return null;
  } finally {
    await browser.close();
  }
}

// Run the test
if (require.main === module) {
  autoDebugErrors()
    .then(results => {
      if (results && results.errors.length === 0) {
        console.log('\n✅ No critical errors found - issue may be with component rendering');
      }
    })
    .catch(console.error);
}

module.exports = { autoDebugErrors };