const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function testWorkflowFix() {
  const options = new chrome.Options();
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  
  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    console.log('🧪 Testing Campaign Setup Workflow Fix...\n');
    
    // Navigate to bypass URL
    console.log('1. Navigating to bypass URL...');
    await driver.get('http://localhost:5174/campaigns/auth/setup?bypass=true');
    
    // Wait for page to load
    await driver.sleep(2000);
    
    // Check what step we land on
    console.log('2. Checking initial step...');
    
    try {
      // Look for step indicator or step text
      const stepTexts = await driver.findElements(By.xpath("//*[contains(text(), 'Step')]"));
      
      if (stepTexts.length > 0) {
        for (let i = 0; i < stepTexts.length; i++) {
          const text = await stepTexts[i].getText();
          console.log(`   Found step text: "${text}"`);
        }
      } else {
        console.log('   No step text found');
      }
      
      // Check for specific step 1 content
      const campaignInfoElements = await driver.findElements(By.xpath("//*[contains(text(), 'Campaign Info') or contains(text(), 'Campaign Setup') or contains(text(), 'Campaign Name')]"));
      
      if (campaignInfoElements.length > 0) {
        console.log('✅ SUCCESS: Found Step 1 (Campaign Info) content');
        
        for (let i = 0; i < Math.min(campaignInfoElements.length, 3); i++) {
          const text = await campaignInfoElements[i].getText();
          if (text.length > 0) {
            console.log(`   Content: "${text}"`);
          }
        }
      } else {
        console.log('❌ FAILED: Did not find Step 1 content');
      }
      
      // Check for step 2 content (should not be present)
      const step2Elements = await driver.findElements(By.xpath("//*[contains(text(), 'Committee') or contains(text(), 'FEC')]"));
      
      if (step2Elements.length > 0) {
        console.log('❌ FAILED: Found Step 2 content (should not be visible on first load)');
      } else {
        console.log('✅ SUCCESS: Step 2 content not shown (correct)');
      }
      
      // Look for the current URL and any routing info
      const currentUrl = await driver.getCurrentUrl();
      console.log(`3. Current URL: ${currentUrl}`);
      
      // Take a screenshot of what we see
      const screenshot = await driver.takeScreenshot();
      require('fs').writeFileSync('/tmp/workflow-test-screenshot.png', screenshot, 'base64');
      console.log('4. Screenshot saved to /tmp/workflow-test-screenshot.png');
      
    } catch (error) {
      console.log('❌ ERROR during testing:', error.message);
    }
    
  } finally {
    await driver.quit();
  }
}

// Run the test
testWorkflowFix().catch(console.error);