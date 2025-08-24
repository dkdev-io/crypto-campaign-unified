#!/usr/bin/env node

/**
 * Post-Click Inspector
 * Investigates what happens after donate button click
 */

const puppeteer = require('puppeteer');

async function inspectPostClick() {
  console.log('🕵️  Post-Click Inspector - What happens after donate button click?');
  
  const browser = await puppeteer.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();
  
  try {
    console.log('📍 Step 1: Navigate to site');
    await page.goto('https://testy-pink-chancellor.lovable.app', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const initialUrl = page.url();
    console.log(`🌐 Initial URL: ${initialUrl}`);
    
    console.log('📍 Step 2: Take before screenshot');
    await page.screenshot({ path: 'before-donate-click.png' });
    
    console.log('📍 Step 3: Click donate button and monitor changes');
    
    // Set up navigation listener
    let navigationHappened = false;
    let newUrl = null;
    
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        navigationHappened = true;
        newUrl = frame.url();
        console.log(`🔄 Navigation detected: ${newUrl}`);
      }
    });
    
    // Click donate button
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      const donateBtn = buttons.find(btn => 
        btn.textContent.toLowerCase().includes('donate')
      );
      if (donateBtn) {
        console.log('Clicking donate button:', donateBtn.textContent);
        donateBtn.click();
        return true;
      }
      return false;
    });
    
    if (!clicked) {
      console.log('❌ No donate button found');
      return;
    }
    
    console.log('✅ Donate button clicked, monitoring for 10 seconds...');
    
    // Wait and observe changes
    for (let i = 1; i <= 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const currentUrl = page.url();
      
      // Check for URL change
      if (currentUrl !== initialUrl && !navigationHappened) {
        navigationHappened = true;
        newUrl = currentUrl;
        console.log(`🔄 URL changed to: ${newUrl}`);
      }
      
      // Check for page elements
      const pageState = await page.evaluate(() => {
        return {
          modals: document.querySelectorAll('[role="dialog"], .modal, .Modal').length,
          forms: document.querySelectorAll('form').length,
          inputs: document.querySelectorAll('input').length,
          title: document.title,
          bodyClass: document.body.className,
          hasOverlay: document.querySelector('[class*="overlay"], [class*="backdrop"]') !== null
        };
      });
      
      console.log(`Second ${i}: URL=${currentUrl === initialUrl ? 'unchanged' : 'CHANGED'}, Modals=${pageState.modals}, Forms=${pageState.forms}, Inputs=${pageState.inputs}`);
      
      if (i === 5) {
        await page.screenshot({ path: 'during-donate-click.png' });
      }
    }
    
    console.log('📍 Step 4: Final analysis');
    await page.screenshot({ path: 'after-donate-click.png' });
    
    const finalUrl = page.url();
    const finalState = await page.evaluate(() => {
      const modals = Array.from(document.querySelectorAll('[role="dialog"], .modal, .Modal, [data-modal]'));
      const forms = Array.from(document.querySelectorAll('form'));
      const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
      
      return {
        url: window.location.href,
        title: document.title,
        modalCount: modals.length,
        modalInfo: modals.map(m => ({
          visible: m.offsetParent !== null,
          display: getComputedStyle(m).display,
          className: m.className,
          innerHTML: m.innerHTML.substring(0, 200)
        })),
        formCount: forms.length,
        inputCount: inputs.length,
        inputInfo: inputs.slice(0, 5).map(i => ({
          type: i.type,
          name: i.name,
          visible: i.offsetParent !== null,
          placeholder: i.placeholder
        })),
        bodyHTML: document.body.innerHTML.substring(0, 1000)
      };
    });
    
    console.log('\n📊 FINAL ANALYSIS');
    console.log('='.repeat(50));
    console.log(`Initial URL: ${initialUrl}`);
    console.log(`Final URL: ${finalUrl}`);
    console.log(`Navigation occurred: ${navigationHappened ? 'YES' : 'NO'}`);
    console.log(`Page title: ${finalState.title}`);
    console.log(`Modals found: ${finalState.modalCount}`);
    console.log(`Forms found: ${finalState.formCount}`);
    console.log(`Inputs found: ${finalState.inputCount}`);
    
    if (finalState.modalCount > 0) {
      console.log('\n🎭 MODAL DETAILS:');
      finalState.modalInfo.forEach((modal, i) => {
        console.log(`Modal ${i + 1}:`, JSON.stringify(modal, null, 2));
      });
    }
    
    if (finalState.inputCount > 0) {
      console.log('\n📝 INPUT DETAILS:');
      finalState.inputInfo.forEach((input, i) => {
        console.log(`Input ${i + 1}:`, JSON.stringify(input, null, 2));
      });
    }
    
    console.log('\n📸 Screenshots saved:');
    console.log('- before-donate-click.png');
    console.log('- during-donate-click.png');
    console.log('- after-donate-click.png');
    
    // Conclusion
    if (navigationHappened) {
      console.log('\n🎯 CONCLUSION: Donate button triggers navigation to new page');
      console.log('✅ SOLUTION: Update testing strategy to handle page navigation instead of modal');
    } else if (finalState.formCount > 0 || finalState.inputCount > 0) {
      console.log('\n🎯 CONCLUSION: Forms/inputs exist but modal detection failed');
      console.log('✅ SOLUTION: Update modal selectors or remove modal detection requirement');
    } else {
      console.log('\n🎯 CONCLUSION: No forms found after button click');
      console.log('❌ ISSUE: Button may not be working or site may have issues');
    }
    
  } finally {
    await browser.close();
  }
}

inspectPostClick().catch(console.error);