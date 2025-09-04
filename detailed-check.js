import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.setCacheEnabled(false);
    console.log('Checking Netlify site thoroughly...');
    await page.goto('https://cryptocampaign.netlify.app/', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    const fullCheck = await page.evaluate(() => {
      // Check main background
      const body = document.body;
      const bodyBg = window.getComputedStyle(body).background;
      
      // Check Features header
      const featuresHeaders = Array.from(document.querySelectorAll('h2'));
      const featuresH2 = featuresHeaders.find(h2 => h2.textContent.includes('Features'));
      
      // Check feature boxes
      const featureBoxes = document.querySelectorAll('#features .crypto-card');
      let featureBoxBg = null;
      let featureBoxTextColor = null;
      if (featureBoxes.length > 0) {
        const firstBox = featureBoxes[0];
        const style = window.getComputedStyle(firstBox);
        featureBoxBg = style.backgroundColor;
        const h3 = firstBox.querySelector('h3');
        if (h3) {
          featureBoxTextColor = window.getComputedStyle(h3).color;
        }
      }
      
      // Check How It Works boxes
      const howItWorksBoxes = document.querySelectorAll('#how-it-works .crypto-card');
      let howItWorksBg = null;
      let howItWorksTextColor = null;
      if (howItWorksBoxes.length > 0) {
        const firstBox = howItWorksBoxes[0];
        const style = window.getComputedStyle(firstBox);
        howItWorksBg = style.backgroundColor;
        const h3 = firstBox.querySelector('h3');
        if (h3) {
          howItWorksTextColor = window.getComputedStyle(h3).color;
        }
      }
      
      return {
        bodyBackground: bodyBg,
        featuresHeader: featuresH2 ? featuresH2.textContent.trim() : 'not found',
        featureBoxes: {
          count: featureBoxes.length,
          backgroundColor: featureBoxBg,
          textColor: featureBoxTextColor
        },
        howItWorksBoxes: {
          count: howItWorksBoxes.length,
          backgroundColor: howItWorksBg,
          textColor: howItWorksTextColor
        }
      };
    });
    
    console.log('\n=== DETAILED NETLIFY CHECK ===');
    console.log('Body Background:', fullCheck.bodyBackground);
    console.log('Features Header:', `"${fullCheck.featuresHeader}"`);
    console.log('Feature Boxes Count:', fullCheck.featureBoxes.count);
    console.log('Feature Box Background:', fullCheck.featureBoxes.backgroundColor);
    console.log('Feature Box Text Color:', fullCheck.featureBoxes.textColor);
    console.log('How It Works Boxes Count:', fullCheck.howItWorksBoxes.count);
    console.log('How It Works Background:', fullCheck.howItWorksBoxes.backgroundColor);
    console.log('How It Works Text Color:', fullCheck.howItWorksBoxes.textColor);
    
    // Analysis
    console.log('\n=== CHANGE ANALYSIS ===');
    const hasDarkPurple = fullCheck.bodyBackground.includes('45, 27, 105') || fullCheck.bodyBackground.includes('2D1B69');
    const hasLightBlueBoxes = fullCheck.featureBoxes.backgroundColor?.includes('227, 242, 253') || fullCheck.featureBoxes.backgroundColor?.includes('E3F2FD');
    const hasBlueText = fullCheck.featureBoxes.textColor?.includes('25, 118, 210') || fullCheck.featureBoxes.textColor?.includes('1976D2');
    
    console.log('✓ Dark purple background:', hasDarkPurple ? 'YES' : 'NO');
    console.log('✓ Features header changed:', fullCheck.featuresHeader === 'Features' ? 'YES' : 'NO');
    console.log('✓ Light blue feature boxes:', hasLightBlueBoxes ? 'YES' : 'NO');
    console.log('✓ Blue text in boxes:', hasBlueText ? 'YES' : 'NO');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();