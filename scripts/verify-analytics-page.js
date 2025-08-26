const puppeteer = require('puppeteer');

async function verifyAnalyticsPage() {
  console.log('🔍 Starting page verification...\n');
  
  try {
    const browser = await puppeteer.launch({
      headless: true, // Run headless for verification
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Capture console logs
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text()
      });
    });
    
    // Navigate to the analytics demo page
    console.log('📱 Navigating to: http://localhost:5173/analytics-demo');
    
    try {
      await page.goto('http://localhost:5173/analytics-demo', { 
        waitUntil: 'networkidle0',
        timeout: 10000 
      });
    } catch (error) {
      console.log('❌ Error loading page:', error.message);
      console.log('\nTrying alternative URL: http://localhost:5173/');
      
      // Try the root URL instead
      await page.goto('http://localhost:5173/', { 
        waitUntil: 'networkidle0',
        timeout: 10000 
      });
    }
    
    // Wait a moment for React to render
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get page title and URL
    const pageTitle = await page.title();
    const currentUrl = page.url();
    
    console.log('\n📄 PAGE METADATA:');
    console.log('  Title:', pageTitle);
    console.log('  Current URL:', currentUrl);
    
    // Check for main elements
    console.log('\n🔍 CHECKING FOR KEY ELEMENTS:\n');
    
    // Check for analytics demo header
    const demoHeader = await page.evaluate(() => {
      const h1Elements = Array.from(document.querySelectorAll('h1'));
      const analyticsHeader = h1Elements.find(el => el.textContent.includes('Analytics Demo'));
      return analyticsHeader ? analyticsHeader.textContent : null;
    });
    console.log('✓ Analytics Demo Header:', demoHeader || '❌ NOT FOUND');
    
    // Check for SimpleDonorForm
    const formExists = await page.evaluate(() => {
      // Look for form elements that indicate SimpleDonorForm
      const hasForm = !!document.querySelector('form');
      const hasFirstNameField = !!Array.from(document.querySelectorAll('label')).find(l => l.textContent.includes('First Name'));
      const hasAmountField = !!Array.from(document.querySelectorAll('label')).find(l => l.textContent.includes('Contribution Amount'));
      const hasWalletField = !!Array.from(document.querySelectorAll('label')).find(l => l.textContent.includes('Wallet Address'));
      
      return {
        hasForm,
        hasFirstNameField,
        hasAmountField,
        hasWalletField
      };
    });
    console.log('✓ Form exists:', formExists.hasForm ? 'YES' : '❌ NO');
    console.log('✓ First Name field:', formExists.hasFirstNameField ? 'YES' : '❌ NO');
    console.log('✓ Amount field:', formExists.hasAmountField ? 'YES' : '❌ NO');
    console.log('✓ Wallet field:', formExists.hasWalletField ? 'YES' : '❌ NO');
    
    // Check for Analytics Provider
    const analyticsStatus = await page.evaluate(() => {
      return {
        hasGlobalAnalytics: typeof window.campaignAnalytics !== 'undefined',
        hasTrackEvent: typeof window.trackEvent === 'function',
        hasGetStatus: typeof window.getAnalyticsStatus === 'function'
      };
    });
    console.log('\n✓ Analytics Integration:');
    console.log('  - Global analytics object:', analyticsStatus.hasGlobalAnalytics ? 'YES' : '❌ NO');
    console.log('  - trackEvent function:', analyticsStatus.hasTrackEvent ? 'YES' : '❌ NO');
    console.log('  - getAnalyticsStatus function:', analyticsStatus.hasGetStatus ? 'YES' : '❌ NO');
    
    // Check for Privacy Banner
    const privacyBanner = await page.evaluate(() => {
      const bannerTexts = Array.from(document.querySelectorAll('*')).map(el => el.textContent);
      const hasCookieBanner = bannerTexts.some(text => text && text.includes('Help Us Improve Your Experience'));
      const hasAcceptButton = !!Array.from(document.querySelectorAll('button')).find(btn => btn.textContent === 'Accept');
      return { hasCookieBanner, hasAcceptButton };
    });
    console.log('\n✓ Privacy Banner:');
    console.log('  - Banner present:', privacyBanner.hasCookieBanner ? 'YES' : '❌ NO');
    console.log('  - Accept button:', privacyBanner.hasAcceptButton ? 'YES' : '❌ NO');
    
    // Get all visible text to check what's actually rendered
    const visibleText = await page.evaluate(() => {
      const body = document.body;
      if (!body) return 'No body element found';
      
      // Get the main visible text
      const mainContent = Array.from(document.querySelectorAll('h1, h2, h3, p, label, button'))
        .map(el => el.textContent.trim())
        .filter(text => text.length > 0)
        .slice(0, 20); // First 20 text elements
      
      return mainContent;
    });
    
    console.log('\n📝 VISIBLE TEXT ON PAGE:');
    visibleText.forEach((text, i) => {
      console.log(`  ${i + 1}. ${text.substring(0, 60)}${text.length > 60 ? '...' : ''}`);
    });
    
    // Check what route is actually loading
    const routeInfo = await page.evaluate(() => {
      const pathname = window.location.pathname;
      const search = window.location.search;
      
      // Try to find which component is rendering
      const hasAuthComponent = !!document.querySelector('*[class*="auth"]') || 
                              Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes('Sign'));
      const hasSetupWizard = Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes('Setup'));
      const hasTestRoute = Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes('Test Route Works'));
      
      return {
        pathname,
        search,
        hasAuthComponent,
        hasSetupWizard,
        hasTestRoute
      };
    });
    
    console.log('\n🛣️ ROUTE INFORMATION:');
    console.log('  Path:', routeInfo.pathname);
    console.log('  Query:', routeInfo.search);
    console.log('  Auth component:', routeInfo.hasAuthComponent ? 'YES' : 'NO');
    console.log('  Setup wizard:', routeInfo.hasSetupWizard ? 'YES' : 'NO');
    console.log('  Test route:', routeInfo.hasTestRoute ? 'YES' : 'NO');
    
    // Check console logs for errors
    const errors = consoleLogs.filter(log => log.type === 'error');
    if (errors.length > 0) {
      console.log('\n⚠️ CONSOLE ERRORS:');
      errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.text}`);
      });
    }
    
    // Take a screenshot for visual verification
    await page.screenshot({ 
      path: '/tmp/analytics-page-verification.png',
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved to: /tmp/analytics-page-verification.png');
    
    // ANALYSIS
    console.log('\n' + '='.repeat(60));
    console.log('📊 ANALYSIS - WHAT\'S NOT CORRECT:\n');
    
    const issues = [];
    
    if (currentUrl.includes('/analytics-demo')) {
      if (!demoHeader) {
        issues.push('❌ Analytics demo header is missing - the route might not be configured properly');
      }
      if (!formExists.hasForm) {
        issues.push('❌ SimpleDonorForm is not rendering - component import or routing issue');
      }
      if (!analyticsStatus.hasGlobalAnalytics) {
        issues.push('❌ Analytics not initialized - AnalyticsProvider might not be wrapping the component');
      }
      if (!privacyBanner.hasCookieBanner) {
        issues.push('❌ Privacy banner is missing - PrivacyBanner component not rendered');
      }
    } else {
      issues.push(`❌ Not on /analytics-demo route - instead showing ${currentUrl}`);
      issues.push('❌ The route might not be properly configured in App.jsx');
    }
    
    if (routeInfo.hasAuthComponent) {
      issues.push('⚠️ Auth component is showing instead of analytics demo - routing issue');
    }
    
    if (issues.length === 0) {
      console.log('✅ Everything appears to be working correctly!');
    } else {
      issues.forEach(issue => console.log(issue));
    }
    
    await browser.close();
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

// Run verification
verifyAnalyticsPage();