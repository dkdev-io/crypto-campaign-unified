import puppeteer from 'puppeteer';

async function testAuthContext() {
  console.log('🔍 TESTING AUTH CONTEXT ON LIVE SITE');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.text().includes('Auth') || msg.text().includes('user') || msg.text().includes('loading')) {
      console.log(`🖥️ ${msg.type().toUpperCase()}: ${msg.text()}`);
    }
  });
  
  try {
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth/setup');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Debug the auth context state
    const authState = await page.evaluate(() => {
      // Check if React is available
      const hasReact = typeof React !== 'undefined';
      
      // Look for auth-related elements and classes
      return {
        hasReact: hasReact,
        hasEmailInput: !!document.querySelector('input[type="email"]'),
        hasPasswordInput: !!document.querySelector('input[type="password"]'),
        hasAuthForm: !!document.querySelector('form'),
        hasSpinner: !!document.querySelector('[data-loading="true"]') || document.body.innerHTML.includes('Loading'),
        hasAuthError: document.body.innerHTML.includes('Error') || document.body.innerHTML.includes('error'),
        authElements: Array.from(document.querySelectorAll('[class*="auth"]')).length,
        campaignElements: Array.from(document.querySelectorAll('[class*="campaign"]')).length,
        bodyText: document.body.innerText.substring(0, 200),
        pageHtml: document.body.innerHTML.substring(0, 500)
      };
    });
    
    console.log('🔍 AUTH CONTEXT DEBUG:');
    console.log('  React available:', authState.hasReact);
    console.log('  Email input:', authState.hasEmailInput);
    console.log('  Password input:', authState.hasPasswordInput);
    console.log('  Auth form:', authState.hasAuthForm);
    console.log('  Loading spinner:', authState.hasSpinner);
    console.log('  Auth error:', authState.hasAuthError);
    console.log('  Auth elements:', authState.authElements);
    console.log('  Campaign elements:', authState.campaignElements);
    console.log('  Page text preview:', authState.bodyText);
    
    if (!authState.hasEmailInput && !authState.hasSpinner) {
      console.log('\n🚨 PROBLEM: No auth form AND no loading spinner');
      console.log('💡 LIKELY CAUSE: CampaignAuth component failed to render');
      console.log('📄 Page HTML preview:', authState.pageHtml);
    }
    
    await browser.close();
    
  } catch (error) {
    console.error('❌ Auth context test failed:', error);
    await browser.close();
  }
}

testAuthContext();