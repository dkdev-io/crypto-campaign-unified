import puppeteer from 'puppeteer';

async function testAdminDashboard() {
  console.log('🔍 TESTING ADMIN DASHBOARD');
  console.log('==========================');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 900 },
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Monitor console for errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ BROWSER ERROR: ${msg.text()}`);
    }
  });
  
  try {
    console.log('1. Logging into campaigns auth...');
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth', { 
      waitUntil: 'networkidle0' 
    });
    
    await page.type('input[name="email"]', 'test@dkdev.io');
    await page.type('input[name="password"]', 'TestDonor123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    console.log('✅ Logged in, current URL:', page.url());
    
    console.log('\n2. Navigating to admin dashboard...');
    await page.goto('https://cryptocampaign.netlify.app/admin', { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/admin-dashboard.png',
      fullPage: true 
    });
    
    console.log('✅ Admin dashboard loaded');
    
    console.log('\n3. Finding all navigation links...');
    const links = await page.evaluate(() => {
      const allLinks = Array.from(document.querySelectorAll('a[href], button[onclick]'));
      return allLinks.map(link => ({
        text: link.textContent?.trim() || '',
        href: link.href || link.getAttribute('onclick') || '',
        visible: link.offsetParent !== null
      })).filter(link => 
        link.text && 
        link.visible && 
        (link.href.includes('admin') || 
         link.text.toLowerCase().includes('campaign') ||
         link.text.toLowerCase().includes('user') ||
         link.text.toLowerCase().includes('contribution') ||
         link.text.toLowerCase().includes('donor') ||
         link.text.toLowerCase().includes('manage'))
      );
    });
    
    console.log('Admin links found:', links.length);
    links.forEach((link, i) => {
      console.log(`  ${i+1}. "${link.text}" -> ${link.href}`);
    });
    
    console.log('\n4. Testing each admin link...');
    const results = [];
    
    for (let i = 0; i < Math.min(links.length, 8); i++) { // Test max 8 links
      const link = links[i];
      
      if (!link.href || link.href.startsWith('javascript:') || link.href.startsWith('mailto:')) {
        console.log(`⏭️  Skipping ${link.text} (non-navigation link)`);
        continue;
      }
      
      try {
        console.log(`\nTesting: "${link.text}"`);
        
        await page.goto(link.href, { waitUntil: 'networkidle0', timeout: 15000 });
        
        // Check if page loaded successfully
        const pageTitle = await page.title();
        const currentUrl = page.url();
        
        // Look for table data or error messages
        const pageAnalysis = await page.evaluate(() => {
          const text = document.body.textContent.toLowerCase();
          const tables = document.querySelectorAll('table, [class*="table"]');
          const errors = document.querySelectorAll('[class*="error"], .error');
          const loading = document.querySelectorAll('[class*="loading"], .loading, .spinner');
          
          return {
            hasTable: tables.length > 0,
            hasError: errors.length > 0 && Array.from(errors).some(el => el.textContent?.trim()),
            isLoading: loading.length > 0,
            containsData: text.includes('campaign') || text.includes('contribution') || text.includes('donor'),
            containsNotFound: text.includes('not found') || text.includes('no data') || text.includes('empty'),
            errorMessage: errors.length > 0 ? Array.from(errors).map(el => el.textContent?.trim()).filter(Boolean)[0] : null
          };
        });
        
        const status = pageAnalysis.hasError ? '❌ ERROR' : 
                      pageAnalysis.hasTable ? '✅ TABLE' : 
                      pageAnalysis.containsData ? '✅ DATA' : 
                      pageAnalysis.isLoading ? '⏳ LOADING' : 
                      '⚠️ UNKNOWN';
        
        console.log(`   ${status}: ${link.text}`);
        if (pageAnalysis.hasError) {
          console.log(`   Error: ${pageAnalysis.errorMessage}`);
        }
        
        results.push({
          link: link.text,
          url: link.href,
          status: status.includes('✅') ? 'WORKING' : status.includes('❌') ? 'ERROR' : 'UNCLEAR',
          hasTable: pageAnalysis.hasTable,
          hasData: pageAnalysis.containsData,
          error: pageAnalysis.errorMessage
        });
        
        await page.screenshot({ 
          path: `/Users/Danallovertheplace/crypto-campaign-unified/admin-link-${i+1}-${link.text.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.png`
        });
        
      } catch (error) {
        console.log(`   ❌ FAILED: ${error.message}`);
        results.push({
          link: link.text,
          url: link.href,
          status: 'FAILED',
          error: error.message
        });
      }
    }
    
    console.log('\n📊 ADMIN DASHBOARD ANALYSIS');
    console.log('============================');
    
    const workingLinks = results.filter(r => r.status === 'WORKING').length;
    const errorLinks = results.filter(r => r.status === 'ERROR').length;
    const failedLinks = results.filter(r => r.status === 'FAILED').length;
    
    console.log(`Total links tested: ${results.length}`);
    console.log(`Working with tables/data: ${workingLinks}`);
    console.log(`Showing errors: ${errorLinks}`);
    console.log(`Failed to load: ${failedLinks}`);
    
    results.forEach(result => {
      console.log(`\n• ${result.link}:`);
      console.log(`  Status: ${result.status}`);
      console.log(`  Has table: ${result.hasTable}`);
      console.log(`  Has data: ${result.hasData}`);
      if (result.error) console.log(`  Error: ${result.error}`);
    });
    
    const allWorking = errorLinks === 0 && failedLinks === 0;
    console.log(`\n🎯 ADMIN DASHBOARD: ${allWorking ? 'ALL LINKS WORKING' : 'HAS ISSUES'}`);
    
    if (!allWorking) {
      console.log('\n🔧 ISSUES FOUND:');
      results.filter(r => r.status !== 'WORKING').forEach(r => {
        console.log(`  • ${r.link}: ${r.error || r.status}`);
      });
    }
    
    console.log('\n⏸️ Browser staying open for manual review...');
    
  } catch (error) {
    console.error('💥 Admin test failed:', error.message);
    await browser.close();
  }
}

testAdminDashboard().catch(console.error);