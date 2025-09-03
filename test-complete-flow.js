import puppeteer from 'puppeteer';

async function testCompleteFlow() {
  console.log('Testing COMPLETE 7-step setup flow...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  try {
    // Get to step 2
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
    
    await page.type('input[name="fullName"]', 'Complete Test');
    await page.type('input[name="email"]', `complete${Date.now()}@dkdev.io`);
    await page.type('input[name="password"]', 'TestPassword123!');
    await page.type('input[name="confirmPassword"]', 'TestPassword123!');
    await page.click('input[name="agreeToTerms"]');
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    console.log('Step 2: Committee Search - Clicking Next...');
    
    // Step 2 → 3
    let nextButtons = await page.$$('button');
    for (let button of nextButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('Next') || text.includes('Connect Bank')) {
        await button.click();
        break;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('Step 3: Bank Connection - Looking for skip button...');
    
    // Step 3: Look for and click Skip button
    const allButtons = await page.$$('button');
    let skipButton = null;
    for (let button of allButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('Skip Bank Connection')) {
        skipButton = button;
        break;
      }
    }
    
    if (!skipButton) {
      console.log('ERROR: Skip Bank Connection button not found');
      await page.screenshot({ path: '/Users/Danallovertheplace/crypto-campaign-unified/step3-no-skip.png' });
      return { step: 3, working: false, issue: 'No skip button found' };
    }
    
    await skipButton.click();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('Skipped bank connection, looking for Next button...');
    
    // After skip, look for Next button
    const postSkipButtons = await page.$$('button');
    let nextAfterSkip = null;
    for (let button of postSkipButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('Next') || text.includes('Terms')) {
        nextAfterSkip = button;
        break;
      }
    }
    
    if (!nextAfterSkip) {
      console.log('ERROR: Next button not found after skip');
      await page.screenshot({ path: '/Users/Danallovertheplace/crypto-campaign-unified/step3-no-next.png' });
      return { step: 3, working: false, issue: 'No next button after skip' };
    }
    
    await nextAfterSkip.click();
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if we reached Step 4
    let pageText = await page.evaluate(() => document.body.textContent);
    const isStep4 = pageText.includes('Step 4') || pageText.includes('Website') || pageText.includes('Style');
    
    console.log(`Step 4 reached: ${isStep4}`);
    await page.screenshot({ path: '/Users/Danallovertheplace/crypto-campaign-unified/step4-check.png' });
    
    if (!isStep4) {
      return { step: 4, working: false, issue: 'Cannot reach step 4' };
    }
    
    // Continue through remaining steps with skip/continue logic
    console.log('Testing remaining steps...');
    
    const steps = [];
    for (let stepNum = 4; stepNum <= 7; stepNum++) {
      console.log(`Testing step ${stepNum}...`);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Look for Next, Skip, Continue, or step-specific buttons
      const stepButtons = await page.$$('button');
      let progressButton = null;
      
      for (let button of stepButtons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text.includes('Next') || 
            text.includes('Continue') || 
            text.includes('Skip') ||
            text.includes('Generate') ||
            text.includes('Complete')) {
          progressButton = button;
          break;
        }
      }
      
      if (progressButton) {
        await progressButton.click();
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        pageText = await page.evaluate(() => document.body.textContent);
        const nextStepReached = pageText.includes(`Step ${stepNum + 1}`) || 
                               (stepNum === 7 && pageText.includes('Complete'));
        
        steps.push({ step: stepNum, reached: nextStepReached });
        console.log(`Step ${stepNum} → ${stepNum + 1}: ${nextStepReached ? 'SUCCESS' : 'FAILED'}`);
        
        await page.screenshot({ 
          path: `/Users/Danallovertheplace/crypto-campaign-unified/step${stepNum + 1}-result.png`,
          fullPage: true 
        });
        
        if (!nextStepReached && stepNum < 7) {
          return { step: stepNum + 1, working: false, issue: `Cannot reach step ${stepNum + 1}` };
        }
      } else {
        console.log(`Step ${stepNum}: No progress button found`);
        await page.screenshot({ 
          path: `/Users/Danallovertheplace/crypto-campaign-unified/step${stepNum}-stuck.png` 
        });
        return { step: stepNum, working: false, issue: 'No progress button' };
      }
    }
    
    return { step: 7, working: true, steps: steps };
    
  } catch (error) {
    console.error('Complete flow test failed:', error.message);
    await page.screenshot({ path: '/Users/Danallovertheplace/crypto-campaign-unified/complete-flow-error.png' });
    return { working: false, error: error.message };
  } finally {
    await browser.close();
  }
}

testCompleteFlow().then(result => {
  console.log('\nCOMPLETE FLOW TEST RESULTS:');
  
  if (result.working) {
    console.log('ALL 7 STEPS: WORKING');
    console.log('Campaign setup workflow is fully functional');
  } else {
    console.log(`BROKEN AT STEP ${result.step}`);
    console.log(`Issue: ${result.issue || result.error}`);
    console.log('Campaign setup workflow is NOT fully functional');
  }
  
  if (result.steps) {
    console.log('\nStep-by-step results:');
    result.steps.forEach(step => {
      console.log(`Step ${step.step}: ${step.reached ? 'SUCCESS' : 'FAILED'}`);
    });
  }
  
  process.exit(result.working ? 0 : 1);
});