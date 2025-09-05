const puppeteer = require('puppeteer');

async function testNetlifyDeployment() {
  console.log('🧪 COMPREHENSIVE NETLIFY DEPLOYMENT TEST');
  console.log('=========================================');
  
  const browser = await puppeteer.launch({
    headless: true, // Run headless for faster automated testing
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = {
    siteAccessible: false,
    latestCodeDeployed: false,
    authPagesWork: false,
    setupPagesWork: false,
    bypassFunctioning: false,
    jsErrors: [],
    consoleMessages: []
  };

  try {
    const page = await browser.newPage();
    
    // Capture console messages and errors
    page.on('console', msg => {
      const text = msg.text();
      results.consoleMessages.push(`${msg.type()}: ${text}`);
      if (msg.type() === 'error') {
        results.jsErrors.push(text);
      }
    });

    page.on('pageerror', error => {
      results.jsErrors.push(error.message);
    });

    // Test 1: Basic site accessibility
    console.log('1️⃣  Testing basic site accessibility...');
    try {
      await page.goto('https://cryptocampaign.netlify.app', {
        waitUntil: 'networkidle0',
        timeout: 15000
      });
      
      const title = await page.title();
      console.log(`✅ Site accessible - Title: ${title}`);
      results.siteAccessible = true;
      
      // Check if latest JavaScript bundle is loaded
      const scripts = await page.$$eval('script[src]', scripts => 
        scripts.map(script => script.src)
      );
      
      const hasNewBundle = scripts.some(src => src.includes('index-DtBPN3QI.js') || src.includes('index-') && !src.includes('index-CkHXklW8.js'));
      if (hasNewBundle) {
        console.log('✅ Latest JavaScript bundle detected');
        results.latestCodeDeployed = true;
      } else {
        console.log('⚠️  Could not confirm latest JavaScript bundle');
        console.log('   Scripts found:', scripts.filter(s => s.includes('index-')));
      }
      
    } catch (error) {
      console.log(`❌ Site inaccessible: ${error.message}`);
    }

    // Test 2: Campaign Auth Page
    console.log('2️⃣  Testing campaign auth page...');
    try {
      await page.goto('https://cryptocampaign.netlify.app/campaigns/auth', {
        waitUntil: 'networkidle0',
        timeout: 15000
      });
      
      // Wait for React to render
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const pageContent = await page.content();
      if (pageContent.includes('NEXTRAISE') || pageContent.includes('campaign') || pageContent.includes('auth')) {
        console.log('✅ Campaign auth page loads with expected content');
        results.authPagesWork = true;
      } else {
        console.log('⚠️  Campaign auth page content unclear');
      }
      
    } catch (error) {
      console.log(`❌ Campaign auth page failed: ${error.message}`);
    }

    // Test 3: Setup Page with Bypass
    console.log('3️⃣  Testing setup page with bypass parameter...');
    try {
      await page.goto('https://cryptocampaign.netlify.app/campaigns/auth/setup?bypass=true', {
        waitUntil: 'networkidle0',
        timeout: 15000
      });
      
      await new Promise(resolve => setTimeout(resolve, 5000)); // Give React time to render
      
      const currentUrl = page.url();
      console.log(`   Current URL: ${currentUrl}`);
      
      if (currentUrl.includes('setup')) {
        console.log('✅ Setup page accessible with bypass parameter');
        results.setupPagesWork = true;
      } else {
        console.log(`⚠️  Redirected to: ${currentUrl}`);
      }
      
    } catch (error) {
      console.log(`❌ Setup page with bypass failed: ${error.message}`);
    }

    // Test 4: Check for VITE environment variable handling
    console.log('4️⃣  Testing environment variable configuration...');
    try {
      // Check if VITE_SKIP_AUTH is properly handled in the built code
      const pageContent = await page.content();
      const response = await page.goto('https://cryptocampaign.netlify.app/assets/index-DtBPN3QI.js', {
        timeout: 10000
      });
      
      if (response && response.status() === 200) {
        const jsContent = await response.text();
        const hasViteConfig = jsContent.includes('VITE_') || jsContent.includes('import.meta.env');
        
        if (hasViteConfig) {
          console.log('✅ Vite environment configuration detected in bundle');
        } else {
          console.log('⚠️  Vite environment handling unclear in bundle');
        }
      }
      
    } catch (error) {
      console.log(`⚠️  Could not analyze JavaScript bundle: ${error.message}`);
    }

    // Test 5: Direct bypass functionality test
    console.log('5️⃣  Testing bypass functionality directly...');
    try {
      await page.goto('https://cryptocampaign.netlify.app/donors/auth?bypass=true', {
        waitUntil: 'networkidle0',
        timeout: 15000
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Look for bypass-related elements or console messages
      const bypassMessages = results.consoleMessages.filter(msg => 
        msg.toLowerCase().includes('bypass') || 
        msg.toLowerCase().includes('skip') ||
        msg.toLowerCase().includes('dev')
      );
      
      if (bypassMessages.length > 0) {
        console.log('✅ Bypass functionality detected in console logs');
        console.log('   Bypass messages:', bypassMessages.slice(0, 3));
        results.bypassFunctioning = true;
      } else {
        console.log('⚠️  No bypass-related console messages found');
      }
      
    } catch (error) {
      console.log(`⚠️  Bypass test inconclusive: ${error.message}`);
    }

    console.log('\n📊 COMPREHENSIVE TEST RESULTS');
    console.log('==============================');
    console.log(`Site Accessible: ${results.siteAccessible ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Latest Code Deployed: ${results.latestCodeDeployed ? '✅ PASS' : '⚠️  UNCLEAR'}`);
    console.log(`Auth Pages Work: ${results.authPagesWork ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Setup Pages Work: ${results.setupPagesWork ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Bypass Functioning: ${results.bypassFunctioning ? '✅ PASS' : '⚠️  UNCLEAR'}`);
    
    if (results.jsErrors.length > 0) {
      console.log(`\n⚠️  JavaScript Errors Found (${results.jsErrors.length}):`);
      results.jsErrors.slice(0, 5).forEach(error => console.log(`   • ${error}`));
    } else {
      console.log('\n✅ No JavaScript errors detected');
    }
    
    // Calculate success rate
    const tests = [
      results.siteAccessible,
      results.latestCodeDeployed,
      results.authPagesWork,
      results.setupPagesWork
    ];
    
    const passedTests = tests.filter(Boolean).length;
    const successRate = Math.round((passedTests / tests.length) * 100);
    
    console.log(`\n🎯 OVERALL SUCCESS RATE: ${successRate}%`);
    console.log(`   ${passedTests}/${tests.length} core tests passed`);
    
    if (successRate >= 75) {
      console.log('🎉 DEPLOYMENT VERIFIED - Core functionality working');
      return true;
    } else {
      console.log('⚠️  DEPLOYMENT ISSUES - Some functionality may not work');
      return false;
    }
    
  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testNetlifyDeployment().then(success => {
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('🏆 NETLIFY DEPLOYMENT: VERIFIED WORKING');
  } else {
    console.log('❌ NETLIFY DEPLOYMENT: ISSUES DETECTED');
  }
  console.log('='.repeat(50));
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});