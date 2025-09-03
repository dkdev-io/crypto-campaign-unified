import puppeteer from 'puppeteer';

async function debugLiveSetup() {
  console.log('🔍 DEBUGGING WHY SETUP WIZARD NOT LOADING ON LIVE SITE');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('🚨 BROWSER ERROR:', msg.text());
    }
  });
  
  // Capture network errors
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`🚨 HTTP ERROR: ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    console.log('\n1. Loading campaign setup page...');
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth/setup');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n2. Logging in...');
    await page.type('input[type="email"]', 'test@dkdev.io');
    await page.type('input[type="password"]', 'TestPassword123!');
    
    const loginButton = await page.$('button[type="submit"]');
    await loginButton.click();
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n3. Checking what loaded after login...');
    
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        hasStepIndicator: document.body.innerHTML.includes('Step'),
        hasSetupWizard: document.body.innerHTML.includes('SetupWizard') || document.body.innerHTML.includes('Campaign Information'),
        hasCampaignSetup: document.body.innerHTML.includes('CampaignSetup'),
        hasH2: document.querySelector('h2') ? document.querySelector('h2').textContent : 'No H2',
        bodyClasses: document.body.className,
        errors: window.console ? 'Console available' : 'No console'
      };
    });
    
    console.log('📊 PAGE ANALYSIS:');
    console.log('   URL:', pageContent.url);
    console.log('   Title:', pageContent.title);
    console.log('   H2 text:', pageContent.hasH2);
    console.log('   Has Step Indicator:', pageContent.hasStepIndicator);
    console.log('   Has Setup Wizard:', pageContent.hasSetupWizard);
    console.log('   Has Campaign Setup:', pageContent.hasCampaignSetup);
    
    // Take screenshot for debugging
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/live-setup-debug.png',
      fullPage: true 
    });
    
    console.log('\n📸 Screenshot saved as live-setup-debug.png');
    
    // Check for specific errors
    const hasAuthError = await page.evaluate(() => {
      return document.body.innerHTML.includes('Invalid') || 
             document.body.innerHTML.includes('Error') ||
             document.body.innerHTML.includes('Failed');
    });
    
    if (hasAuthError) {
      console.log('🚨 AUTH/LOADING ERROR detected in page content');
    }
    
    console.log('\n🔧 DIAGNOSIS:');
    if (!pageContent.hasStepIndicator && !pageContent.hasSetupWizard) {
      console.log('❌ PROBLEM: Setup wizard components not loading');
      console.log('💡 LIKELY CAUSE: Database columns missing on live site OR JS error');
    } else {
      console.log('✅ Setup wizard components are loading');
    }
    
    await browser.close();
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
    await browser.close();
  }
}

debugLiveSetup();