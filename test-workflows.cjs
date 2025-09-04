const puppeteer = require('puppeteer');

// Test configuration
const BASE_URL = 'https://cryptocampaign.netlify.app';
const TEST_EMAIL = 'test@example.com'; // Replace with your test email
const TEST_PASSWORD = 'testpassword123'; // Replace with your test password

// Test results storage
const testResults = {
  campaignWorkflow: {},
  donorWorkflow: {},
  generalPages: {},
  errors: []
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name) {
  try {
    await page.screenshot({ 
      path: `screenshots/${name}.png`, 
      fullPage: true 
    });
    console.log(`📸 Screenshot saved: ${name}.png`);
  } catch (error) {
    console.log(`⚠️ Screenshot failed for ${name}:`, error.message);
  }
}

async function testPageLoad(page, url, pageName) {
  try {
    console.log(`🔍 Testing ${pageName}: ${url}`);
    
    const response = await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await delay(2000);
    
    const title = await page.title();
    const content = await page.content();
    
    // Check for React errors
    const hasReactError = content.includes('react') && content.includes('error') || 
                         content.includes('Failed to compile') ||
                         content.includes('Module not found');
    
    // Check for basic page loading
    const hasContent = content.length > 1000;
    const hasTitle = title && title !== '';
    
    const result = {
      url,
      status: response?.status() || 'unknown',
      title,
      hasContent,
      hasReactError,
      contentLength: content.length,
      success: response?.ok() && hasContent && !hasReactError
    };
    
    console.log(`${result.success ? '✅' : '❌'} ${pageName}: Status ${result.status}, Content: ${result.contentLength} chars`);
    
    if (!result.success) {
      console.log(`   Title: "${result.title}"`);
      if (hasReactError) console.log('   ⚠️ React compilation error detected');
      if (!hasContent) console.log('   ⚠️ Minimal content detected');
    }
    
    await takeScreenshot(page, pageName.replace(/[^a-zA-Z0-9]/g, '_'));
    
    return result;
    
  } catch (error) {
    console.log(`❌ ${pageName} failed:`, error.message);
    return {
      url,
      success: false,
      error: error.message,
      status: 'error'
    };
  }
}

async function testCampaignWorkflow(browser) {
  console.log('\n🏛️ TESTING CAMPAIGN WORKFLOW');
  console.log('=' .repeat(50));
  
  const page = await browser.newPage();
  
  try {
    // Test main campaign auth page
    testResults.campaignWorkflow.authPage = await testPageLoad(
      page, 
      `${BASE_URL}/campaigns/auth`, 
      'Campaign Auth'
    );
    
    // Test campaign setup page (the problematic one)
    testResults.campaignWorkflow.setupPage = await testPageLoad(
      page, 
      `${BASE_URL}/campaigns/auth/setup`, 
      'Campaign Setup'
    );
    
    // Try to interact with the setup page
    if (testResults.campaignWorkflow.setupPage.success) {
      console.log('🔍 Checking for auth components...');
      
      // Check if we see auth form or if already authenticated
      const hasSignInForm = await page.$('input[type="email"]') || 
                           await page.$('button:contains("Sign In")') ||
                           await page.$('form');
                           
      const hasSetupContent = await page.$('h1') || await page.$('.setup') ||
                             await page.$('button:contains("BYPASS")');
      
      testResults.campaignWorkflow.hasAuthForm = !!hasSignInForm;
      testResults.campaignWorkflow.hasSetupContent = !!hasSetupContent;
      
      console.log(`   Auth form present: ${testResults.campaignWorkflow.hasAuthForm ? '✅' : '❌'}`);
      console.log(`   Setup content present: ${testResults.campaignWorkflow.hasSetupContent ? '✅' : '❌'}`);
      
      // Try to click bypass button if available (for testing)
      try {
        const bypassButton = await page.$('button[class*="yellow"]');
        if (bypassButton) {
          console.log('🔍 Found bypass button, testing navigation...');
          await bypassButton.click();
          await delay(3000);
          
          const currentUrl = page.url();
          testResults.campaignWorkflow.bypassNavigation = {
            success: currentUrl !== `${BASE_URL}/campaigns/auth/setup`,
            newUrl: currentUrl
          };
          console.log(`   Navigation result: ${testResults.campaignWorkflow.bypassNavigation.success ? '✅' : '❌'} → ${currentUrl}`);
        }
      } catch (error) {
        console.log('   Bypass test failed:', error.message);
      }
    }
    
  } catch (error) {
    testResults.errors.push(`Campaign workflow error: ${error.message}`);
    console.log('❌ Campaign workflow error:', error.message);
  } finally {
    await page.close();
  }
}

