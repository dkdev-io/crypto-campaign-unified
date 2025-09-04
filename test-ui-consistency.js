import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testUIConsistency() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  const results = {
    pages: [],
    errors: [],
    emojis: [],
    inconsistentFonts: [],
    inconsistentColors: []
  };

  const baseURL = 'http://localhost:3000';
  
  // Pages to test
  const testPages = [
    { name: 'Home', url: '/' },
    { name: 'Campaign Auth', url: '/campaigns/auth' },
    { name: 'Donor Auth', url: '/donors/auth' },
    { name: 'Campaign Setup', url: '/campaigns/auth/setup' },
    { name: 'Campaign Info Form', url: '/YourInfo' },
    { name: 'Committee Search', url: '/CommitteeSearch' },
    { name: 'Bank Connection', url: '/BankConnection' },
    { name: 'Website Style', url: '/WebsiteStyle' }
  ];

  // Get home page styles as reference
  let homePageStyles = null;
  
  try {
    console.log('📊 Starting UI Consistency Test...\n');
    
    // First get home page reference styles
    await page.goto(baseURL);
    await page.waitForSelector('h1', { timeout: 5000 });
    
    homePageStyles = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const h2 = document.querySelector('h2');
      const button = document.querySelector('button');
      const body = document.querySelector('body');
      
      const getComputedStyle = (element) => {
        if (!element) return null;
        const styles = window.getComputedStyle(element);
        return {
          fontSize: styles.fontSize,
          fontFamily: styles.fontFamily,
          fontWeight: styles.fontWeight,
          color: styles.color,
          backgroundColor: styles.backgroundColor
        };
      };
      
      return {
        h1: getComputedStyle(h1),
        h2: getComputedStyle(h2),
        button: getComputedStyle(button),
        body: getComputedStyle(body)
      };
    });
    
    console.log('✅ Home page reference styles captured');
    
    // Test each page
    for (const testPage of testPages) {
      try {
        console.log(`🔍 Testing ${testPage.name}...`);
        
        await page.goto(baseURL + testPage.url, { waitUntil: 'networkidle0', timeout: 10000 });
        
        // Check for emojis in text content
        const emojis = await page.evaluate(() => {
          const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
          const textContent = document.body.textContent || '';
          const matches = textContent.match(emojiRegex);
          return matches ? Array.from(new Set(matches)) : [];
        });
        
        // Check font sizes on headings
        const fontSizes = await page.evaluate(() => {
          const headings = document.querySelectorAll('h1, h2, h3');
          return Array.from(headings).map(h => ({
            tag: h.tagName,
            fontSize: window.getComputedStyle(h).fontSize,
            text: h.textContent?.trim().substring(0, 50),
            hasInlineStyle: h.hasAttribute('style')
          }));
        });
        
        // Check for hardcoded colors
        const hardcodedColors = await page.evaluate(() => {
          const elements = document.querySelectorAll('*[style*="color"], *[class*="text-"], *[class*="bg-"]');
          const issues = [];
          
          elements.forEach(el => {
            const style = el.getAttribute('style') || '';
            const className = el.getAttribute('class') || '';
            
            // Check for hardcoded hex colors
            if (style.match(/#[0-9A-Fa-f]{3,6}/)) {
              issues.push({
                type: 'hardcoded-hex',
                element: el.tagName,
                style: style.substring(0, 100),
                text: el.textContent?.trim().substring(0, 30)
              });
            }
            
            // Check for specific problematic classes
            if (className.match(/text-(blue|gray|navy)-[0-9]|bg-(blue|gray|navy)-[0-9]/)) {
              issues.push({
                type: 'hardcoded-tailwind',
                element: el.tagName,
                className: className,
                text: el.textContent?.trim().substring(0, 30)
              });
            }
          });
          
          return issues;
        });
        
        const pageResult = {
          name: testPage.name,
          url: testPage.url,
          emojis: emojis,
          fontSizes: fontSizes,
          hardcodedColors: hardcodedColors,
          status: 'success'
        };
        
        results.pages.push(pageResult);
        
        if (emojis.length > 0) {
          console.log(`  ❌ Found emojis: ${emojis.join(', ')}`);
        } else {
          console.log(`  ✅ No emojis found`);
        }
        
        if (hardcodedColors.length > 0) {
          console.log(`  ⚠️  Found ${hardcodedColors.length} hardcoded color issues`);
        } else {
          console.log(`  ✅ No hardcoded color issues`);
        }
        
      } catch (error) {
        console.log(`  ❌ Error testing ${testPage.name}: ${error.message}`);
        results.errors.push({
          page: testPage.name,
          error: error.message
        });
      }
    }
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await browser.close();
  }
  
  // Generate report
  console.log('\n📋 UI CONSISTENCY TEST RESULTS\n');
  console.log('=' * 50);
  
  results.pages.forEach(page => {
    console.log(`\n${page.name} (${page.url}):`);
    console.log(`  Emojis: ${page.emojis.length === 0 ? '✅ None' : '❌ ' + page.emojis.length + ' found'}`);
    console.log(`  Color Issues: ${page.hardcodedColors.length === 0 ? '✅ None' : '⚠️ ' + page.hardcodedColors.length + ' found'}`);
    console.log(`  Font Sizes: ${page.fontSizes.length} headings checked`);
    
    if (page.emojis.length > 0) {
      console.log(`    Emojis found: ${page.emojis.join(', ')}`);
    }
    
    if (page.hardcodedColors.length > 0) {
      page.hardcodedColors.slice(0, 3).forEach(issue => {
        console.log(`    ${issue.type}: ${issue.element} - ${issue.style || issue.className}`);
      });
    }
  });
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    results.errors.forEach(err => {
      console.log(`  ${err.page}: ${err.error}`);
    });
  }
  
  // Save detailed results to file
  fs.writeFileSync(
    path.join(__dirname, 'ui-consistency-report.json'),
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n📄 Detailed report saved to: ui-consistency-report.json');
  
  return results;
}

// Check if we're running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testUIConsistency().catch(console.error);
}