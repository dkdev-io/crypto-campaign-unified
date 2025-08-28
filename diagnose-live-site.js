#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function diagnoseLiveSite() {
  console.log('🔍 Diagnosing Live Netlify Site');
  console.log('🌐 URL: https://blue-token-campaigns.lovable.app');
  console.log('');

  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false, 
      slowMo: 100 
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    // First check the main page
    console.log('1️⃣ Checking main homepage...');
    await page.goto('https://blue-token-campaigns.lovable.app', { waitUntil: 'networkidle0', timeout: 15000 });
    
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);
    
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log(`📄 Page content preview: ${bodyText.substring(0, 300)}...`);
    
    // Take screenshot
    await page.screenshot({ path: 'live-site-homepage.png', fullPage: true });
    console.log('📸 Homepage screenshot saved: live-site-homepage.png');
    
    // Check for navigation links
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a')).map(link => ({
        text: link.innerText?.trim(),
        href: link.href
      })).filter(link => link.text && link.href);
    });
    
    console.log('\n🔗 Found navigation links:');
    links.slice(0, 10).forEach(link => {
      console.log(`   • ${link.text} → ${link.href}`);
    });
    
    // Check if donor-related links exist
    const donorLinks = links.filter(link => 
      link.href.includes('donor') || 
      link.text.toLowerCase().includes('donor') ||
      link.text.toLowerCase().includes('sign up') ||
      link.text.toLowerCase().includes('register')
    );
    
    if (donorLinks.length > 0) {
      console.log('\n🎯 Found donor-related links:');
      donorLinks.forEach(link => {
        console.log(`   • ${link.text} → ${link.href}`);
      });
    }
    
    // Try to access the donor registration URL directly
    console.log('\n2️⃣ Trying donor registration URL directly...');
    
    try {
      await page.goto('https://blue-token-campaigns.lovable.app/donors/auth/register', { 
        waitUntil: 'networkidle0', 
        timeout: 15000 
      });
      
      const regTitle = await page.title();
      console.log(`📄 Registration page title: ${regTitle}`);
      
      const regBodyText = await page.evaluate(() => document.body.innerText);
      console.log(`📄 Registration page content: ${regBodyText.substring(0, 500)}...`);
      
      // Check for forms
      const hasForm = await page.$('form') !== null;
      console.log(`📝 Form found: ${hasForm ? 'Yes' : 'No'}`);
      
      if (hasForm) {
        const formInputs = await page.evaluate(() => {
          const form = document.querySelector('form');
          return Array.from(form.querySelectorAll('input')).map(input => ({
            type: input.type,
            name: input.name,
            placeholder: input.placeholder,
            id: input.id
          }));
        });
        
        console.log('📋 Form inputs found:');
        formInputs.forEach(input => {
          console.log(`   • ${input.type}: ${input.name || input.id} (${input.placeholder})`);
        });
        
        const hasSubmitButton = await page.$('button[type="submit"], input[type="submit"]') !== null;
        console.log(`🔘 Submit button found: ${hasSubmitButton ? 'Yes' : 'No'}`);
      }
      
      // Take screenshot of registration page
      await page.screenshot({ path: 'live-site-registration.png', fullPage: true });
      console.log('📸 Registration page screenshot saved: live-site-registration.png');
      
    } catch (error) {
      console.log(`❌ Registration page error: ${error.message}`);
      
      // Check if it's a 404
      const currentURL = page.url();
      console.log(`🔗 Current URL: ${currentURL}`);
      
      const errorText = await page.evaluate(() => document.body.innerText);
      if (errorText.includes('404') || errorText.includes('Not Found')) {
        console.log('💡 The donor registration route might not exist on the live site');
      }
    }
    
    // Check what routes actually exist by looking at the site structure
    console.log('\n3️⃣ Checking site structure...');
    
    // Check if there's a different path for donors
    const possiblePaths = [
      '/donors',
      '/donor',
      '/register', 
      '/signup',
      '/auth/register',
      '/auth/signup',
      '/donor-signup',
      '/donor-register'
    ];
    
    for (const path of possiblePaths) {
      try {
        await page.goto(`https://blue-token-campaigns.lovable.app${path}`, { 
          waitUntil: 'networkidle0', 
          timeout: 5000 
        });
        
        const status = await page.evaluate(() => {
          const body = document.body.innerText;
          if (body.includes('404') || body.includes('Not Found')) {
            return '404';
          } else if (body.includes('registration') || body.includes('sign up') || body.includes('donor')) {
            return 'Found';
          } else {
            return 'Unknown';
          }
        });
        
        console.log(`   ${path}: ${status}`);
        
        if (status === 'Found') {
          console.log(`   🎯 Potential donor registration at: ${path}`);
          await page.screenshot({ path: `live-site${path.replace(/\//g, '-')}.png`, fullPage: true });
          console.log(`   📸 Screenshot saved: live-site${path.replace(/\//g, '-')}.png`);
        }
        
      } catch (e) {
        console.log(`   ${path}: Error (${e.message.substring(0, 50)}...)`);
      }
    }
    
  } catch (error) {
    console.error('💥 Diagnosis failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

diagnoseLiveSite().then(() => {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 DIAGNOSIS COMPLETE');
  console.log('');
  console.log('📸 Screenshots saved:');
  console.log('  - live-site-homepage.png');
  console.log('  - live-site-registration.png (if accessible)');
  console.log('  - Additional route screenshots if found');
  console.log('');
  console.log('📋 Next steps:');
  console.log('  1. Check the screenshots to see the actual live site');
  console.log('  2. Identify the correct donor registration path');
  console.log('  3. Update the Puppeteer test with correct URL');
  console.log('='.repeat(60));
}).catch(err => {
  console.error('💥 Fatal error:', err);
});