#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function debugJavaScriptErrors() {
  console.log('🐛 Debugging JavaScript Errors on Live Site');
  console.log('='.repeat(50));
  
  const browser = await puppeteer.launch({ headless: false, devtools: true });
  const page = await browser.newPage();
  
  // Enable detailed error logging
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    
    if (type === 'error') {
      console.log(`❌ CONSOLE ERROR: ${text}`);
    } else if (type === 'warn') {
      console.log(`⚠️  CONSOLE WARN: ${text}`);
    } else if (type === 'log') {
      console.log(`ℹ️  CONSOLE LOG: ${text}`);
    }
  });
  
  // Enable error event logging
  page.on('pageerror', error => {
    console.log(`💥 PAGE ERROR: ${error.message}`);
    console.log(`   Stack: ${error.stack}`);
  });
  
  // Enable request failure logging
  page.on('requestfailed', request => {
    console.log(`🌐 REQUEST FAILED: ${request.url()}`);
    console.log(`   Failure: ${request.failure().errorText}`);
  });
  
  // Enable response monitoring
  page.on('response', response => {
    const status = response.status();
    const url = response.url();
    
    if (status >= 400) {
      console.log(`🚨 HTTP ERROR: ${status} - ${url}`);
    } else if (url.includes('index') || url.includes('main') || url.includes('assets')) {
      console.log(`✅ LOADED: ${status} - ${url}`);
    }
  });
  
  try {
    console.log('\n🔄 Navigating to homepage...');
    await page.goto('https://cryptocampaign.netlify.app/', { 
      waitUntil: 'domcontentloaded', 
      timeout: 30000 
    });
    
    // Wait and check React initialization step by step
    console.log('⏳ Waiting 2 seconds for initial load...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const initialCheck = await page.evaluate(() => ({
      hasRoot: !!document.getElementById('root'),
      rootChildren: document.getElementById('root')?.children.length || 0,
      windowReact: typeof window.React !== 'undefined',
      windowReactDOM: typeof window.ReactDOM !== 'undefined',
      totalScripts: document.getElementsByTagName('script').length
    }));
    
    console.log('📊 Initial State:');
    console.log(`   Root exists: ${initialCheck.hasRoot}`);
    console.log(`   Root children: ${initialCheck.rootChildren}`);
    console.log(`   Window.React: ${initialCheck.windowReact}`);
    console.log(`   Window.ReactDOM: ${initialCheck.windowReactDOM}`);
    console.log(`   Script tags: ${initialCheck.totalScripts}`);
    
    console.log('\n⏳ Waiting 5 more seconds for React to initialize...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const laterCheck = await page.evaluate(() => ({
      rootChildren: document.getElementById('root')?.children.length || 0,
      rootHTML: document.getElementById('root')?.innerHTML?.slice(0, 200) || 'Empty',
      bodyText: document.body.textContent?.slice(0, 200) || 'No text',
      hasNavElements: document.querySelectorAll('nav').length,
      hasReactElements: document.querySelectorAll('[class*="bg-"], [class*="text-"], [class*="crypto"]').length
    }));
    
    console.log('\n📊 After Wait:');
    console.log(`   Root children: ${laterCheck.rootChildren}`);
    console.log(`   Root HTML: ${laterCheck.rootHTML}`);
    console.log(`   Body text: ${laterCheck.bodyText}`);
    console.log(`   Nav elements: ${laterCheck.hasNavElements}`);
    console.log(`   React-style elements: ${laterCheck.hasReactElements}`);
    
    // Try the auth page
    console.log('\n🔄 Navigating to auth page...');
    await page.goto('https://cryptocampaign.netlify.app/auth', { 
      waitUntil: 'domcontentloaded', 
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const authCheck = await page.evaluate(() => ({
      rootChildren: document.getElementById('root')?.children.length || 0,
      rootHTML: document.getElementById('root')?.innerHTML?.slice(0, 300) || 'Empty',
      hasFormElements: document.querySelectorAll('form, input, button').length,
      hasBreadcrumbs: document.querySelectorAll('nav[aria-label*="readcrumb"], nav[aria-label*="Breadcrumb"]').length,
      allNavs: document.querySelectorAll('nav').length
    }));
    
    console.log('\n📋 Auth Page State:');
    console.log(`   Root children: ${authCheck.rootChildren}`);
    console.log(`   Root HTML: ${authCheck.rootHTML}`);
    console.log(`   Form elements: ${authCheck.hasFormElements}`);
    console.log(`   Breadcrumb navs: ${authCheck.hasBreadcrumbs}`);
    console.log(`   All navs: ${authCheck.allNavs}`);
    
    console.log('\n🔍 Keeping browser open for manual inspection...');
    console.log('   Check the Developer Tools Console tab for more details');
    console.log('   Press Ctrl+C when done inspecting');
    
    // Keep browser open for manual inspection
    await new Promise(resolve => {
      process.on('SIGINT', () => {
        console.log('\n👋 Closing browser...');
        resolve();
      });
    });
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the debug session
if (require.main === module) {
  debugJavaScriptErrors().catch(console.error);
}

module.exports = { debugJavaScriptErrors };