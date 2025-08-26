#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function capturePage() {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    console.log('🔍 Navigating to http://localhost:5175/...');
    await page.goto('http://localhost:5175/', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Get page title
    const title = await page.title();
    console.log(`📄 Page Title: ${title}`);
    
    // Get main heading
    const mainHeading = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.textContent.trim() : 'No H1 found';
    });
    console.log(`🎯 Main Heading: ${mainHeading}`);
    
    // Get all visible text content
    const bodyText = await page.evaluate(() => {
      // Remove script and style elements
      const elementsToRemove = document.querySelectorAll('script, style');
      elementsToRemove.forEach(el => el.remove());
      
      return document.body.innerText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .slice(0, 20) // First 20 non-empty lines
        .join('\n');
    });
    
    console.log('\n📝 Page Content (first 20 lines):');
    console.log('=' * 50);
    console.log(bodyText);
    console.log('=' * 50);
    
    // Check for specific auth-related elements
    const authElements = await page.evaluate(() => {
      const elements = [];
      
      // Look for auth-related text
      const authKeywords = ['sign up', 'login', 'email', 'password', 'auth', 'campaign', 'demo'];
      
      authKeywords.forEach(keyword => {
        const found = document.body.innerText.toLowerCase().includes(keyword);
        if (found) {
          elements.push(`✅ Found: "${keyword}"`);
        }
      });
      
      // Look for form elements
      const forms = document.querySelectorAll('form');
      if (forms.length > 0) {
        elements.push(`📋 Found ${forms.length} form(s)`);
      }
      
      // Look for buttons
      const buttons = document.querySelectorAll('button');
      if (buttons.length > 0) {
        elements.push(`🔘 Found ${buttons.length} button(s)`);
      }
      
      // Look for input fields
      const inputs = document.querySelectorAll('input');
      if (inputs.length > 0) {
        elements.push(`📝 Found ${inputs.length} input field(s)`);
      }
      
      return elements;
    });
    
    console.log('\n🔍 Auth-related Elements Detected:');
    authElements.forEach(element => console.log(element));
    
    // Get current URL
    const currentUrl = await page.url();
    console.log(`\n🌐 Current URL: ${currentUrl}`);
    
    // Check for any errors in console
    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(msg.text()));
    
    if (consoleMessages.length > 0) {
      console.log('\n⚠️ Console Messages:');
      consoleMessages.forEach(msg => console.log(`  ${msg}`));
    }
    
    // Take a screenshot
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/scripts/page-capture.png',
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved to: scripts/page-capture.png');
    
  } catch (error) {
    console.error('❌ Error capturing page:', error.message);
  } finally {
    await browser.close();
  }
}

capturePage().catch(console.error);