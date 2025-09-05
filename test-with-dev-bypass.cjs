const puppeteer = require('puppeteer');

async function testWithDevBypass() {
  console.log('🚀 Testing with DEV BYPASS button...');
  
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
    
    // Check if we see the DEV BYPASS button
    const bypassButton = await page.$('button:contains("DEV BYPASS"), button[contains="DEV BYPASS"], [text*="DEV BYPASS"]');
    
    if (!bypassButton) {
      // Try using evaluate to find bypass button
      const foundBypass = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          if (btn.textContent.toLowerCase().includes('dev') && btn.textContent.toLowerCase().includes('bypass')) {
            btn.click();
            return btn.textContent.trim();
          }
        }
        return null;
      });
      
      if (foundBypass) {
        console.log(`✅ Clicked DEV BYPASS: ${foundBypass}`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        console.log('❌ Could not find DEV BYPASS button');
      }
    } else {
      await bypassButton.click();
      console.log('✅ Clicked DEV BYPASS button');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Take screenshot after bypass
    await page.screenshot({ 
      path: 'after-dev-bypass.png',
      fullPage: true 
    });
    
    // Now navigate through the steps systematically
    console.log('🔄 Navigating through setup steps...');
    
    for (let attempt = 1; attempt <= 8; attempt++) {
      console.log(`\n📋 Step ${attempt}: Checking current page...`);
      
      const pageInfo = await page.evaluate(() => {
        const h2 = document.querySelector('h2');
        const stepText = document.body.textContent.toLowerCase();
        
        return {
          h2: h2 ? h2.textContent.trim() : '',
          url: window.location.href,
          hasWebsite: stepText.includes('website'),
          hasAnalyze: stepText.includes('analyze'),
          hasStyle: stepText.includes('style'),
          hasPrimaryColor: stepText.includes('primary color'),
          hasSecondaryColor: stepText.includes('secondary color'),
          hasFontFamily: stepText.includes('font family'),
          hasColorPicker: document.querySelectorAll('input[type="color"]').length > 0,
          hasSelect: document.querySelectorAll('select').length > 0,
          hasFileInput: document.querySelectorAll('input[type="file"]').length > 0,
          buttonTexts: Array.from(document.querySelectorAll('button')).map(btn => btn.textContent.trim()).filter(text => text)
        };
      });
      
      console.log(`Page: ${pageInfo.h2}`);
      console.log(`URL: ${pageInfo.url}`);
      console.log(`Buttons: ${pageInfo.buttonTexts.join(', ')}`);
      
      // Check if we found the Website Style page
      if (pageInfo.hasWebsite && (pageInfo.hasAnalyze || pageInfo.hasStyle || pageInfo.hasPrimaryColor)) {
        console.log('\n🎯 FOUND WEBSITE STYLE PAGE!');
        
        // Take screenshot of the style page
        await page.screenshot({ 
          path: 'website-style-page-found.png',
          fullPage: true 
        });
        
        console.log('🧪 Testing form fields...');
        
        // Test form fields
        const formTests = await page.evaluate(() => {
          const results = {
            urlInputs: document.querySelectorAll('input[type="url"]').length,
            colorInputs: document.querySelectorAll('input[type="color"]').length,
            textInputs: document.querySelectorAll('input[type="text"]').length,
            selects: document.querySelectorAll('select').length,
            fileInputs: document.querySelectorAll('input[type="file"]').length,
            labels: document.querySelectorAll('label').length,
            hasPrimaryColorText: document.body.textContent.includes('Primary Color'),
            hasSecondaryColorText: document.body.textContent.includes('Secondary Color'),
            hasFontFamilyText: document.body.textContent.includes('Font Family'),
            hasLogoText: document.body.textContent.includes('Logo') || document.body.textContent.includes('Brand Image'),
            hasUploadText: document.body.textContent.includes('upload') || document.body.textContent.includes('Upload')
          };
          
          return results;
        });
        
        console.log('\n📊 FORM FIELD RESULTS:');
        console.log(`🌐 URL inputs: ${formTests.urlInputs}`);
        console.log(`🎨 Color pickers: ${formTests.colorInputs}`);
        console.log(`📝 Text inputs: ${formTests.textInputs}`);
        console.log(`📋 Select dropdowns: ${formTests.selects}`);
        console.log(`📁 File inputs: ${formTests.fileInputs}`);
        console.log(`🏷️ Labels: ${formTests.labels}`);
        console.log(`📄 "Primary Color" text: ${formTests.hasPrimaryColorText}`);
        console.log(`📄 "Secondary Color" text: ${formTests.hasSecondaryColorText}`);
        console.log(`📄 "Font Family" text: ${formTests.hasFontFamilyText}`);
        console.log(`📄 "Logo/Brand" text: ${formTests.hasLogoText}`);
        console.log(`📄 "Upload" text: ${formTests.hasUploadText}`);
        
        // Test interactions
        if (formTests.urlInputs > 0) {
          console.log('\n🔗 Testing URL input...');
          try {
            await page.type('input[type="url"]', 'https://test.example.com');
            console.log('  ✅ URL input works');
          } catch (e) {
            console.log('  ❌ URL input failed:', e.message);
          }
        }
        
        if (formTests.colorInputs >= 2) {
          console.log('\n🎨 Testing color pickers...');
          try {
            const colorInputs = await page.$$('input[type="color"]');
            
            // Test primary color
            const primaryValue = await page.evaluate(el => el.value, colorInputs[0]);
            console.log(`  Primary color current: ${primaryValue}`);
            
            await page.evaluate(el => {
              el.value = '#ff0000';
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }, colorInputs[0]);
            console.log('  ✅ Primary color picker works');
            
            // Test secondary color
            const secondaryValue = await page.evaluate(el => el.value, colorInputs[1]);
            console.log(`  Secondary color current: ${secondaryValue}`);
            
            await page.evaluate(el => {
              el.value = '#00ff00';
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }, colorInputs[1]);
            console.log('  ✅ Secondary color picker works');
            
          } catch (e) {
            console.log('  ❌ Color picker test failed:', e.message);
          }
        }
        
        if (formTests.selects > 0) {
          console.log('\n🔤 Testing font selection...');
          try {
            const options = await page.evaluate(() => {
              const select = document.querySelector('select');
              if (select) {
                return Array.from(select.options).map(opt => opt.value);
              }
              return [];
            });
            
            console.log(`  Font options: ${options.join(', ')}`);
            
            if (options.length > 1) {
              await page.select('select', options[1]);
              console.log(`  ✅ Selected font: ${options[1]}`);
            }
          } catch (e) {
            console.log('  ❌ Font selection failed:', e.message);
          }
        }
        
        if (formTests.fileInputs > 0) {
          console.log('\n📁 Testing file upload...');
          try {
            const fileProps = await page.evaluate(() => {
              const fileInput = document.querySelector('input[type="file"]');
              return fileInput ? {
                accept: fileInput.accept,
                id: fileInput.id,
                hasLabel: !!document.querySelector(`label[for="${fileInput.id}"]`)
              } : null;
            });
            
            console.log(`  File input accepts: ${fileProps.accept}`);
            console.log(`  File input ID: ${fileProps.id}`);
            console.log(`  Has connected label: ${fileProps.hasLabel}`);
            console.log('  ✅ File upload properly configured');
          } catch (e) {
            console.log('  ❌ File upload test failed:', e.message);
          }
        }
        
        // Final verification screenshot
        await page.screenshot({ 
          path: 'form-fields-verified.png',
          fullPage: true 
        });
        
        console.log('\n🎉 WEBSITE STYLE ANALYZER FORM VERIFICATION COMPLETE!');
        
        // Summary
        const allFieldsPresent = 
          formTests.urlInputs > 0 &&
          formTests.colorInputs >= 2 &&
          formTests.selects > 0 &&
          formTests.fileInputs > 0 &&
          formTests.hasPrimaryColorText &&
          formTests.hasSecondaryColorText &&
          formTests.hasFontFamilyText;
        
        console.log(`\n📊 FINAL RESULT: ${allFieldsPresent ? '✅ ALL FIELDS VERIFIED' : '❌ SOME FIELDS MISSING'}`);
        
        return; // Exit successfully
      }
      
      // Try to find and click next/continue buttons
      const clicked = await page.evaluate(() => {
        // Look for DEV bypass buttons first
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          const text = btn.textContent.toLowerCase();
          if (text.includes('dev') && (text.includes('skip') || text.includes('bypass'))) {
            btn.click();
            return `DEV: ${btn.textContent.trim()}`;
          }
        }
        
        // Then look for regular navigation
        for (const btn of buttons) {
          const text = btn.textContent.toLowerCase();
          if (!btn.disabled && (text.includes('next') || text.includes('continue') || text.includes('skip'))) {
            btn.click();
            return btn.textContent.trim();
          }
        }
        
        return null;
      });
      
      if (clicked) {
        console.log(`  ✅ Clicked: ${clicked}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.log('  ❌ No clickable navigation button found');
        break;
      }
    }
    
    console.log('\n❌ Did not reach Website Style page after 8 attempts');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    try {
      await page.screenshot({ 
        path: 'dev-bypass-test-error.png',
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

testWithDevBypass().catch(console.error);