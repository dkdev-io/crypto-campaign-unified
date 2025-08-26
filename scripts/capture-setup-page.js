#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function captureSetupPage() {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Capture console messages
    page.on('console', msg => {
      console.log(`Console ${msg.type()}: ${msg.text()}`);
    });
    
    console.log('🔍 Navigating to http://localhost:5175/setup');
    await page.goto('http://localhost:5175/setup', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Analyze the setup page
    const setupAnalysis = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      
      return {
        title: document.title,
        hasForm: !!document.querySelector('form'),
        hasSubmitButton: !!document.querySelector('button[type="submit"], input[type="submit"]'),
        hasNextButton: bodyText.includes('Next') || bodyText.includes('Continue'),
        formFields: document.querySelectorAll('input, textarea, select').length,
        buttons: document.querySelectorAll('button').length,
        bodyText: bodyText.slice(0, 500),
        currentStep: bodyText.match(/Step \d+/)?.[0] || 'No step found'
      };
    });
    
    console.log('\n📊 SETUP PAGE ANALYSIS:');
    console.log(`Title: ${setupAnalysis.title}`);
    console.log(`Current Step: ${setupAnalysis.currentStep}`);
    console.log(`Has Form: ${setupAnalysis.hasForm}`);
    console.log(`Has Submit Button: ${setupAnalysis.hasSubmitButton}`);
    console.log(`Has Next Button: ${setupAnalysis.hasNextButton}`);
    console.log(`Form Fields: ${setupAnalysis.formFields}`);
    console.log(`Total Buttons: ${setupAnalysis.buttons}`);
    
    console.log('\n📝 Page Content:');
    console.log(setupAnalysis.bodyText);
    
    // Try to find and click submit/next button
    console.log('\n🔄 Testing submit/next button...');
    
    try {
      // Look for submit or next button
      const buttons = await page.$$('button, input[type="submit"]');
      let submitFound = false;
      
      for (let button of buttons) {
        const buttonText = await page.evaluate(el => el.textContent || el.value, button);
        const buttonType = await page.evaluate(el => el.type, button);
        
        console.log(`Found button: "${buttonText}" (type: ${buttonType})`);
        
        if (buttonText.includes('Next') || buttonText.includes('Submit') || buttonText.includes('Continue') || buttonType === 'submit') {
          console.log(`Clicking button: "${buttonText}"`);
          
          // Fill in required fields if any
          const requiredFields = await page.$$('input[required], select[required], textarea[required]');
          for (let field of requiredFields) {
            const fieldType = await page.evaluate(el => el.type, field);
            const placeholder = await page.evaluate(el => el.placeholder || el.name, field);
            
            console.log(`Filling required field: ${placeholder} (${fieldType})`);
            
            if (fieldType === 'email') {
              await page.type(field, 'test@example.com');
            } else if (fieldType === 'text' || fieldType === 'tel') {
              await page.type(field, 'Test Value');
            }
          }
          
          await button.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
          submitFound = true;
          break;
        }
      }
      
      if (submitFound) {
        const afterClick = await page.evaluate(() => ({
          url: window.location.href,
          bodySnippet: document.body.innerText.slice(0, 300),
          currentStep: document.body.innerText.match(/Step \d+/)?.[0] || 'No step found'
        }));
        
        console.log('\n📍 AFTER CLICKING SUBMIT:');
        console.log(`URL: ${afterClick.url}`);
        console.log(`Current Step: ${afterClick.currentStep}`);
        console.log(`Content: ${afterClick.bodySnippet}`);
        
        const progressMade = afterClick.url !== 'http://localhost:5175/setup' || 
                           afterClick.currentStep !== setupAnalysis.currentStep;
        
        console.log(`\n✅ Progress to next step: ${progressMade ? '✓' : '✗'}`);
        
        if (!progressMade) {
          console.log('❌ ISSUE: User stuck on same step after clicking submit');
        }
      } else {
        console.log('❌ No submit/next button found');
      }
      
    } catch (error) {
      console.log('Error testing submit:', error.message);
    }
    
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/scripts/setup-page-debug.png',
      fullPage: true 
    });
    
    console.log('\n📸 Screenshot saved to: scripts/setup-page-debug.png');
    console.log('🔍 Browser staying open for 8 seconds...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

captureSetupPage().catch(console.error);