import puppeteer from 'puppeteer';

const TEST_URL = 'http://localhost:5173/campaigns/auth/setup?bypass=dev';

async function testCommitteeSave() {
  const browser = await puppeteer.launch({ 
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
    await page.waitForSelector('input[placeholder*="committee name"]', { timeout: 10000 });
    
    // Fill out the manual committee form
    console.log('📝 Filling out committee form...');
    await page.fill('input[placeholder*="committee name"]', 'Test Committee for Verification');
    await page.fill('input[placeholder*="address"]', '123 Test Street');
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
      // Wait for success message
      await page.waitForSelector('.text-sm.text-muted-foreground:has-text("Committee information saved")', { timeout: 10000 });
      console.log('✅ SUCCESS: Committee save completed!');
      
      // Check if continue button appears
      const continueButton = await page.locator('button:has-text("Continue to Next Step")').isVisible();
      if (continueButton) {
        console.log('✅ Continue button is visible - save was successful!');
      }
      
    } catch (waitError) {
      // Check for error message
      const errorElement = await page.locator('.text-sm.text-muted-foreground:has-text("Failed to save")');
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