const puppeteer = require('puppeteer');

async function testDonorDashboardToggle() {
  console.log('🎯 Starting Donor Dashboard Toggle Test');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to donor dashboard with bypass mode
    console.log('📍 Navigating to donor dashboard...');
    const dashboardUrl = 'http://localhost:5173/donors/dashboard?bypass=true';
    await page.goto(dashboardUrl, { waitUntil: 'networkidle0' });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if toggle buttons exist
    console.log('🔍 Checking for toggle buttons...');
    const givenButton = await page.waitForSelector('[data-testid="given-tab"]', { timeout: 5000 });
    const raisedButton = await page.waitForSelector('[data-testid="raised-tab"]', { timeout: 5000 });
    
    if (!givenButton || !raisedButton) {
      throw new Error('Toggle buttons not found');
    }
    
    console.log('✅ Toggle buttons found successfully');
    
    // Test initial state (should be "Given")
    const givenTabActive = await page.evaluate(() => {
      const givenTab = document.querySelector('[data-testid="given-tab"]');
      return givenTab.getAttribute('aria-selected') === 'true';
    });
    
    console.log(`📊 Initial tab state - Given active: ${givenTabActive}`);
    
    // Check if Given content is visible
    const givenContentVisible = await page.evaluate(() => {
      const welcomeSection = document.querySelector('[style*="var(--gradient-hero)"]');
      return welcomeSection && welcomeSection.textContent.includes('Welcome to Your Donor Dashboard');
    });
    
    console.log(`📋 Given content visible: ${givenContentVisible}`);
    
    // Click on Raised tab
    console.log('🖱️ Clicking Raised tab...');
    await raisedButton.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if Raised tab is now active
    const raisedTabActive = await page.evaluate(() => {
      const raisedTab = document.querySelector('[data-testid="raised-tab"]');
      return raisedTab.getAttribute('aria-selected') === 'true';
    });
    
    console.log(`📊 After click - Raised active: ${raisedTabActive}`);
    
    // Check if Raised content is visible
    const raisedContentVisible = await page.evaluate(() => {
      const raisedContent = document.querySelector('h2');
      return raisedContent && raisedContent.textContent.includes('Raised Funds Dashboard');
    });
    
    console.log(`📋 Raised content visible: ${raisedContentVisible}`);
    
    // Click back to Given tab
    console.log('🖱️ Clicking back to Given tab...');
    await givenButton.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify Given tab is active again
    const givenTabActiveAgain = await page.evaluate(() => {
      const givenTab = document.querySelector('[data-testid="given-tab"]');
      return givenTab.getAttribute('aria-selected') === 'true';
    });
    
    console.log(`📊 Back to Given - Given active: ${givenTabActiveAgain}`);
    
    // Verify Given content is visible again
    const givenContentVisibleAgain = await page.evaluate(() => {
      const welcomeSection = document.querySelector('[style*="var(--gradient-hero)"]');
      return welcomeSection && welcomeSection.textContent.includes('Welcome to Your Donor Dashboard');
    });
    
    console.log(`📋 Given content visible again: ${givenContentVisibleAgain}`);
    
    // Take screenshots for verification
    console.log('📸 Taking screenshots...');
    await page.screenshot({ path: 'donor-dashboard-given-view.png', fullPage: true });
    
    await raisedButton.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ path: 'donor-dashboard-raised-view.png', fullPage: true });
    
    // Test results
    const testResults = {
      toggleButtonsFound: !!(givenButton && raisedButton),
      initialGivenActive: givenTabActive,
      initialGivenContentVisible: givenContentVisible,
      raisedTabActivatesCorrectly: raisedTabActive,
      raisedContentVisible: raisedContentVisible,
      givenTabReactivatesCorrectly: givenTabActiveAgain,
      givenContentVisibleAgain: givenContentVisibleAgain
    };
    
    console.log('\n🎯 TEST RESULTS:');
    console.log('================');
    Object.entries(testResults).forEach(([key, value]) => {
      const status = value ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${key}: ${value}`);
    });
    
    const allTestsPass = Object.values(testResults).every(result => result === true);
    console.log(`\n🏆 OVERALL RESULT: ${allTestsPass ? '✅ ALL TESTS PASS' : '❌ SOME TESTS FAILED'}`);
    
    if (allTestsPass) {
      console.log('🎉 Donor dashboard toggle functionality is working correctly!');
    } else {
      console.log('⚠️  Some toggle functionality issues detected.');
    }
    
    // Keep browser open for 5 seconds for visual verification
    console.log('👀 Keeping browser open for 5 seconds for visual verification...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    return testResults;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
if (require.main === module) {
  testDonorDashboardToggle()
    .then(results => {
      console.log('\n✨ Test completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testDonorDashboardToggle };