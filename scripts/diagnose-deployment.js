#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function diagnoseLiveDeployment() {
  console.log('🔧 Diagnosing Live Deployment Issues');
  console.log('='.repeat(50));
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log(`❌ Console Error: ${msg.text()}`);
    }
  });
  
  // Capture network failures
  const networkFailures = [];
  page.on('response', response => {
    if (response.status() >= 400) {
      networkFailures.push(`${response.status()} - ${response.url()}`);
      console.log(`🌐 Network Error: ${response.status()} - ${response.url()}`);
    }
  });
  
  try {
    console.log('\n📍 Loading homepage...');
    await page.goto('https://cryptocampaign.netlify.app/', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    // Wait for potential React loading
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check basic page info
    const pageInfo = await page.evaluate(() => ({
      title: document.title,
      htmlLength: document.documentElement.outerHTML.length,
      hasReactRoot: !!document.getElementById('root'),
      rootContent: document.getElementById('root')?.innerHTML.slice(0, 200) || 'No root element',
      scriptTags: Array.from(document.getElementsByTagName('script')).length,
      linkTags: Array.from(document.getElementsByTagName('link')).length,
      hasViteScript: Array.from(document.getElementsByTagName('script')).some(s => s.src.includes('index')),
      bodyClasses: document.body.className,
      metaTags: Array.from(document.getElementsByTagName('meta')).map(m => m.name || m.property).filter(Boolean)
    }));
    
    console.log('\n📊 Page Analysis:');
    console.log(`   Title: ${pageInfo.title}`);
    console.log(`   HTML Length: ${pageInfo.htmlLength} chars`);
    console.log(`   Has React Root: ${pageInfo.hasReactRoot}`);
    console.log(`   Root Content: ${pageInfo.rootContent}`);
    console.log(`   Script Tags: ${pageInfo.scriptTags}`);
    console.log(`   Link Tags: ${pageInfo.linkTags}`);
    console.log(`   Has Vite Script: ${pageInfo.hasViteScript}`);
    console.log(`   Body Classes: ${pageInfo.bodyClasses}`);
    console.log(`   Meta Tags: ${pageInfo.metaTags.join(', ')}`);
    
    // Check auth page specifically
    console.log('\n📍 Loading auth page...');
    await page.goto('https://cryptocampaign.netlify.app/auth', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const authPageInfo = await page.evaluate(() => ({
      hasReactElements: document.querySelectorAll('[class*="bg-gradient"], [class*="crypto"], .container-responsive').length,
      hasAuthForm: !!document.querySelector('form'),
      hasButtons: document.querySelectorAll('button').length,
      hasInputs: document.querySelectorAll('input').length,
      visibleText: document.body.textContent.trim().slice(0, 300),
      breadcrumbElements: document.querySelectorAll('nav, [class*="breadcrumb"]').length
    }));
    
    console.log('\n📋 Auth Page Analysis:');
    console.log(`   React-style Elements: ${authPageInfo.hasReactElements}`);
    console.log(`   Has Form: ${authPageInfo.hasAuthForm}`);
    console.log(`   Button Count: ${authPageInfo.hasButtons}`);
    console.log(`   Input Count: ${authPageInfo.hasInputs}`);
    console.log(`   Breadcrumb Elements: ${authPageInfo.breadcrumbElements}`);
    console.log(`   Visible Text: ${authPageInfo.visibleText}`);
    
    return {
      consoleErrors,
      networkFailures,
      pageInfo,
      authPageInfo
    };
    
  } catch (error) {
    console.error('\n❌ Navigation failed:', error.message);
    return null;
  } finally {
    await browser.close();
  }
}

// Run diagnosis
if (require.main === module) {
  diagnoseLiveDeployment()
    .then(results => {
      if (results) {
        console.log('\n🏁 DIAGNOSIS SUMMARY:');
        console.log(`   Console Errors: ${results.consoleErrors.length}`);
        console.log(`   Network Failures: ${results.networkFailures.length}`);
        console.log(`   React Loading: ${results.pageInfo?.hasReactRoot && results.authPageInfo?.hasReactElements > 0 ? 'SUCCESS' : 'FAILED'}`);
        console.log(`   Breadcrumbs Present: ${results.authPageInfo?.breadcrumbElements > 0 ? 'YES' : 'NO'}`);
        
        if (results.consoleErrors.length === 0 && results.networkFailures.length === 0) {
          console.log('\n✅ No obvious deployment errors detected');
          console.log('   Issue may be with React hydration or component rendering');
        } else {
          console.log('\n🚨 Deployment issues detected - see errors above');
        }
      }
    })
    .catch(console.error);
}

module.exports = { diagnoseLiveDeployment };