async function testDonorWorkflow(browser) {
  console.log('\n💝 TESTING DONOR WORKFLOW');
  console.log('=' .repeat(50));
  
  const page = await browser.newPage();
  
  try {
    // Test donor auth page
    testResults.donorWorkflow.authPage = await testPageLoad(
      page, 
      `${BASE_URL}/donors/auth`, 
      'Donor Auth'
    );
    
    // Test donor dashboard (should redirect to auth if not logged in)
    testResults.donorWorkflow.dashboardPage = await testPageLoad(
      page, 
      `${BASE_URL}/donors/dashboard`, 
      'Donor Dashboard'
    );
    
    // Check auth page functionality
    if (testResults.donorWorkflow.authPage.success) {
      console.log('🔍 Checking donor auth components...');
      
      const hasEmailInput = await page.$('input[type="email"]');
      const hasPasswordInput = await page.$('input[type="password"]');
      const hasSignInButton = await page.$('button:contains("Sign In")') || 
                             await page.$('button[type="submit"]');
      const hasBypassButton = await page.$('button[class*="yellow"]');
      
      testResults.donorWorkflow.hasEmailInput = !!hasEmailInput;
      testResults.donorWorkflow.hasPasswordInput = !!hasPasswordInput;
      testResults.donorWorkflow.hasSignInButton = !!hasSignInButton;
      testResults.donorWorkflow.hasBypassButton = !!hasBypassButton;
      
      console.log(`   Email input: ${testResults.donorWorkflow.hasEmailInput ? '✅' : '❌'}`);
      console.log(`   Password input: ${testResults.donorWorkflow.hasPasswordInput ? '✅' : '❌'}`);
      console.log(`   Sign in button: ${testResults.donorWorkflow.hasSignInButton ? '✅' : '❌'}`);
      console.log(`   Bypass button: ${testResults.donorWorkflow.hasBypassButton ? '✅' : '❌'}`);
      
      // Test bypass button
      if (hasBypassButton) {
        try {
          console.log('🔍 Testing donor bypass navigation...');
          await hasBypassButton.click();
          await delay(3000);
          
          const currentUrl = page.url();
          testResults.donorWorkflow.bypassNavigation = {
            success: currentUrl.includes('/donors/dashboard'),
            newUrl: currentUrl
          };
          console.log(`   Bypass navigation: ${testResults.donorWorkflow.bypassNavigation.success ? '✅' : '❌'} → ${currentUrl}`);
          
          // Take screenshot of dashboard
          if (testResults.donorWorkflow.bypassNavigation.success) {
            await takeScreenshot(page, 'Donor_Dashboard_After_Bypass');
          }
        } catch (error) {
          console.log('   Donor bypass test failed:', error.message);
        }
      }
    }
    
  } catch (error) {
    testResults.errors.push(`Donor workflow error: ${error.message}`);
    console.log('❌ Donor workflow error:', error.message);
  } finally {
    await page.close();
  }
}

async function testGeneralPages(browser) {
  console.log('\n🌐 TESTING GENERAL PAGES');
  console.log('=' .repeat(50));
  
  const page = await browser.newPage();
  
  const pagesToTest = [
    { url: BASE_URL, name: 'Home Page' },
    { url: `${BASE_URL}/campaigns/auth/terms`, name: 'Campaign Terms' },
    { url: `${BASE_URL}/campaigns/auth/privacy`, name: 'Campaign Privacy' },
    { url: `${BASE_URL}/donors/auth/terms`, name: 'Donor Terms' },
    { url: `${BASE_URL}/donors/auth/privacy`, name: 'Donor Privacy' }
  ];
  
  for (const pageTest of pagesToTest) {
    testResults.generalPages[pageTest.name] = await testPageLoad(
      page, 
      pageTest.url, 
      pageTest.name
    );
    await delay(1000);
  }
  
  await page.close();
}

async function generateReport() {
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(50));
  
  const campaignSuccess = testResults.campaignWorkflow.setupPage?.success;
  const donorSuccess = testResults.donorWorkflow.authPage?.success;
  
  console.log(`\n🏛️ CAMPAIGN WORKFLOW:`);
  console.log(`   Setup Page Load: ${campaignSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
  if (testResults.campaignWorkflow.setupPage) {
    console.log(`   Status: ${testResults.campaignWorkflow.setupPage.status}`);
    console.log(`   Title: "${testResults.campaignWorkflow.setupPage.title}"`);
  }
  
  console.log(`\n💝 DONOR WORKFLOW:`);
  console.log(`   Auth Page Load: ${donorSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`   Auth Components: ${testResults.donorWorkflow.hasEmailInput && testResults.donorWorkflow.hasSignInButton ? '✅ COMPLETE' : '⚠️ INCOMPLETE'}`);
  
  if (testResults.donorWorkflow.bypassNavigation) {
    console.log(`   Bypass Navigation: ${testResults.donorWorkflow.bypassNavigation.success ? '✅ WORKING' : '❌ FAILED'}`);
  }
  
  console.log(`\n🌐 GENERAL PAGES:`);
  Object.entries(testResults.generalPages).forEach(([name, result]) => {
    console.log(`   ${name}: ${result.success ? '✅' : '❌'} (${result.status})`);
  });
  
  if (testResults.errors.length > 0) {
    console.log(`\n❌ ERRORS ENCOUNTERED:`);
    testResults.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  
  const overallSuccess = campaignSuccess && donorSuccess;
  console.log(`\n🎯 OVERALL STATUS: ${overallSuccess ? '✅ TESTS PASSED' : '❌ TESTS FAILED'}`);
  
  // Save detailed results to file
  const fs = require('fs');
  fs.writeFileSync('test-results.json', JSON.stringify(testResults, null, 2));
  console.log('\n📄 Detailed results saved to test-results.json');
  
  return overallSuccess;
}

async function main() {
  console.log('🚀 STARTING CRYPTO CAMPAIGN WORKFLOW TESTS');
  console.log('🌐 Target URL:', BASE_URL);
  console.log('⏰ Starting at:', new Date().toLocaleString());
  
  // Create screenshots directory
  const fs = require('fs');
  if (!fs.existsSync('screenshots')) {
    fs.mkdirSync('screenshots');
  }
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false, // Set to true for headless mode
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ],
      defaultViewport: { width: 1280, height: 720 }
    });
    
    console.log('✅ Browser launched successfully');
    
    // Run all tests
    await testCampaignWorkflow(browser);
    await testDonorWorkflow(browser);
    await testGeneralPages(browser);
    
    // Generate final report
    const success = await generateReport();
    
    console.log('\n🏁 Testing complete!');
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⏹️ Tests interrupted by user');
  process.exit(1);
});

// Run the tests
main().catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});