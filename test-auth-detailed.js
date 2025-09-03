import puppeteer from 'puppeteer';

async function testAuthDetailed() {
  console.log('🔍 DETAILED AUTH DEBUGGING ON LIVE SITE');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  // Capture ALL console messages
  page.on('console', msg => {
    console.log(`🖥️ ${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  
  // Capture network requests
  page.on('response', response => {
    if (response.url().includes('auth') || response.status() >= 400) {
      console.log(`📡 ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    console.log('\n1. Loading campaign auth page...');
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth/setup');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n2. Checking page state before login...');
    const beforeLogin = await page.evaluate(() => ({
      url: window.location.href,
      hasAuth: !!document.querySelector('input[type="email"]'),
      currentUser: window.localStorage.getItem('supabase.auth.token') ? 'Has token' : 'No token'
    }));
    console.log('Before login:', beforeLogin);
    
    console.log('\n3. Attempting login...');
    await page.type('input[type="email"]', 'test@dkdev.io');
    await page.type('input[type="password"]', 'TestPassword123!');
    
    // Click login and wait for response
    const loginButton = await page.$('button[type="submit"]');
    await loginButton.click();
    
    // Wait and check what happens
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    console.log('\n4. Checking state after login attempt...');
    const afterLogin = await page.evaluate(() => ({
      url: window.location.href,
      hasSetupWizard: document.body.innerHTML.includes('Step 1') || 
                     document.body.innerHTML.includes('Campaign Information') ||
                     document.body.innerHTML.includes('setup-container'),
      hasAuthForm: !!document.querySelector('input[type="email"]'),
      hasError: document.body.innerHTML.includes('error') || document.body.innerHTML.includes('Error'),
      localStorage: Object.keys(localStorage).filter(key => key.includes('auth')),
      h2Text: document.querySelector('h2') ? document.querySelector('h2').textContent : 'No H2'
    }));
    
    console.log('After login:', afterLogin);
    
    console.log('\n🎯 FINAL DIAGNOSIS:');
    if (afterLogin.hasAuthForm && !afterLogin.hasSetupWizard) {
      console.log('❌ STILL ON AUTH PAGE - LOGIN FAILED');
      console.log('💡 Need to check: auth credentials, auth config, or CampaignSetup routing');
    } else if (afterLogin.hasSetupWizard) {
      console.log('✅ SUCCESS: Setup wizard loaded after login');
    } else {
      console.log('❓ UNKNOWN STATE: Neither auth nor setup wizard');
    }
    
    await browser.close();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await browser.close();
  }
}

testAuthDetailed();