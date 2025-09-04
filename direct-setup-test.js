/**
 * Direct Setup Testing - Navigate directly to setup wizard
 */

import puppeteer from 'puppeteer';

async function directSetupTest() {
  console.log('🎯 Testing setup forms directly...');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 1000
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });

  try {
    // Navigate directly to setup wizard
    console.log('📋 Navigating to setup wizard...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle0' });
    
    // Try to navigate through the app structure
    // First check if there's a way to access setup
    const pageContent = await page.content();
    console.log('🔍 Current page loaded, looking for setup access...');

    // Take a baseline screenshot
    await page.screenshot({ path: 'direct-baseline.png', fullPage: true });
    console.log('📸 Baseline screenshot taken');

    // Try clicking on Campaigns button if it exists
    try {
      const campaignsButton = await page.waitForSelector('button:has-text("Campaigns"), a:has-text("Campaigns")', { timeout: 5000 });
      if (campaignsButton) {
        await campaignsButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Clicked Campaigns');
        
        await page.screenshot({ path: 'direct-after-campaigns.png', fullPage: true });
        console.log('📸 After clicking Campaigns');
      }
    } catch (err) {
      console.log('⚠️ No Campaigns button found');
    }

    // Try to access setup through URL manipulation
    console.log('🌐 Trying direct URL access...');
    
    const testUrls = [
      'http://localhost:5174/campaigns/auth/setup',
      'http://localhost:5174/setup',
      'http://localhost:5174/campaigns/setup',
      'http://localhost:5174/campaigns/auth?devbypass=true'
    ];

    for (let url of testUrls) {
      try {
        console.log(`🔗 Testing URL: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
        await page.waitForTimeout(3000);
        
        const currentUrl = page.url();
        console.log(`📍 Result URL: ${currentUrl}`);
        
        const filename = `direct-${url.split('/').pop() || 'root'}.png`;
        await page.screenshot({ path: filename, fullPage: true });
        console.log(`📸 Screenshot: ${filename}`);

        // If we find a setup form, analyze it
        const hasSetupForm = await page.evaluate(() => {
          const h2Elements = Array.from(document.querySelectorAll('h2'));
          const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="email"]'));
          const buttons = Array.from(document.querySelectorAll('button'));
          
          return {
            hasHeaders: h2Elements.length > 0,
            hasInputs: inputs.length > 0,
            hasButtons: buttons.length > 0,
            headerTexts: h2Elements.map(h => h.textContent.trim()),
            url: window.location.href
          };
        });

        console.log('📊 Form analysis:', hasSetupForm);

        if (hasSetupForm.hasHeaders && hasSetupForm.hasInputs) {
          console.log('🎉 Found setup form! Taking detailed analysis...');
          
          // Get detailed styling information
          const detailedAnalysis = await page.evaluate(() => {
            const analysis = { headers: [], inputs: [], buttons: [] };
            
            document.querySelectorAll('h2').forEach(h2 => {
              const styles = window.getComputedStyle(h2);
              analysis.headers.push({
                text: h2.textContent.trim(),
                fontSize: styles.fontSize,
                fontWeight: styles.fontWeight,
                color: styles.color,
                fontFamily: styles.fontFamily.split(',')[0].replace(/['"]/g, ''),
                textAlign: styles.textAlign
              });
            });

            document.querySelectorAll('input[type="text"], input[type="email"], input[type="url"]').forEach(input => {
              const styles = window.getComputedStyle(input);
              analysis.inputs.push({
                placeholder: input.placeholder,
                fontSize: styles.fontSize,
                padding: styles.padding,
                backgroundColor: styles.backgroundColor,
                color: styles.color,
                border: styles.border,
                fontFamily: styles.fontFamily.split(',')[0].replace(/['"]/g, '')
              });
            });

            document.querySelectorAll('button').forEach(button => {
              const styles = window.getComputedStyle(button);
              const text = button.textContent.trim();
              if (text) {
                analysis.buttons.push({
                  text: text,
                  fontSize: styles.fontSize,
                  fontWeight: styles.fontWeight,
                  backgroundColor: styles.backgroundColor,
                  color: styles.color,
                  padding: styles.padding,
                  fontFamily: styles.fontFamily.split(',')[0].replace(/['"]/g, '')
                });
              }
            });

            return analysis;
          });

          console.log('💾 Saving detailed form analysis...');
          require('fs').writeFileSync('direct-form-analysis.json', JSON.stringify(detailedAnalysis, null, 2));
          
          break; // Found the form, stop testing other URLs
        }

      } catch (err) {
        console.log(`❌ Error with ${url}: ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Direct setup test error:', error.message);
    
    await page.screenshot({ path: 'direct-error.png', fullPage: true });
  } finally {
    console.log('🏁 Closing browser...');
    await browser.close();
  }

  console.log('\n✅ Direct setup test completed!');
  console.log('📋 Check the screenshots to see if we accessed the setup forms');
  console.log('🔍 Look for evidence of our form improvements:');
  console.log('   • Headers with 2rem font size and Inter family');
  console.log('   • Inputs with 0.75rem padding and HSL colors');
  console.log('   • Buttons with consistent styling');
}

directSetupTest().catch(console.error);