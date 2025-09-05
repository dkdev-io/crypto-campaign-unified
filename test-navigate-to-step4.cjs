const puppeteer = require('puppeteer');

async function navigateToStep4() {
  console.log('🚀 Navigating specifically to Step 4...');
  
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
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('📋 Step 1: Filling Campaign Info...');
    
    // Fill Campaign Name
    try {
      await page.type('input[placeholder*="campaign name"], input[placeholder*="Campaign name"]', 'Test Campaign');
      console.log('✅ Campaign name filled');
    } catch (e) {
      console.log('⚠️ Could not fill campaign name');
    }
    
    // Fill First Name  
    try {
      await page.type('input[placeholder*="first name"], input[placeholder*="First name"]', 'John');
      console.log('✅ First name filled');
    } catch (e) {
      console.log('⚠️ Could not fill first name');
    }
    
    // Fill Last Name
    try {
      await page.type('input[placeholder*="last name"], input[placeholder*="Last name"]', 'Doe');
      console.log('✅ Last name filled');
    } catch (e) {
      console.log('⚠️ Could not fill last name');
    }
    
    // Fill Email
    try {
      await page.type('input[placeholder*="email"], input[placeholder*="Email"]', 'test@example.com');
      console.log('✅ Email filled');
    } catch (e) {
      console.log('⚠️ Could not fill email');
    }
    
    // Fill Phone
    try {
      await page.type('input[placeholder*="phone"], input[placeholder*="Phone"]', '555-1234');
      console.log('✅ Phone filled');
    } catch (e) {
      console.log('⚠️ Could not fill phone');
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Click Next for Step 1
    try {
      await page.click('button:contains("NEXT"), button:contains("Next")');
      console.log('✅ Clicked Next for Step 1');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (e) {
      console.log('⚠️ Could not click Next for Step 1');
    }
    
    console.log('📋 Step 2: Handling Committee Search...');
    
    // Fill minimal committee info to advance
    try {
      await page.type('input[placeholder*="committee name"]', 'Test Committee', { delay: 100 });
      await page.type('input[placeholder*="address"]', '123 Test St', { delay: 100 });
      await page.type('input[placeholder*="City"], input[placeholder*="city"]', 'Test City', { delay: 100 });
      await page.type('input[placeholder*="State"], input[placeholder*="state"]', 'CA', { delay: 100 });
      await page.type('input[placeholder*="ZIP"], input[placeholder*="zip"]', '90210', { delay: 100 });
      console.log('✅ Committee info filled');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Click continue for committee
      await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          const text = btn.textContent.toLowerCase();
          if (text.includes('save') && text.includes('continue')) {
            btn.click();
            return;
          }
        }
      });
      
      console.log('✅ Clicked Continue for Step 2');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (e) {
      console.log('⚠️ Could not complete Step 2:', e.message);
    }
    
    console.log('📋 Step 3: Handling Bank Connection...');
    
    // Skip bank connection
    try {
      await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          const text = btn.textContent.toLowerCase();
          if (text.includes('skip') || text.includes('next') || text.includes('continue')) {
            btn.click();
            return;
          }
        }
      });
      
      console.log('✅ Skipped Step 3 (Bank)');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (e) {
      console.log('⚠️ Could not complete Step 3:', e.message);
    }
    
    // Take screenshot of current step
    await page.screenshot({ 
      path: 'reached-step-4.png',
      fullPage: true 
    });
    
    console.log('📋 Current Page Analysis:');
    const pageAnalysis = await page.evaluate(() => {
      const h2 = document.querySelector('h2');
      const h3 = document.querySelector('h3');
      const stepIndicator = document.querySelector('.step-indicator, [class*="step"]');
      
      return {
        h2Text: h2 ? h2.textContent.trim() : '',
        h3Text: h3 ? h3.textContent.trim() : '',
        stepText: stepIndicator ? stepIndicator.textContent.substring(0, 100) : '',
        bodyText: document.body.textContent.toLowerCase(),
        currentUrl: window.location.href
      };
    });
    
    console.log(`URL: ${pageAnalysis.currentUrl}`);
    console.log(`H2: "${pageAnalysis.h2Text}"`);
    console.log(`H3: "${pageAnalysis.h3Text}"`);
    console.log(`Step: "${pageAnalysis.stepText}"`);
    
    const hasStyleContent = pageAnalysis.bodyText.includes('website') && 
                           (pageAnalysis.bodyText.includes('analyze') || 
                            pageAnalysis.bodyText.includes('style') ||
                            pageAnalysis.bodyText.includes('color') ||
                            pageAnalysis.bodyText.includes('font'));
    
    console.log(`Has style content: ${hasStyleContent}`);
    
    if (hasStyleContent) {
      console.log('🎯 REACHED WEBSITE STYLE STEP!');
      
      // Now test our form fields
      const formFields = await page.evaluate(() => {
        return {
          urlInputs: document.querySelectorAll('input[type="url"]').length,
          colorInputs: document.querySelectorAll('input[type="color"]').length,
          textInputs: document.querySelectorAll('input[type="text"]').length,
          selects: document.querySelectorAll('select').length,
          fileInputs: document.querySelectorAll('input[type="file"]').length,
          hasPrimaryColor: document.body.textContent.toLowerCase().includes('primary color'),
          hasSecondaryColor: document.body.textContent.toLowerCase().includes('secondary color'),
          hasFontFamily: document.body.textContent.toLowerCase().includes('font family'),
          hasLogoUpload: document.body.textContent.toLowerCase().includes('logo') || 
                         document.body.textContent.toLowerCase().includes('brand image')
        };
      });
      
      console.log('\n🎨 WEBSITE STYLE ANALYZER FIELDS:');
      console.log(`URL inputs: ${formFields.urlInputs}`);
      console.log(`Color pickers: ${formFields.colorInputs}`);
      console.log(`Text inputs: ${formFields.textInputs}`);
      console.log(`Select dropdowns: ${formFields.selects}`);
      console.log(`File inputs: ${formFields.fileInputs}`);
      console.log(`Has "Primary Color": ${formFields.hasPrimaryColor}`);
      console.log(`Has "Secondary Color": ${formFields.hasSecondaryColor}`);
      console.log(`Has "Font Family": ${formFields.hasFontFamily}`);
      console.log(`Has Logo/Brand upload: ${formFields.hasLogoUpload}`);
      
      // Test field interactions
      if (formFields.urlInputs > 0) {
        console.log('\n🔗 Testing URL input...');
        try {
          await page.type('input[type="url"]', 'https://example.com');
          console.log('✅ URL input works');
        } catch (e) {
          console.log('❌ URL input failed');
        }
      }
      
      if (formFields.colorInputs > 0) {
        console.log('\n🎨 Testing color inputs...');
        try {
          const colorInputs = await page.$$('input[type="color"]');
          for (let i = 0; i < colorInputs.length; i++) {
            const currentValue = await page.evaluate(el => el.value, colorInputs[i]);
            console.log(`Color input ${i + 1}: ${currentValue}`);
            
            await page.evaluate((el, color) => {
              el.value = color;
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }, colorInputs[i], i === 0 ? '#ff0000' : '#00ff00');
          }
          console.log('✅ Color inputs work');
        } catch (e) {
          console.log('❌ Color inputs failed:', e.message);
        }
      }
      
      if (formFields.selects > 0) {
        console.log('\n🔤 Testing font selection...');
        try {
          const options = await page.evaluate(() => {
            const select = document.querySelector('select');
            return select ? Array.from(select.options).map(opt => opt.text) : [];
          });
          console.log(`Font options: ${options.join(', ')}`);
          
          if (options.length > 1) {
            await page.select('select', options[1]);
            console.log(`✅ Selected font: ${options[1]}`);
          }
        } catch (e) {
          console.log('❌ Font selection failed:', e.message);
        }
      }
      
      if (formFields.fileInputs > 0) {
        console.log('\n📁 Testing file upload...');
        try {
          const fileInput = await page.$('input[type="file"]');
          const accept = await page.evaluate(el => el.accept, fileInput);
          const id = await page.evaluate(el => el.id, fileInput);
          console.log(`File input: accepts="${accept}", id="${id}"`);
          
          const label = await page.$(`label[for="${id}"]`);
          if (label) {
            const labelText = await page.evaluate(el => el.textContent.trim(), label);
            console.log(`✅ File upload connected to label: "${labelText.substring(0, 50)}..."`);
          }
        } catch (e) {
          console.log('❌ File upload test failed:', e.message);
        }
      }
      
      // Final verification screenshot
      await page.screenshot({ 
        path: 'website-style-analyzer-verified.png',
        fullPage: true 
      });
      
    } else {
      console.log('❌ Did not reach website style step');
    }
    
  } catch (error) {
    console.error('❌ Navigation failed:', error);
    
    try {
      await page.screenshot({ 
        path: 'navigation-error.png',
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

navigateToStep4().catch(console.error);