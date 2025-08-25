#!/usr/bin/env node

/**
 * Post-Click Inspector
 * Investigates what happens after donate button click
 */

const puppeteer = require('puppeteer');

async function inspectPostClick() {
  
  const browser = await puppeteer.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://testy-pink-chancellor.lovable.app', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const initialUrl = page.url();
    
    await page.screenshot({ path: 'before-donate-click.png' });
    
    
    // Set up navigation listener
    let navigationHappened = false;
    let newUrl = null;
    
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        navigationHappened = true;
        newUrl = frame.url();
      }
    });
    
    // Click donate button
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      const donateBtn = buttons.find(btn => 
        btn.textContent.toLowerCase().includes('donate')
      );
      if (donateBtn) {
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
      
      
      if (i === 5) {
        await page.screenshot({ path: 'during-donate-click.png' });
      }
    }
    
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
    
    
    if (finalState.modalCount > 0) {
      finalState.modalInfo.forEach((modal, i) => {
      });
    }
    
    if (finalState.inputCount > 0) {
      finalState.inputInfo.forEach((input, i) => {
      });
    }
    
    
    // Conclusion
    if (navigationHappened) {
      console.log('✅ SOLUTION: Update testing strategy to handle page navigation instead of modal');
    } else if (finalState.formCount > 0 || finalState.inputCount > 0) {
      console.log('✅ SOLUTION: Update modal selectors or remove modal detection requirement');
    } else {
      console.log('❌ ISSUE: Button may not be working or site may have issues');
    }
    
  } finally {
    await browser.close();
  }
}

inspectPostClick().catch(console.error);