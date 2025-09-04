/**
 * Simple bypass click test to reach setup forms
 */

import puppeteer from 'puppeteer';

async function bypassClickTest() {
  console.log('🎯 Testing DEV BYPASS click to setup forms...');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 1000
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });

  try {
    console.log('🔗 Navigating to auth page...');
    await page.goto('http://localhost:5174/campaigns/auth?devbypass=true', { 
      waitUntil: 'networkidle0' 
    });
    
    await page.waitForTimeout(2000);
    console.log('📸 Taking initial screenshot...');
    await page.screenshot({ path: 'click-step1-auth.png', fullPage: true });

    console.log('🔍 Looking for DEV BYPASS button...');
    // Find and click the DEV BYPASS button using text content
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const bypassButton = buttons.find(button => 
        button.textContent.includes('DEV BYPASS') || 
        button.textContent.includes('Setup')
      );
      
      if (bypassButton) {
        console.log('Found DEV BYPASS button, clicking...');
        bypassButton.click();
        return true;
      }
      return false;
    });

    await page.waitForTimeout(4000);
    console.log('📸 Taking post-click screenshot...');
    await page.screenshot({ path: 'click-step2-after-bypass.png', fullPage: true });

    // Check what page we're on now
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);

    // Look for setup wizard content
    const pageInfo = await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({
        tag: h.tagName,
        text: h.textContent.trim()
      }));
      
      const inputs = Array.from(document.querySelectorAll('input')).map(input => ({
        type: input.type,
        placeholder: input.placeholder || '',
        name: input.name || ''
      }));

      return {
        url: window.location.href,
        title: document.title,
        headers: headers,
        inputs: inputs,
        hasSetupContent: headers.some(h => 
          h.text.toLowerCase().includes('campaign') && 
          h.text.toLowerCase().includes('setup')
        ) || headers.some(h => h.text.toLowerCase().includes('step'))
      };
    });

    console.log('📊 Page analysis:', JSON.stringify(pageInfo, null, 2));

    if (pageInfo.hasSetupContent || currentUrl.includes('setup')) {
      console.log('🎉 SUCCESS! Reached setup wizard!');
      
      // Take detailed screenshot of setup page
      await page.screenshot({ path: 'click-step3-setup-wizard.png', fullPage: true });
      
      // Try to capture the form styling
      const setupStyling = await page.evaluate(() => {
        const formAnalysis = { headers: [], inputs: [], buttons: [] };
        
        // Get all headers with styling
        document.querySelectorAll('h2').forEach(h2 => {
          const styles = window.getComputedStyle(h2);
          formAnalysis.headers.push({
            text: h2.textContent.trim(),
            fontSize: styles.fontSize,
            fontFamily: styles.fontFamily.split(',')[0].replace(/['"]/g, ''),
            color: styles.color,
            fontWeight: styles.fontWeight
          });
        });

        // Get form inputs with styling
        document.querySelectorAll('input[type="text"], input[type="email"]').forEach(input => {
          const styles = window.getComputedStyle(input);
          formAnalysis.inputs.push({
            placeholder: input.placeholder,
            fontSize: styles.fontSize,
            fontFamily: styles.fontFamily.split(',')[0].replace(/['"]/g, ''),
            padding: styles.padding,
            backgroundColor: styles.backgroundColor,
            border: styles.border
          });
        });

        // Get buttons with styling
        document.querySelectorAll('button').forEach(button => {
          const text = button.textContent.trim();
          if (text && !text.includes('Sign') && !text.includes('Bypass')) {
            const styles = window.getComputedStyle(button);
            formAnalysis.buttons.push({
              text: text,
              fontSize: styles.fontSize,
              fontFamily: styles.fontFamily.split(',')[0].replace(/['"]/g, ''),
              backgroundColor: styles.backgroundColor,
              padding: styles.padding
            });
          }
        });

        return formAnalysis;
      });

      console.log('🎨 Setup form styling:', JSON.stringify(setupStyling, null, 2));
      
      // Save the styling analysis
      require('fs').writeFileSync('bypass-setup-styling.json', JSON.stringify(setupStyling, null, 2));
      console.log('💾 Setup styling analysis saved!');

    } else {
      console.log('⚠️ Did not reach setup wizard, current page:', pageInfo.title);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'click-error.png', fullPage: true });
  } finally {
    await browser.close();
  }

  console.log('\n✅ Bypass click test completed!');
  console.log('📋 Check the screenshots to see if we reached the setup forms');
}

bypassClickTest().catch(console.error);