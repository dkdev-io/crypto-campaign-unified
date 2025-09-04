import { chromium } from 'playwright';

const TEST_URL = 'http://localhost:5173/setup';

async function testCommitteeSave() {
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true,
    slowMo: 500
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('📱 Navigating to committee setup page...');
    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');
    
    // Wait for the form to load
    console.log('⏱️ Waiting for committee form to load...');
    
    // Take initial screenshot to see what's there
    await page.screenshot({ path: 'committee-form-initial.png', fullPage: true });
    console.log('📸 Initial screenshot saved');
    
    // Navigate through setup to committee step
    console.log('🧭 Navigating to committee step...');
    
    // Fill step 1 - Campaign Info
    await page.fill('input[placeholder*="Campaign Name"]', 'Test Campaign');
    await page.fill('input[placeholder*="email"]', 'test@example.com');
    await page.fill('input[placeholder*="website"]', 'https://test.com');
    
    // Click Next to go to committee step
    const nextButton = page.locator('button:has-text("Next")');
    await nextButton.click();
    await page.waitForTimeout(2000);
    
    // Now wait for committee form
    await page.waitForSelector('input[placeholder*="Enter your committee name"]', { timeout: 10000 });
    
    // Fill out the manual committee form
    console.log('📝 Filling out committee form...');
    await page.fill('input[placeholder*="Enter your committee name"]', 'Test Committee for Verification');
    await page.fill('input[placeholder*="Committee address"]', '123 Test Street');
    await page.fill('input[placeholder*="City"]', 'Test City');
    await page.fill('input[placeholder*="State"]', 'TX');
    await page.fill('input[placeholder*="ZIP"]', '12345');
    
    // Monitor console for errors and success messages
    const messages = [];
    page.on('console', msg => {
      const text = msg.text();
      messages.push(text);
      console.log(`🖥️ Console: ${text}`);
    });
    
    // Monitor network requests
    const networkRequests = [];
    page.on('request', request => {
      if (request.url().includes('supabase') || request.url().includes('campaigns')) {
        networkRequests.push({
          method: request.method(),
          url: request.url(),
          postData: request.postData()
        });
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('supabase') || response.url().includes('campaigns')) {
        console.log(`🌐 Response: ${response.status()} ${response.url()}`);
      }
    });
    
    // Click the save button
    console.log('💾 Clicking save button...');
    const saveButton = await page.waitForSelector('button:has-text("Save Committee Info & Continue")', { timeout: 5000 });
    await saveButton.click();
    
    // Wait for either success or error message
    console.log('⏱️ Waiting for save result...');
    
    try {
      // Wait for success message - look for the success div
      await page.waitForSelector('div:has-text("Committee Information Saved!")', { timeout: 10000 });
      console.log('✅ SUCCESS: Committee save completed!');
      
      // Check if continue button appears
      const continueButton = page.locator('button:has-text("Continue to Next Step")');
      if (await continueButton.isVisible()) {
        console.log('✅ Continue button is visible - save was successful!');
      }
      
    } catch (waitError) {
      // Check for error message
      const errorElement = page.locator('div:has-text("Failed to save")');
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent();
        console.log('❌ ERROR: Committee save failed:', errorText);
      } else {
        console.log('❓ UNKNOWN: No clear success or error message found');
      }
    }
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'committee-form-result.png', fullPage: true });
    console.log('📸 Screenshot saved as committee-form-result.png');
    
    // Log all collected information
    console.log('\n📊 SUMMARY:');
    console.log('Network Requests:', networkRequests);
    console.log('Console Messages:', messages.filter(m => 
      m.includes('committee') || 
      m.includes('save') || 
      m.includes('error') || 
      m.includes('success')
    ));
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
testCommitteeSave()
  .then(() => {
    console.log('✅ Committee save test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Committee save test failed:', error);
    process.exit(1);
  });