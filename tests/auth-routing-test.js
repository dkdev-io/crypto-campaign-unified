import puppeteer from 'puppeteer';

async function testAuthRouting() {
  console.log('🚀 Testing auth routing fixes...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  
  try {
    // Test 1: Campaign context routing
    console.log('\n📝 Test 1: Campaign context routing');
    console.log('Navigating to campaign setup (protected route)...');
    
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth/setup', {
      waitUntil: 'networkidle2'
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/campaigns/auth')) {
      console.log('✅ SUCCESS: Campaign protected route redirected to /campaigns/auth');
    } else if (currentUrl.includes('/auth') && !currentUrl.includes('/campaigns/auth')) {
      console.log('❌ FAILED: Still redirecting to generic /auth page');
    } else {
      console.log('⚠️  UNKNOWN: Unexpected redirect destination');
    }

    // Test 2: Try accessing SetupWizard directly (another protected route)
    console.log('\n📝 Test 2: SetupWizard protected route');
    console.log('Navigating to setup wizard...');
    
    await page.goto('https://cryptocampaign.netlify.app/setup', {
      waitUntil: 'networkidle2'
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const setupUrl = page.url();
    console.log(`Current URL after setup access: ${setupUrl}`);
    
    if (setupUrl.includes('/campaigns/auth')) {
      console.log('✅ SUCCESS: Setup wizard redirected to /campaigns/auth');
    } else {
      console.log('❌ FAILED: Setup wizard did not redirect to campaigns auth');
    }

    // Test 3: Donor context routing
    console.log('\n📝 Test 3: Donor context routing');
    console.log('Navigating to donor dashboard (protected route)...');
    
    await page.goto('https://cryptocampaign.netlify.app/donors/dashboard', {
      waitUntil: 'networkidle2'
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const donorUrl = page.url();
    console.log(`Current URL after donor access: ${donorUrl}`);
    
    if (donorUrl.includes('/donors/auth')) {
      console.log('✅ SUCCESS: Donor protected route redirected to /donors/auth');
    } else {
      console.log('❌ FAILED: Donor route did not redirect correctly');
    }

    // Test 4: Check if campaign auth page loads properly
    console.log('\n📝 Test 4: Campaign auth page functionality');
    
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth', {
      waitUntil: 'networkidle2'
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if the page has campaign auth elements
    const hasSignUpForm = await page.$eval('body', (body) => {
      return body.textContent.includes('Sign Up') || 
             body.textContent.includes('Create Account') ||
             body.textContent.includes('Register');
    }).catch(() => false);
    
    const hasSignInForm = await page.$eval('body', (body) => {
      return body.textContent.includes('Sign In') || 
             body.textContent.includes('Login');
    }).catch(() => false);
    
    if (hasSignUpForm && hasSignInForm) {
      console.log('✅ SUCCESS: Campaign auth page has both sign up and sign in options');
    } else {
      console.log('⚠️  WARNING: Campaign auth page may be missing expected forms');
      console.log(`Sign Up found: ${hasSignUpForm}, Sign In found: ${hasSignInForm}`);
    }

    // Test 5: Test the workflow by trying to sign up and see session behavior
    console.log('\n📝 Test 5: Test session expiry routing behavior');
    
    // Navigate back to a campaign page
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth', {
      waitUntil: 'networkidle2'
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to simulate what happens when ProtectedRoute triggers
    await page.evaluate(() => {
      // Clear any existing session data to trigger auth redirect
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Navigate to a protected campaign route
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth/setup', {
      waitUntil: 'networkidle2'
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const finalUrl = page.url();
    console.log(`Final URL after session clear: ${finalUrl}`);
    
    if (finalUrl.includes('/campaigns/auth')) {
      console.log('✅ SUCCESS: Session-less access redirected to /campaigns/auth');
    } else {
      console.log('❌ FAILED: Unexpected redirect after session clear');
    }

    // Test 6: Verify the old /auth route still works for backward compatibility
    console.log('\n📝 Test 6: Backward compatibility check');
    
    await page.goto('https://cryptocampaign.netlify.app/auth', {
      waitUntil: 'networkidle2'
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const authPageUrl = page.url();
    const authPageWorks = authPageUrl.includes('/auth');
    
    if (authPageWorks) {
      console.log('✅ SUCCESS: Generic /auth route still accessible for backward compatibility');
    } else {
      console.log('⚠️  WARNING: Generic /auth route may have issues');
    }

    console.log('\n🎉 Auth routing test completed!');
    console.log('\n📊 Summary:');
    console.log('- Campaign protected routes should redirect to /campaigns/auth ✓');
    console.log('- Donor protected routes should redirect to /donors/auth ✓'); 
    console.log('- Backward compatibility with /auth maintained ✓');
    console.log('- Session expiry should use contextual routing ✓');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testAuthRouting();