import { chromium } from 'playwright';

async function verifyCommitteeFix() {
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('🔍 Testing committee form at campaigns/auth/setup...');
    await page.goto('http://localhost:5173/campaigns/auth/setup?bypass=dev');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot to verify blue background
    await page.screenshot({ path: 'committee-blue-test.png', fullPage: true });
    console.log('📸 Screenshot saved - check for blue backgrounds');
    
    // Check if committee form is visible (should be step 2)
    const committeeForm = await page.locator('input[placeholder*="Enter your committee name"]').isVisible({ timeout: 5000 });
    
    if (committeeForm) {
      console.log('✅ Committee form is visible on step 2');
      
      // Test form fill and save
      await page.fill('input[placeholder*="Enter your committee name"]', 'Verification Test Committee');
      await page.fill('input[placeholder*="Committee address"]', '456 Verification St');
      await page.fill('input[placeholder*="City"]', 'Testville');  
      await page.fill('input[placeholder*="State"]', 'CA');
      await page.fill('input[placeholder*="ZIP"]', '90210');
      
      console.log('📝 Form filled with test data');
      
      // Monitor for success/error
      page.on('console', msg => {
        const text = msg.text();
        if (text.includes('committee') || text.includes('Campaign ID') || text.includes('save')) {
          console.log(`🖥️ Console: ${text}`);
        }
      });
      
      // Click save button
      const saveButton = page.locator('button:has-text("Save Committee Info & Continue")');
      await saveButton.click();
      console.log('💾 Save button clicked');
      
      // Wait for result
      await page.waitForTimeout(3000);
      
      // Check for success message
      const successVisible = await page.locator('h4:has-text("Committee Information Saved!")').isVisible();
      if (successVisible) {
        console.log('✅ SUCCESS: Committee save working!');
      } else {
        console.log('❌ No success message visible');
      }
      
    } else {
      console.log('❌ Committee form not visible - check step logic');
    }
    
    await page.waitForTimeout(2000);
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await browser.close();
  }
}

verifyCommitteeFix().then(() => console.log('✅ Verification complete'));