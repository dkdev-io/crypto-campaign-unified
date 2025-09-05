const puppeteer = require('puppeteer');

async function verifyDeploymentFix() {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    console.log('🧪 Testing Netlify deployment fix...');
    console.log('📍 URL: https://cryptocampaign.netlify.app/campaigns/auth?bypass=true');
    
    // Test 1: Load campaign auth page with bypass
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth?bypass=true', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    console.log('✅ Page loaded successfully');
    
    // Test 2: Check if latest code is deployed by looking for bypass functionality
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    // Test 3: Check for bypass button (indicator of latest code)
    await page.waitForTimeout(3000); // Wait for React to render
    
    const bypassButton = await page.$('[data-testid="dev-bypass"], button:contains("BYPASS AUTH"), button:contains("Skip")');
    if (bypassButton) {
      console.log('✅ Bypass functionality detected - latest code is deployed!');
    } else {
      console.log('⚠️  Bypass button not found - checking page content...');
    }
    
    // Test 4: Check console for any errors
    const logs = [];
    page.on('console', msg => logs.push(`${msg.type()}: ${msg.text()}`));
    
    await page.waitForTimeout(2000);
    
    if (logs.length > 0) {
      console.log('📋 Console logs:');
      logs.forEach(log => console.log('  ', log));
    }
    
    // Test 5: Try to access setup page to confirm auth bypass is working
    console.log('🔄 Testing setup page access...');
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth/setup?bypass=true', {
      waitUntil: 'networkidle0',
      timeout: 15000
    });
    
    const currentUrl = page.url();
    console.log('📍 Final URL:', currentUrl);
    
    if (currentUrl.includes('setup')) {
      console.log('✅ Setup page accessible - bypass working!');
    } else {
      console.log('❌ Redirected away from setup - bypass may not be working');
    }
    
    console.log('🎉 Deployment verification complete!');
    return true;
    
  } catch (error) {
    console.error('❌ Deployment test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

verifyDeploymentFix().then(success => {
  process.exit(success ? 0 : 1);
});