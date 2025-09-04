import puppeteer from 'puppeteer';

async function verifyFinalFixes() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🔍 FINAL VERIFICATION - Checking all setup workflow steps...\n');
    
    // Get home page reference colors and fonts
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    const homeReference = await page.evaluate(() => {
      const computedStyles = getComputedStyle(document.documentElement);
      return {
        cryptoNavy: computedStyles.getPropertyValue('--crypto-navy').trim(),
        cryptoWhite: computedStyles.getPropertyValue('--crypto-white').trim(), 
        cryptoGold: computedStyles.getPropertyValue('--crypto-gold').trim(),
        bodyFont: getComputedStyle(document.body).fontFamily
      };
    });
    
    console.log('📏 Home page design system:');
    console.log(`  --crypto-navy: ${homeReference.cryptoNavy}`);
    console.log(`  --crypto-white: ${homeReference.cryptoWhite}`);
    console.log(`  --crypto-gold: ${homeReference.cryptoGold}`);
    console.log(`  Font family: ${homeReference.bodyFont}`);
    
    // Test individual setup components by navigating directly to their routes
    const testRoutes = [
      { name: 'Campaign Info', url: '/YourInfo' },
      { name: 'Committee Search', url: '/CommitteeSearch' },
      { name: 'Bank Connection', url: '/BankConnection' },
      { name: 'Website Style', url: '/WebsiteStyle' }
    ];
    
    const results = [];
    
    for (const route of testRoutes) {
      console.log(`\n🧪 Testing ${route.name} (${route.url})...`);
      
      try {
        await page.goto(`http://localhost:5173${route.url}`, { waitUntil: 'networkidle0' });
        
        const analysis = await page.evaluate((homeRef) => {
          // Check for emojis in entire page text
          const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[→←•]/gu;
          const textContent = document.body.textContent || '';
          const emojis = textContent.match(emojiRegex) || [];
          
          // Check background color consistency
          const body = document.body;
          const setupContainer = document.querySelector('.setup-container');
          const mainContainer = setupContainer || body;
          const computedBg = getComputedStyle(mainContainer).backgroundColor;
          
          // Check font family consistency
          const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'));
          const fontAnalysis = headings.map(h => ({
            tag: h.tagName,
            text: h.textContent?.trim().substring(0, 30),
            fontFamily: getComputedStyle(h).fontFamily,
            fontSize: getComputedStyle(h).fontSize,
            usesDesignSystem: h.getAttribute('style')?.includes('var(--text-heading')
          }));
          
          // Check for hardcoded colors in inline styles
          const elementsWithInlineColors = Array.from(document.querySelectorAll('*[style*="#"]')).map(el => ({
            tag: el.tagName,
            style: el.getAttribute('style')?.substring(0, 100),
            text: el.textContent?.trim().substring(0, 30)
          }));
          
          return {
            emojisFound: emojis,
            emojiCount: emojis.length,
            backgroundColor: computedBg,
            mainHeading: document.querySelector('h1, h2')?.textContent?.trim(),
            fontAnalysis: fontAnalysis,
            hardcodedColors: elementsWithInlineColors,
            pageTitle: document.title,
            url: window.location.href
          };
        }, homeReference);
        
        results.push({
          route: route.name,
          url: route.url,
          ...analysis
        });
        
        console.log(`  Heading: "${analysis.mainHeading}"`);
        console.log(`  Emojis: ${analysis.emojiCount === 0 ? '✅ None' : '❌ Found ' + analysis.emojiCount + ': ' + analysis.emojisFound.join(', ')}`);
        console.log(`  Background: ${analysis.backgroundColor}`);
        console.log(`  Hardcoded colors: ${analysis.hardcodedColors.length === 0 ? '✅ None' : '⚠️ Found ' + analysis.hardcodedColors.length}`);
        console.log(`  Fonts using design system: ${analysis.fontAnalysis.filter(f => f.usesDesignSystem).length}/${analysis.fontAnalysis.length}`);
        
        if (analysis.hardcodedColors.length > 0) {
          console.log(`    Examples: ${analysis.hardcodedColors.slice(0, 2).map(el => el.style).join('; ')}`);
        }
        
      } catch (error) {
        console.log(`  ❌ Error testing ${route.name}: ${error.message}`);
        results.push({
          route: route.name,
          url: route.url,
          error: error.message
        });
      }
    }
    
    // Calculate final percentages
    const validResults = results.filter(r => !r.error);
    const emojisRemovedPercent = Math.round((validResults.filter(r => r.emojiCount === 0).length / validResults.length) * 100);
    const hardcodedColorsRemovedPercent = Math.round((validResults.filter(r => r.hardcodedColors.length === 0).length / validResults.length) * 100);
    
    console.log('\n🎯 FINAL VERIFICATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Pages tested: ${validResults.length}`);
    console.log(`Emojis completely removed: ${emojisRemovedPercent}%`);
    console.log(`Hardcoded colors removed: ${hardcodedColorsRemovedPercent}%`);
    console.log(`Design system font usage: Checking...`);
    
    const totalHeadings = validResults.reduce((sum, r) => sum + (r.fontAnalysis?.length || 0), 0);
    const designSystemHeadings = validResults.reduce((sum, r) => sum + (r.fontAnalysis?.filter(f => f.usesDesignSystem).length || 0), 0);
    const fontPercent = totalHeadings > 0 ? Math.round((designSystemHeadings / totalHeadings) * 100) : 0;
    
    console.log(`Font sizes using design system: ${fontPercent}%`);
    
    const overallScore = Math.round((emojisRemovedPercent + hardcodedColorsRemovedPercent + fontPercent) / 3);
    console.log(`\n🏆 OVERALL CONSISTENCY SCORE: ${overallScore}%`);
    
    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      homeReference,
      results,
      summary: {
        pagesTestedSuccessfully: validResults.length,
        emojisRemovedPercent,
        hardcodedColorsRemovedPercent,
        fontPercent,
        overallScore
      }
    };
    
    require('fs').writeFileSync('./final-verification-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to: final-verification-report.json');
    
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } finally {
    await browser.close();
  }
}

verifyFinalFixes().catch(console.error);