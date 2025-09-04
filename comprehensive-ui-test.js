import puppeteer from 'puppeteer';
import fs from 'fs';

async function comprehensiveUITest() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  const results = {
    homePageReference: null,
    donorWorkflow: [],
    campaignWorkflow: [],
    summary: {
      emojisRemoved: 0,
      backgroundsConsistent: 0,
      fontsConsistent: 0,
      totalPages: 0
    }
  };

  try {
    console.log('🔍 Starting Comprehensive UI Verification...\n');
    
    // 1. Get home page reference
    console.log('📏 Getting home page reference styles...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    
    const homeReference = await page.evaluate(() => {
      const body = document.body;
      const h1 = document.querySelector('h1');
      const bodyStyles = window.getComputedStyle(body);
      const h1Styles = h1 ? window.getComputedStyle(h1) : null;
      
      return {
        backgroundColor: bodyStyles.backgroundColor,
        color: bodyStyles.color,
        fontFamily: bodyStyles.fontFamily,
        h1FontSize: h1Styles?.fontSize,
        h1FontFamily: h1Styles?.fontFamily,
        h1FontWeight: h1Styles?.fontWeight
      };
    });
    
    results.homePageReference = homeReference;
    console.log('✅ Home page styles captured');
    
    // 2. Test donor workflow with bypass
    console.log('\n👤 Testing Donor Workflow...');
    
    const donorPages = [
      { name: 'Donor Auth', url: '/donors/auth', hasHeader: true },
      { name: 'Donor Dashboard (bypassed)', url: '/donors/auth', hasHeader: true, useBypass: true }
    ];
    
    for (const pageInfo of donorPages) {
      try {
        console.log(`  Testing ${pageInfo.name}...`);
        await page.goto(`http://localhost:5173${pageInfo.url}`, { waitUntil: 'networkidle0' });
        
        if (pageInfo.useBypass) {
          // Click the bypass button
          try {
            const bypassButton = await page.waitForSelector('button:has-text("DEV BYPASS")', { timeout: 3000 });
            await bypassButton.click();
            await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
          } catch (e) {
            console.log('    No bypass button found or navigation failed');
          }
        }
        
        const pageTest = await page.evaluate((homeRef) => {
          const body = document.body;
          const h1 = document.querySelector('h1');
          const h2 = document.querySelector('h2');
          const bodyStyles = window.getComputedStyle(body);
          
          // Check for emojis in text content
          const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
          const textContent = document.body.textContent || '';
          const emojis = textContent.match(emojiRegex) || [];
          
          const mainHeading = h1 || h2;
          const headingStyles = mainHeading ? window.getComputedStyle(mainHeading) : null;
          
          return {
            url: window.location.href,
            pageTitle: document.title,
            emojisFound: emojis,
            emojiCount: emojis.length,
            backgroundColor: bodyStyles.backgroundColor,
            backgroundMatches: bodyStyles.backgroundColor === homeRef.backgroundColor,
            fontFamily: bodyStyles.fontFamily,
            fontMatches: bodyStyles.fontFamily === homeRef.fontFamily,
            headingText: mainHeading?.textContent?.trim(),
            headingFontSize: headingStyles?.fontSize,
            headingFontFamily: headingStyles?.fontFamily,
            headingUsesDesignSystem: mainHeading?.getAttribute('style')?.includes('var(--text-heading')
          };
        }, homeReference);
        
        results.donorWorkflow.push({
          ...pageInfo,
          ...pageTest
        });
        
        console.log(`    Emojis: ${pageTest.emojiCount === 0 ? '✅ None' : '❌ ' + pageTest.emojiCount + ' found'}`);
        console.log(`    Background: ${pageTest.backgroundMatches ? '✅ Matches home' : '❌ Different'}`);
        console.log(`    Fonts: ${pageTest.fontMatches ? '✅ Matches home' : '❌ Different'}`);
        
      } catch (error) {
        console.log(`    ❌ Error: ${error.message}`);
        results.donorWorkflow.push({
          ...pageInfo,
          error: error.message
        });
      }
    }
    
    // 3. Test campaign workflow with bypass
    console.log('\n🏛️ Testing Campaign Workflow...');
    
    const campaignPages = [
      { name: 'Campaign Auth', url: '/campaigns/auth', hasHeader: true },
      { name: 'Campaign Setup (bypassed)', url: '/campaigns/auth', hasHeader: true, useBypass: true }
    ];
    
    for (const pageInfo of campaignPages) {
      try {
        console.log(`  Testing ${pageInfo.name}...`);
        await page.goto(`http://localhost:5173${pageInfo.url}`, { waitUntil: 'networkidle0' });
        
        if (pageInfo.useBypass) {
          try {
            const bypassButton = await page.waitForSelector('button:has-text("DEV BYPASS")', { timeout: 3000 });
            await bypassButton.click();
            await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
          } catch (e) {
            console.log('    No bypass button found or navigation failed');
          }
        }
        
        const pageTest = await page.evaluate((homeRef) => {
          const body = document.body;
          const h1 = document.querySelector('h1');
          const h2 = document.querySelector('h2');
          const bodyStyles = window.getComputedStyle(body);
          
          const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
          const textContent = document.body.textContent || '';
          const emojis = textContent.match(emojiRegex) || [];
          
          const mainHeading = h1 || h2;
          const headingStyles = mainHeading ? window.getComputedStyle(mainHeading) : null;
          
          return {
            url: window.location.href,
            pageTitle: document.title,
            emojisFound: emojis,
            emojiCount: emojis.length,
            backgroundColor: bodyStyles.backgroundColor,
            backgroundMatches: bodyStyles.backgroundColor === homeRef.backgroundColor,
            fontFamily: bodyStyles.fontFamily,
            fontMatches: bodyStyles.fontFamily === homeRef.fontFamily,
            headingText: mainHeading?.textContent?.trim(),
            headingFontSize: headingStyles?.fontSize,
            headingFontFamily: headingStyles?.fontFamily,
            headingUsesDesignSystem: mainHeading?.getAttribute('style')?.includes('var(--text-heading')
          };
        }, homeReference);
        
        results.campaignWorkflow.push({
          ...pageInfo,
          ...pageTest
        });
        
        console.log(`    Emojis: ${pageTest.emojiCount === 0 ? '✅ None' : '❌ ' + pageTest.emojiCount + ' found'}`);
        console.log(`    Background: ${pageTest.backgroundMatches ? '✅ Matches home' : '❌ Different'}`);
        console.log(`    Fonts: ${pageTest.fontMatches ? '✅ Matches home' : '❌ Different'}`);
        
      } catch (error) {
        console.log(`    ❌ Error: ${error.message}`);
        results.campaignWorkflow.push({
          ...pageInfo,
          error: error.message
        });
      }
    }
    
    // 4. Calculate percentages
    const allPages = [...results.donorWorkflow, ...results.campaignWorkflow].filter(p => !p.error);
    results.summary.totalPages = allPages.length;
    
    results.summary.emojisRemoved = Math.round(
      (allPages.filter(p => p.emojiCount === 0).length / allPages.length) * 100
    );
    
    results.summary.backgroundsConsistent = Math.round(
      (allPages.filter(p => p.backgroundMatches).length / allPages.length) * 100
    );
    
    results.summary.fontsConsistent = Math.round(
      (allPages.filter(p => p.fontMatches).length / allPages.length) * 100
    );
    
    // 5. Generate final report
    console.log('\n📊 FINAL VERIFICATION RESULTS');
    console.log('='.repeat(50));
    console.log(`Total pages tested: ${results.summary.totalPages}`);
    console.log(`Emojis removed: ${results.summary.emojisRemoved}%`);
    console.log(`Background consistency: ${results.summary.backgroundsConsistent}%`);
    console.log(`Font consistency: ${results.summary.fontsConsistent}%`);
    
    const overallScore = Math.round(
      (results.summary.emojisRemoved + results.summary.backgroundsConsistent + results.summary.fontsConsistent) / 3
    );
    console.log(`\n🎯 OVERALL UI CONSISTENCY: ${overallScore}%`);
    
    // Save detailed report
    fs.writeFileSync('./ui-verification-report.json', JSON.stringify(results, null, 2));
    console.log('\n📄 Detailed report saved to: ui-verification-report.json');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    return { overallScore, results };
    
  } finally {
    await browser.close();
  }
}

comprehensiveUITest().catch(console.error);