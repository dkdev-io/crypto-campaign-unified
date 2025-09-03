import puppeteer from 'puppeteer';

async function debugAdminContext() {
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('🔧 DEBUGGING ADMIN CONTEXT ON PRODUCTION');
    console.log('=========================================');
    
    // Add console logging
    page.on('console', message => {
      console.log(`PAGE LOG: ${message.text()}`);
    });
    
    page.on('pageerror', error => {
      console.log(`PAGE ERROR: ${error.message}`);
    });
    
    const prodUrl = 'https://cryptocampaign.netlify.app';
    
    // Login first
    console.log('\n1. Logging in...');
    await page.goto(`${prodUrl}/minda`, { waitUntil: 'networkidle0' });
    
    await page.type('input[name="email"]', 'dan@dkdev.io');
    await page.type('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    // Debug AdminContext state
    console.log('\n2. Checking AdminContext state...');
    const adminState = await page.evaluate(() => {
      // Try to access React DevTools or check window for admin data
      return {
        currentUrl: window.location.href,
        localStorage: localStorage.getItem('admin_user'),
        hasAdminContext: !!window.React,
        bodyContent: document.body.innerText.slice(0, 200)
      };
    });
    
    console.log('Admin State:', adminState);
    
    // Navigate to users page and debug what's happening
    console.log('\n3. Navigating to users page and debugging...');
    await page.goto(`${prodUrl}/minda/users`, { waitUntil: 'networkidle0' });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check what's actually rendering
    const pageDebug = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        bodyText: document.body.innerText,
        bodyLength: document.body.innerText.length,
        hasReactRoot: !!document.getElementById('root'),
        reactChildren: document.getElementById('root') ? document.getElementById('root').children.length : 0,
        errors: window.console._errors || []
      };
    });
    
    console.log('\nUSERS PAGE DEBUG:');
    console.log('URL:', pageDebug.url);
    console.log('Title:', pageDebug.title);
    console.log('Body text length:', pageDebug.bodyLength);
    console.log('React root children:', pageDebug.reactChildren);
    console.log('Body content preview:', pageDebug.bodyText.slice(0, 300));
    
    // Test campaigns page too
    console.log('\n4. Testing campaigns page...');
    await page.goto(`${prodUrl}/minda/campaigns`, { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const campaignsDebug = await page.evaluate(() => {
      return {
        bodyText: document.body.innerText,
        bodyLength: document.body.innerText.length,
        hasContent: document.body.innerText.includes('Campaign') || document.body.innerText.includes('Management')
      };
    });
    
    console.log('CAMPAIGNS PAGE:');
    console.log('Body length:', campaignsDebug.bodyLength);
    console.log('Has campaign content:', campaignsDebug.hasContent);
    console.log('Content preview:', campaignsDebug.bodyText.slice(0, 200));
    
    console.log('\n=========================================');
    console.log('🎯 DEBUG SUMMARY');
    console.log('=========================================');
    console.log(`Admin Login: ${adminState.currentUrl.includes('dashboard') ? 'Success' : 'Failed'}`);
    console.log(`Users Page: ${pageDebug.bodyLength > 100 ? 'Has Content' : 'Empty'} (${pageDebug.bodyLength} chars)`);
    console.log(`Campaigns Page: ${campaignsDebug.bodyLength > 100 ? 'Has Content' : 'Empty'} (${campaignsDebug.bodyLength} chars)`);
    
    return {
      adminState,
      usersPage: pageDebug,
      campaignsPage: campaignsDebug
    };
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    return { error: error.message };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run debug
debugAdminContext().then(result => {
  console.log('\n✅ Debug complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Debug failed:', error);
  process.exit(1);
});