import puppeteer from 'puppeteer';

async function testCommitteeSearch() {
  console.log('Testing committee search step 2...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  try {
    // Go directly to committee search by creating an account first
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth/setup');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Quick signup to get to step 2
    const buttons = await page.$$('button');
    for (let button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.trim() === 'Sign Up') {
        await button.click();
        break;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.type('input[name="fullName"]', 'Committee Test');
    await page.type('input[name="email"]', `committee${Date.now()}@dkdev.io`);
    await page.type('input[name="password"]', 'TestPassword123!');
    await page.type('input[name="confirmPassword"]', 'TestPassword123!');
    await page.click('input[name="agreeToTerms"]');
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    console.log('Testing committee search functionality...');
    
    // Test committee search
    const searchField = await page.$('input[placeholder*="committee"]');
    const searchButton = await page.$('button:contains("Search")');
    
    if (!searchField) {
      console.log('ERROR: Committee search field not found');
      await page.screenshot({ path: '/Users/Danallovertheplace/crypto-campaign-unified/committee-search-missing.png' });
      return false;
    }
    
    console.log('Searching for test committee...');
    await page.type('input[placeholder*="committee"]', 'test committee');
    
    if (searchButton) {
      await searchButton.click();
    } else {
      // Try pressing Enter
      await page.keyboard.press('Enter');
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check for search results or next step
    const pageText = await page.evaluate(() => document.body.textContent);
    const hasResults = pageText.includes('result') || pageText.includes('found') || pageText.includes('committee');
    const canProceed = await page.$('button:contains("Next")') !== null ||
                       await page.$('button[type="submit"]') !== null;
    
    console.log(`Search executed: true`);
    console.log(`Has results/feedback: ${hasResults}`);
    console.log(`Can proceed to step 3: ${canProceed}`);
    
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/committee-search-test.png',
      fullPage: true 
    });
    
    // Try to proceed to step 3
    if (canProceed) {
      const nextButtons = await page.$$('button');
      for (let button of nextButtons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text.includes('Next') || text.includes('Connect Bank')) {
          console.log('Clicking next to step 3...');
          await button.click();
          await new Promise(resolve => setTimeout(resolve, 5000));
          break;
        }
      }
      
      const finalText = await page.evaluate(() => document.body.textContent);
      const reachedStep3 = finalText.includes('Step 3') || finalText.includes('Bank');
      
      console.log(`Reached step 3: ${reachedStep3}`);
      
      await page.screenshot({ 
        path: '/Users/Danallovertheplace/crypto-campaign-unified/committee-search-step3.png',
        fullPage: true 
      });
      
      return reachedStep3;
    }
    
    return false;
    
  } catch (error) {
    console.error('Committee search test failed:', error.message);
    await page.screenshot({ path: '/Users/Danallovertheplace/crypto-campaign-unified/committee-error.png' });
    return false;
  } finally {
    await browser.close();
  }
}

testCommitteeSearch().then(success => {
  console.log(`Committee search working: ${success ? 'YES' : 'NO'}`);
  process.exit(success ? 0 : 1);
});