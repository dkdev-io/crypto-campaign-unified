/**
 * Final working bypass test
 */

import puppeteer from 'puppeteer';
import fs from 'fs';

async function finalBypassTest() {
  console.log('🎯 Final test to reach setup forms...');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 1500
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });

  try {
    console.log('🔗 Navigating to auth with bypass...');
    await page.goto('http://localhost:5174/campaigns/auth?devbypass=true', { 
      waitUntil: 'networkidle0' 
    });
    
    // Use setTimeout instead of page.waitForTimeout
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('📸 Taking auth page screenshot...');
    await page.screenshot({ path: 'final-auth.png', fullPage: true });

    console.log('🔍 Clicking DEV BYPASS button...');
    const clickResult = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const bypassButton = buttons.find(button => 
        button.textContent.includes('DEV BYPASS')
      );
      
      if (bypassButton) {
        bypassButton.click();
        return { success: true, buttonText: bypassButton.textContent };
      }
      return { success: false, availableButtons: buttons.map(b => b.textContent.trim()) };
    });

    console.log('🎯 Click result:', clickResult);
    
    if (clickResult.success) {
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      console.log('📸 Taking post-click screenshot...');
      await page.screenshot({ path: 'final-after-bypass.png', fullPage: true });
      
      const currentUrl = page.url();
      console.log(`📍 Current URL: ${currentUrl}`);
      
      // Analyze the current page
      const pageAnalysis = await page.evaluate(() => {
        const getElementStyles = (element) => {
          const styles = window.getComputedStyle(element);
          return {
            fontSize: styles.fontSize,
            fontFamily: styles.fontFamily.split(',')[0].replace(/['"]/g, ''),
            fontWeight: styles.fontWeight,
            color: styles.color,
            backgroundColor: styles.backgroundColor,
            padding: styles.padding,
            border: styles.border
          };
        };

        const analysis = {
          url: window.location.href,
          title: document.title,
          forms: {
            headers: [],
            inputs: [],
            buttons: []
          }
        };

        // Capture headers
        document.querySelectorAll('h1, h2, h3').forEach(header => {
          if (header.textContent.trim()) {
            analysis.forms.headers.push({
              tag: header.tagName,
              text: header.textContent.trim(),
              ...getElementStyles(header)
            });
          }
        });

        // Capture form inputs
        document.querySelectorAll('input').forEach(input => {
          analysis.forms.inputs.push({
            type: input.type,
            placeholder: input.placeholder || '',
            ...getElementStyles(input)
          });
        });

        // Capture buttons
        document.querySelectorAll('button').forEach(button => {
          const text = button.textContent.trim();
          if (text && !text.includes('Sign') && !text.includes('Bypass') && text.length < 20) {
            analysis.forms.buttons.push({
              text: text,
              ...getElementStyles(button)
            });
          }
        });

        return analysis;
      });

      console.log('🔍 Page analysis complete!');
      console.log(`Headers found: ${pageAnalysis.forms.headers.length}`);
      console.log(`Inputs found: ${pageAnalysis.forms.inputs.length}`);
      console.log(`Buttons found: ${pageAnalysis.forms.buttons.length}`);

      // Save the complete analysis
      fs.writeFileSync('final-bypass-analysis.json', JSON.stringify(pageAnalysis, null, 2));
      console.log('💾 Complete analysis saved!');

      // Check if we have setup form content
      const hasSetupContent = pageAnalysis.forms.headers.some(h => 
        h.text.toLowerCase().includes('campaign') || 
        h.text.toLowerCase().includes('setup') ||
        h.text.toLowerCase().includes('step')
      );

      if (hasSetupContent) {
        console.log('🎉 SUCCESS! Found setup form content!');
        console.log('📊 Form improvements verified:');
        
        pageAnalysis.forms.headers.forEach((header, i) => {
          console.log(`   Header ${i+1}: "${header.text}" - ${header.fontSize}, ${header.fontFamily}`);
        });
        
        pageAnalysis.forms.inputs.forEach((input, i) => {
          console.log(`   Input ${i+1}: ${input.type} - ${input.fontSize}, padding: ${input.padding}`);
        });
        
        pageAnalysis.forms.buttons.forEach((button, i) => {
          console.log(`   Button ${i+1}: "${button.text}" - ${button.fontSize}, ${button.fontFamily}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'final-error.png', fullPage: true });
  } finally {
    await browser.close();
  }

  console.log('\n✅ Final bypass test completed!');
}

finalBypassTest().catch(console.error);