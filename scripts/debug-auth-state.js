#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function debugAuthState() {
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser for debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Capture console messages and errors
    const consoleMessages = [];
    const errors = [];
    
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      console.log(`Console ${msg.type()}: ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
      console.log(`Page error: ${error.message}`);
    });
    
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`Failed request: ${response.url()} - ${response.status()}`);
      }
    });
    
    console.log('🔍 Navigating to http://localhost:5175/...');
    await page.goto('http://localhost:5175/', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Check for React/auth state
    const authState = await page.evaluate(() => {
      // Check if React is loaded
      const hasReact = !!window.React;
      
      // Check localStorage for Supabase auth
      const supabaseAuth = localStorage.getItem('supabase.auth.token');
      
      // Check for auth-related elements
      const hasAuthForm = !!document.querySelector('form');
      const hasSignupText = document.body.innerText.includes('Create Your Account');
      const hasProfileForm = document.body.innerText.includes('Full Name') && 
                            document.body.innerText.includes('Phone');
      
      // Check for any obvious errors in the DOM
      const errorMessages = Array.from(document.querySelectorAll('[class*="error"]'))
        .map(el => el.textContent);
      
      return {
        hasReact,
        supabaseAuth: !!supabaseAuth,
        hasAuthForm,
        hasSignupText,
        hasProfileForm,
        errorMessages,
        bodyText: document.body.innerText.slice(0, 500)
      };
    });
    
    console.log('\n📊 Auth State Analysis:');
    console.log('='.repeat(40));
    console.log(`React loaded: ${authState.hasReact}`);
    console.log(`Supabase auth token: ${authState.supabaseAuth}`);
    console.log(`Has auth form: ${authState.hasAuthForm}`);
    console.log(`Shows signup text: ${authState.hasSignupText}`);
    console.log(`Has profile form: ${authState.hasProfileForm}`);
    console.log(`Error messages: ${authState.errorMessages.join(', ') || 'None'}`);
    
    console.log('\n📝 Current page content:');
    console.log(authState.bodyText);
    
    if (consoleMessages.length > 0) {
      console.log('\n🚨 Console Messages:');
      consoleMessages.forEach(msg => console.log(`  ${msg}`));
    }
    
    if (errors.length > 0) {
      console.log('\n❌ JavaScript Errors:');
      errors.forEach(error => console.log(`  ${error}`));
    }
    
    // Try to simulate login if we see signup form
    if (authState.hasSignupText && !authState.hasProfileForm) {
      console.log('\n🔄 Attempting to switch to login form...');
      
      // Look for "Already have an account" link
      const loginLink = await page.$('a, button');
      if (loginLink) {
        const linkText = await page.evaluate(el => el.textContent, loginLink);
        if (linkText.includes('Sign In') || linkText.includes('account')) {
          await loginLink.click();
          await page.waitForTimeout(1000);
          
          const afterClick = await page.evaluate(() => ({
            hasLoginForm: document.body.innerText.includes('Sign In') || 
                         document.body.innerText.includes('Login'),
            bodySnippet: document.body.innerText.slice(0, 200)
          }));
          
          console.log(`After clicking login link: ${afterClick.hasLoginForm}`);
          console.log(`New content: ${afterClick.bodySnippet}`);
        }
      }
    }
    
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/scripts/debug-auth.png',
      fullPage: true 
    });
    console.log('\n📸 Debug screenshot saved to: scripts/debug-auth.png');
    
    // Keep browser open for manual inspection
    console.log('\n🔍 Browser will stay open for 10 seconds for manual inspection...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Debug script error:', error.message);
  } finally {
    await browser.close();
  }
}

debugAuthState().catch(console.error);