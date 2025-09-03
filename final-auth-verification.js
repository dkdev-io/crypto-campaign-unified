import puppeteer from 'puppeteer';

async function verifyAuthFix() {
  console.log('🚀 FINAL AUTH VERIFICATION WITH PUPPETEER');
  console.log('==========================================\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser for verification
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox'],
    devtools: true
  });
  
  const page = await browser.newPage();
  
  // Monitor console for auth logs
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`🐛 BROWSER ERROR: ${msg.text()}`);
    } else if (msg.text().includes('auth') || msg.text().includes('Auth') || msg.text().includes('✅') || msg.text().includes('❌')) {
      console.log(`📱 BROWSER LOG: ${msg.text()}`);
    }
  });
  
  try {
    // TEST 1: CAMPAIGN AUTH
    console.log('📋 TEST 1: CAMPAIGN AUTH');
    console.log('-------------------------');
    
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log('✅ Campaign auth page loaded');
    
    // Test wrong password (original problem)
    console.log('\n🔐 Testing sign-in with wrong password...');
    await page.type('input[name="email"]', 'test@example.com');
    await page.type('input[name="password"]', 'wrongpassword');
    
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/auth-final-1-filled.png',
      fullPage: true 
    });
    
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    // Check for error message
    const signinErrorVisible = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('[class*="destructive"], .error, [class*="error"]');
      for (let el of errorElements) {
        if (el.textContent && el.textContent.trim() && el.offsetParent !== null) {
          return {
            found: true,
            message: el.textContent.trim(),
            visible: true
          };
        }
      }
      return { found: false };
    });
    
    console.log('Sign-in error result:', signinErrorVisible);
    
    if (signinErrorVisible.found) {
      console.log('✅ SIGN-IN ERROR HANDLING WORKS');
      console.log(`   Message: "${signinErrorVisible.message}"`);
    } else {
      console.log('❌ Sign-in error not displayed');
    }
    
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/auth-final-2-signin-error.png',
      fullPage: true 
    });
    
    // Test signup with existing email (original problem)
    console.log('\n📝 Testing sign-up with existing email...');
    
    // Find signup tab
    const signupTabFound = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const signupBtn = buttons.find(btn => btn.textContent?.includes('Sign Up'));
      if (signupBtn) {
        signupBtn.click();
        return true;
      }
      return false;
    });
    
    if (signupTabFound) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear form and fill with existing user data
      await page.evaluate(() => {
        document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]').forEach(input => {
          input.value = '';
        });
      });
      
      await page.type('input[name="fullName"]', 'Test User');
      await page.type('input[name="email"]', 'test@example.com'); // Use same email
      await page.type('input[name="password"]', 'TestPassword123!');
      
      const hasConfirmField = await page.$('input[name="confirmPassword"]');
      if (hasConfirmField) {
        await page.type('input[name="confirmPassword"]', 'TestPassword123!');
      }
      
      // Handle terms checkbox
      const hasTermsCheckbox = await page.$('input[type="checkbox"]');
      if (hasTermsCheckbox) {
        await page.click('input[type="checkbox"]');
      }
      
      await page.screenshot({ 
        path: '/Users/Danallovertheplace/crypto-campaign-unified/auth-final-3-signup-filled.png',
        fullPage: true 
      });
      
      await page.click('button[type="submit"]');
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      // Check for signup error
      const signupErrorVisible = await page.evaluate(() => {
        const text = document.body.textContent.toLowerCase();
        const hasRegisteredError = text.includes('already registered') || 
                                   text.includes('already exists') ||
                                   text.includes('user already');
        
        const errorElements = document.querySelectorAll('[class*="destructive"], .error, [class*="error"]');
        let errorMessage = '';
        for (let el of errorElements) {
          if (el.textContent && el.textContent.trim() && el.offsetParent !== null) {
            errorMessage = el.textContent.trim();
            break;
          }
        }
        
        return {
          hasRegisteredError,
          errorMessage,
          bodyContainsRegistered: text.includes('registered')
        };
      });
      
      console.log('Sign-up error result:', signupErrorVisible);
      
      if (signupErrorVisible.hasRegisteredError || signupErrorVisible.errorMessage.toLowerCase().includes('registered')) {
        console.log('✅ SIGN-UP ERROR HANDLING WORKS');
        console.log(`   Detected existing user error`);
      } else {
        console.log('❌ Sign-up error for existing user not shown');
        console.log(`   Error message found: "${signupErrorVisible.errorMessage}"`);
      }
      
      await page.screenshot({ 
        path: '/Users/Danallovertheplace/crypto-campaign-unified/auth-final-4-signup-error.png',
        fullPage: true 
      });
      
    } else {
      console.log('❌ Could not find sign-up tab');
    }
    
    // TEST 2: DONOR AUTH
    console.log('\n\n👥 TEST 2: DONOR AUTH');
    console.log('----------------------');
    
    await page.goto('https://cryptocampaign.netlify.app/donors/auth', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log('✅ Donor auth page loaded');
    
    // Test donor wrong password
    console.log('\n🔐 Testing donor sign-in with wrong password...');
    await page.type('input[name="email"]', 'donor@example.com');
    await page.type('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const donorSigninError = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('[class*="destructive"], .error, [class*="error"]');
      for (let el of errorElements) {
        if (el.textContent && el.textContent.trim() && el.offsetParent !== null) {
          return el.textContent.trim();
        }
      }
      return null;
    });
    
    console.log('Donor sign-in error:', donorSigninError || 'None found');
    
    if (donorSigninError) {
      console.log('✅ DONOR SIGN-IN ERROR HANDLING WORKS');
    } else {
      console.log('❌ Donor sign-in error not displayed');
    }
    
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/auth-final-5-donor-error.png',
      fullPage: true 
    });
    
    // FINAL SUMMARY
    console.log('\n\n🎉 FINAL VERIFICATION SUMMARY');
    console.log('==============================');
    
    const campaignSigninWorks = signinErrorVisible.found;
    const campaignSignupWorks = signupTabFound && (signupErrorVisible.hasRegisteredError || signupErrorVisible.bodyContainsRegistered);
    const donorSigninWorks = !!donorSigninError;
    
    console.log('Campaign Sign-in Error Handling:', campaignSigninWorks ? '✅ WORKING' : '❌ BROKEN');
    console.log('Campaign Sign-up Error Handling:', campaignSignupWorks ? '✅ WORKING' : '❌ BROKEN');
    console.log('Donor Sign-in Error Handling:', donorSigninWorks ? '✅ WORKING' : '❌ BROKEN');
    
    const allWorking = campaignSigninWorks && campaignSignupWorks && donorSigninWorks;
    
    console.log('\n🎯 AUTHENTICATION STATUS:', allWorking ? '✅ COMPLETELY FIXED' : '⚠️ PARTIALLY FIXED');
    
    if (allWorking) {
      console.log('\n🚀 Your auth system is ready! No more login loops.');
      console.log('   • Campaign auth: https://cryptocampaign.netlify.app/campaigns/auth');
      console.log('   • Donor auth: https://cryptocampaign.netlify.app/donors/auth');
    }
    
    // Keep browser open for manual review
    console.log('\n⏸️  Browser staying open for manual inspection...');
    console.log('   Close browser when done reviewing screenshots');
    console.log('   Screenshots saved as auth-final-*.png');
    
  } catch (error) {
    console.error('💥 Verification failed:', error.message);
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/auth-final-error.png',
      fullPage: true 
    });
    await browser.close();
  }
}

verifyAuthFix().catch(console.error);