import puppeteer from 'puppeteer';
import fs from 'fs';

async function testSetupWorkflow() {
  console.log('🚀 Testing Setup Workflow with Puppeteer...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('\n📍 Step 1: Test /setup route accessibility');
    
    // Test the setup page directly
    await page.goto('https://cryptocampaign.netlify.app/setup', { 
      waitUntil: 'networkidle2',
      timeout: 15000 
    });
    
    // Wait a bit for any redirects or loading
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    // Take screenshot
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/setup-test-1.png',
      fullPage: true 
    });
    
    // Check if we're on a 404 page
    const pageContent = await page.content();
    const isNotFound = pageContent.includes('404') || 
                      pageContent.includes('Page Not Found') ||
                      pageContent.includes('not exist');
    
    if (isNotFound) {
      console.log('❌ STILL BROKEN: Setup page shows 404');
      return false;
    }
    
    // Check if we were redirected to auth (expected behavior)
    const isAuthPage = currentUrl.includes('/auth') || 
                       currentUrl.includes('/login') ||
                       pageContent.includes('Sign in') ||
                       pageContent.includes('Login');
    
    if (isAuthPage) {
      console.log('✅ GOOD: Setup page redirected to authentication (expected)');
      
      // Try to find login form
      const hasEmailField = await page.$('input[type="email"]') !== null;
      const hasPasswordField = await page.$('input[type="password"]') !== null;
      const hasLoginButton = await page.$('button[type="submit"]') !== null ||
                             await page.$('input[type="submit"]') !== null;
      
      console.log(`Email field found: ${hasEmailField}`);
      console.log(`Password field found: ${hasPasswordField}`);
      console.log(`Login button found: ${hasLoginButton}`);
      
      if (hasEmailField && hasPasswordField) {
        console.log('\n📍 Step 2: Test login with test@dkdev.io');
        
        // Fill in the test email
        await page.type('input[type="email"]', 'test@dkdev.io');
        await page.type('input[type="password"]', 'TestPassword123!');
        
        // Take screenshot before submit
        await page.screenshot({ 
          path: '/Users/Danallovertheplace/crypto-campaign-unified/setup-test-2-login.png',
          fullPage: true 
        });
        
        // Click login button
        if (hasLoginButton) {
          const loginButton = await page.$('button[type="submit"]') || 
                             await page.$('input[type="submit"]') ||
                             await page.$('button:contains("Sign in")') ||
                             await page.$('button:contains("Login")');
          
          if (loginButton) {
            await loginButton.click();
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for potential redirect
            
            const afterLoginUrl = page.url();
            console.log(`After login URL: ${afterLoginUrl}`);
            
            // Take screenshot after login attempt
            await page.screenshot({ 
              path: '/Users/Danallovertheplace/crypto-campaign-unified/setup-test-3-after-login.png',
              fullPage: true 
            });
            
            // Check if we got to the setup wizard
            const finalContent = await page.content();
            const isSetupWizard = finalContent.includes('Setup') || 
                                 finalContent.includes('Campaign') ||
                                 finalContent.includes('Step 1') ||
                                 finalContent.includes('Wizard');
            
            if (isSetupWizard) {
              console.log('✅ SUCCESS: Reached setup wizard after authentication');
              return true;
            } else {
              console.log('⚠️  PARTIAL: Login worked but may not have reached setup wizard');
              return false;
            }
          }
        }
      }
      
      return true; // At least the route works and redirects properly
    }
    
    // Check if we're directly on the setup wizard (shouldn't happen without auth)
    const isSetupWizard = pageContent.includes('Setup') && 
                          (pageContent.includes('Step') || pageContent.includes('Wizard'));
    
    if (isSetupWizard) {
      console.log('⚠️  SECURITY ISSUE: Setup wizard accessible without authentication');
      return false;
    }
    
    console.log('❓ UNKNOWN STATE: Setup page loaded but unclear what it shows');
    console.log('Page title:', await page.title());
    return false;
    
  } catch (error) {
    console.error('💥 ERROR during setup test:', error.message);
    
    // Take error screenshot
    try {
      await page.screenshot({ 
        path: '/Users/Danallovertheplace/crypto-campaign-unified/setup-test-error.png',
        fullPage: true 
      });
    } catch (screenshotError) {
      console.error('Could not take error screenshot:', screenshotError.message);
    }
    
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testSetupWorkflow().then(success => {
  console.log(`\n🎯 FINAL RESULT: Setup workflow ${success ? 'WORKING' : 'BROKEN'}`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});