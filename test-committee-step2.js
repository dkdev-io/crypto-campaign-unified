import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 400 });
  const page = await browser.newPage();
  
  console.log('🌐 Testing committee form on Step 2...');
  await page.goto('http://localhost:5173/campaigns/auth/setup?bypass=dev');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('📍 Current step: Step 1 - Campaign Info');
  console.log('📝 Filling out Step 1 to get to committee form...');
  
  // Fill Step 1 form to proceed to Step 2 (Committee)
  await page.type('input[placeholder="Campaign name"]', 'Test Campaign for Committee');
  await page.type('input[placeholder="First name"]', 'John');
  await page.type('input[placeholder="Last name"]', 'Doe');
  await page.type('input[placeholder="Email address"]', 'john@example.com');
  await page.type('input[placeholder="Phone number"]', '555-1234');
  
  console.log('▶️ Clicking Next to go to Step 2...');
  await page.click('button[type="submit"], button:last-of-type');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Now we should be on Step 2 - Committee Search
  await page.screenshot({ path: 'step2-committee-form.png', fullPage: true });
  
  const pageText = await page.evaluate(() => document.body.innerText);
  console.log('📄 Current step:', pageText.includes('Step 2') ? 'Step 2 - Committee' : 'Still on Step 1');
  
  // Check for committee form
  const committeeInput = await page.$('input[placeholder="Enter your committee name"]');
  console.log('📋 Committee form found:', !!committeeInput);
  
  if (committeeInput) {
    console.log('✅ SUCCESS: Reached Step 2 - Testing committee submission...');
    
    await committeeInput.type('Step 2 Test Committee');
    await page.type('input[placeholder="Committee address"]', '123 Step2 Street');
    await page.type('input[placeholder="City"]', 'Committee City');
    await page.type('input[placeholder="State"]', 'TX');
    await page.type('input[placeholder="ZIP"]', '75001');
    
    console.log('🖱️ Submitting committee form...');
    
    // Click submit button
    const submitButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('Save Committee'));
    });
    
    if (submitButton.asElement()) {
      await submitButton.asElement().click();
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      const finalUrl = await page.url();
      const finalContent = await page.evaluate(() => document.body.innerText);
      
      console.log('📍 Final URL:', finalUrl);
      
      if (finalContent.includes('Step 3') || finalContent.includes('Bank Connection')) {
        console.log('🎉 PERFECT: Committee form saved and moved to Step 3!');
      } else if (finalContent.includes('Committee Information Saved')) {
        console.log('✅ Committee saved - checking navigation...');
      } else if (finalContent.includes('Campaign ID not found')) {
        console.log('❌ STILL BROKEN: Campaign ID error on Step 2');
      } else {
        console.log('❓ Unknown state - check manually');
      }
      
      await page.screenshot({ path: 'final-committee-result.png', fullPage: true });
    } else {
      console.log('❌ Submit button not found on committee form');
    }
  } else {
    console.log('❌ Committee form not found on Step 2');
    console.log('📄 Page content preview:', pageText.substring(0, 400));
  }
})();