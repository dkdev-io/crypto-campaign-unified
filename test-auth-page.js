import puppeteer from 'puppeteer';

async function testAuthPage() {
  console.log('🚀 Testing Auth Page...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  try {
    // Go directly to auth page
    await page.goto('https://cryptocampaign.netlify.app/auth', { 
      waitUntil: 'networkidle2',
      timeout: 15000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/auth-test.png',
      fullPage: true 
    });
    
    // Check if page has content
    const hasEmailField = await page.$('input[type="email"]') !== null;
    const hasPasswordField = await page.$('input[type="password"]') !== null;
    const hasSignInButton = await page.$('text="Sign In"') !== null;
    
    console.log(`Email field: ${hasEmailField}`);
    console.log(`Password field: ${hasPasswordField}`);
    console.log(`Sign In button: ${hasSignInButton}`);
    
    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);
    
    const isWorking = hasEmailField && hasPasswordField;
    console.log(`Auth page working: ${isWorking}`);
    
    return isWorking;
    
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testAuthPage().then(success => {
  console.log(`Auth page ${success ? 'WORKING' : 'BROKEN'}`);
  process.exit(success ? 0 : 1);
});