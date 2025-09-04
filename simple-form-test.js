/**
 * Simple Visual Form Testing
 * Direct navigation to test form improvements
 */

import puppeteer from 'puppeteer';
import fs from 'fs';

async function simpleFormTest() {
  console.log('🎭 Starting simple form testing...');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 500,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });

  const baseUrl = 'http://localhost:5174';
  const screenshots = [];

  try {
    console.log('📱 Testing main landing page...');
    await page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 15000 });
    
    await page.screenshot({ 
      path: 'landing-page.png',
      fullPage: true 
    });
    screenshots.push('landing-page.png');
    console.log('📸 Screenshot: Landing page');

    console.log('🏢 Testing campaign setup direct access...');
    // Try direct access to setup
    await page.goto(`${baseUrl}/campaigns/auth/setup`, { waitUntil: 'networkidle0', timeout: 15000 });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: 'campaign-setup-direct.png',
      fullPage: true 
    });
    screenshots.push('campaign-setup-direct.png');
    console.log('📸 Screenshot: Campaign setup page');

    console.log('💰 Testing donor auth page...');
    await page.goto(`${baseUrl}/donors/auth`, { waitUntil: 'networkidle0', timeout: 15000 });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: 'donor-auth-page.png',
      fullPage: true 
    });
    screenshots.push('donor-auth-page.png');
    console.log('📸 Screenshot: Donor auth page');

    console.log('🔑 Testing campaign auth with bypass...');
    await page.goto(`${baseUrl}/campaigns/auth?devbypass=true`, { waitUntil: 'networkidle0', timeout: 15000 });
    await page.waitForTimeout(3000);
    
    await page.screenshot({ 
      path: 'campaign-auth-bypass.png',
      fullPage: true 
    });
    screenshots.push('campaign-auth-bypass.png');
    console.log('📸 Screenshot: Campaign auth with bypass');

    // Analyze current page for forms
    console.log('🔍 Analyzing forms on current page...');
    const formAnalysis = await page.evaluate(() => {
      const analysis = {
        pageTitle: document.title,
        url: window.location.href,
        headers: [],
        inputs: [],
        buttons: [],
        errors: []
      };

      try {
        // Analyze headers
        document.querySelectorAll('h1, h2, h3').forEach((header, index) => {
          const styles = window.getComputedStyle(header);
          analysis.headers.push({
            tag: header.tagName.toLowerCase(),
            text: header.textContent.trim().substring(0, 50),
            fontSize: styles.fontSize,
            fontWeight: styles.fontWeight,
            fontFamily: styles.fontFamily.substring(0, 30),
            color: styles.color
          });
        });

        // Analyze inputs
        document.querySelectorAll('input').forEach((input, index) => {
          const styles = window.getComputedStyle(input);
          analysis.inputs.push({
            type: input.type,
            placeholder: (input.placeholder || '').substring(0, 30),
            fontSize: styles.fontSize,
            fontFamily: styles.fontFamily.substring(0, 20),
            padding: styles.padding,
            backgroundColor: styles.backgroundColor,
            color: styles.color,
            border: styles.border.substring(0, 50)
          });
        });

        // Analyze buttons
        document.querySelectorAll('button').forEach((button, index) => {
          const styles = window.getComputedStyle(button);
          analysis.buttons.push({
            text: button.textContent.trim().substring(0, 20),
            fontSize: styles.fontSize,
            fontFamily: styles.fontFamily.substring(0, 20),
            fontWeight: styles.fontWeight,
            padding: styles.padding,
            backgroundColor: styles.backgroundColor,
            color: styles.color
          });
        });

      } catch (error) {
        analysis.errors.push(error.message);
      }

      return analysis;
    });

    // Save analysis
    fs.writeFileSync('simple-form-analysis.json', JSON.stringify(formAnalysis, null, 2));
    console.log('💾 Form analysis saved');

    console.log('🎯 Testing specific form pages...');
    
    // Try to navigate to different parts if possible
    const testUrls = [
      '/campaigns/auth/setup',
      '/donors/auth?devbypass=true',
      '/',
    ];

    for (let url of testUrls) {
      try {
        console.log(`🌐 Testing ${url}...`);
        await page.goto(baseUrl + url, { waitUntil: 'networkidle0', timeout: 10000 });
        await page.waitForTimeout(1000);
        
        const filename = `test-${url.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
        await page.screenshot({ 
          path: filename,
          fullPage: true 
        });
        screenshots.push(filename);
        console.log(`📸 Screenshot: ${filename}`);
        
      } catch (err) {
        console.log(`⚠️ Could not test ${url}:`, err.message);
      }
    }

  } catch (error) {
    console.error('❌ Test error:', error);
    
    // Screenshot on error
    await page.screenshot({ 
      path: 'simple-test-error.png',
      fullPage: true 
    });
    screenshots.push('simple-test-error.png');
  } finally {
    await browser.close();
  }

  // Generate test report
  const report = {
    timestamp: new Date().toISOString(),
    testType: 'simple-form-test',
    screenshotsTaken: screenshots.length,
    screenshots: screenshots,
    status: 'completed'
  };

  fs.writeFileSync('simple-test-report.json', JSON.stringify(report, null, 2));
  
  console.log('\n✅ Simple form testing completed!');
  console.log(`📸 Screenshots taken: ${screenshots.length}`);
  console.log('📋 Files generated:');
  screenshots.forEach(screenshot => console.log(`   - ${screenshot}`));
  console.log('   - simple-form-analysis.json');
  console.log('   - simple-test-report.json');
  console.log('\nCheck the screenshots to verify form styling improvements.');
}

// Run the test
simpleFormTest().catch(console.error);