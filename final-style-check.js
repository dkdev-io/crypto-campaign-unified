import puppeteer from 'puppeteer';

async function checkStyling() {
  console.log('🔍 Checking styling consistency on localhost:5173...\n');
  
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  
  const pagesToTest = [
    { name: 'Homepage', url: 'http://localhost:5173' },
    { name: 'Campaign Auth', url: 'http://localhost:5173/campaigns/auth' },
    { name: 'Donor Auth', url: 'http://localhost:5173/donors/auth' },
    { name: 'Campaign Setup', url: 'http://localhost:5173/campaigns/auth/setup' }
  ];
  
  let consistentPages = 0;
  let totalPages = pagesToTest.length;
  
  for (const pageInfo of pagesToTest) {
    console.log(`📸 Testing ${pageInfo.name}...`);
    
    try {
      await page.goto(pageInfo.url, { waitUntil: 'networkidle0', timeout: 15000 });
      
      // Check for bypass button and click if available
      try {
        const bypassButton = await page.waitForSelector('[class*="yellow"]:has-text("BYPASS"), button[class*="yellow"]', { timeout: 2000 });
        if (bypassButton) {
          console.log(`  🔧 Clicking bypass button...`);
          await bypassButton.click();
          await page.waitForTimeout(3000);
        }
      } catch (e) {
        // No bypass button, continue
      }
      
      await page.screenshot({ path: `/private/tmp/final-${pageInfo.name.toLowerCase().replace(' ', '-')}.png` });
      
      // Check styling
      const styleCheck = await page.evaluate(() => {
        const body = document.body;
        const bodyStyle = getComputedStyle(body);
        
        // Check background color - look for dark blue container or body background
        const mainContainer = document.querySelector('[style*="crypto-navy"], .min-h-screen, [style*="214 100% 21%"]');
        const containerStyle = mainContainer ? getComputedStyle(mainContainer) : bodyStyle;
        const bgColor = containerStyle.backgroundColor || bodyStyle.backgroundColor;
        
        // Check if it's the crypto navy color or dark blue
        const isDarkBlue = bgColor.includes('rgb(26, 35, 126)') || 
                          bgColor.includes('rgba(26, 35, 126)') ||
                          bgColor.includes('rgb(26, 36, 127)') ||
                          mainContainer?.style?.backgroundColor?.includes('crypto-navy') ||
                          bodyStyle.background.includes('crypto-navy');
        
        // Check for white inputs
        const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
        let whiteInputCount = 0;
        inputs.forEach(input => {
          const inputStyle = getComputedStyle(input);
          if (inputStyle.backgroundColor === 'rgb(255, 255, 255)' || inputStyle.backgroundColor === 'rgba(255, 255, 255, 1)') {
            whiteInputCount++;
          }
        });
        
        // Check font family
        const fontFamily = bodyStyle.fontFamily;
        const hasInterFont = fontFamily.toLowerCase().includes('inter');
        
        // Check for emojis
        const textContent = document.body.innerText;
        const emojiCount = (textContent.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
        
        return {
          darkBlueBackground: isDarkBlue,
          whiteInputs: inputs.length > 0 ? whiteInputCount === inputs.length : true,
          inputCount: inputs.length,
          whiteInputCount: whiteInputCount,
          interFont: hasInterFont,
          noEmojis: emojiCount === 0,
          emojiCount: emojiCount,
          bgColor: bgColor,
          fontFamily: fontFamily
        };
      });
      
      const isConsistent = styleCheck.darkBlueBackground && styleCheck.whiteInputs && styleCheck.interFont && styleCheck.noEmojis;
      
      if (isConsistent) {
        consistentPages++;
        console.log(`  ✅ CONSISTENT (${pageInfo.name})`);
      } else {
        console.log(`  ❌ INCONSISTENT (${pageInfo.name})`);
        console.log(`    - Dark blue background: ${styleCheck.darkBlueBackground ? '✅' : '❌'} (${styleCheck.bgColor})`);
        console.log(`    - White inputs: ${styleCheck.whiteInputs ? '✅' : '❌'} (${styleCheck.whiteInputCount}/${styleCheck.inputCount})`);
        console.log(`    - Inter font: ${styleCheck.interFont ? '✅' : '❌'} (${styleCheck.fontFamily})`);
        console.log(`    - No emojis: ${styleCheck.noEmojis ? '✅' : '❌'} (${styleCheck.emojiCount} found)`);
      }
      
    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}`);
    }
  }
  
  await browser.close();
  
  const consistencyPercentage = Math.round((consistentPages / totalPages) * 100);
  
  console.log(`\n🎯 FINAL RESULT:`);
  console.log(`${consistentPages}/${totalPages} pages are perfectly consistent`);
  console.log(`${consistencyPercentage}% styling consistency achieved`);
  
  return consistencyPercentage;
}

checkStyling().catch(console.error);