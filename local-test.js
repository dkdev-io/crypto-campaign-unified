import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Testing LOCAL dev server at localhost:5173...');
    
    // Disable cache completely
    await page.setCacheEnabled(false);
    await page.setExtraHTTPHeaders({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    await page.goto('http://localhost:5173/', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    const localResults = await page.evaluate(() => {
      // Check main div background
      const mainDiv = document.querySelector('div[style*="backgroundColor"]');
      let mainDivBg = 'NOT FOUND';
      if (mainDiv) {
        mainDivBg = mainDiv.style.backgroundColor;
      }
      
      // Check body background
      const bodyBg = window.getComputedStyle(document.body).background;
      
      // Check Features header
      const h2Elements = Array.from(document.querySelectorAll('h2'));
      const featuresH2 = h2Elements.find(h2 => h2.textContent.includes('Features'));
      
      // Check feature boxes
      const featureBoxes = document.querySelectorAll('#features .crypto-card');
      let featureBoxBg = 'NOT FOUND';
      if (featureBoxes.length > 0) {
        featureBoxBg = window.getComputedStyle(featureBoxes[0]).backgroundColor;
      }
      
      return {
        mainDivBackground: mainDivBg,
        bodyBackground: bodyBg,
        featuresHeader: featuresH2 ? featuresH2.textContent.trim() : 'NOT FOUND',
        featureBoxBackground: featureBoxBg,
        featureBoxCount: featureBoxes.length
      };
    });
    
    console.log('\n=== LOCAL DEV SERVER (localhost:5173) ===');
    console.log('Main Div Background:', localResults.mainDivBackground);
    console.log('Body Background:', localResults.bodyBackground);
    console.log('Features Header:', localResults.featuresHeader);
    console.log('Feature Box Background:', localResults.featureBoxBackground);
    console.log('Feature Box Count:', localResults.featureBoxCount);
    
    // Check for the specific colors we expect
    const hasMainPurple = localResults.mainDivBackground === 'rgb(45, 27, 105)' || localResults.mainDivBackground.includes('2D1B69');
    const hasBodyPurple = localResults.bodyBackground.includes('45, 27, 105') || localResults.bodyBackground.includes('2D1B69');
    const hasLightBlueBoxes = localResults.featureBoxBackground === 'rgb(227, 242, 253)' || localResults.featureBoxBackground.includes('E3F2FD');
    
    console.log('\n=== LOCAL VERIFICATION ===');
    console.log('✓ Main div purple:', hasMainPurple ? 'YES' : 'NO');
    console.log('✓ Body purple:', hasBodyPurple ? 'YES' : 'NO');
    console.log('✓ Features header changed:', localResults.featuresHeader === 'Features' ? 'YES' : 'NO');
    console.log('✓ Light blue boxes:', hasLightBlueBoxes ? 'YES' : 'NO');
    
  } catch (error) {
    console.error('Local test error:', error.message);
  } finally {
    await browser.close();
  }
})();