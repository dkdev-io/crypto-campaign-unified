import puppeteer from 'puppeteer';
import fs from 'fs';

async function analyzeLiveSite() {
  const browser = await puppeteer.launch({ 
    headless: false, // Set to true for production
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Analyzing live site styling...');
    
    // Define the pages we want to check
    const pagesToCheck = [
      { 
        name: 'Home Page', 
        url: 'https://cryptocampaign.netlify.app',
        expectedChanges: [
          'Navy blue background (hsl(214, 100%, 21%))',
          'White text on navy background', 
          'Navigation with navy background and black corner brackets'
        ]
      },
      { 
        name: 'Donor Auth', 
        url: 'https://cryptocampaign.netlify.app/donors/auth',
        expectedChanges: [
          'Navy background throughout',
          'Auth forms on navy background',
          'Navigation with corner brackets'
        ]
      },
      { 
        name: 'Campaign Auth', 
        url: 'https://cryptocampaign.netlify.app/campaigns/auth',
        expectedChanges: [
          'Navy background',
          'Navigation styling updates'
        ]
      },
      { 
        name: 'Setup Page', 
        url: 'https://cryptocampaign.netlify.app/setup',
        expectedChanges: [
          'Navy background instead of light gray',
          'Setup wizard on navy background'
        ]
      }
    ];
    
    const results = [];
    
    for (const pageInfo of pagesToCheck) {
      console.log(`\n📄 Checking ${pageInfo.name}: ${pageInfo.url}`);
      
      try {
        await page.goto(pageInfo.url, { waitUntil: 'networkidle2', timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for any animations/loading
        
        // Check body background color
        const bodyBg = await page.evaluate(() => {
          const body = document.body;
          return window.getComputedStyle(body).backgroundColor;
        });
        
        // Check if navigation exists and its styling
        const navStyling = await page.evaluate(() => {
          const header = document.querySelector('header');
          if (!header) return null;
          
          const styles = window.getComputedStyle(header);
          const cornerBrackets = document.querySelectorAll('header .absolute');
          
          return {
            backgroundColor: styles.backgroundColor,
            color: styles.color,
            hasCornerBrackets: cornerBrackets.length >= 4
          };
        });
        
        // Check main content background
        const mainContentBg = await page.evaluate(() => {
          const main = document.querySelector('main') || document.querySelector('.min-h-screen');
          if (!main) return null;
          
          const styles = window.getComputedStyle(main);
          return {
            backgroundColor: styles.backgroundColor,
            color: styles.color
          };
        });
        
        // Check for any elements that should have navy backgrounds
        const navyElements = await page.evaluate(() => {
          const elements = document.querySelectorAll('div, section');
          let navyCount = 0;
          let whiteCount = 0;
          
          elements.forEach(el => {
            const bg = window.getComputedStyle(el).backgroundColor;
            if (bg.includes('rgb(26, 35, 126)') || bg.includes('hsl(214, 100%, 21%)')) {
              navyCount++;
            } else if (bg.includes('rgb(255, 255, 255)') || bg === 'white') {
              whiteCount++;
            }
          });
          
          return { blueCount: navyCount, whiteCount, total: elements.length };
        });
        
        // Take a screenshot
        const screenshotPath = `/Users/Danallovertheplace/crypto-campaign-unified/frontend/scripts/screenshots/${pageInfo.name.replace(/\s/g, '_').toLowerCase()}_live.png`;
        await page.screenshot({ 
          path: screenshotPath, 
          fullPage: true 
        });
        
        const pageResult = {
          page: pageInfo.name,
          url: pageInfo.url,
          bodyBackground: bodyBg,
          navigationStyling: navStyling,
          mainContentStyling: mainContentBg,
          elementAnalysis: navyElements,
          screenshot: screenshotPath,
          expectedChanges: pageInfo.expectedChanges
        };
        
        results.push(pageResult);
        
        console.log(`✅ ${pageInfo.name} analyzed`);
        console.log(`   Body BG: ${bodyBg}`);
        console.log(`   Nav BG: ${navStyling?.backgroundColor || 'Not found'}`);
        console.log(`   Corner Brackets: ${navStyling?.hasCornerBrackets ? 'YES' : 'NO'}`);
        console.log(`   Navy elements: ${navyElements.blueCount}, White elements: ${navyElements.whiteCount}`);
        
      } catch (error) {
        console.log(`❌ Error checking ${pageInfo.name}: ${error.message}`);
        results.push({
          page: pageInfo.name,
          url: pageInfo.url,
          error: error.message,
          expectedChanges: pageInfo.expectedChanges
        });
      }
    }
    
    // Calculate implementation percentage
    console.log('\n🔍 ANALYSIS SUMMARY:');
    console.log('===================');
    
    let totalExpectedChanges = 0;
    let implementedChanges = 0;
    
    results.forEach(result => {
      if (result.error) {
        console.log(`\n❌ ${result.page}: Could not access (${result.error})`);
        return;
      }
      
      console.log(`\n📊 ${result.page}:`);
      totalExpectedChanges += result.expectedChanges.length;
      
      let pageImplementedCount = 0;
      
      // Check if background is navy blue (correct color)
      const hasNavyBackground = result.bodyBackground.includes('rgb(26, 35, 126)') || 
                               result.bodyBackground.includes('hsl(214, 100%, 21%)') ||
                               result.mainContentStyling?.backgroundColor.includes('rgb(26, 35, 126)') ||
                               result.elementAnalysis.blueCount > 0;
      
      if (hasNavyBackground) {
        pageImplementedCount++;
        console.log('   ✅ Navy background detected');
      } else {
        console.log('   ❌ Navy background missing');
      }
      
      // Check navigation styling  
      if (result.navigationStyling?.hasCornerBrackets) {
        pageImplementedCount++;
        console.log('   ✅ Navigation corner brackets present');
      } else {
        console.log('   ❌ Navigation corner brackets missing');
      }
      
      // Check if navigation has navy background
      if (result.navigationStyling?.backgroundColor.includes('rgb(26, 35, 126)')) {
        pageImplementedCount++;
        console.log('   ✅ Navigation has navy background');
      } else {
        console.log('   ❌ Navigation navy background missing');
      }
      
      implementedChanges += pageImplementedCount;
      
      const pagePercentage = Math.round((pageImplementedCount / result.expectedChanges.length) * 100);
      console.log(`   📈 Page completion: ${pagePercentage}%`);
    });
    
    const overallPercentage = Math.round((implementedChanges / totalExpectedChanges) * 100);
    
    console.log('\n🎯 FINAL RESULTS:');
    console.log('================');
    console.log(`Total expected changes: ${totalExpectedChanges}`);
    console.log(`Changes implemented: ${implementedChanges}`);
    console.log(`🔥 IMPLEMENTATION PERCENTAGE: ${overallPercentage}%`);
    
    if (overallPercentage >= 80) {
      console.log('🎉 Excellent! Most changes are live on the site.');
    } else if (overallPercentage >= 50) {
      console.log('⚡ Good progress! Some changes are visible but more deployment needed.');
    } else {
      console.log('🚧 Changes may not be deployed yet or need troubleshooting.');
    }
    
    // Save results to file
    const resultsPath = '/Users/Danallovertheplace/crypto-campaign-unified/frontend/scripts/site-analysis-results.json';
    fs.writeFileSync(resultsPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      overallPercentage,
      implementedChanges,
      totalExpectedChanges,
      pageResults: results
    }, null, 2));
    
    console.log(`\n📁 Full results saved to: ${resultsPath}`);
    return overallPercentage;
    
  } finally {
    await browser.close();
  }
}

// Run the analysis
analyzeLiveSite()
  .then(percentage => {
    console.log(`\n🏁 Analysis complete! Implementation: ${percentage}%`);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });