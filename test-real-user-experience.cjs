const puppeteer = require('puppeteer');

async function testRealUserExperience() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 },
    slowMo: 500 // Slow down actions to match human speed
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('PAGE LOG:', msg.text());
  });
  
  try {
    console.log('🧪 TESTING REAL USER EXPERIENCE ON NETLIFY');
    console.log('1. Going to donor auth page...');
    
    await page.goto('https://cryptocampaign.netlify.app/donors/auth', { 
      waitUntil: 'networkidle0',
      timeout: 10000
    });
    
    console.log('2. Looking for and clicking DEV BYPASS button...');
    
    // Wait for the button to be visible and clickable
    await page.waitForSelector('button', { timeout: 10000 });
    
    // Find the specific devbypass button
    const buttons = await page.$$('button');
    let bypassButton = null;
    
    for (let button of buttons) {
      const text = await button.evaluate(el => el.textContent || '');
      if (text.includes('DEV BYPASS')) {
        bypassButton = button;
        console.log('✅ Found DEV BYPASS button');
        break;
      }
    }
    
    if (!bypassButton) {
      console.log('❌ DEV BYPASS button not found');
      return;
    }
    
    // Take screenshot before click
    await page.screenshot({ path: 'before-click.png' });
    
    console.log('3. Clicking DEV BYPASS button...');
    await bypassButton.click();
    
    console.log('4. Waiting for navigation...');
    
    // Wait for navigation to complete
    try {
      await page.waitForNavigation({ 
        waitUntil: 'networkidle0', 
        timeout: 10000 
      });
      console.log('✅ Navigation completed');
    } catch (e) {
      console.log('⚠️ Navigation timeout or no navigation detected');
    }
    
    console.log('5. Checking final state...');
    const finalUrl = page.url();
    console.log('Final URL:', finalUrl);
    
    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot after click
    await page.screenshot({ path: 'after-click.png' });
    
    // Check if we're on the dashboard
    if (finalUrl.includes('/donors/dashboard')) {
      console.log('✅ Successfully navigated to dashboard');
      
      // Check if bypass parameter is present
      if (finalUrl.includes('bypass=true')) {
        console.log('✅ Bypass parameter present');
      } else {
        console.log('❌ Bypass parameter missing');
      }
      
      // Check if page has actual dashboard content
      const hasTitle = await page.$('h1, h2');
      if (hasTitle) {
        const titleText = await hasTitle.evaluate(el => el.textContent);
        console.log('Dashboard title:', titleText);
        
        if (titleText.includes('Dashboard')) {
          console.log('✅ Dashboard content loaded');
        } else {
          console.log('❌ Dashboard content missing');
        }
      } else {
        console.log('❌ No title found - page might be broken');
      }
      
      // Check for bypass indicator
      const bypassIndicator = await page.$eval('body', body => 
        body.textContent.includes('Bypass Mode') || body.textContent.includes('DEV BYPASS')
      );
      
      if (bypassIndicator) {
        console.log('✅ Bypass mode indicator found');
      } else {
        console.log('❌ Bypass mode indicator missing');
      }
      
    } else {
      console.log('❌ Failed to navigate to dashboard');
      console.log('Current page might be:', finalUrl);
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    await page.screenshot({ path: 'error-state.png' });
  }
  
  console.log('6. Test completed. Check screenshots: before-click.png, after-click.png');
  await browser.close();
}

testRealUserExperience().catch(console.error);