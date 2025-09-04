/**
 * Setup Form Testing - Target the specific improved forms
 */

import puppeteer from 'puppeteer';
import fs from 'fs';

async function setupFormTest() {
  console.log('🎯 Testing setup forms with improvements...');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 2000,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });

  const baseUrl = 'http://localhost:5174';
  const screenshots = [];
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  try {
    // Start with campaign auth and use dev bypass
    console.log('🔑 Starting with campaign auth...');
    await page.goto(`${baseUrl}/campaigns/auth`, { waitUntil: 'networkidle0', timeout: 15000 });
    await delay(2000);

    // Click the DEV BYPASS button if it exists
    try {
      const bypassButton = await page.waitForSelector('button:has-text("DEV BYPASS")', { timeout: 5000 });
      if (bypassButton) {
        await bypassButton.click();
        await delay(3000);
        console.log('✅ Clicked DEV BYPASS button');
      }
    } catch (err) {
      console.log('⚠️ No DEV BYPASS button found, trying direct navigation');
      await page.goto(`${baseUrl}/campaigns/auth/setup`, { waitUntil: 'networkidle0' });
      await delay(3000);
    }

    // Screenshot: Current page after bypass
    await page.screenshot({ 
      path: 'setup-after-bypass.png',
      fullPage: true 
    });
    screenshots.push('setup-after-bypass.png');
    console.log('📸 Screenshot: After dev bypass');

    // Try to navigate through setup steps manually if needed
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);

    // If we're on a setup page, try to navigate through steps
    if (currentUrl.includes('setup') || currentUrl.includes('campaign')) {
      
      // Look for form inputs and fill them to enable navigation
      try {
        const campaignInput = await page.$('input[placeholder*="campaign"], input[placeholder*="Campaign"]');
        if (campaignInput) {
          await campaignInput.type('Visual Test Campaign');
          console.log('✏️ Filled campaign name');
        }

        const emailInput = await page.$('input[type="email"]');
        if (emailInput) {
          await emailInput.type('test@example.com');
          console.log('✏️ Filled email');
        }

        const nameInput = await page.$('input[placeholder*="name"], input[placeholder*="Name"]');
        if (nameInput) {
          await nameInput.type('Test User');
          console.log('✏️ Filled name');
        }

        await delay(2000);

        // Screenshot: Form filled
        await page.screenshot({ 
          path: 'setup-step1-filled.png',
          fullPage: true 
        });
        screenshots.push('setup-step1-filled.png');
        console.log('📸 Screenshot: Step 1 filled');

        // Try to go to next step
        const nextButton = await page.$('button:has-text("Next")');
        if (nextButton) {
          await nextButton.click();
          await delay(3000);
          
          await page.screenshot({ 
            path: 'setup-step2-committee.png',
            fullPage: true 
          });
          screenshots.push('setup-step2-committee.png');
          console.log('📸 Screenshot: Step 2 - Committee Search');

          // Test manual committee entry
          const manualCommitteeInput = await page.$('input[placeholder*="committee"], input[placeholder*="Committee"]');
          if (manualCommitteeInput) {
            await manualCommitteeInput.type('Test Committee Name');
            console.log('✏️ Filled committee name');
            
            await delay(1000);
            
            await page.screenshot({ 
              path: 'setup-step2-manual-input.png',
              fullPage: true 
            });
            screenshots.push('setup-step2-manual-input.png');
            console.log('📸 Screenshot: Manual committee input');
          }
        }

      } catch (err) {
        console.log('⚠️ Error during form interaction:', err.message);
      }
    }

    // Test specific component styling
    console.log('🔍 Analyzing form styling on current page...');
    const styleAnalysis = await page.evaluate(() => {
      const analysis = {
        url: window.location.href,
        title: document.title,
        styling: {
          headers: [],
          inputs: [],
          buttons: []
        }
      };

      // Check headers (our 2rem, Inter font improvements)
      document.querySelectorAll('h1, h2, h3').forEach(header => {
        const styles = window.getComputedStyle(header);
        analysis.styling.headers.push({
          tag: header.tagName,
          text: header.textContent.trim().substring(0, 50),
          fontSize: styles.fontSize,
          fontWeight: styles.fontWeight,
          fontFamily: styles.fontFamily.substring(0, 30),
          color: styles.color,
          textAlign: styles.textAlign
        });
      });

      // Check inputs (our padding, border, background improvements)
      document.querySelectorAll('input[type="text"], input[type="email"], input[type="url"]').forEach(input => {
        const styles = window.getComputedStyle(input);
        analysis.styling.inputs.push({
          type: input.type,
          placeholder: (input.placeholder || '').substring(0, 30),
          fontSize: styles.fontSize,
          fontFamily: styles.fontFamily.substring(0, 20),
          padding: styles.padding,
          border: styles.border.substring(0, 50),
          backgroundColor: styles.backgroundColor,
          color: styles.color
        });
      });

      // Check buttons (our standardized styling)
      document.querySelectorAll('button').forEach(button => {
        const styles = window.getComputedStyle(button);
        const text = button.textContent.trim();
        if (text && text.length > 0) {
          analysis.styling.buttons.push({
            text: text.substring(0, 20),
            fontSize: styles.fontSize,
            fontFamily: styles.fontFamily.substring(0, 20),
            fontWeight: styles.fontWeight,
            padding: styles.padding,
            backgroundColor: styles.backgroundColor,
            color: styles.color,
            borderRadius: styles.borderRadius
          });
        }
      });

      return analysis;
    });

    fs.writeFileSync('setup-style-analysis.json', JSON.stringify(styleAnalysis, null, 2));
    console.log('💾 Setup styling analysis saved');

  } catch (error) {
    console.error('❌ Setup test error:', error.message);
    
    await page.screenshot({ 
      path: 'setup-error.png',
      fullPage: true 
    });
    screenshots.push('setup-error.png');
  } finally {
    await browser.close();
  }

  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    testType: 'setup-form-verification',
    screenshotCount: screenshots.length,
    screenshots: screenshots,
    status: screenshots.length > 0 ? 'completed' : 'failed'
  };

  fs.writeFileSync('setup-test-report.json', JSON.stringify(report, null, 2));
  
  console.log('\n✅ Setup form testing completed!');
  console.log(`📸 Total screenshots: ${screenshots.length}`);
  
  if (screenshots.length > 0) {
    console.log('\n📷 Screenshots captured:');
    screenshots.forEach(screenshot => console.log(`   • ${screenshot}`));
    console.log('\n🎯 Review these screenshots to verify:');
    console.log('   ✓ Header typography (2rem, Inter font, white color)');
    console.log('   ✓ Input styling (0.75rem padding, HSL borders, navy background)');
    console.log('   ✓ Button consistency (Inter font, proper spacing)');
    console.log('   ✓ Overall form readability and contrast');
  }
}

setupFormTest().catch(console.error);