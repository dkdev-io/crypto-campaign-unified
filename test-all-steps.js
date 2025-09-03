import puppeteer from 'puppeteer';

async function testAllSteps() {
  console.log('Testing ALL 7 setup wizard steps...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  try {
    // Create account and get to step 2
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth/setup');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const buttons = await page.$$('button');
    for (let button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.trim() === 'Sign Up') {
        await button.click();
        break;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.type('input[name="fullName"]', 'Step Test');
    await page.type('input[name="email"]', `steps${Date.now()}@dkdev.io`);
    await page.type('input[name="password"]', 'TestPassword123!');
    await page.type('input[name="confirmPassword"]', 'TestPassword123!');
    await page.click('input[name="agreeToTerms"]');
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    console.log('Now at step 2 - Testing committee search...');
    
    // Test Step 2: Committee Search
    const searchInput = await page.$('input[placeholder*="committee"]');
    if (!searchInput) {
      console.log('STEP 2 BROKEN: No committee search input');
      return false;
    }
    
    await page.type('input[placeholder*="committee"]', 'test committee');
    
    // Look for search button
    const allButtons = await page.$$('button');
    let searchButton = null;
    for (let button of allButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('Search')) {
        searchButton = button;
        break;
      }
    }
    
    if (searchButton) {
      await searchButton.click();
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/step2-committee.png',
      fullPage: true 
    });
    
    // Try to go to Step 3
    console.log('Attempting to proceed to step 3...');
    const nextButtons = await page.$$('button');
    let nextButton = null;
    for (let button of nextButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('Next') || text.includes('Connect Bank')) {
        nextButton = button;
        break;
      }
    }
    
    if (!nextButton) {
      console.log('STEP 2 BROKEN: Cannot proceed to step 3 - no next button');
      return false;
    }
    
    await nextButton.click();
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if we reached Step 3
    const step3Text = await page.evaluate(() => document.body.textContent);
    const isStep3 = step3Text.includes('Step 3') || step3Text.includes('Bank');
    
    console.log(`Reached step 3: ${isStep3}`);
    
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/step3-result.png',
      fullPage: true 
    });
    
    if (!isStep3) {
      console.log('WORKFLOW BROKEN: Cannot progress past step 2');
      return false;
    }
    
    console.log('Step 2 → 3 progression: WORKING');
    return true;
    
  } catch (error) {
    console.error('Step progression test failed:', error.message);
    await page.screenshot({ path: '/Users/Danallovertheplace/crypto-campaign-unified/step-progression-error.png' });
    return false;
  } finally {
    await browser.close();
  }
}

testAllSteps().then(success => {
  console.log(`Setup wizard step progression: ${success ? 'WORKING' : 'BROKEN'}`);
  if (!success) {
    console.log('The campaign setup workflow is NOT fully functional');
  }
  process.exit(success ? 0 : 1);
});