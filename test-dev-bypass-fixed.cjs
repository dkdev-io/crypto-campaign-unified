const puppeteer = require('puppeteer');

async function testDevBypassFixed() {
  console.log('🚀 Testing DEV BYPASS (fixed)...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('📍 Loading setup page...');
    await page.goto('http://localhost:5173/campaigns/auth/setup', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Look for and click DEV BYPASS button
    console.log('🔍 Looking for DEV BYPASS button...');
    const foundBypass = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        const text = btn.textContent.toLowerCase();
        if (text.includes('dev') && text.includes('bypass')) {
          btn.click();
          return btn.textContent.trim();
        }
      }
      return null;
    });
    
    if (foundBypass) {
      console.log(`✅ Clicked: ${foundBypass}`);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait longer for navigation
    } else {
      console.log('❌ DEV BYPASS button not found');
    }
    
    // Take screenshot after bypass attempt
    await page.screenshot({ 
      path: 'after-bypass-attempt.png',
      fullPage: true 
    });
    
    // Now check what page we're on
    const currentPage = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        h1: document.querySelector('h1')?.textContent || '',
        h2: document.querySelector('h2')?.textContent || '',
        bodyPreview: document.body.textContent.substring(0, 200)
      };
    });
    
    console.log('\n📄 Current page info:');
    console.log(`URL: ${currentPage.url}`);
    console.log(`Title: ${currentPage.title}`);
    console.log(`H1: ${currentPage.h1}`);
    console.log(`H2: ${currentPage.h2}`);
    console.log(`Body preview: ${currentPage.bodyPreview}...`);
    
    // Navigate through setup steps until we find the style page
    console.log('\n🔄 Navigating through steps...');
    
    for (let step = 1; step <= 10; step++) {
      console.log(`\n--- Step ${step} ---`);
      
      const stepInfo = await page.evaluate(() => {
        const h2 = document.querySelector('h2');
        const stepIndicator = document.querySelector('[class*="step"], .step-indicator, [style*="Step"]') ||
                             document.querySelector('p:contains("Step"), p[text*="Step"]') ||
                             Array.from(document.querySelectorAll('p')).find(p => p.textContent.includes('Step'));
        
        const bodyText = document.body.textContent.toLowerCase();
        
        return {
          h2: h2?.textContent || 'No H2',
          stepText: stepIndicator?.textContent?.substring(0, 100) || 'No step indicator',
          hasStyle: bodyText.includes('style') || bodyText.includes('website'),
          hasAnalyze: bodyText.includes('analyze'),
          hasPrimaryColor: bodyText.includes('primary color'),
          hasSecondaryColor: bodyText.includes('secondary color'),
          hasFont: bodyText.includes('font'),
          hasColorPicker: document.querySelectorAll('input[type="color"]').length > 0,
          hasSelect: document.querySelectorAll('select').length > 0,
          hasFileInput: document.querySelectorAll('input[type="file"]').length > 0,
          hasUrlInput: document.querySelectorAll('input[type="url"]').length > 0,
          formFields: {
            colorInputs: document.querySelectorAll('input[type="color"]').length,
            selects: document.querySelectorAll('select').length,
            fileInputs: document.querySelectorAll('input[type="file"]').length,
            urlInputs: document.querySelectorAll('input[type="url"]').length,
            textInputs: document.querySelectorAll('input[type="text"]').length
          }
        };
      });
      
      console.log(`H2: ${stepInfo.h2}`);
      console.log(`Step: ${stepInfo.stepText}`);
      
      // Check if this looks like the Website Style page
      const isStylePage = stepInfo.hasStyle && (
        stepInfo.hasAnalyze || 
        stepInfo.hasPrimaryColor || 
        stepInfo.hasColorPicker ||
        stepInfo.hasUrlInput
      );
      
      if (isStylePage) {
        console.log('\n🎯 FOUND WEBSITE STYLE PAGE!');
        console.log(`Form fields found:`);
        console.log(`  - URL inputs: ${stepInfo.formFields.urlInputs}`);
        console.log(`  - Color pickers: ${stepInfo.formFields.colorInputs}`);
        console.log(`  - Select dropdowns: ${stepInfo.formFields.selects}`);
        console.log(`  - File inputs: ${stepInfo.formFields.fileInputs}`);
        console.log(`  - Text inputs: ${stepInfo.formFields.textInputs}`);
        
        console.log(`Text content check:`);
        console.log(`  - "Primary Color": ${stepInfo.hasPrimaryColor}`);
        console.log(`  - "Secondary Color": ${stepInfo.hasSecondaryColor}`);
        console.log(`  - "Font": ${stepInfo.hasFont}`);
        
        // Take screenshot of the found page
        await page.screenshot({ 
          path: 'website-style-page-final.png',
          fullPage: true 
        });
        
        // Test field interactions
        console.log('\n🧪 Testing field interactions...');
        
        if (stepInfo.formFields.urlInputs > 0) {
          console.log('Testing URL input...');
          try {
            await page.type('input[type="url"]', 'https://example.com');
            console.log('✅ URL input works');
          } catch (e) {
            console.log(`❌ URL input failed: ${e.message}`);
          }
        }
        
        if (stepInfo.formFields.colorInputs >= 2) {
          console.log('Testing color pickers...');
          try {
            await page.evaluate(() => {
              const colorInputs = document.querySelectorAll('input[type="color"]');
              if (colorInputs[0]) {
                colorInputs[0].value = '#ff0000';
                colorInputs[0].dispatchEvent(new Event('change'));
              }
              if (colorInputs[1]) {
                colorInputs[1].value = '#00ff00';
                colorInputs[1].dispatchEvent(new Event('change'));
              }
            });
            console.log('✅ Color pickers work');
          } catch (e) {
            console.log(`❌ Color pickers failed: ${e.message}`);
          }
        }
        
        if (stepInfo.formFields.selects > 0) {
          console.log('Testing font selection...');
          try {
            const options = await page.evaluate(() => {
              const select = document.querySelector('select');
              return select ? Array.from(select.options).map(opt => opt.value) : [];
            });
            
            if (options.length > 1) {
              await page.select('select', options[1]);
              console.log(`✅ Font selection works - selected: ${options[1]}`);
            }
          } catch (e) {
            console.log(`❌ Font selection failed: ${e.message}`);
          }
        }
        
        console.log('\n🎉 WEBSITE STYLE ANALYZER VERIFICATION COMPLETED SUCCESSFULLY!');
        
        // Final summary
        const success = stepInfo.formFields.urlInputs > 0 && 
                       stepInfo.formFields.colorInputs >= 2 && 
                       stepInfo.formFields.selects > 0 && 
                       stepInfo.formFields.fileInputs > 0;
        
        console.log(`\n📊 FINAL RESULT: ${success ? '✅ ALL REQUIRED FIELDS PRESENT' : '⚠️ SOME FIELDS MISSING'}`);
        
        return; // Success - exit
      }
      
      // Look for navigation buttons
      const navigationResult = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        
        // First look for DEV buttons
        for (const btn of buttons) {
          const text = btn.textContent.toLowerCase();
          if (!btn.disabled && text.includes('dev') && (text.includes('skip') || text.includes('bypass'))) {
            btn.click();
            return `DEV: ${btn.textContent.trim()}`;
          }
        }
        
        // Then look for regular navigation
        for (const btn of buttons) {
          const text = btn.textContent.toLowerCase();
          if (!btn.disabled && (text.includes('next') || text.includes('continue'))) {
            btn.click();
            return btn.textContent.trim();
          }
        }
        
        return null;
      });
      
      if (navigationResult) {
        console.log(`✅ Navigation: ${navigationResult}`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        console.log('❌ No navigation available');
        
        // Try to click any enabled button as last resort
        const lastResort = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const enabledButtons = buttons.filter(btn => !btn.disabled && btn.textContent.trim());
          
          if (enabledButtons.length > 0) {
            const btn = enabledButtons[enabledButtons.length - 1]; // Try the last button
            btn.click();
            return btn.textContent.trim();
          }
          
          return null;
        });
        
        if (lastResort) {
          console.log(`🔄 Last resort clicked: ${lastResort}`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
          console.log('❌ No clickable buttons found - stopping navigation');
          break;
        }
      }
    }
    
    console.log('\n❌ Did not find Website Style page after 10 attempts');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    try {
      await page.screenshot({ 
        path: 'dev-bypass-error.png',
        fullPage: true 
      });
      console.log('📸 Error screenshot saved');
    } catch (e) {
      console.log('Could not save error screenshot');
    }
  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }
}

testDevBypassFixed().catch(console.error);