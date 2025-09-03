import puppeteer from 'puppeteer';

async function verifyAuthFixed() {
  console.log('🚀 VERIFYING AUTHENTICATION FIX');
  console.log('================================\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox'],
    devtools: true
  });
  
  const page = await browser.newPage();
  
  // Monitor console logs and errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`🐛 BROWSER ERROR: ${msg.text()}`);
    } else if (msg.text().includes('Supabase') || msg.text().includes('auth')) {
      console.log(`📱 AUTH LOG: ${msg.text()}`);
    }
  });
  
  page.on('pageerror', error => {
    console.log(`❌ PAGE ERROR: ${error.message}`);
  });
  
  try {
    // Test 1: Campaign Auth Page
    console.log('📋 TEST 1: Campaign Auth Page');
    console.log('----------------------------');
    
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/auth-verify-1-loaded.png',
      fullPage: true 
    });
    
    console.log('✅ Page loaded successfully');
    
    // Test wrong password scenario (the original problem)
    console.log('\n🔐 TEST 2: Sign In with Wrong Password');
    console.log('--------------------------------------');
    
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    
    // Fill form with existing user and wrong password
    await page.type('input[name="email"]', 'dan@dkdev.io');
    await page.type('input[name="password"]', 'wrongpassword');
    
    console.log('Form filled with test credentials');
    
    // Submit and wait for response
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for error message
    const errorVisible = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('.text-destructive, .error, [class*="error"]');
      for (let el of errorElements) {
        if (el.textContent && el.textContent.trim()) {
          return {
            found: true,
            message: el.textContent.trim(),
            visible: el.offsetParent !== null
          };
        }
      }
      return { found: false };
    });
    
    console.log('Error handling result:', errorVisible);
    
    if (errorVisible.found && errorVisible.visible) {
      console.log('✅ Error message shown to user');
      console.log(`   Message: "${errorVisible.message}"`);
    } else {
      console.log('❌ No error message displayed');
    }
    
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/auth-verify-2-signin-error.png',
      fullPage: true 
    });
    
    // Test sign up tab
    console.log('\n📝 TEST 3: Switch to Sign Up Tab');
    console.log('---------------------------------');
    
    // Find signup tab by evaluating text content
    const signupTab = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent?.includes('Sign Up'))?.dataset.tab || 
             buttons.find(btn => btn.textContent?.includes('Sign Up')) ||
             buttons[1]; // Fallback to second button
    });
    
    let signupTabElement;
    if (typeof signupTab === 'string') {
      signupTabElement = await page.$(`button[data-tab="${signupTab}"]`);
    } else {
      // Find by text content
      signupTabElement = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => btn.textContent?.includes('Sign Up')) || buttons[1];
      });
    }
    
    if (signupTabElement) {
      await signupTabElement.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('✅ Switched to sign up tab');
      
      await page.screenshot({ 
        path: '/Users/Danallovertheplace/crypto-campaign-unified/auth-verify-3-signup-tab.png',
        fullPage: true 
      });
      
      // Test sign up with existing email (the other original problem)
      console.log('\n👥 TEST 4: Sign Up with Existing Email');
      console.log('--------------------------------------');
      
      // Clear form and fill with existing user
      await page.evaluate(() => {
        document.querySelectorAll('input').forEach(input => input.value = '');
      });
      
      const fullNameInput = await page.$('input[name="fullName"]');
      const emailInput = await page.$('input[name="email"]');
      const passwordInput = await page.$('input[name="password"]');
      
      if (fullNameInput && emailInput && passwordInput) {
        await page.type('input[name="fullName"]', 'Test User');
        await page.type('input[name="email"]', 'dan@dkdev.io'); // Existing email
        await page.type('input[name="password"]', 'TestPassword123!');
        
        const confirmPasswordInput = await page.$('input[name="confirmPassword"]');
        if (confirmPasswordInput) {
          await page.type('input[name="confirmPassword"]', 'TestPassword123!');
        }
        
        // Check terms checkbox if exists
        const termsCheckbox = await page.$('input[type="checkbox"]');
        if (termsCheckbox) {
          await termsCheckbox.click();
        }
        
        console.log('Sign up form filled with existing email');
        
        // Submit signup
        await page.click('button[type="submit"]');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check for signup error
        const signupError = await page.evaluate(() => {
          const errorElements = document.querySelectorAll('.text-destructive, .error, [class*="error"]');
          for (let el of errorElements) {
            if (el.textContent && el.textContent.trim()) {
              return {
                found: true,
                message: el.textContent.trim(),
                visible: el.offsetParent !== null
              };
            }
          }
          return { found: false };
        });
        
        console.log('Signup error result:', signupError);
        
        if (signupError.found && signupError.message.includes('already registered')) {
          console.log('✅ Proper "user exists" error shown');
        } else if (signupError.found) {
          console.log(`⚠️  Different error shown: "${signupError.message}"`);
        } else {
          console.log('❌ No error message for existing user');
        }
        
        await page.screenshot({ 
          path: '/Users/Danallovertheplace/crypto-campaign-unified/auth-verify-4-signup-error.png',
          fullPage: true 
        });
      } else {
        console.log('❌ Could not find signup form fields');
      }
    } else {
      console.log('❌ Could not find signup tab');
    }
    
    // Test new user signup
    console.log('\n🆕 TEST 5: Sign Up with New Email');
    console.log('----------------------------------');
    
    const newEmail = `test.${Date.now()}@example.com`;
    
    // Clear and fill form with new email
    await page.evaluate(() => {
      document.querySelectorAll('input').forEach(input => input.value = '');
    });
    
    const fullNameInput2 = await page.$('input[name="fullName"]');
    if (fullNameInput2) {
      await page.type('input[name="fullName"]', 'New Test User');
      await page.type('input[name="email"]', newEmail);
      await page.type('input[name="password"]', 'TestPassword123!');
      
      const confirmPasswordInput2 = await page.$('input[name="confirmPassword"]');
      if (confirmPasswordInput2) {
        await page.type('input[name="confirmPassword"]', 'TestPassword123!');
      }
      
      // Check terms if needed
      const termsCheckbox2 = await page.$('input[type="checkbox"]:not(:checked)');
      if (termsCheckbox2) {
        await termsCheckbox2.click();
      }
      
      console.log(`New user form filled with: ${newEmail}`);
      
      // Submit new user signup
      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000);
      
      // Check result
      const currentUrl = page.url();
      const pageText = await page.evaluate(() => document.body.textContent);
      
      console.log(`Current URL: ${currentUrl}`);
      
      if (currentUrl !== 'https://cryptocampaign.netlify.app/campaigns/auth') {
        console.log('✅ User was redirected after signup (success)');
      } else if (pageText.includes('verification') || pageText.includes('verify')) {
        console.log('✅ Verification message shown (success)');
      } else {
        console.log('⚠️  Signup result unclear');
      }
      
      await page.screenshot({ 
        path: '/Users/Danallovertheplace/crypto-campaign-unified/auth-verify-5-new-signup.png',
        fullPage: true 
      });
    }
    
    console.log('\n🏁 VERIFICATION COMPLETE');
    console.log('=========================');
    console.log('✅ Authentication system tested with real browser');
    console.log('Screenshots saved for review');
    
    // Keep browser open for manual inspection
    console.log('\n⏸️  Browser staying open for inspection...');
    console.log('Close when done reviewing');
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/auth-verify-error.png',
      fullPage: true 
    });
    
    throw error;
  }
}

verifyAuthFixed().catch(console.error);