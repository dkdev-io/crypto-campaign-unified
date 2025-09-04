// Final verification of committee form on port 5173
import puppeteer from 'puppeteer';

async function finalVerification() {
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 500
  });

  try {
    const page = await browser.newPage();
    
    console.log('🌐 Opening http://localhost:5173/campaigns/auth/setup');
    await page.goto('http://localhost:5173/campaigns/auth/setup');
    await page.waitForTimeout(2000);
    
    // Check if login is required
    const bypassButton = await page.$('button');
    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map(btn => btn.textContent);
    });
    console.log('🔘 Buttons found:', buttons);
    
    // Look for DEV BYPASS button
    const devBypassFound = buttons.some(text => text.includes('DEV BYPASS') || text.includes('Setup'));
    if (devBypassFound) {
      console.log('🔑 Found DEV BYPASS - clicking...');
      await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (let btn of buttons) {
          if (btn.textContent.includes('DEV BYPASS') || btn.textContent.includes('Setup')) {
            btn.click();
            break;
          }
        }
      });
      await page.waitForTimeout(3000);
    }
    
    // Now check for committee form
    const allInputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input')).map(input => input.placeholder || input.type);
    });
    console.log('📝 Inputs found:', allInputs);
    
    // Look for manual committee entry form
    const committeeNameInput = await page.$('input[placeholder="Enter your committee name"]');
    
    if (committeeNameInput) {
      console.log('✅ COMMITTEE FORM FOUND - Testing submission...');
      
      // Fill the form
      await committeeNameInput.type('Final Test Committee');
      
      const addressInput = await page.$('input[placeholder="Committee address"]');
      await addressInput.type('789 Final Test Ave');
      
      const cityInput = await page.$('input[placeholder="City"]');
      await cityInput.type('TestTown');
      
      const stateInput = await page.$('input[placeholder="State"]');
      await stateInput.type('CA');
      
      const zipInput = await page.$('input[placeholder="ZIP"]');
      await zipInput.type('90210');
      
      console.log('📝 Form filled out');
      
      // Take screenshot before submit
      await page.screenshot({ path: 'form-filled-5173.png' });
      
      // Find and click submit button
      const submitButton = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (let btn of buttons) {
          if (btn.textContent.includes('Save Committee') || btn.textContent.includes('Continue')) {
            return btn;
          }
        }
        return null;
      });
      
      if (submitButton) {
        console.log('🖱️ Clicking submit...');
        await page.evaluate(() => {
          const buttons = document.querySelectorAll('button');
          for (let btn of buttons) {
            if (btn.textContent.includes('Save Committee') || btn.textContent.includes('Continue')) {
              btn.click();
              break;
            }
          }
        });
        
        await page.waitForTimeout(3000);
        
        // Check final state
        const finalUrl = await page.url();
        await page.screenshot({ path: 'after-submit-5173.png' });
        
        console.log('📍 Final URL:', finalUrl);
        console.log('✅ VERIFICATION COMPLETE - Check screenshots and browser');
        
      } else {
        console.log('❌ Submit button not found');
      }
      
    } else {
      console.log('❌ Committee form not found');
      const pageContent = await page.evaluate(() => document.body.innerText);
      console.log('📄 Page content preview:', pageContent.substring(0, 500));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('🔍 Browser left open for manual inspection');
}

finalVerification();