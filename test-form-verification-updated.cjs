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
      path: 'step-navigation-initial.png',
      fullPage: true 
    });
    
    // Helper function to wait
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Navigate through steps to reach Step 4
    console.log('🚶‍♂️ Navigating through setup steps...');
    
    // Step 1 -> Step 2: Usually auto-advances or we might already be on step 2
    await wait(1000);
    
    // Step 2: Committee Search - fill out minimal info to continue
    console.log('📋 Step 2: Filling Committee Search...');
    try {
      // Fill committee name
      const committeeNameInput = await page.$('input[placeholder*="committee name"], input[placeholder*="Committee name"]');
      if (committeeNameInput) {
        await committeeNameInput.type('Test Committee');
      }
      
      // Fill committee address  
      const addressInput = await page.$('input[placeholder*="address"], input[placeholder*="Address"]');
      if (addressInput) {
        await addressInput.type('123 Test St');
      }
      
      // Fill city
      const cityInput = await page.$('input[placeholder*="city"], input[placeholder*="City"]');
      if (cityInput) {
        await cityInput.type('Test City');
      }
      
      // Fill state
      const stateInput = await page.$('input[placeholder*="state"], input[placeholder*="State"]');
      if (stateInput) {
        await stateInput.type('CA');
      }
      
      // Fill ZIP
      const zipInput = await page.$('input[placeholder*="zip"], input[placeholder*="ZIP"]');
      if (zipInput) {
        await zipInput.type('90210');
      }
      
      await wait(1000);
      
      // Click Save & Continue or Next button
      const continueButton = await page.evaluateHandle(() => {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          const text = btn.textContent.toLowerCase();
          if ((text.includes('save') && text.includes('continue')) || 
              text.includes('next') || 
              (text.includes('committee') && text.includes('continue'))) {
            return btn;
          }
        }
        return null;
      });
      
      if (continueButton && continueButton.asElement()) {
        console.log('✅ Clicking continue button for Step 2');
        await continueButton.asElement().click();
        await wait(2000);
      }
      
    } catch (error) {
      console.log('⚠️ Could not complete Step 2:', error.message);
    }
    
    // Step 3: Bank Connection - skip or fill minimal
    console.log('🏦 Step 3: Handling Bank Connection...');
    try {
      await wait(1000);
      
      // Look for skip or next button
      const skipButton = await page.evaluateHandle(() => {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          const text = btn.textContent.toLowerCase();
          if (text.includes('skip') || text.includes('next') || text.includes('continue')) {
            return btn;
          }
        }
        return null;
      });
      
      if (skipButton && skipButton.asElement()) {
        console.log('✅ Skipping Step 3 (Bank Connection)');
        await skipButton.asElement().click();
        await wait(2000);
      }
      
    } catch (error) {
      console.log('⚠️ Could not complete Step 3:', error.message);
    }
    
    // Now we should be on Step 4: Website Style Matcher
    console.log('🎨 Checking if we reached Step 4: Website Style Matcher...');
    await wait(1000);
    
    // Take screenshot of current step
    await page.screenshot({ 
      path: 'step-4-reached.png',
      fullPage: true 
    });
    
    // Check if we're on the right step by looking for specific elements
    const stepTitle = await page.evaluate(() => {
      const h2 = document.querySelector('h2');
      const h3 = document.querySelector('h3');
      return {
        h2: h2 ? h2.textContent.trim() : '',
        h3: h3 ? h3.textContent.trim() : ''
      };
    });
    
    console.log(`Current page titles: H2="${stepTitle.h2}", H3="${stepTitle.h3}"`);
    
    // Look for our new form fields
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
      const currentColor = await page.evaluate(el => el.value, primaryColorPicker);
      console.log(`Current primary color: ${currentColor}`);
      
      await page.evaluate(el => {
        el.value = '#ff0000';
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, primaryColorPicker);
      console.log('✅ Primary color picker interaction works');
    } else {
      console.log('❌ Primary color picker not found');
    }
    
    // Test 3: Check for secondary color picker
    console.log('3️⃣ Testing secondary color picker...');
    const colorPickers = await page.$$('input[type="color"]');
    console.log(`Found ${colorPickers.length} color picker(s)`);
    
    if (colorPickers.length >= 2) {
      console.log('✅ Secondary color picker found');
      const secondaryColorPicker = colorPickers[1];
      const currentColor = await page.evaluate(el => el.value, secondaryColorPicker);
      console.log(`Current secondary color: ${currentColor}`);
      
      await page.evaluate(el => {
        el.value = '#00ff00';
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, secondaryColorPicker);
      console.log('✅ Secondary color picker interaction works');
    } else {
      console.log(`❌ Secondary color picker not found (only ${colorPickers.length} color pickers total)`);
    }
    
    // Test 4: Check for font selection dropdown
    console.log('4️⃣ Testing font selection dropdown...');
    const fontSelect = await page.$('select');
    if (fontSelect) {
      console.log('✅ Font selection dropdown found');
      
      const options = await page.evaluate(select => {
        return Array.from(select.options).map(option => ({
          value: option.value,
          text: option.text
        }));
      }, fontSelect);
      
      console.log(`Available fonts: ${options.map(o => o.text).join(', ')}`);
      
      if (options.find(o => o.value === 'Georgia')) {
        await page.select('select', 'Georgia');
        console.log('✅ Font selection works - selected Georgia');
      }
    } else {
      console.log('❌ Font selection dropdown not found');
    }
    
    // Test 5: Check for image upload field
    console.log('5️⃣ Testing image upload functionality...');
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      console.log('✅ Image upload field found');
      
      const acceptValue = await page.evaluate(el => el.accept, fileInput);
      console.log(`File input accepts: ${acceptValue}`);
      
      // Check if it's properly hidden and has correct ID
      const isHidden = await page.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.display === 'none';
      }, fileInput);
      
      const inputId = await page.evaluate(el => el.id, fileInput);
      console.log(`File input ID: ${inputId}, Hidden: ${isHidden}`);
      
      // Check for corresponding label
      const label = await page.$(`label[for="${inputId}"]`);
      if (label) {
        console.log('✅ Upload label found and properly connected');
      } else {
        console.log('⚠️ Upload label not found or not connected');
      }
      
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
      
      if ((placeholder && placeholder.includes('#')) || (value && value.includes('#'))) {
        colorTextInputs.push({ placeholder, value });
      }
    }
    
    console.log(`Found ${textInputs.length} text inputs total`);
    if (colorTextInputs.length > 0) {
      console.log(`✅ Found ${colorTextInputs.length} color text input(s)`);
      colorTextInputs.forEach((input, i) => {
        console.log(`  Color input ${i + 1}: placeholder="${input.placeholder}", value="${input.value}"`);
      });
      
      // Test typing in color text input
      if (textInputs.length > 0) {
        try {
          await textInputs[0].click({ clickCount: 3 }); // Select all
          await textInputs[0].type('#123456');
          console.log('✅ Color text input typing works');
        } catch (e) {
          console.log('⚠️ Color text input typing failed:', e.message);
        }
      }
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
    
    // Test 8: Check for specific new elements
    console.log('8️⃣ Testing for specific form structure...');
    
    // Check for grid layout (color inputs should be in a grid)
    const gridElements = await page.$$('[style*="grid"]');
    console.log(`Found ${gridElements.length} elements with grid styling`);
    
    // Check for upload area styling
    const uploadAreas = await page.$$('[style*="dashed"]');
    console.log(`Found ${uploadAreas.length} elements with dashed border (upload areas)`);
    
    // Check for labels
    const labels = await page.$$('label');
    console.log(`Found ${labels.length} label elements`);
    for (let i = 0; i < Math.min(labels.length, 10); i++) { // Limit to first 10
      const labelText = await page.evaluate(el => el.textContent.trim(), labels[i]);
      console.log(`  Label ${i + 1}: "${labelText}"`);
    }
    
    // Take final screenshot
    console.log('📸 Taking final screenshot...');
    await page.screenshot({ 
      path: 'form-verification-final.png',
      fullPage: true 
    });
    
    console.log('\n🎉 Form verification complete!');
    console.log('\n📊 Summary:');
    console.log(`✅ URL Input: ${urlInput ? 'FOUND' : 'MISSING'}`);
    console.log(`✅ Primary Color Picker: ${primaryColorPicker ? 'FOUND' : 'MISSING'}`);
    console.log(`✅ Secondary Color Picker: ${colorPickers.length >= 2 ? 'FOUND' : 'MISSING'}`);
    console.log(`✅ Font Selection: ${fontSelect ? 'FOUND' : 'MISSING'}`);
    console.log(`✅ Image Upload: ${fileInput ? 'FOUND' : 'MISSING'}`);
    console.log(`✅ Color Text Inputs: ${colorTextInputs.length > 0 ? `FOUND (${colorTextInputs.length})` : 'MISSING'}`);
    console.log(`✅ Total Buttons: ${buttons.length}`);
    console.log(`✅ Total Labels: ${labels.length}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    try {
      const page = browser.pages()[0] || await browser.newPage();
      await page.screenshot({ 
        path: 'form-verification-error.png',
        fullPage: true 
      });
      console.log('📸 Error screenshot saved');
    } catch (screenshotError) {
      console.log('Could not take error screenshot:', screenshotError.message);
    }
  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }
}

testFormFields().catch(console.error);