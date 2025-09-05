import puppeteer from 'puppeteer';

async function verifyLocalhost5173() {
  console.log('🔍 Verifying localhost:5173 is working...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Browser Error:', msg.text());
      }
    });

    page.on('pageerror', error => {
      console.log('❌ Page Error:', error.message);
    });

    console.log('🌐 Loading http://localhost:5173...');
    
    // Test basic localhost:5173 first
    const response = await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle0',
      timeout: 15000
    });

    if (response.ok()) {
      console.log('✅ localhost:5173 is accessible - Status:', response.status());
    } else {
      console.log('❌ localhost:5173 failed - Status:', response.status());
      throw new Error(`HTTP ${response.status()}`);
    }

    // Check if page loaded properly
    const title = await page.title();
    console.log('📄 Page title:', title);

    // Test the setup page specifically
    console.log('🌐 Loading setup page: http://localhost:5173/campaigns/auth/setup?bypass=true');
    
    const setupResponse = await page.goto('http://localhost:5173/campaigns/auth/setup?bypass=true', {
      waitUntil: 'networkidle0',
      timeout: 15000
    });

    if (setupResponse.ok()) {
      console.log('✅ Setup page loads - Status:', setupResponse.status());
      
      // Check if we can see the campaign setup content
      await page.waitForSelector('h1', { timeout: 5000 });
      const heading = await page.$eval('h1', el => el.textContent);
      console.log('📋 Page heading:', heading);

      // Check for step indicator
      const stepText = await page.evaluate(() => {
        const stepEl = document.querySelector('p');
        return stepEl ? stepEl.textContent : 'No step text found';
      });
      console.log('📍 Step indicator:', stepText);

      console.log('🎉 SUCCESS: localhost:5173 is working properly!');
      
    } else {
      console.log('❌ Setup page failed - Status:', setupResponse.status());
      throw new Error(`Setup page HTTP ${setupResponse.status()}`);
    }

  } catch (error) {
    console.error('❌ FAILED:', error.message);
    
    // Take a screenshot for debugging
    try {
      await page.screenshot({ 
        path: '/Users/Danallovertheplace/crypto-campaign-unified/debug-screenshot.png',
        fullPage: true 
      });
      console.log('📸 Debug screenshot saved to debug-screenshot.png');
    } catch (screenshotError) {
      console.log('Failed to take screenshot:', screenshotError.message);
    }
    
    throw error;
  } finally {
    await browser.close();
  }
}

verifyLocalhost5173()
  .then(() => {
    console.log('\n🎯 VERIFICATION COMPLETE: localhost:5173 is working correctly');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 VERIFICATION FAILED:', error.message);
    process.exit(1);
  });