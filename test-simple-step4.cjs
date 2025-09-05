const puppeteer = require('puppeteer');

async function testSimpleStep4() {
  console.log('🚀 Simple Step 4 test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('📍 Going to setup page...');
    await page.goto('http://localhost:5173/campaigns/auth/setup', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait a bit for page to stabilize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('📸 Taking initial screenshot...');
    await page.screenshot({ 
      path: 'simple-test-initial.png',
      fullPage: true 
    });
    
    // Get current page info
    const pageInfo = await page.evaluate(() => {
      const h2 = document.querySelector('h2');
      const stepText = document.querySelector('[class*="step"], .setup-wizard');
      const allText = document.body.textContent.toLowerCase();
      
      return {
        h2: h2 ? h2.textContent.trim() : '',
        stepElement: stepText ? stepText.textContent.substring(0, 200) : '',
        hasWebsiteText: allText.includes('website'),
        hasAnalyzeText: allText.includes('analyze'),
        hasStyleText: allText.includes('style'),
        hasColorText: allText.includes('color'),
        hasFontText: allText.includes('font'),
        hasImageText: allText.includes('image') || allText.includes('upload'),
        currentUrl: window.location.href
      };
    });
    
    console.log('\n📋 Current page info:');
    console.log(`URL: ${pageInfo.currentUrl}`);
    console.log(`H2 title: "${pageInfo.h2}"`);
    console.log(`Step element: "${pageInfo.stepElement}"`);
    console.log(`Has website text: ${pageInfo.hasWebsiteText}`);
    console.log(`Has analyze text: ${pageInfo.hasAnalyzeText}`);
    console.log(`Has style text: ${pageInfo.hasStyleText}`);
    console.log(`Has color text: ${pageInfo.hasColorText}`);
    console.log(`Has font text: ${pageInfo.hasFontText}`);
    console.log(`Has image/upload text: ${pageInfo.hasImageText}`);
    
    // Count form elements
    const formElements = await page.evaluate(() => {
      return {
        urlInputs: document.querySelectorAll('input[type="url"]').length,
        colorInputs: document.querySelectorAll('input[type="color"]').length,
        textInputs: document.querySelectorAll('input[type="text"]').length,
        selects: document.querySelectorAll('select').length,
        fileInputs: document.querySelectorAll('input[type="file"]').length,
        buttons: document.querySelectorAll('button').length,
        labels: document.querySelectorAll('label').length
      };
    });
    
    console.log('\n🔢 Form elements count:');
    console.log(`URL inputs: ${formElements.urlInputs}`);
    console.log(`Color inputs: ${formElements.colorInputs}`);
    console.log(`Text inputs: ${formElements.textInputs}`);
    console.log(`Select elements: ${formElements.selects}`);
    console.log(`File inputs: ${formElements.fileInputs}`);
    console.log(`Buttons: ${formElements.buttons}`);
    console.log(`Labels: ${formElements.labels}`);
    
    // If this isn't step 4, try clicking through steps manually
    if (!pageInfo.hasWebsiteText || !pageInfo.hasAnalyzeText) {
      console.log('\n🔄 Attempting to navigate to Step 4...');
      
      // Try clicking "Continue to Next Step" or similar buttons multiple times
      for (let attempt = 1; attempt <= 4; attempt++) {
        console.log(`Attempt ${attempt}: Looking for navigation buttons...`);
        
        const clicked = await page.evaluate(() => {
          const buttons = document.querySelectorAll('button');
          for (const btn of buttons) {
            const text = btn.textContent.toLowerCase();
            if (text.includes('continue') || text.includes('next') || text.includes('skip')) {
              if (!btn.disabled) {
                console.log('Clicking button:', btn.textContent.trim());
                btn.click();
                return btn.textContent.trim();
              }
            }
          }
          return null;
        });
        
        if (clicked) {
          console.log(`✅ Clicked: ${clicked}`);
          // Wait for navigation
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Check if we reached the right step
          const newPageInfo = await page.evaluate(() => {
            const h2 = document.querySelector('h2');
            const allText = document.body.textContent.toLowerCase();
            return {
              h2: h2 ? h2.textContent.trim() : '',
              hasWebsiteText: allText.includes('website'),
              hasAnalyzeText: allText.includes('analyze'),
              hasStyleText: allText.includes('style')
            };
          });
          
          console.log(`New page H2: "${newPageInfo.h2}"`);
          
          if (newPageInfo.hasWebsiteText && (newPageInfo.hasAnalyzeText || newPageInfo.hasStyleText)) {
            console.log('🎯 Reached Website/Style page!');
            break;
          }
          
          // Take screenshot of this step
          await page.screenshot({ 
            path: `step-navigation-${attempt}.png`,
            fullPage: true 
          });
          
        } else {
          console.log('❌ No clickable navigation button found');
          break;
        }
      }
    }
    
    // Final check for our form elements
    console.log('\n🔍 Final check for our custom form fields...');
    
    const finalElements = await page.evaluate(() => {
      const results = {};
      
      // Check URL input
      const urlInput = document.querySelector('input[type="url"]');
      results.urlInput = urlInput ? {
        found: true,
        placeholder: urlInput.placeholder,
        value: urlInput.value
      } : { found: false };
      
      // Check color inputs
      const colorInputs = document.querySelectorAll('input[type="color"]');
      results.colorInputs = Array.from(colorInputs).map((input, i) => ({
        index: i,
        value: input.value,
        id: input.id || `color-${i}`
      }));
      
      // Check select (font dropdown)
      const select = document.querySelector('select');
      results.fontSelect = select ? {
        found: true,
        options: Array.from(select.options).map(opt => opt.text),
        selected: select.value
      } : { found: false };
      
      // Check file input
      const fileInput = document.querySelector('input[type="file"]');
      results.fileInput = fileInput ? {
        found: true,
        accept: fileInput.accept,
        id: fileInput.id
      } : { found: false };
      
      // Check for color text inputs (hex inputs)
      const textInputs = document.querySelectorAll('input[type="text"]');
      results.colorTextInputs = Array.from(textInputs)
        .filter(input => 
          (input.placeholder && input.placeholder.includes('#')) || 
          (input.value && input.value.match(/^#[0-9a-fA-F]/))
        )
        .map((input, i) => ({
          index: i,
          placeholder: input.placeholder,
          value: input.value
        }));
      
      // Check for specific text content
      const bodyText = document.body.textContent.toLowerCase();
      results.textContent = {
        primaryColor: bodyText.includes('primary color'),
        secondaryColor: bodyText.includes('secondary color'),
        fontFamily: bodyText.includes('font family') || bodyText.includes('font'),
        logoImage: bodyText.includes('logo') || bodyText.includes('brand image'),
        analyze: bodyText.includes('analyze'),
        website: bodyText.includes('website')
      };
      
      return results;
    });
    
    // Report findings
    console.log('\n📊 FINAL RESULTS:');
    console.log('=================');
    
    console.log(`\n🌐 URL Input: ${finalElements.urlInput.found ? '✅ FOUND' : '❌ NOT FOUND'}`);
    if (finalElements.urlInput.found) {
      console.log(`   Placeholder: "${finalElements.urlInput.placeholder}"`);
      console.log(`   Current value: "${finalElements.urlInput.value}"`);
    }
    
    console.log(`\n🎨 Color Pickers: ${finalElements.colorInputs.length > 0 ? '✅ FOUND' : '❌ NOT FOUND'} (${finalElements.colorInputs.length})`);
    finalElements.colorInputs.forEach(color => {
      console.log(`   Color ${color.index + 1}: ${color.value} (id: ${color.id})`);
    });
    
    console.log(`\n🔤 Font Selection: ${finalElements.fontSelect.found ? '✅ FOUND' : '❌ NOT FOUND'}`);
    if (finalElements.fontSelect.found) {
      console.log(`   Options: ${finalElements.fontSelect.options.join(', ')}`);
      console.log(`   Selected: "${finalElements.fontSelect.selected}"`);
    }
    
    console.log(`\n📁 File Upload: ${finalElements.fileInput.found ? '✅ FOUND' : '❌ NOT FOUND'}`);
    if (finalElements.fileInput.found) {
      console.log(`   Accepts: "${finalElements.fileInput.accept}"`);
      console.log(`   ID: "${finalElements.fileInput.id}"`);
    }
    
    console.log(`\n🖍️ Color Text Inputs: ${finalElements.colorTextInputs.length > 0 ? '✅ FOUND' : '❌ NOT FOUND'} (${finalElements.colorTextInputs.length})`);
    finalElements.colorTextInputs.forEach(input => {
      console.log(`   Input ${input.index + 1}: placeholder="${input.placeholder}", value="${input.value}"`);
    });
    
    console.log(`\n📝 Text Content Check:`);
    console.log(`   "Primary Color": ${finalElements.textContent.primaryColor ? '✅' : '❌'}`);
    console.log(`   "Secondary Color": ${finalElements.textContent.secondaryColor ? '✅' : '❌'}`);
    console.log(`   "Font Family": ${finalElements.textContent.fontFamily ? '✅' : '❌'}`);
    console.log(`   "Logo/Brand Image": ${finalElements.textContent.logoImage ? '✅' : '❌'}`);
    console.log(`   "Analyze": ${finalElements.textContent.analyze ? '✅' : '❌'}`);
    console.log(`   "Website": ${finalElements.textContent.website ? '✅' : '❌'}`);
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'simple-test-final.png',
      fullPage: true 
    });
    
    console.log('\n📸 Screenshots saved: simple-test-initial.png, simple-test-final.png');
    console.log('🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    try {
      const page = browser.pages()[0] || await browser.newPage();
      await page.screenshot({ 
        path: 'simple-test-error.png',
        fullPage: true 
      });
      console.log('📸 Error screenshot saved: simple-test-error.png');
    } catch (e) {
      console.log('Could not take error screenshot');
    }
  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }
}

testSimpleStep4().catch(console.error);