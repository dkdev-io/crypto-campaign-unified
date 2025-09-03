import puppeteer from 'puppeteer';

async function testMindaDashboard() {
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('🔍 Testing MINDA Admin Dashboard on Production Site...');
    console.log('=====================================\n');
    
    // Test both local and production
    const sites = [
      { name: 'Local', url: 'http://localhost:5173/minda' },
      { name: 'Production (Netlify)', url: 'https://cryptocampaign.netlify.app/minda' }
    ];
    
    for (const site of sites) {
      console.log(`\n📍 Testing ${site.name}: ${site.url}`);
      console.log('-----------------------------------');
      
      try {
        // Navigate to minda login
        console.log('1. Navigating to /minda login page...');
        await page.goto(site.url, { waitUntil: 'networkidle0', timeout: 30000 });
        
        // Check if login page loaded
        const loginForm = await page.$('form');
        if (loginForm) {
          console.log('✅ Login page loaded successfully');
        } else {
          console.log('❌ Login page did not load properly');
          continue;
        }
        
        // Clear any existing values and login with correct credentials
        console.log('2. Attempting login with credentials...');
        const emailInput = await page.$('input[name="email"]');
        const passwordInput = await page.$('input[name="password"]');
        
        if (emailInput) {
          await emailInput.click({ clickCount: 3 });
          await emailInput.type('dan@dkdev.io');
        }
        
        if (passwordInput) {
          await passwordInput.click({ clickCount: 3 });
          await passwordInput.type('admin123');
        }
        
        // Submit login
        await page.click('button[type="submit"]');
        
        // Wait for navigation or timeout
        console.log('3. Waiting for dashboard to load...');
        try {
          await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
          console.log('✅ Successfully navigated after login');
        } catch (navError) {
          console.log('⚠️ Navigation timeout, checking current state...');
        }
        
        // Wait for dashboard elements
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check current URL
        const currentUrl = page.url();
        console.log(`4. Current URL: ${currentUrl}`);
        
        if (currentUrl.includes('/minda/dashboard')) {
          console.log('✅ Successfully redirected to dashboard');
        } else if (currentUrl.includes('/minda')) {
          console.log('⚠️ Still on login page, checking for errors...');
          
          // Check for error messages
          const errorText = await page.$eval('body', el => el.innerText).catch(() => '');
          if (errorText.includes('Invalid') || errorText.includes('Error')) {
            console.log('❌ Login error detected:', errorText.slice(0, 100));
          }
        }
        
        // Check for dashboard content
        console.log('5. Checking dashboard content...');
        const dashboardCards = await page.$$('.crypto-card');
        console.log(`   Found ${dashboardCards.length} dashboard cards`);
        
        // Try to get stats
        const stats = await page.$$eval('.text-3xl', elements => 
          elements.map(el => el.textContent.trim())
        ).catch(() => []);
        
        if (stats.length > 0) {
          console.log('📊 Dashboard Stats:');
          stats.forEach((stat, index) => {
            console.log(`   - Stat ${index + 1}: ${stat}`);
          });
        }
        
        // Check for data tables
        const tables = await page.$$('table');
        console.log(`   Found ${tables.length} data tables`);
        
        // Check console for errors
        const logs = [];
        page.on('console', message => {
          if (message.type() === 'error') {
            logs.push(message.text());
          }
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (logs.length > 0) {
          console.log('\n⚠️ Console errors detected:');
          logs.forEach(log => console.log(`   - ${log.slice(0, 100)}`));
        }
        
        // Summary for this site
        const success = currentUrl.includes('/minda/dashboard') || dashboardCards.length > 0;
        console.log(`\n${site.name} Result: ${success ? '✅ WORKING' : '❌ NOT WORKING'}`);
        
      } catch (error) {
        console.log(`❌ Error testing ${site.name}:`, error.message);
      }
    }
    
    console.log('\n=====================================');
    console.log('🎉 MINDA Dashboard Testing Complete');
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { error: error.message };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testMindaDashboard().then(result => {
  console.log('\n✅ Test execution complete');
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});