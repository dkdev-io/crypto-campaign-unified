#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function debugPage() {
  console.log('🔍 PUPPETEER DEBUG - Examining Page Elements');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 500
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    console.log('🌐 Opening campaign auth page...');
    await page.goto('http://localhost:5175/campaigns/auth', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get page title and URL
    const title = await page.title();
    const url = await page.url();
    console.log('📄 Page Title:', title);
    console.log('🔗 Page URL:', url);
    
    // Check if page loaded successfully
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('📝 Page contains text length:', bodyText.length);
    
    // Look for all input elements
    console.log('🔍 Looking for input elements...');
    const inputs = await page.evaluate(() => {
      const inputElements = Array.from(document.querySelectorAll('input'));
      return inputElements.map(input => ({
        type: input.type,
        name: input.name,
        id: input.id,
        placeholder: input.placeholder,
        className: input.className
      }));
    });
    console.log('📋 Found inputs:', JSON.stringify(inputs, null, 2));
    
    // Look for all buttons
    console.log('🔍 Looking for button elements...');
    const buttons = await page.evaluate(() => {
      const buttonElements = Array.from(document.querySelectorAll('button'));
      return buttonElements.map(button => ({
        text: button.textContent.trim(),
        type: button.type,
        className: button.className,
        id: button.id
      }));
    });
    console.log('🔘 Found buttons:', JSON.stringify(buttons, null, 2));
    
    // Check for forms
    console.log('🔍 Looking for form elements...');
    const forms = await page.evaluate(() => {
      const formElements = Array.from(document.querySelectorAll('form'));
      return formElements.map(form => ({
        id: form.id,
        className: form.className,
        action: form.action,
        method: form.method
      }));
    });
    console.log('📋 Found forms:', JSON.stringify(forms, null, 2));
    
    // Take detailed screenshot
    await page.screenshot({ path: 'debug-page.png', fullPage: true });
    console.log('📸 Debug screenshot saved: debug-page.png');
    
    // Try to find signup tab and click it
    console.log('🔍 Looking for Sign Up tab...');
    const signUpFound = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const signUpButton = buttons.find(button => 
        button.textContent.includes('Sign Up') || 
        button.textContent.includes('signup')
      );
      return signUpButton ? signUpButton.textContent : null;
    });
    
    if (signUpFound) {
      console.log('✅ Found Sign Up button:', signUpFound);
      
      // Click it
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const signUpButton = buttons.find(button => 
          button.textContent.includes('Sign Up')
        );
        if (signUpButton) signUpButton.click();
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check inputs again after clicking signup tab
      const inputsAfterClick = await page.evaluate(() => {
        const inputElements = Array.from(document.querySelectorAll('input'));
        return inputElements.map(input => ({
          type: input.type,
          name: input.name,
          id: input.id,
          placeholder: input.placeholder,
          visible: input.offsetParent !== null
        }));
      });
      console.log('📋 Inputs after clicking Sign Up:', JSON.stringify(inputsAfterClick, null, 2));
    } else {
      console.log('❌ Sign Up button not found');
    }
    
    console.log('⏳ Keeping browser open for 10 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } finally {
    await browser.close();
    console.log('🔚 Browser closed');
  }
}

debugPage().catch(console.error);