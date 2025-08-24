#!/usr/bin/env node

/**
 * Quick Modal Debug - Direct approach to find the modal form issue
 */

const puppeteer = require('puppeteer');

async function quickDebug() {
  console.log('🚀 Quick Modal Debug - Finding the real issue');
  
  const browser = await puppeteer.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();
  
  try {
    console.log('📍 Step 1: Load site');
    await page.goto('https://testy-pink-chancellor.lovable.app');
    await page.waitForTimeout(2000);
    
    console.log('📍 Step 2: Find and click donate button');
    const donateButton = await page.$('button:contains("Donate")') || 
                         await page.$('button[class*="donate"]') || 
                         await page.$eval('button', el => el.textContent.includes('Donate') ? el : null);
    
    if (!donateButton) {
      // Alternative approach
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button'))
          .find(b => b.textContent.includes('Donate'));
        if (btn) btn.click();
        return !!btn;
      });
      console.log('✅ Donate button clicked via evaluate');
    } else {
      await donateButton.click();
      console.log('✅ Donate button clicked directly');
    }
    
    console.log('📍 Step 3: Wait and inspect modal');
    await page.waitForTimeout(5000);
    
    const analysis = await page.evaluate(() => {
      // Look for any modals or dialogs
      const modals = document.querySelectorAll('[role="dialog"], .modal, [data-modal], .dialog');
      const forms = document.querySelectorAll('form');
      const inputs = document.querySelectorAll('input, select, textarea');
      
      return {
        modalCount: modals.length,
        formCount: forms.length,
        inputCount: inputs.length,
        modalInfo: Array.from(modals).map(m => ({
          visible: m.offsetParent !== null,
          display: getComputedStyle(m).display,
          innerHTML: m.innerHTML.substring(0, 200)
        })),
        inputInfo: Array.from(inputs).map(i => ({
          type: i.type,
          name: i.name,
          visible: i.offsetParent !== null,
          display: getComputedStyle(i).display
        }))
      };
    });
    
    console.log('📋 Modal Analysis:', JSON.stringify(analysis, null, 2));
    
    // Try different selectors
    const selectorTests = [
      'input',
      'form input',
      '[role="dialog"] input',
      'input[type="text"]',
      'input[type="email"]'
    ];
    
    console.log('📍 Step 4: Test selectors');
    for (const selector of selectorTests) {
      const count = await page.$$eval(selector, els => els.length).catch(() => 0);
      if (count > 0) {
        console.log(`✅ ${selector}: ${count} found`);
      }
    }
    
    await page.screenshot({ path: 'quick-debug-modal.png' });
    console.log('📸 Screenshot saved: quick-debug-modal.png');
    
  } finally {
    await browser.close();
  }
}

quickDebug().catch(console.error);