#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function complete7Steps() {
  const browser = await puppeteer.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();
  
  console.log('🚀 Starting 7-step campaign setup...');
  
  try {
    // Login first
    await page.goto('http://localhost:5173/campaigns/auth');
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', 'test@dkdev.io');
    await page.type('input[name="password"]', 'TestDonor123!');
    await page.click('button[type="submit"]');
    
    // Wait for setup page
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('✅ Logged in, now at:', page.url());
    
    // Complete all steps automatically by clicking through
    for (let step = 1; step <= 7; step++) {
      console.log(`📝 Completing Step ${step}...`);
      
      // Fill basic required fields if present
      const inputs = await page.$$('input[required]');
      for (const input of inputs) {
        const type = await input.evaluate(el => el.type);
        const name = await input.evaluate(el => el.name);
        
        if (type === 'text' || type === 'email') {
          await input.type(`test-${name}-value`);
        } else if (type === 'url') {
          await input.type('https://example.com');
        }
      }
      
      // Check checkboxes if required
      const checkboxes = await page.$$('input[type="checkbox"][required]');
      for (const checkbox of checkboxes) {
        await checkbox.click();
      }
      
      // Click Next/Continue/Submit button
      const buttons = await page.$$('button');
      let clicked = false;
      
      for (const button of buttons) {
        const text = await button.evaluate(el => el.textContent?.toLowerCase() || '');
        if (text.includes('next') || text.includes('continue') || text.includes('submit') || text.includes('finish')) {
          await button.click();
          clicked = true;
          break;
        }
      }
      
      if (!clicked) {
        console.log(`⚠️ No next button found for step ${step}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Look for final results
    console.log('\n🔍 Looking for embed code and campaign link...');
    
    const embedCode = await page.$eval('textarea', el => el.value).catch(() => null);
    const campaignLink = await page.$eval('a[href*="campaign"]', el => el.href).catch(() => null);
    
    console.log('\n📋 EMBED CODE:');
    console.log(embedCode || 'Not found');
    
    console.log('\n🔗 CAMPAIGN LINK:');
    console.log(campaignLink || 'Not found');
    
    return { embedCode, campaignLink };
    
  } finally {
    await browser.close();
  }
}

complete7Steps();