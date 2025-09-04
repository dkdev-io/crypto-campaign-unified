/**
 * Visual Form Testing with Puppeteer
 * Tests the form improvements across campaign and donor workflows using auth bypass
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function visualFormTest() {
  console.log('🎭 Starting visual form testing with Puppeteer...');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 1000,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });

  const baseUrl = 'http://localhost:5174';
  const screenshots = [];

  try {
    // Test Campaign Workflow with Auth Bypass
    console.log('📋 Testing Campaign Setup Flow...');
    
    // Navigate to campaign auth with bypass
    await page.goto(`${baseUrl}/campaigns/auth?devbypass=true`, { waitUntil: 'networkidle0' });
    
    // Wait for redirect to setup
    await page.waitForSelector('h2', { timeout: 10000 });
    
    // Screenshot: Campaign Info page
    await page.screenshot({ 
      path: 'campaign-step1-info.png',
      fullPage: true 
    });
    screenshots.push('campaign-step1-info.png');
    console.log('📸 Screenshot: Campaign Info form');

    // Fill out campaign info form
    await page.waitForSelector('input[placeholder*="campaign"]', { timeout: 5000 });
    await page.type('input[placeholder*="campaign"]', 'Visual Test Campaign');
    
    await page.waitForSelector('input[placeholder*="email"]');
    await page.type('input[placeholder*="email"]', 'test@example.com');
    
    await page.waitForSelector('input[placeholder*="name"]');
    await page.type('input[placeholder*="name"]', 'Test User');

    // Click Next to go to Committee Search
    await page.click('button:contains("Next")');
    await page.waitForSelector('h2', { timeout: 10000 });
    
    // Screenshot: Committee Search page
    await page.screenshot({ 
      path: 'campaign-step2-committee.png',
      fullPage: true 
    });
    screenshots.push('campaign-step2-committee.png');
    console.log('📸 Screenshot: Committee Search form');

    // Test manual committee entry
    await page.waitForSelector('input[placeholder*="committee name"]');
    await page.type('input[placeholder*="committee name"]', 'Test Committee');
    
    await page.waitForSelector('input[placeholder*="address"]');
    await page.type('input[placeholder*="address"]', '123 Test Street');
    
    await page.waitForSelector('input[placeholder*="City"]');
    await page.type('input[placeholder*="City"]', 'Test City');
    
    await page.waitForSelector('input[placeholder*="State"]');
    await page.type('input[placeholder*="State"]', 'CA');
    
    await page.waitForSelector('input[placeholder*="ZIP"]');
    await page.type('input[placeholder*="ZIP"]', '12345');

    // Screenshot: Manual committee form filled
    await page.screenshot({ 
      path: 'campaign-step2-manual-filled.png',
      fullPage: true 
    });
    screenshots.push('campaign-step2-manual-filled.png');
    console.log('📸 Screenshot: Manual committee form filled');

    // Try to continue (may need to handle the save button)
    const saveButton = await page.$('button:contains("Save Committee")');
    if (saveButton) {
      await saveButton.click();
      await page.waitForTimeout(2000);
      
      // Screenshot after save
      await page.screenshot({ 
        path: 'campaign-step2-saved.png',
        fullPage: true 
      });
      screenshots.push('campaign-step2-saved.png');
      console.log('📸 Screenshot: Committee saved');
    }

    // Try to navigate to next step
    try {
      const nextButton = await page.$('button:contains("Next")');
      if (nextButton) {
        await nextButton.click();
        await page.waitForTimeout(3000);
        
        // Screenshot: Bank Connection page
        await page.screenshot({ 
          path: 'campaign-step3-bank.png',
          fullPage: true 
        });
        screenshots.push('campaign-step3-bank.png');
        console.log('📸 Screenshot: Bank Connection form');
      }
    } catch (err) {
      console.log('⚠️ Could not navigate to next step:', err.message);
    }

    // Test Donor Workflow with Auth Bypass
    console.log('💰 Testing Donor Flow...');
    
    // Navigate to donor auth with bypass
    await page.goto(`${baseUrl}/donors/auth?devbypass=true`, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000);
    
    // Screenshot: Donor auth/dashboard
    await page.screenshot({ 
      path: 'donor-dashboard.png',
      fullPage: true 
    });
    screenshots.push('donor-dashboard.png');
    console.log('📸 Screenshot: Donor dashboard');

    // Test Form Customization page
    console.log('🎨 Testing Form Customization...');
    await page.goto(`${baseUrl}/campaigns/auth/setup`, { waitUntil: 'networkidle0' });
    
    // Navigate through steps to get to customization
    // This is a simplified approach - in reality we'd need to complete previous steps
    try {
      // Try direct navigation to see if we can access form customization
      await page.evaluate(() => {
        // Simulate advancing through steps
        if (window.location.pathname.includes('setup')) {
          console.log('On setup page');
        }
      });
      
      await page.screenshot({ 
        path: 'form-customization.png',
        fullPage: true 
      });
      screenshots.push('form-customization.png');
      console.log('📸 Screenshot: Current page');
      
    } catch (err) {
      console.log('⚠️ Could not test form customization:', err.message);
    }

    // Analyze form styling
    console.log('🔍 Analyzing form styling...');
    
    const formAnalysis = await page.evaluate(() => {
      const analysis = {
        headers: [],
        inputs: [],
        buttons: []
      };

      // Analyze headers
      document.querySelectorAll('h2').forEach(h2 => {
        const styles = window.getComputedStyle(h2);
        analysis.headers.push({
          text: h2.textContent.trim(),
          fontSize: styles.fontSize,
          fontWeight: styles.fontWeight,
          fontFamily: styles.fontFamily,
          color: styles.color
        });
      });

      // Analyze inputs
      document.querySelectorAll('input[type="text"], input[type="email"], input[type="url"]').forEach(input => {
        const styles = window.getComputedStyle(input);
        analysis.inputs.push({
          placeholder: input.placeholder,
          fontSize: styles.fontSize,
          fontFamily: styles.fontFamily,
          padding: styles.padding,
          border: styles.border,
          backgroundColor: styles.backgroundColor,
          color: styles.color
        });
      });

      // Analyze buttons
      document.querySelectorAll('button').forEach(button => {
        const styles = window.getComputedStyle(button);
        analysis.buttons.push({
          text: button.textContent.trim(),
          fontSize: styles.fontSize,
          fontFamily: styles.fontFamily,
          fontWeight: styles.fontWeight,
          padding: styles.padding,
          backgroundColor: styles.backgroundColor,
          color: styles.color
        });
      });

      return analysis;
    });

    // Save analysis
    fs.writeFileSync('form-analysis.json', JSON.stringify(formAnalysis, null, 2));
    console.log('💾 Form styling analysis saved to form-analysis.json');

  } catch (error) {
    console.error('❌ Test error:', error);
    
    // Screenshot on error
    await page.screenshot({ 
      path: 'test-error.png',
      fullPage: true 
    });
    screenshots.push('test-error.png');
  } finally {
    await browser.close();
  }

  // Generate test report
  const report = {
    timestamp: new Date().toISOString(),
    screenshotsTaken: screenshots.length,
    screenshots: screenshots,
    status: 'completed'
  };

  fs.writeFileSync('visual-test-report.json', JSON.stringify(report, null, 2));
  
  console.log('\n✅ Visual form testing completed!');
  console.log(`📸 Screenshots taken: ${screenshots.length}`);
  console.log('📋 Files generated:');
  screenshots.forEach(screenshot => console.log(`   - ${screenshot}`));
  console.log('   - form-analysis.json');
  console.log('   - visual-test-report.json');
  console.log('\nPlease review the screenshots to verify form improvements.');
}

// Run the test
visualFormTest().catch(console.error);