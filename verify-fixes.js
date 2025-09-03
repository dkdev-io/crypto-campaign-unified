import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.goto('https://cryptocampaign.netlify.app/campaigns/auth/setup');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Check current state
  const text = await page.evaluate(() => document.body.textContent);
  
  if (text.includes('Step 2')) {
    console.log('REACHED STEP 2');
    
    // Look for skip button
    const hasSkip = text.includes('Continue Without Committee');
    console.log(`Skip button present: ${hasSkip}`);
    
    if (hasSkip) {
      const buttons = await page.$$('button');
      for (let button of buttons) {
        const btnText = await page.evaluate(el => el.textContent, button);
        if (btnText.includes('Continue Without Committee')) {
          console.log('CLICKING SKIP BUTTON');
          await button.click();
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          const newText = await page.evaluate(() => document.body.textContent);
          if (newText.includes('Step 3')) {
            console.log('SUCCESS: REACHED STEP 3');
            
            // Look for bank skip
            if (newText.includes('Skip Bank Connection')) {
              const bankButtons = await page.$$('button');
              for (let btn of bankButtons) {
                const bankBtnText = await page.evaluate(el => el.textContent, btn);
                if (bankBtnText.includes('Skip Bank Connection')) {
                  console.log('CLICKING BANK SKIP');
                  await btn.click();
                  await new Promise(resolve => setTimeout(resolve, 5000));
                  
                  const step4Text = await page.evaluate(() => document.body.textContent);
                  console.log(`STEP 4 STATUS: ${step4Text.includes('Step 4') ? 'REACHED' : 'FAILED'}`);
                  break;
                }
              }
            }
          } else {
            console.log('FAILED: DID NOT REACH STEP 3');
          }
          break;
        }
      }
    }
  } else if (text.includes('Sign Up')) {
    console.log('ON AUTH PAGE - NEED TO CREATE ACCOUNT FIRST');
  } else {
    console.log('UNKNOWN STATE');
  }
  
  console.log('KEEPING BROWSER OPEN FOR INSPECTION');
})();