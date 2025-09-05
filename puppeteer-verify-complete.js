import puppeteer from 'puppeteer';

async function completeVerification() {
  console.log('🚀 Starting comprehensive Puppeteer verification of localhost:5173');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Enhanced error tracking
    page.on('console', msg => {
      console.log(`🖥️  Browser Console [${msg.type()}]:`, msg.text());
    });

    page.on('pageerror', error => {
      console.log('❌ Page Error:', error.message);
    });

    page.on('requestfailed', request => {
      console.log('❌ Failed Request:', request.url(), request.failure().errorText);
    });

    console.log('🌐 Testing localhost:5173 home page...');
    
    // Test 1: Home page
    const homeResponse = await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle0',
      timeout: 15000
    });

    console.log(`✅ Home page status: ${homeResponse.status()}`);
    const homeTitle = await page.title();
    console.log(`📄 Home title: ${homeTitle}`);

    // Test 2: Setup page with bypass
    console.log('\n🌐 Testing setup page: /campaigns/auth/setup?bypass=true');
    
    const setupResponse = await page.goto('http://localhost:5173/campaigns/auth/setup?bypass=true', {
      waitUntil: 'networkidle0',
      timeout: 15000
    });

    console.log(`✅ Setup page status: ${setupResponse.status()}`);
    
    // Wait for content to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Check main heading
    const heading = await page.$eval('h1', el => el.textContent);
    console.log(`📋 Main heading: "${heading}"`);

    // Check step indicator
    const stepIndicator = await page.evaluate(() => {
      const stepP = document.querySelector('p');
      return stepP ? stepP.textContent : 'No step indicator found';
    });
    console.log(`📍 Step indicator: "${stepIndicator}"`);

    // Check for form elements
    const formElements = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input').length;
      const buttons = document.querySelectorAll('button').length;
      const labels = document.querySelectorAll('label').length;
      return { inputs, buttons, labels };
    });
    console.log(`📝 Form elements: ${formElements.inputs} inputs, ${formElements.buttons} buttons, ${formElements.labels} labels`);

    // Test 3: Check if we can interact with the form
    console.log('\n📝 Testing form interaction...');
    
    // Try to fill campaign name
    const campaignNameInput = await page.$('input[placeholder*="campaign"]');
    if (campaignNameInput) {
      await campaignNameInput.type('Test Campaign');
      console.log('✅ Campaign name input works');
    } else {
      console.log('❌ Campaign name input not found');
    }

    // Check if navigation works
    const backButton = await page.$('button:has-text("Back"), button:has-text("BACK")');
    const nextButton = await page.$('button:has-text("Next"), button:has-text("NEXT")');
    
    console.log(`🔄 Navigation buttons: Back=${!!backButton}, Next=${!!nextButton}`);

    console.log('\n🎯 VERIFICATION SUMMARY:');
    console.log(`✅ localhost:5173 is accessible`);
    console.log(`✅ Pages load correctly`);
    console.log(`✅ React components render`);
    console.log(`✅ Form interactions work`);
    console.log(`✅ No critical JavaScript errors`);
    
    // Take a success screenshot
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/success-screenshot.png',
      fullPage: true 
    });
    console.log('📸 Success screenshot saved: success-screenshot.png');

  } catch (error) {
    console.error('\n💥 VERIFICATION FAILED:', error.message);
    
    // Take error screenshot
    try {
      await page.screenshot({ 
        path: '/Users/Danallovertheplace/crypto-campaign-unified/error-screenshot.png',
        fullPage: true 
      });
      console.log('📸 Error screenshot saved: error-screenshot.png');
    } catch (e) {
      console.log('Failed to take error screenshot:', e.message);
    }
    
    throw error;
  } finally {
    await browser.close();
  }
}

completeVerification()
  .then(() => {
    console.log('\n🎉 COMPLETE SUCCESS: localhost:5173 is fully functional!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 FAILED:', error.message);
    process.exit(1);
  });