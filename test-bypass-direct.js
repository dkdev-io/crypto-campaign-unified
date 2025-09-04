import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 300 });
  const page = await browser.newPage();
  
  console.log('🌐 Going directly to bypass URL...');
  await page.goto('http://localhost:5173/campaigns/auth/setup?bypass=dev');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const url = await page.url();
  console.log('📍 Current URL:', url);
  
  await page.screenshot({ path: 'bypass-direct-test.png', fullPage: true });
  console.log('📸 Screenshot saved');
  
  // Check for committee form now
  const committeeInput = await page.$('input[placeholder="Enter your committee name"]');
  console.log('📋 Committee form found:', !!committeeInput);
  
  if (committeeInput) {
    console.log('✅ SUCCESS: Committee form is accessible via DEV BYPASS');
    
    // Test the form
    await committeeInput.type('Direct Bypass Committee');
    await page.type('input[placeholder="Committee address"]', '999 Bypass Road');
    await page.type('input[placeholder="City"]', 'DevTown');
    await page.type('input[placeholder="State"]', 'CA');
    await page.type('input[placeholder="ZIP"]', '99999');
    
    console.log('📝 Form filled, submitting...');
    
    // Find submit button more reliably
    const submitBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('Save Committee'));
    });
    
    if (submitBtn.asElement()) {
      await submitBtn.asElement().click();
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      const finalUrl = await page.url();
      const content = await page.evaluate(() => document.body.innerText);
      
      console.log('📍 After submit URL:', finalUrl);
      
      if (content.includes('Committee Information Saved') || finalUrl.includes('/BankConnection')) {
        console.log('🎉 PERFECT: Form submitted and working!');
      } else if (content.includes('Campaign ID not found')) {
        console.log('❌ STILL BROKEN: Campaign ID error');
      } else {
        console.log('❓ CHECK MANUALLY');
      }
      
      await page.screenshot({ path: 'after-submit-bypass.png', fullPage: true });
    }
  } else {
    console.log('❌ No committee form found');
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('Page content:', pageText.substring(0, 300));
  }
  
  console.log('🔍 Keeping browser open for manual verification');
})();