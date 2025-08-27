const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Starting Design System Verification...');
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Navigate to the live site
    console.log('📡 Navigating to https://cryptocampaign.netlify.app...');
    await page.goto('https://cryptocampaign.netlify.app', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log('✅ Page loaded successfully');
    
    // Check for design system CSS variables
    const designSystemCheck = await page.evaluate(() => {
      const computedStyle = getComputedStyle(document.documentElement);
      
      return {
        cryptoNavy: computedStyle.getPropertyValue('--crypto-navy').trim(),
        cryptoBlue: computedStyle.getPropertyValue('--crypto-blue').trim(), 
        cryptoGold: computedStyle.getPropertyValue('--crypto-gold').trim(),
        cryptoWhite: computedStyle.getPropertyValue('--crypto-white').trim(),
        primaryColor: computedStyle.getPropertyValue('--primary').trim(),
        accentColor: computedStyle.getPropertyValue('--accent').trim(),
        backgroundColor: computedStyle.getPropertyValue('--background').trim()
      };
    });
    
    console.log('🎨 Design System Variables Check:');
    console.log('  --crypto-navy:', designSystemCheck.cryptoNavy || 'NOT FOUND');
    console.log('  --crypto-blue:', designSystemCheck.cryptoBlue || 'NOT FOUND'); 
    console.log('  --crypto-gold:', designSystemCheck.cryptoGold || 'NOT FOUND');
    console.log('  --crypto-white:', designSystemCheck.cryptoWhite || 'NOT FOUND');
    console.log('  --primary:', designSystemCheck.primaryColor || 'NOT FOUND');
    console.log('  --accent:', designSystemCheck.accentColor || 'NOT FOUND');
    
    // Check for design system classes
    const cssClassCheck = await page.evaluate(() => {
      const classes = {
        cryptoCard: document.querySelector('.crypto-card') !== null,
        btnPrimary: document.querySelector('.btn-primary') !== null,
        btnSecondary: document.querySelector('.btn-secondary') !== null,
        formInput: document.querySelector('.form-input') !== null,
        formLabel: document.querySelector('.form-label') !== null,
        containerResponsive: document.querySelector('.container-responsive') !== null,
        heroSection: document.querySelector('.hero-section') !== null
      };
      
      return classes;
    });
    
    console.log('🔍 CSS Classes Check:');
    console.log('  .crypto-card:', cssClassCheck.cryptoCard ? '✅ FOUND' : '❌ NOT FOUND');
    console.log('  .btn-primary:', cssClassCheck.btnPrimary ? '✅ FOUND' : '❌ NOT FOUND');
    console.log('  .btn-secondary:', cssClassCheck.btnSecondary ? '✅ FOUND' : '❌ NOT FOUND');
    console.log('  .form-input:', cssClassCheck.formInput ? '✅ FOUND' : '❌ NOT FOUND');
    console.log('  .form-label:', cssClassCheck.formLabel ? '✅ FOUND' : '❌ NOT FOUND');
    console.log('  .container-responsive:', cssClassCheck.containerResponsive ? '✅ FOUND' : '❌ NOT FOUND');
    console.log('  .hero-section:', cssClassCheck.heroSection ? '✅ FOUND' : '❌ NOT FOUND');
    
    // Check for consistent HSL color usage
    const colorUsageCheck = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      let hslUsage = 0;
      let hardcodedColors = 0;
      
      allElements.forEach(el => {
        const computedStyle = window.getComputedStyle(el);
        const color = computedStyle.color;
        const backgroundColor = computedStyle.backgroundColor;
        const borderColor = computedStyle.borderColor;
        
        [color, backgroundColor, borderColor].forEach(colorValue => {
          if (colorValue && colorValue !== 'rgba(0, 0, 0, 0)' && colorValue !== 'transparent') {
            if (colorValue.includes('hsl(')) {
              hslUsage++;
            } else if (colorValue.includes('rgb(') || colorValue.includes('#')) {
              hardcodedColors++;
            }
          }
        });
      });
      
      return { hslUsage, hardcodedColors };
    });
    
    console.log('🎨 Color Usage Analysis:');
    console.log('  HSL Colors:', colorUsageCheck.hslUsage);
    console.log('  Hardcoded Colors:', colorUsageCheck.hardcodedColors);
    
    const colorCompliance = colorUsageCheck.hslUsage > 0 ? 
      Math.round((colorUsageCheck.hslUsage / (colorUsageCheck.hslUsage + colorUsageCheck.hardcodedColors)) * 100) : 0;
    console.log('  Color System Compliance:', colorCompliance + '%');
    
    // Check specific design system elements
    const specificElementCheck = await page.evaluate(() => {
      return {
        navyHeadings: document.querySelectorAll('[style*="hsl(var(--crypto-navy))"]').length,
        goldAccents: document.querySelectorAll('[style*="hsl(var(--crypto-gold))"]').length,
        whiteText: document.querySelectorAll('[style*="hsl(var(--crypto-white))"]').length,
        hasHeroSection: document.querySelector('.hero-section') !== null,
        hasFooter: document.querySelector('.app-footer') !== null || document.querySelector('footer') !== null
      };
    });
    
    console.log('🏗️ Specific Design Elements:');
    console.log('  Navy Blue Elements:', specificElementCheck.navyHeadings);
    console.log('  Gold Accent Elements:', specificElementCheck.goldAccents);
    console.log('  White Text Elements:', specificElementCheck.whiteText);
    console.log('  Hero Section:', specificElementCheck.hasHeroSection ? '✅ FOUND' : '❌ NOT FOUND');
    console.log('  Footer:', specificElementCheck.hasFooter ? '✅ FOUND' : '❌ NOT FOUND');
    
    // Overall compliance score
    const totalChecks = 7; // Number of CSS class checks
    const passedChecks = Object.values(cssClassCheck).filter(Boolean).length;
    const overallCompliance = Math.round((passedChecks / totalChecks) * 100);
    
    console.log('\n📊 DESIGN SYSTEM VERIFICATION SUMMARY:');
    console.log('================================');
    console.log('Overall CSS Class Compliance:', overallCompliance + '%');
    console.log('Color System Usage:', colorCompliance + '%');
    console.log('Design Variables Present:', designSystemCheck.cryptoNavy ? '✅ YES' : '❌ NO');
    console.log('Core Classes Working:', cssClassCheck.containerResponsive && cssClassCheck.heroSection ? '✅ YES' : '❌ NO');
    
    if (overallCompliance >= 85) {
      console.log('🎉 DESIGN SYSTEM SUCCESS: Excellent compliance!');
    } else if (overallCompliance >= 70) {
      console.log('⚠️ DESIGN SYSTEM WARNING: Good but needs improvement');
    } else {
      console.log('❌ DESIGN SYSTEM FAILURE: Major issues detected');
    }
    
    // Take a screenshot for visual verification
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/design-system-verification.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: design-system-verification.png');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    
    // Try to get more info about the error
    if (error.message.includes('timeout') || error.message.includes('navigation')) {
      console.log('🕒 Site may still be deploying. Please try again in a few minutes.');
    }
  } finally {
    await browser.close();
    console.log('🏁 Verification complete');
  }
})();