import puppeteer from 'puppeteer';

async function testCommitteeFormFix() {
  console.log('🧪 TESTING COMMITTEE FORM FIX...');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false, 
      slowMo: 100,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to campaign setup
    console.log('1️⃣ Navigating to campaign setup page...');
    await page.goto('http://localhost:5173/campaigns/auth/setup?bypass=true', { 
      waitUntil: 'networkidle0' 
    });
    
    // Wait for the committee search form (Step 2)
    console.log('2️⃣ Waiting for committee search form to load...');
    await page.waitForSelector('.committee-search-container', { timeout: 10000 });
    
    console.log('3️⃣ Page loaded successfully! Testing manual committee entry...');
    
    // Fill out the manual committee form
    console.log('4️⃣ Filling out manual committee form...');
    
    // Committee name
    await page.type('input[value=""][placeholder="Enter your committee name"]', 'Test Committee Fixed');
    await page.waitForTimeout(500);
    
    // Committee address  
    await page.type('input[value=""][placeholder="Committee address"]', '123 Test Street');
    await page.waitForTimeout(500);
    
    // City
    await page.type('input[value=""][placeholder="City"]', 'Test City');
    await page.waitForTimeout(500);
    
    // State
    await page.type('input[value=""][placeholder="State"]', 'TS');
    await page.waitForTimeout(500);
    
    // ZIP
    await page.type('input[value=""][placeholder="ZIP"]', '12345');
    await page.waitForTimeout(500);
    
    console.log('5️⃣ Form filled out. Checking Save button state...');
    
    // Check if Save button is enabled
    const saveButtonSelector = 'button:has-text("Save Committee Info & Continue")';
    await page.waitForSelector(saveButtonSelector, { timeout: 5000 });
    
    const saveButtonDisabled = await page.$eval(saveButtonSelector, btn => btn.disabled);
    console.log(`Save button disabled: ${saveButtonDisabled}`);
    
    if (saveButtonDisabled) {
      console.error('❌ FAIL: Save button is still disabled after filling all fields!');
      return false;
    }
    
    console.log('6️⃣ Save button is enabled! Clicking save...');
    
    // Click the save button
    await page.click(saveButtonSelector);
    await page.waitForTimeout(2000);
    
    console.log('7️⃣ Checking for success message and Next button state...');
    
    // Wait for success message
    await page.waitForSelector('div:has-text("Committee Information Saved!")', { timeout: 10000 });
    console.log('✅ Success message appeared!');
    
    // Check if Next button is visible and enabled
    const nextButtonSelector = 'button:has-text("Continue to Next Step"), button:has-text("Next")';
    await page.waitForSelector(nextButtonSelector, { timeout: 5000 });
    
    const nextButtonDisabled = await page.$eval(nextButtonSelector, btn => btn.disabled);
    console.log(`Next button disabled: ${nextButtonDisabled}`);
    
    if (nextButtonDisabled) {
      console.error('❌ FAIL: Next button is disabled even after saving committee!');
      return false;
    }
    
    console.log('8️⃣ Next button is enabled! Testing navigation...');
    
    // Click the Next button to test navigation
    await page.click(nextButtonSelector);
    await page.waitForTimeout(3000);
    
    // Check if we advanced to the next step
    const step3Header = await page.$('h2:has-text("Bank Connection"), h2:has-text("Step 3")');
    if (step3Header) {
      console.log('🎉 SUCCESS: Navigation to Step 3 worked!');
      return true;
    } else {
      console.error('❌ FAIL: Did not advance to Step 3');
      return false;
    }
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    console.error(error.stack);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testCommitteeFormFix()
  .then(success => {
    if (success) {
      console.log('🎉 ALL TESTS PASSED! Committee form fix is working correctly!');
      process.exit(0);
    } else {
      console.error('💥 TESTS FAILED! Issues remain with the form.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 TEST ERROR:', error.message);
    process.exit(1);
  });