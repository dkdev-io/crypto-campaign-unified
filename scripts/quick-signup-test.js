#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testSignupFlow() {
  const browser = await puppeteer.launch({ 
    headless: false, 
    slowMo: 200,
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Listen for console messages and errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`🔴 Browser error: ${msg.text()}`);
    } else if (msg.text().includes('signup') || msg.text().includes('auth') || msg.text().includes('error')) {
      console.log(`🟡 Browser log: ${msg.text()}`);
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('supabase') || response.url().includes('auth')) {
      console.log(`📡 API call: ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    console.log('🧪 Testing signup flow specifically...');
    
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth', { 
      waitUntil: 'networkidle2' 
    });
    
    // Click signup tab
    const buttons = await page.$$('button');
    for (let button of buttons) {
      const text = await button.evaluate(el => el.textContent);
      if (text.includes('Sign Up')) {
        await button.click();
        console.log('📝 Clicked Sign Up tab');
        break;
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Fill signup form with test data
    await page.type('input[name="fullName"]', 'Test User');
    await page.type('input[name="email"]', `test${Date.now()}@gmail.com`);
    await page.type('input[name="password"]:not([name="confirmPassword"])', '321test!');
    await page.type('input[name="confirmPassword"]', '321test!');
    
    // Check terms if exists
    const checkbox = await page.$('input[type="checkbox"]');
    if (checkbox) {
      await checkbox.click();
    }
    
    console.log('✏️ Form filled, taking screenshot...');
    await page.screenshot({ path: 'scripts/signup-before-submit.png' });
    
    // Submit form
    const submitButton = await page.$('button[type="submit"]');
    await submitButton.click();
    console.log('🚀 Submitted signup form');
    
    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Take screenshot of result
    await page.screenshot({ path: 'scripts/signup-after-submit.png' });
    console.log('📸 Result screenshot saved');
    
    // Get all text on page to see what message appears
    const pageText = await page.evaluate(() => document.body.textContent);
    
    // Check for verification message
    if (pageText.includes('check your email') || 
        pageText.includes('Check Your Email') || 
        pageText.includes('verification') ||
        pageText.includes('Account created')) {
      console.log('✅ SUCCESS: Verification message found!');
      
      // Extract the specific message
      const elements = await page.$$eval('*', els => 
        els.map(el => el.textContent.trim())
           .filter(text => text.toLowerCase().includes('email') || text.toLowerCase().includes('account'))
           .filter(text => text.length > 10)
      );
      
      elements.forEach(msg => console.log(`📧 Message: ${msg}`));
      
    } else {
      console.log('❌ FAILED: No verification message displayed');
      console.log('📄 Current page text (first 500 chars):');
      console.log(pageText.substring(0, 500));
    }
    
    const finalUrl = page.url();
    console.log(`📍 Final URL: ${finalUrl}`);
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    await page.screenshot({ path: 'scripts/signup-error.png' });
  }
  
  // Keep browser open for 10 seconds to see result
  console.log('🔍 Browser will stay open for 10 seconds...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  await browser.close();
}

testSignupFlow().catch(console.error);