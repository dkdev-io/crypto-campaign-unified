#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testNetlifyActual() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', error => console.error('ERROR:', error.message));
  
  console.log('🔍 Testing actual Netlify site...');
  
  try {
    // Test if the main site loads
    console.log('1. Testing main site...');
    await page.goto('https://cryptocampaign.netlify.app', { timeout: 10000 });
    console.log('✅ Main site loads');
    
    // Test campaigns/auth
    console.log('2. Testing campaigns/auth...');
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth', { timeout: 10000 });
    
    const hasForm = await page.$('input[name="email"]') !== null;
    console.log('Auth form exists:', hasForm);
    
    if (!hasForm) {
      const bodyText = await page.$eval('body', el => el.textContent);
      console.log('Page content:', bodyText.substring(0, 200));
    }
    
    // Test testy campaign page
    console.log('3. Testing testy campaign page...');
    await page.goto('https://cryptocampaign.netlify.app/testy', { timeout: 10000 });
    
    const testyExists = await page.$('h1') !== null;
    console.log('Testy page loads:', testyExists);
    
    if (!testyExists) {
      console.log('❌ Testy page shows 404 or error');
    }
    
  } catch (error) {
    console.error('❌ Netlify test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testNetlifyActual();