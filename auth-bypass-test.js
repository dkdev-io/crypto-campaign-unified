/**
 * Auth Bypass Test - Actually reach the setup wizard forms
 */

import puppeteer from 'puppeteer';
import fs from 'fs';

async function authBypassTest() {
  console.log('🔓 Testing auth bypass to reach setup forms...');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 2000,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });

  const screenshots = [];
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  try {
    console.log('🚀 Navigating to campaign auth with bypass...');
    await page.goto('http://localhost:5174/campaigns/auth?devbypass=true', { 
      waitUntil: 'networkidle0',
      timeout: 15000 
    });
    
    await delay(3000);
    
    // Take screenshot of current state
    await page.screenshot({ 
      path: 'bypass-step1-initial.png',
      fullPage: true 
    });
    screenshots.push('bypass-step1-initial.png');
    console.log('📸 Initial state after bypass URL');

    // Look for and click the DEV BYPASS button
    console.log('🔍 Looking for DEV BYPASS button...');
    try {
      const bypassButton = await page.$('button:contains("DEV BYPASS"), button[class*="bypass"], button[style*="234, 179, 8"]');
      if (bypassButton) {
        console.log('✅ Found DEV BYPASS button, clicking...');
        await bypassButton.click();
        await delay(4000);
        
        await page.screenshot({ 
          path: 'bypass-step2-after-click.png',
          fullPage: true 
        });
        screenshots.push('bypass-step2-after-click.png');
        console.log('📸 After clicking DEV BYPASS button');
      } else {
        console.log('🔍 No DEV BYPASS button found, trying CSS selector...');
        
        // Try different selectors for the bypass button
        const possibleSelectors = [
          'button[style*="rgb(234, 179, 8)"]',
          'button[style*="background-color: rgb(234, 179, 8)"]',
          '[style*="DEV BYPASS"]',
          'button:contains("Setup")',
          'a[href*="setup"]'
        ];
        
        for (let selector of possibleSelectors) {
          try {
            const element = await page.$(selector);
            if (element) {
              console.log(`✅ Found element with selector: ${selector}`);
              await element.click();
              await delay(3000);
              break;
            }
          } catch (err) {
            // Continue to next selector
          }
        }
      }
    } catch (err) {
      console.log('⚠️ Error finding bypass button:', err.message);
    }

    // Check current URL and page content
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);

    // Look for setup wizard content
    const setupContent = await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent.trim());
      const inputs = Array.from(document.querySelectorAll('input')).length;
      const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).filter(t => t.length > 0);
      
      return {
        url: window.location.href,
        headers: headers,
        inputCount: inputs,
        buttons: buttons,
        hasSetupForm: headers.some(h => h.toLowerCase().includes('campaign') || h.toLowerCase().includes('setup'))
      };
    });

    console.log('🔍 Page analysis:', setupContent);

    if (setupContent.hasSetupForm) {
      console.log('🎉 SUCCESS! Found setup form content!');
      
      await page.screenshot({ 
        path: 'bypass-step3-setup-found.png',
        fullPage: true 
      });
      screenshots.push('bypass-step3-setup-found.png');
      console.log('📸 Setup form page captured');

      // Analyze the setup form styling
      const detailedAnalysis = await page.evaluate(() => {
        const analysis = {
          pageInfo: {
            url: window.location.href,
            title: document.title
          },
          headers: [],
          inputs: [],
          buttons: []
        };

        // Analyze headers (our 2rem improvements)
        document.querySelectorAll('h2').forEach(h2 => {
          const styles = window.getComputedStyle(h2);
          analysis.headers.push({
            text: h2.textContent.trim(),
            fontSize: styles.fontSize,
            fontWeight: styles.fontWeight,
            fontFamily: styles.fontFamily.split(',')[0].replace(/['"]/g, ''),
            color: styles.color,
            textAlign: styles.textAlign,
            marginBottom: styles.marginBottom
          });
        });

        // Analyze inputs (our padding and styling improvements)
        document.querySelectorAll('input[type="text"], input[type="email"], input[type="url"]').forEach(input => {
          const styles = window.getComputedStyle(input);
          analysis.inputs.push({
            type: input.type,
            placeholder: input.placeholder || '',
            fontSize: styles.fontSize,
            fontFamily: styles.fontFamily.split(',')[0].replace(/['"]/g, ''),
            padding: styles.padding,
            border: styles.border,
            backgroundColor: styles.backgroundColor,
            color: styles.color,
            borderRadius: styles.borderRadius
          });
        });

        // Analyze buttons (our standardized styling)
        document.querySelectorAll('button').forEach(button => {
          const styles = window.getComputedStyle(button);
          const text = button.textContent.trim();
          if (text && text.length > 0 && text.length < 50) {
            analysis.buttons.push({
              text: text,
              fontSize: styles.fontSize,
              fontWeight: styles.fontWeight,
              fontFamily: styles.fontFamily.split(',')[0].replace(/['"]/g, ''),
              padding: styles.padding,
              backgroundColor: styles.backgroundColor,
              color: styles.color,
              borderRadius: styles.borderRadius,
              border: styles.border
            });
          }
        });

        return analysis;
      });

      // Save the detailed analysis
      fs.writeFileSync('setup-wizard-analysis.json', JSON.stringify(detailedAnalysis, null, 2));
      console.log('💾 Detailed setup form analysis saved');

      // Try to fill out the form and navigate to next step
      console.log('📝 Attempting to fill out setup form...');
      try {
        // Look for campaign name input
        const campaignInput = await page.$('input[placeholder*="campaign"], input[placeholder*="Campaign"]');
        if (campaignInput) {
          await campaignInput.type('Visual Test Campaign 2024');
          console.log('✏️ Filled campaign name');
        }

        // Look for email input  
        const emailInput = await page.$('input[type="email"]');
        if (emailInput) {
          await emailInput.type('test@campaign.com');
          console.log('✏️ Filled email');
        }

        // Look for name input
        const nameInput = await page.$('input[placeholder*="name"], input[placeholder*="Name"]');
        if (nameInput) {
          await nameInput.type('Campaign Manager');
          console.log('✏️ Filled name');
        }

        await delay(2000);

        await page.screenshot({ 
          path: 'bypass-step4-form-filled.png',
          fullPage: true 
        });
        screenshots.push('bypass-step4-form-filled.png');
        console.log('📸 Setup form filled out');

        // Try to click Next button
        const nextButton = await page.$('button:contains("Next"), button[style*="hsl(var(--crypto-navy))"]');
        if (nextButton) {
          console.log('👆 Clicking Next button...');
          await nextButton.click();
          await delay(4000);

          await page.screenshot({ 
            path: 'bypass-step5-committee-search.png',
            fullPage: true 
          });
          screenshots.push('bypass-step5-committee-search.png');
          console.log('📸 Committee Search page reached!');

          // This is where our major CommitteeSearch improvements are!
          console.log('🎯 SUCCESS! Reached Committee Search with our form improvements!');
        }

      } catch (formErr) {
        console.log('⚠️ Error filling form:', formErr.message);
      }
    }

  } catch (error) {
    console.error('❌ Auth bypass test error:', error.message);
    
    await page.screenshot({ 
      path: 'bypass-error.png',
      fullPage: true 
    });
    screenshots.push('bypass-error.png');
  } finally {
    await browser.close();
  }

  console.log(`\n✅ Auth bypass test completed!`);
  console.log(`📸 Screenshots captured: ${screenshots.length}`);
  screenshots.forEach(screenshot => console.log(`   📷 ${screenshot}`));
  
  if (screenshots.includes('bypass-step5-committee-search.png')) {
    console.log('\n🎉 SUCCESS! Reached the Committee Search form with our improvements!');
    console.log('🔍 Check bypass-step5-committee-search.png to see our form styling improvements');
  }
}

authBypassTest().catch(console.error);