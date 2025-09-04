import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    
    const inlineStyleDebug = await page.evaluate(() => {
      // Find all divs with inline backgroundColor
      const allDivs = document.querySelectorAll('div');
      const divsWithInlineStyle = [];
      
      for (let div of allDivs) {
        if (div.style.backgroundColor) {
          divsWithInlineStyle.push({
            className: div.className,
            inlineStyle: div.style.backgroundColor,
            computedStyle: window.getComputedStyle(div).backgroundColor,
            outerHTML: div.outerHTML.substring(0, 200) + '...'
          });
        }
      }
      
      return {
        totalDivs: allDivs.length,
        divsWithInline: divsWithInlineStyle.length,
        divDetails: divsWithInlineStyle
      };
    });
    
    console.log('=== INLINE STYLE DEBUG ===');
    console.log('Total divs:', inlineStyleDebug.totalDivs);
    console.log('Divs with inline backgroundColor:', inlineStyleDebug.divsWithInline);
    
    if (inlineStyleDebug.divDetails.length > 0) {
      console.log('\nDivs with inline styles:');
      inlineStyleDebug.divDetails.forEach((div, index) => {
        console.log(`${index + 1}. Class: ${div.className}`);
        console.log(`   Inline: ${div.inlineStyle}`);
        console.log(`   Computed: ${div.computedStyle}`);
        console.log(`   HTML: ${div.outerHTML}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('Debug error:', error.message);
  } finally {
    await browser.close();
  }
})();