// Simple UI test for committee form
import puppeteer from 'puppeteer';

async function testCommitteeUI() {
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 50
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    console.log('🌐 Opening committee setup page...');
    await page.goto('http://localhost:5174/campaigns/auth/setup');
    
    // Wait for page to load
    await page.waitForLoadState?.('domcontentloaded') || await new Promise(resolve => setTimeout(resolve, 3000));

    const url = await page.url();
    console.log('📍 Current URL:', url);

    // Take screenshot
    await page.screenshot({ path: 'committee-form-test.png', fullPage: true });
    console.log('📸 Screenshot saved as committee-form-test.png');

    // Check if manual committee form is visible
    const manualFormVisible = await page.$('input[placeholder="Enter your committee name"]') !== null;
    console.log('👀 Manual committee form visible:', manualFormVisible);

    if (manualFormVisible) {
      console.log('✅ Committee form is accessible - proceeding with test...');
      
      // Fill out the manual form
      await page.type('input[placeholder="Enter your committee name"]', 'Puppeteer Test Committee');
      await page.type('input[placeholder="Committee address"]', '789 Automation St');
      await page.type('input[placeholder="City"]', 'TestVille');
      await page.type('input[placeholder="State"]', 'CA');
      await page.type('input[placeholder="ZIP"]', '90210');

      console.log('📝 Form filled out');
      
      // Click submit
      await page.click('button:has-text("Save Committee Info & Continue")');
      console.log('🖱️ Submit button clicked');

      // Wait for response
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check final state
      const finalUrl = await page.url();
      const pageContent = await page.evaluate(() => document.body.innerText);
      
      console.log('📍 Final URL:', finalUrl);
      console.log('✅ Form submission test completed');
      
      if (pageContent.includes('Committee Information Saved') || finalUrl.includes('BankConnection')) {
        console.log('🎉 SUCCESS: Committee form works!');
      } else if (pageContent.includes('Campaign ID not found')) {
        console.log('❌ STILL BROKEN: Campaign ID not found error');
      } else {
        console.log('❓ UNCLEAR: Need to check page manually');
      }
    } else {
      console.log('❌ Committee form not visible - page may not be loading correctly');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testCommitteeUI();