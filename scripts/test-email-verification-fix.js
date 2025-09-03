#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testSignupLogin() {
  console.log('🚀 TESTING EMAIL VERIFICATION FIX');
  console.log('');

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 500,
    defaultViewport: { width: 1200, height: 800 }
  });

  try {
    const page = await browser.newPage();

    // Go to the app
    console.log('1. Going to the app...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    console.log('   ✅ App loaded');

    // Take screenshot of initial state
    await page.screenshot({ path: 'auth-test-initial.png' });

    // Look for auth/signup links
    console.log('2. Looking for signup/login links...');
    
    // Try common signup/login selectors
    const authSelectors = [
      'a[href*="auth"]',
      'a[href*="sign"]', 
      'a[href*="login"]',
      'a[href*="register"]',
      'button[class*="auth"]',
      'button[class*="sign"]',
      '[data-testid*="auth"]',
      'text=Sign Up',
      'text=Login',
      'text=Sign In',
      'text=Register'
    ];

    let authElement = null;
    for (const selector of authSelectors) {
      try {
        authElement = await page.waitForSelector(selector, { timeout: 2000 });
        if (authElement) {
          console.log(`   ✅ Found auth element: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue searching
      }
    }

    if (!authElement) {
      // Try to find any auth-related text or links on the page
      console.log('   🔍 Searching page content for auth links...');
      const content = await page.content();
      console.log('   Page title:', await page.title());
      
      // Look for auth-related paths in the URL or navigation
      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a')).map(a => ({
          href: a.href,
          text: a.textContent.trim()
        }));
      });
      
      console.log('   Available links:', links.filter(l => l.text));
    }

    // Try direct navigation to common auth paths
    const authPaths = [
      '/auth/signup',
      '/auth/login', 
      '/auth/register',
      '/signup',
      '/login',
      '/register'
    ];

    for (const path of authPaths) {
      console.log(`3. Trying direct path: ${path}`);
      try {
        await page.goto(`http://localhost:5173${path}`, { waitUntil: 'networkidle2', timeout: 5000 });
        
        // Check if we got a signup form
        const hasForm = await page.$('form') || await page.$('input[type="email"]');
        if (hasForm) {
          console.log(`   ✅ Found signup form at ${path}!`);
          
          // Take screenshot
          await page.screenshot({ path: 'auth-test-filled.png' });
          
          // Try to fill out the form with test credentials
          console.log('4. Filling out signup form...');
          
          const emailInput = await page.$('input[type="email"]') || await page.$('input[name="email"]');
          if (emailInput) {
            await emailInput.type('test@dkdev.io');
            console.log('   ✅ Email filled');
          }
          
          const passwordInput = await page.$('input[type="password"]') || await page.$('input[name="password"]');
          if (passwordInput) {
            await passwordInput.type('TestDonor123!');
            console.log('   ✅ Password filled');
          }
          
          // Look for submit button
          const submitButton = await page.$('button[type="submit"]') || 
                              await page.$('input[type="submit"]') || 
                              await page.$('button:contains("Sign")') ||
                              await page.$('button');
          
          if (submitButton) {
            console.log('5. Submitting form...');
            await submitButton.click();
            
            // Wait for response
            await page.waitForTimeout(3000);
            
            // Take screenshot after submit
            await page.screenshot({ path: 'auth-test-after-submit.png' });
            
            // Check if we're now logged in or got an error
            const currentUrl = page.url();
            console.log('   Current URL after submit:', currentUrl);
            
            // Look for success indicators
            const successIndicators = await page.evaluate(() => {
              const text = document.body.textContent.toLowerCase();
              return {
                hasWelcome: text.includes('welcome'),
                hasAccount: text.includes('account'),
                hasDashboard: text.includes('dashboard'),
                hasLogout: text.includes('logout'),
                hasError: text.includes('error'),
                hasVerification: text.includes('verification') || text.includes('verify'),
                fullText: text
              };
            });
            
            if (successIndicators.hasError) {
              console.log('   ❌ Error detected in response');
              console.log('   Error content:', successIndicators.fullText.slice(0, 500));
            } else if (successIndicators.hasVerification) {
              console.log('   ❌ Still asking for email verification');
              console.log('   This means the fix did not work properly');
            } else if (successIndicators.hasWelcome || successIndicators.hasDashboard || successIndicators.hasLogout) {
              console.log('   ✅ SUCCESS! User appears to be logged in without email verification');
              console.log('   🎉 EMAIL VERIFICATION FIX WORKED!');
            } else {
              console.log('   ⚠️ Unclear result. Page content:', successIndicators.fullText.slice(0, 300));
            }
            
            break;
          }
        }
      } catch (error) {
        // Path doesn't exist, continue
      }
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    console.log('');
    console.log('📸 Screenshots saved:');
    console.log('   • auth-test-initial.png');
    console.log('   • auth-test-filled.png'); 
    console.log('   • auth-test-after-submit.png');
    
    await browser.close();
  }
}

testSignupLogin().catch(console.error);