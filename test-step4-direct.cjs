const puppeteer = require('puppeteer');

async function testStep4Direct() {
  console.log('🚀 Testing Step 4 directly with bypass...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Try different URLs to reach step 4
    const urlsToTry = [
      'http://localhost:5173/campaigns/auth/setup?bypass=true&step=4',
      'http://localhost:5173/campaigns/auth/setup?step=4',
      'http://localhost:5173/campaigns/auth/setup#step4'
    ];
    
    for (const url of urlsToTry) {
      console.log(`\n🔗 Trying URL: ${url}`);
      
      try {
        await page.goto(url, { 
          waitUntil: 'networkidle2',
          timeout: 15000 
        });
        
        await page.waitForTimeout(2000);
        
        // Check page title
        const titles = await page.evaluate(() => {
          const h2 = document.querySelector('h2');
          const h3 = document.querySelector('h3');
          const title = document.title;
          
          return {
            pageTitle: title,
            h2Text: h2 ? h2.textContent.trim() : '',
            h3Text: h3 ? h3.textContent.trim() : '',
            bodyText: document.body.textContent.substring(0, 200)
          };
        });
        
        console.log(`Page title: "${titles.pageTitle}"`);
        console.log(`H2: "${titles.h2Text}"`);
        console.log(`H3: "${titles.h3Text}"`);
        console.log(`Body preview: "${titles.bodyText}..."`);
        
        // Look for Website Style Matcher specific elements
        const styleElements = await page.evaluate(() => {
          const results = {
            websiteUrlInput: !!document.querySelector('input[type="url"]'),
            colorInputs: document.querySelectorAll('input[type="color"]').length,
            textInputs: document.querySelectorAll('input[type="text"]').length,
            selectElements: document.querySelectorAll('select').length,
            fileInputs: document.querySelectorAll('input[type="file"]').length,
            hasAnalyzeText: document.body.textContent.toLowerCase().includes('analyze'),
            hasWebsiteText: document.body.textContent.toLowerCase().includes('website'),
            hasStyleText: document.body.textContent.toLowerCase().includes('style'),
            hasPrimaryColorText: document.body.textContent.toLowerCase().includes('primary color'),
            hasSecondaryColorText: document.body.textContent.toLowerCase().includes('secondary color'),
            hasFontText: document.body.textContent.toLowerCase().includes('font')
          };
          return results;
        });
        
        console.log('🔍 Style matcher elements found:');
        console.log(`  URL inputs: ${styleElements.websiteUrlInput ? 'YES' : 'NO'}`);
        console.log(`  Color pickers: ${styleElements.colorInputs}`);
        console.log(`  Text inputs: ${styleElements.textInputs}`);
        console.log(`  Select dropdowns: ${styleElements.selectElements}`);
        console.log(`  File inputs: ${styleElements.fileInputs}`);
        console.log(`  Contains "analyze": ${styleElements.hasAnalyzeText ? 'YES' : 'NO'}`);
        console.log(`  Contains "website": ${styleElements.hasWebsiteText ? 'YES' : 'NO'}`);
        console.log(`  Contains "style": ${styleElements.hasStyleText ? 'YES' : 'NO'}`);
        console.log(`  Contains "primary color": ${styleElements.hasPrimaryColorText ? 'YES' : 'NO'}`);
        console.log(`  Contains "secondary color": ${styleElements.hasSecondaryColorText ? 'YES' : 'NO'}`);
        console.log(`  Contains "font": ${styleElements.hasFontText ? 'YES' : 'NO'}`);
        
        // Take screenshot for this attempt
        await page.screenshot({ 
          path: `step4-attempt-${urlsToTry.indexOf(url) + 1}.png`,
          fullPage: true 
        });
        
        // If we found style matcher elements, run detailed tests
        if (styleElements.websiteUrlInput || styleElements.colorInputs > 0 || 
            styleElements.hasPrimaryColorText || styleElements.hasSecondaryColorText) {
          
          console.log('\n🎯 Found style matcher! Running detailed tests...');
          
          // Test URL input
          if (styleElements.websiteUrlInput) {
            console.log('✅ Testing URL input...');
            try {
              await page.type('input[type="url"]', 'https://example.com');
              console.log('  ✓ URL input works');
            } catch (e) {
              console.log('  ✗ URL input failed:', e.message);
            }
          }
          
          // Test color pickers
          if (styleElements.colorInputs > 0) {
            console.log(`✅ Testing ${styleElements.colorInputs} color picker(s)...`);
            try {
              const colorPickers = await page.$$('input[type="color"]');
              for (let i = 0; i < colorPickers.length; i++) {
                const currentValue = await page.evaluate(el => el.value, colorPickers[i]);
                console.log(`  Color picker ${i + 1}: ${currentValue}`);
                
                // Try to change color
                await page.evaluate((el, newColor) => {
                  el.value = newColor;
                  el.dispatchEvent(new Event('change', { bubbles: true }));
                }, colorPickers[i], i === 0 ? '#ff0000' : '#00ff00');
                
                console.log(`  ✓ Color picker ${i + 1} changed`);
              }
            } catch (e) {
              console.log('  ✗ Color picker test failed:', e.message);
            }
          }
          
          // Test font selection
          if (styleElements.selectElements > 0) {
            console.log(`✅ Testing ${styleElements.selectElements} select element(s)...`);
            try {
              const selects = await page.$$('select');
              for (let i = 0; i < selects.length; i++) {
                const options = await page.evaluate(el => {
                  return Array.from(el.options).map(opt => ({ 
                    value: opt.value, 
                    text: opt.text 
                  }));
                }, selects[i]);
                
                console.log(`  Select ${i + 1} options: ${options.map(o => o.text).join(', ')}`);
                
                if (options.length > 1) {
                  await page.evaluate((el, value) => {
                    el.value = value;
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                  }, selects[i], options[1].value);
                  
                  console.log(`  ✓ Selected: ${options[1].text}`);
                }
              }
            } catch (e) {
              console.log('  ✗ Select test failed:', e.message);
            }
          }
          
          // Test file input
          if (styleElements.fileInputs > 0) {
            console.log(`✅ Testing ${styleElements.fileInputs} file input(s)...`);
            try {
              const fileInputs = await page.$$('input[type="file"]');
              for (let i = 0; i < fileInputs.length; i++) {
                const accept = await page.evaluate(el => el.accept, fileInputs[i]);
                const id = await page.evaluate(el => el.id, fileInputs[i]);
                console.log(`  File input ${i + 1}: accepts="${accept}", id="${id}"`);
                
                // Check for corresponding label
                if (id) {
                  const label = await page.$(`label[for="${id}"]`);
                  if (label) {
                    const labelText = await page.evaluate(el => el.textContent.trim(), label);
                    console.log(`  ✓ Connected label: "${labelText}"`);
                  }
                }
              }
            } catch (e) {
              console.log('  ✗ File input test failed:', e.message);
            }
          }
          
          // Test text inputs (looking for color hex inputs)
          if (styleElements.textInputs > 0) {
            console.log(`✅ Testing ${styleElements.textInputs} text input(s)...`);
            try {
              const textInputs = await page.$$('input[type="text"]');
              let colorInputCount = 0;
              
              for (let i = 0; i < textInputs.length; i++) {
                const placeholder = await page.evaluate(el => el.placeholder, textInputs[i]);
                const value = await page.evaluate(el => el.value, textInputs[i]);
                
                if ((placeholder && placeholder.includes('#')) || 
                    (value && value.match(/^#[0-9a-fA-F]{6}$/))) {
                  colorInputCount++;
                  console.log(`  Color text input ${colorInputCount}: placeholder="${placeholder}", value="${value}"`);
                  
                  // Test typing a hex color
                  try {
                    await page.evaluate(el => el.select(), textInputs[i]);
                    await textInputs[i].type('#123456');
                    console.log(`  ✓ Color text input ${colorInputCount} accepts input`);
                  } catch (e) {
                    console.log(`  ✗ Color text input ${colorInputCount} typing failed`);
                  }
                }
              }
              
              console.log(`  Found ${colorInputCount} color-related text inputs`);
            } catch (e) {
              console.log('  ✗ Text input test failed:', e.message);
            }
          }
          
          // Final screenshot
          await page.screenshot({ 
            path: `step4-detailed-test.png`,
            fullPage: true 
          });
          
          console.log('\n🎉 Step 4 form field tests completed!');
          return; // Exit after successful test
        }
        
      } catch (error) {
        console.log(`❌ Failed to load ${url}:`, error.message);
      }
    }
    
    console.log('\n⚠️ Could not find Step 4 Website Style Matcher form');
    console.log('This might indicate:');
    console.log('1. The form changes were not applied correctly');
    console.log('2. Step navigation is required');
    console.log('3. Authentication/session issues');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    try {
      const page = browser.pages()[0] || await browser.newPage();
      await page.screenshot({ 
        path: 'step4-direct-error.png',
        fullPage: true 
      });
    } catch (e) {
      console.log('Could not take error screenshot');
    }
  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }
}

testStep4Direct().catch(console.error);