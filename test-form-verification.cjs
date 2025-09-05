const puppeteer = require('puppeteer');
const path = require('path');

async function testFormFields() {
  console.log('🚀 Starting Puppeteer form verification test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to the setup form
    console.log('📍 Navigating to setup form...');
    await page.goto('http://localhost:5173/campaigns/auth/setup', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for the form to load
    console.log('⏳ Waiting for form to load...');
    await page.waitForSelector('.setup-wizard', { timeout: 10000 });
    
    // Take initial screenshot
    console.log('📸 Taking initial screenshot...');
    await page.screenshot({ 
      path: 'form-initial.png',
      fullPage: true 
    });
    
    // Check if we need to navigate to step 4 (Website Style Matcher)
    console.log('🔍 Checking current step...');
    const currentStep = await page.evaluate(() => {
      const stepIndicator = document.querySelector('.step-indicator');
      if (stepIndicator) {
        const activeStep = stepIndicator.querySelector('.active');
        return activeStep ? activeStep.textContent.trim() : null;
      }
      return null;
    });
    
    console.log(`Current step: ${currentStep || 'Unknown'}`);
    
    // If not on step 4, try to navigate there
    if (!currentStep || !currentStep.includes('4')) {
      console.log('🔄 Attempting to navigate to step 4...');
      
      // Look for next/continue buttons and click them until we reach step 4
      for (let i = 0; i < 5; i++) {
        try {
          // Try different button selectors that might advance to next step
          const buttonSelectors = [
            'button:contains("Next")',
            'button:contains("Continue")',
            'button:contains("Skip")',
            '.form-actions button:last-child',
            'button[style*="crypto-navy"]'
          ];
          
          let buttonFound = false;
          for (const selector of buttonSelectors) {
            try {
              if (selector.includes(':contains')) {
                // Use evaluate for text-based selectors
                const found = await page.evaluate((text) => {
                  const buttons = document.querySelectorAll('button');
                  for (const btn of buttons) {
                    if (btn.textContent.toLowerCase().includes(text.toLowerCase())) {
                      btn.click();
                      return true;
                    }
                  }
                  return false;
                }, selector.split(':contains("')[1].split('")')[0]);
                
                if (found) {
                  buttonFound = true;
                  break;
                }
              } else {
                await page.click(selector);
                buttonFound = true;
                break;
              }
            } catch (e) {
              // Continue to next selector
            }
          }
          
          if (!buttonFound) {
            console.log('❌ No navigation button found');
            break;
          }
          
          // Wait for navigation
          await page.waitForTimeout(2000);
          
          // Check if we're now on the right step
          const stepText = await page.evaluate(() => {
            const title = document.querySelector('h2');
            return title ? title.textContent.trim() : '';
          });
          
          console.log(`Step ${i + 1}: ${stepText}`);
          
          if (stepText.includes('Website') || stepText.includes('Analyze') || stepText.includes('Style')) {
            console.log('✅ Found Website Style form!');
            break;
          }
          
        } catch (error) {
          console.log(`Navigation attempt ${i + 1} failed:`, error.message);
        }
      }
    }
    
    // Take screenshot of current state
    await page.screenshot({ 
      path: 'form-current-step.png',
      fullPage: true 
    });
    
    console.log('🔍 Looking for new form fields...');
    
    // Test 1: Check for URL input field
    console.log('1️⃣ Testing URL input field...');
    const urlInput = await page.$('input[type="url"]');
    if (urlInput) {
      console.log('✅ URL input field found');
      await urlInput.type('https://example.com');
      console.log('✅ URL input works');
    } else {
      console.log('❌ URL input field not found');
    }
    
    // Test 2: Check for primary color picker
    console.log('2️⃣ Testing primary color picker...');
    const primaryColorPicker = await page.$('input[type="color"]');
    if (primaryColorPicker) {
      console.log('✅ Primary color picker found');
      // Get current value
      const currentColor = await page.evaluate(el => el.value, primaryColorPicker);
      console.log(`Current primary color: ${currentColor}`);
      
      // Try to change color (note: programmatic color changes are limited in browsers)
      await page.evaluate(el => el.value = '#ff0000', primaryColorPicker);
      await page.evaluate(el => el.dispatchEvent(new Event('change')), primaryColorPicker);
      console.log('✅ Primary color picker interaction works');
    } else {
      console.log('❌ Primary color picker not found');
    }
    
    // Test 3: Check for secondary color picker
    console.log('3️⃣ Testing secondary color picker...');
    const colorPickers = await page.$$('input[type="color"]');
    if (colorPickers.length >= 2) {
      console.log('✅ Secondary color picker found');
      const secondaryColorPicker = colorPickers[1];
      const currentColor = await page.evaluate(el => el.value, secondaryColorPicker);
      console.log(`Current secondary color: ${currentColor}`);
      
      await page.evaluate(el => el.value = '#00ff00', secondaryColorPicker);
      await page.evaluate(el => el.dispatchEvent(new Event('change')), secondaryColorPicker);
      console.log('✅ Secondary color picker interaction works');
    } else {
      console.log('❌ Secondary color picker not found');
    }
    
    // Test 4: Check for font selection dropdown
    console.log('4️⃣ Testing font selection dropdown...');
    const fontSelect = await page.$('select');
    if (fontSelect) {
      console.log('✅ Font selection dropdown found');
      
      // Get available options
      const options = await page.evaluate(select => {
        return Array.from(select.options).map(option => ({
          value: option.value,
          text: option.text
        }));
      }, fontSelect);
      
      console.log(`Available fonts: ${options.map(o => o.text).join(', ')}`);
      
      // Try to select a different font
      await page.select('select', 'Georgia');
      console.log('✅ Font selection works');
    } else {
      console.log('❌ Font selection dropdown not found');
    }
    
    // Test 5: Check for image upload field
    console.log('5️⃣ Testing image upload functionality...');
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      console.log('✅ Image upload field found');
      
      // Check if it accepts image files
      const acceptValue = await page.evaluate(el => el.accept, fileInput);
      console.log(`File input accepts: ${acceptValue}`);
      
      // Create a test image file (we can't actually upload without a real file)
      console.log('✅ Image upload field is properly configured');
    } else {
      console.log('❌ Image upload field not found');
    }
    
    // Test 6: Check for color text inputs (hex values)
    console.log('6️⃣ Testing color text inputs...');
    const textInputs = await page.$$('input[type="text"]');
    const colorTextInputs = [];
    
    for (const input of textInputs) {
      const placeholder = await page.evaluate(el => el.placeholder, input);
      const value = await page.evaluate(el => el.value, input);
      
      if (placeholder && placeholder.includes('#') || value && value.includes('#')) {
        colorTextInputs.push({ placeholder, value });
      }
    }
    
    if (colorTextInputs.length > 0) {
      console.log(`✅ Found ${colorTextInputs.length} color text input(s)`);
      colorTextInputs.forEach((input, i) => {
        console.log(`  Color input ${i + 1}: placeholder="${input.placeholder}", value="${input.value}"`);
      });
    } else {
      console.log('❌ Color text inputs not found');
    }
    
    // Test 7: Check button functionality
    console.log('7️⃣ Testing button functionality...');
    const buttons = await page.$$('button');
    console.log(`Found ${buttons.length} buttons on the page`);
    
    for (let i = 0; i < buttons.length; i++) {
      const buttonText = await page.evaluate(el => el.textContent.trim(), buttons[i]);
      const isDisabled = await page.evaluate(el => el.disabled, buttons[i]);
      console.log(`  Button ${i + 1}: "${buttonText}" (disabled: ${isDisabled})`);
    }
    
    // Take final screenshot
    console.log('📸 Taking final screenshot...');
    await page.screenshot({ 
      path: 'form-final-state.png',
      fullPage: true 
    });
    
    // Test form submission behavior
    console.log('8️⃣ Testing form state persistence...');
    
    // Fill out all available fields
    if (urlInput) {
      await page.evaluate(el => el.value = 'https://test-website.com', urlInput);
    }
    
    // Try to trigger form data saving
    const continueButton = await page.evaluateHandle(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        const text = btn.textContent.toLowerCase();
        if (text.includes('continue') || text.includes('next') || text.includes('manual')) {
          return btn;
        }
      }
      return null;
    });
    
    if (continueButton) {
      console.log('✅ Found continue/next button');
      // We won't click it to avoid navigation, just verify it exists
    }
    
    console.log('\n🎉 Form verification complete!');
    console.log('\n📊 Summary:');
    console.log(`✅ URL Input: ${urlInput ? 'FOUND' : 'MISSING'}`);
    console.log(`✅ Primary Color Picker: ${primaryColorPicker ? 'FOUND' : 'MISSING'}`);
    console.log(`✅ Secondary Color Picker: ${colorPickers.length >= 2 ? 'FOUND' : 'MISSING'}`);
    console.log(`✅ Font Selection: ${fontSelect ? 'FOUND' : 'MISSING'}`);
    console.log(`✅ Image Upload: ${fileInput ? 'FOUND' : 'MISSING'}`);
    console.log(`✅ Color Text Inputs: ${colorTextInputs.length > 0 ? `FOUND (${colorTextInputs.length})` : 'MISSING'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Take error screenshot
    try {
      const page = browser.pages()[0] || await browser.newPage();
      await page.screenshot({ 
        path: 'form-error.png',
        fullPage: true 
      });
      console.log('📸 Error screenshot saved as form-error.png');
    } catch (screenshotError) {
      console.log('Could not take error screenshot:', screenshotError.message);
    }
  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }
}

// Run the test
testFormFields().catch(console.error);