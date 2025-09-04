import puppeteer from 'puppeteer';

async function verifyStyleConsistency() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1200, height: 800 });
  
  console.log('🔍 Comprehensive styling verification for localhost:5173...\n');
  
  const pages = [
    { name: 'Homepage', url: 'http://localhost:5173' },
    { name: 'Campaign Auth', url: 'http://localhost:5173/campaigns/auth' },
    { name: 'Donor Auth', url: 'http://localhost:5173/donors/auth' },
    { name: 'Campaign Info', url: 'http://localhost:5173/YourInfo' },
    { name: 'Committee Search', url: 'http://localhost:5173/CommitteeSearch' },
    { name: 'Bank Connection', url: 'http://localhost:5173/BankConnection' },
    { name: 'Website Style', url: 'http://localhost:5173/WebsiteStyle' }
  ];
  
  const results = [];
  
  // First capture homepage baseline
  console.log('📸 Capturing homepage baseline...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: '/private/tmp/verification-homepage.png' });
  
  // Extract homepage styling
  const homepageStyles = await page.evaluate(() => {
    const body = document.body;
    const computedStyle = getComputedStyle(body);
    const h1 = document.querySelector('h1');
    const button = document.querySelector('button');
    
    return {
      backgroundColor: computedStyle.backgroundColor,
      color: computedStyle.color,
      fontFamily: computedStyle.fontFamily,
      h1FontSize: h1 ? getComputedStyle(h1).fontSize : null,
      h1Color: h1 ? getComputedStyle(h1).color : null,
      buttonColor: button ? getComputedStyle(button).backgroundColor : null
    };
  });
  
  console.log('🏠 Homepage baseline:', homepageStyles);
  
  // Test each page
  for (const pageInfo of pages) {
    console.log(`\n🔍 Testing ${pageInfo.name}...`);
    
    try {
      await page.goto(pageInfo.url, { waitUntil: 'networkidle2', timeout: 10000 });
      
      // Take screenshot
      await page.screenshot({ path: `/private/tmp/verification-${pageInfo.name.toLowerCase().replace(' ', '-')}.png` });
      
      // Check for auth bypass and use it if needed
      if (pageInfo.url.includes('/auth') || pageInfo.url.includes('YourInfo') || pageInfo.url.includes('Committee') || pageInfo.url.includes('Bank') || pageInfo.url.includes('Website')) {
        try {
          const bypassButton = await page.$('button:has-text("DEV BYPASS"), button:has-text("BYPASS")');
          if (bypassButton) {
            console.log(`  🔧 Using auth bypass for ${pageInfo.name}`);
            await bypassButton.click();
            await page.waitForTimeout(2000);
            await page.screenshot({ path: `/private/tmp/verification-${pageInfo.name.toLowerCase().replace(' ', '-')}-bypassed.png` });
          }
        } catch (e) {
          console.log(`  ⏭️ No bypass needed for ${pageInfo.name}`);
        }
      }
      
      // Extract styling properties
      const pageStyles = await page.evaluate(() => {
        const body = document.body;
        const computedStyle = getComputedStyle(body);
        const h1 = document.querySelector('h1');
        const h2 = document.querySelector('h2');
        const inputs = Array.from(document.querySelectorAll('input'));
        const buttons = Array.from(document.querySelectorAll('button'));
        
        // Check for emojis in content
        const textContent = document.body.innerText;
        const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
        const emojis = textContent.match(emojiRegex) || [];
        
        return {
          backgroundColor: computedStyle.backgroundColor,
          color: computedStyle.color,
          fontFamily: computedStyle.fontFamily,
          h1FontSize: h1 ? getComputedStyle(h1).fontSize : null,
          h1Color: h1 ? getComputedStyle(h1).color : null,
          h2FontSize: h2 ? getComputedStyle(h2).fontSize : null,
          h2Color: h2 ? getComputedStyle(h2).color : null,
          inputCount: inputs.length,
          inputColors: inputs.slice(0, 3).map(input => ({
            background: getComputedStyle(input).backgroundColor,
            color: getComputedStyle(input).color,
            border: getComputedStyle(input).borderColor
          })),
          buttonCount: buttons.length,
          buttonColors: buttons.slice(0, 3).map(button => ({
            background: getComputedStyle(button).backgroundColor,
            color: getComputedStyle(button).color
          })),
          emojisFound: emojis.length,
          emojis: emojis
        };
      });
      
      // Compare with homepage
      const comparison = {
        name: pageInfo.name,
        url: pageInfo.url,
        backgroundMatch: pageStyles.backgroundColor === homepageStyles.backgroundColor,
        fontFamilyMatch: pageStyles.fontFamily === homepageStyles.fontFamily,
        inputsHaveWhiteBackground: pageStyles.inputColors.every(input => 
          input.background === 'rgb(255, 255, 255)' || input.background === 'rgba(255, 255, 255, 1)'
        ),
        emojisFound: pageStyles.emojisFound,
        emojis: pageStyles.emojis,
        consistencyScore: 0
      };
      
      // Calculate consistency score
      let score = 0;
      if (comparison.backgroundMatch) score += 25;
      if (comparison.fontFamilyMatch) score += 25; 
      if (comparison.inputsHaveWhiteBackground) score += 25;
      if (comparison.emojisFound === 0) score += 25;
      
      comparison.consistencyScore = score;
      
      console.log(`  📊 Consistency Score: ${score}/100`);
      console.log(`  🎨 Background: ${comparison.backgroundMatch ? '✅' : '❌'}`);
      console.log(`  🔤 Font Family: ${comparison.fontFamilyMatch ? '✅' : '❌'}`);
      console.log(`  📝 White Inputs: ${comparison.inputsHaveWhiteBackground ? '✅' : '❌'}`);
      console.log(`  😀 No Emojis: ${comparison.emojisFound === 0 ? '✅' : '❌'} (${comparison.emojisFound} found)`);
      
      if (comparison.emojis.length > 0) {
        console.log(`  Found emojis: ${comparison.emojis.join(', ')}`);
      }
      
      results.push(comparison);
      
    } catch (error) {
      console.log(`  ❌ Error testing ${pageInfo.name}: ${error.message}`);
      results.push({
        name: pageInfo.name,
        url: pageInfo.url,
        error: error.message,
        consistencyScore: 0
      });
    }
  }
  
  // Calculate overall results
  const totalPages = results.length;
  const averageScore = results.reduce((sum, result) => sum + (result.consistencyScore || 0), 0) / totalPages;
  const perfectPages = results.filter(r => r.consistencyScore === 100).length;
  
  console.log(`\n📋 FINAL STYLING CONSISTENCY REPORT`);
  console.log(`================================`);
  console.log(`Pages tested: ${totalPages}`);
  console.log(`Average consistency: ${averageScore.toFixed(1)}/100`);
  console.log(`Perfect pages: ${perfectPages}/${totalPages} (${((perfectPages/totalPages)*100).toFixed(1)}%)`);
  console.log(`\nDetailed Results:`);
  
  results.forEach(result => {
    console.log(`\n${result.name}: ${result.consistencyScore || 0}/100`);
    if (result.error) {
      console.log(`  ❌ Error: ${result.error}`);
    }
  });
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    homepageBaseline: homepageStyles,
    results: results,
    summary: {
      totalPages,
      averageScore,
      perfectPages,
      percentagePerfect: ((perfectPages/totalPages)*100).toFixed(1)
    }
  };
  
  await page.evaluate((data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'styling-consistency-report.json';
    a.click();
  }, report);
  
  console.log(`\n✅ Complete report saved`);
  console.log(`📸 Screenshots saved to /private/tmp/verification-*.png`);
  
  await browser.close();
  
  return {
    totalPages,
    averageScore: averageScore.toFixed(1),
    perfectPages,
    percentagePerfect: ((perfectPages/totalPages)*100).toFixed(1)
  };
}

verifyStyleConsistency()
  .then(summary => {
    console.log(`\n🎯 FINAL RESULT: ${summary.percentagePerfect}% of pages have perfect styling consistency`);
  })
  .catch(console.error);