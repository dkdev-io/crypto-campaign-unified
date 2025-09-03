import puppeteer from 'puppeteer';

async function debugAuthErrors() {
  console.log('🔍 Debugging Auth Page Errors...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-web-security']
  });
  
  const page = await browser.newPage();
  
  // Capture console logs and errors
  const logs = [];
  const errors = [];
  
  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
    console.log(`CONSOLE ${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(`PAGE ERROR: ${error.message}`);
  });
  
  page.on('requestfailed', request => {
    console.log(`FAILED REQUEST: ${request.url()} - ${request.failure()?.errorText}`);
  });
  
  try {
    console.log('📍 Loading auth page...');
    await page.goto('https://cryptocampaign.netlify.app/auth', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait longer for React to load
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log('📍 Checking page content...');
    
    // Get page HTML to see what's actually there
    const bodyHTML = await page.evaluate(() => document.body.innerHTML);
    console.log('BODY HTML LENGTH:', bodyHTML.length);
    console.log('BODY HTML PREVIEW:', bodyHTML.substring(0, 500));
    
    // Check if React root exists
    const hasReactRoot = await page.evaluate(() => {
      return document.getElementById('root') !== null;
    });
    console.log('React root exists:', hasReactRoot);
    
    // Check if React has rendered anything
    const rootContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.innerHTML.length : 0;
    });
    console.log('React root content length:', rootContent);
    
    // Check for specific elements
    const checks = {
      'div': await page.$('div') !== null,
      'header': await page.$('header') !== null,
      'button': await page.$('button') !== null,
      'input': await page.$('input') !== null,
      'form': await page.$('form') !== null,
      '.auth-form': await page.$('.auth-form') !== null,
      '.bg-card': await page.$('.bg-card') !== null,
      'text containing "Sign"': await page.evaluate(() => document.body.textContent.includes('Sign')),
      'text containing "Email"': await page.evaluate(() => document.body.textContent.includes('Email')),
      'text containing "Password"': await page.evaluate(() => document.body.textContent.includes('Password'))
    };
    
    console.log('ELEMENT CHECKS:', checks);
    
    // Take screenshot for visual debugging
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/debug-auth-full.png',
      fullPage: true 
    });
    
    // Check network requests
    const requests = [];
    page.on('request', request => {
      requests.push(`${request.method()} ${request.url()}`);
    });
    
    console.log('CONSOLE LOGS:', logs.length);
    console.log('ERRORS:', errors.length);
    
    return {
      hasContent: rootContent > 100,
      hasInputs: checks.input,
      errors: errors,
      logs: logs.slice(-10) // Last 10 logs
    };
    
  } catch (error) {
    console.error('💥 Debug failed:', error.message);
    return { error: error.message };
  } finally {
    await browser.close();
  }
}

debugAuthErrors().then(result => {
  console.log('\n🎯 DEBUG RESULT:', result);
  process.exit(0);
});