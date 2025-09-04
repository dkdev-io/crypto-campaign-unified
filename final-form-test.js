/**
 * Final Visual Form Testing
 * Working version to verify form improvements
 */

import puppeteer from 'puppeteer';
import fs from 'fs';

async function finalFormTest() {
  console.log('🎭 Starting final form testing...');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 1000,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  const baseUrl = 'http://localhost:5174';
  const screenshots = [];
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  try {
    console.log('📱 Testing landing page...');
    await page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 15000 });
    await delay(1000);
    
    await page.screenshot({ 
      path: 'final-landing.png',
      fullPage: true 
    });
    screenshots.push('final-landing.png');
    console.log('📸 Screenshot: Landing page captured');

    console.log('🔑 Testing campaign auth bypass...');
    await page.goto(`${baseUrl}/campaigns/auth?devbypass=true`, { 
      waitUntil: 'networkidle0', 
      timeout: 15000 
    });
    await delay(2000);
    
    await page.screenshot({ 
      path: 'final-campaign-auth.png',
      fullPage: true 
    });
    screenshots.push('final-campaign-auth.png');
    console.log('📸 Screenshot: Campaign auth with bypass');

    console.log('💰 Testing donor auth bypass...');
    await page.goto(`${baseUrl}/donors/auth?devbypass=true`, { 
      waitUntil: 'networkidle0', 
      timeout: 15000 
    });
    await delay(2000);
    
    await page.screenshot({ 
      path: 'final-donor-auth.png',
      fullPage: true 
    });
    screenshots.push('final-donor-auth.png');
    console.log('📸 Screenshot: Donor auth with bypass');

    console.log('🏢 Testing direct setup access...');
    await page.goto(`${baseUrl}/campaigns/auth/setup`, { 
      waitUntil: 'networkidle0', 
      timeout: 15000 
    });
    await delay(2000);
    
    await page.screenshot({ 
      path: 'final-setup-page.png',
      fullPage: true 
    });
    screenshots.push('final-setup-page.png');
    console.log('📸 Screenshot: Setup page');

    // Analyze forms on current page
    console.log('🔍 Analyzing forms...');
    const formAnalysis = await page.evaluate(() => {
      const analysis = {
        pageUrl: window.location.href,
        pageTitle: document.title,
        formElements: {
          headers: [],
          inputs: [],
          buttons: []
        }
      };

      // Headers
      document.querySelectorAll('h1, h2, h3').forEach(header => {
        const styles = window.getComputedStyle(header);
        analysis.formElements.headers.push({
          tag: header.tagName,
          text: header.textContent.trim(),
          fontSize: styles.fontSize,
          fontWeight: styles.fontWeight,
          color: styles.color,
          fontFamily: styles.fontFamily.split(',')[0].replace(/['"]/g, '')
        });
      });

      // Inputs
      document.querySelectorAll('input').forEach(input => {
        const styles = window.getComputedStyle(input);
        analysis.formElements.inputs.push({
          type: input.type,
          placeholder: input.placeholder || '',
          fontSize: styles.fontSize,
          padding: styles.padding,
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          fontFamily: styles.fontFamily.split(',')[0].replace(/['"]/g, '')
        });
      });

      // Buttons
      document.querySelectorAll('button').forEach(button => {
        const styles = window.getComputedStyle(button);
        analysis.formElements.buttons.push({
          text: button.textContent.trim(),
          fontSize: styles.fontSize,
          fontWeight: styles.fontWeight,
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          padding: styles.padding,
          fontFamily: styles.fontFamily.split(',')[0].replace(/['"]/g, '')
        });
      });

      return analysis;
    });

    // Save detailed analysis
    fs.writeFileSync('final-form-analysis.json', JSON.stringify(formAnalysis, null, 2));
    console.log('💾 Form analysis saved');

    // Test console errors
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
    });

    // Test specific routes
    const testRoutes = [
      { name: 'Committee Manager', url: '/committee-manager' },
      { name: 'Admin Dashboard', url: '/admin' },
      { name: 'Donor Dashboard', url: '/donors/dashboard' }
    ];

    for (let route of testRoutes) {
      try {
        console.log(`🌐 Testing ${route.name}...`);
        await page.goto(baseUrl + route.url, { 
          waitUntil: 'networkidle0', 
          timeout: 10000 
        });
        await delay(1500);
        
        const filename = `final-${route.name.toLowerCase().replace(/\s+/g, '-')}.png`;
        await page.screenshot({ 
          path: filename,
          fullPage: true 
        });
        screenshots.push(filename);
        console.log(`📸 Screenshot: ${route.name}`);
        
      } catch (err) {
        console.log(`⚠️ Could not access ${route.name}: ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
    
    // Error screenshot
    try {
      await page.screenshot({ 
        path: 'final-error.png',
        fullPage: true 
      });
      screenshots.push('final-error.png');
    } catch (screenshotError) {
      console.log('Could not take error screenshot');
    }
  } finally {
    await browser.close();
  }

  // Generate comprehensive report
  const report = {
    timestamp: new Date().toISOString(),
    testType: 'final-form-verification',
    screenshotCount: screenshots.length,
    screenshots: screenshots,
    status: screenshots.length > 0 ? 'completed' : 'failed',
    summary: {
      landingPageTested: screenshots.includes('final-landing.png'),
      campaignAuthTested: screenshots.includes('final-campaign-auth.png'),
      donorAuthTested: screenshots.includes('final-donor-auth.png'),
      setupPageTested: screenshots.includes('final-setup-page.png')
    }
  };

  fs.writeFileSync('final-test-report.json', JSON.stringify(report, null, 2));
  
  console.log('\n✅ Final form testing completed!');
  console.log(`📸 Total screenshots: ${screenshots.length}`);
  console.log('\n📋 Generated files:');
  screenshots.forEach(screenshot => console.log(`   📷 ${screenshot}`));
  console.log('   📊 final-form-analysis.json');
  console.log('   📋 final-test-report.json');
  
  if (screenshots.length > 0) {
    console.log('\n🎯 VISUAL VERIFICATION:');
    console.log('Please review the screenshots to verify:');
    console.log('   • Consistent header typography (2rem, Inter font)');
    console.log('   • Standardized button styling');
    console.log('   • Proper input field styling');
    console.log('   • HSL color scheme implementation');
    console.log('   • Form readability improvements');
  }
}

finalFormTest().catch(console.error);