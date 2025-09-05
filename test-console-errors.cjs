const puppeteer = require('puppeteer');

async function testConsoleErrors() {
  console.log('🚀 Checking for console errors...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Collect console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    });
    
    // Collect errors
    const errors = [];
    page.on('pageerror', error => {
      errors.push({
        message: error.message,
        stack: error.stack
      });
    });
    
    // Collect failed requests
    const failedRequests = [];
    page.on('requestfailed', request => {
      failedRequests.push({
        url: request.url(),
        failure: request.failure().errorText
      });
    });
    
    console.log('📍 Loading setup page...');
    await page.goto('http://localhost:5173/campaigns/auth/setup', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for any async operations
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n📊 CONSOLE ANALYSIS:');
    console.log('==================');
    
    console.log(`\n🔍 Console Messages (${consoleMessages.length}):`);
    if (consoleMessages.length === 0) {
      console.log('   No console messages');
    } else {
      consoleMessages.forEach((msg, i) => {
        console.log(`   ${i + 1}. [${msg.type.toUpperCase()}] ${msg.text}`);
        if (msg.location) {
          console.log(`      Location: ${msg.location.url}:${msg.location.lineNumber}`);
        }
      });
    }
    
    console.log(`\n❌ Page Errors (${errors.length}):`);
    if (errors.length === 0) {
      console.log('   No JavaScript errors');
    } else {
      errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error.message}`);
        if (error.stack) {
          console.log(`      Stack: ${error.stack.substring(0, 200)}...`);
        }
      });
    }
    
    console.log(`\n🚫 Failed Requests (${failedRequests.length}):`);
    if (failedRequests.length === 0) {
      console.log('   No failed requests');
    } else {
      failedRequests.forEach((req, i) => {
        console.log(`   ${i + 1}. ${req.url}`);
        console.log(`      Error: ${req.failure}`);
      });
    }
    
    // Check if WebsiteStyleMatcher component is available
    const componentCheck = await page.evaluate(() => {
      // Try to find any reference to WebsiteStyleMatcher in the global scope
      const scripts = Array.from(document.scripts);
      let hasWebsiteStyleMatcher = false;
      
      // Check if React DevTools are available
      const hasReact = !!window.React || !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      
      // Check if component name appears in any script content
      for (const script of scripts) {
        if (script.innerHTML && script.innerHTML.includes('WebsiteStyleMatcher')) {
          hasWebsiteStyleMatcher = true;
          break;
        }
      }
      
      // Check loaded modules/components
      const moduleInfo = {
        hasReact,
        hasWebsiteStyleMatcher,
        scriptCount: scripts.length,
        currentUrl: window.location.href,
        currentStep: document.querySelector('h2') ? document.querySelector('h2').textContent : '',
        hasSetupWizard: !!document.querySelector('.setup-wizard'),
      };
      
      return moduleInfo;
    });
    
    console.log('\n⚛️ Component Analysis:');
    console.log(`   React available: ${componentCheck.hasReact}`);
    console.log(`   WebsiteStyleMatcher in scripts: ${componentCheck.hasWebsiteStyleMatcher}`);
    console.log(`   Script count: ${componentCheck.scriptCount}`);
    console.log(`   Current URL: ${componentCheck.currentUrl}`);
    console.log(`   Current step: ${componentCheck.currentStep}`);
    console.log(`   Has setup wizard class: ${componentCheck.hasSetupWizard}`);
    
    // Try to manually check the React component tree
    const reactInfo = await page.evaluate(() => {
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
        const fiberRoots = hook.getFiberRoots ? hook.getFiberRoots(1) : null;
        
        if (fiberRoots && fiberRoots.size > 0) {
          return {
            hasDevTools: true,
            rootCount: fiberRoots.size
          };
        }
      }
      
      return {
        hasDevTools: false,
        rootCount: 0
      };
    });
    
    console.log('\n🔧 React DevTools:');
    console.log(`   DevTools available: ${reactInfo.hasDevTools}`);
    console.log(`   Fiber roots: ${reactInfo.rootCount}`);
    
    // Take a screenshot
    await page.screenshot({ 
      path: 'console-error-check.png',
      fullPage: true 
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
    console.log('\n🔒 Browser closed');
  }
}

testConsoleErrors().catch(console.error);