import puppeteer from 'puppeteer';

async function verifyMindaProduction() {
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('🔍 VERIFYING MINDA ADMIN DASHBOARD ON PRODUCTION');
    console.log('===============================================');
    
    const prodUrl = 'https://cryptocampaign.netlify.app';
    
    // Test 1: Login to /minda
    console.log('\n1. Testing login at /minda...');
    await page.goto(`${prodUrl}/minda`, { waitUntil: 'networkidle0' });
    
    // Login
    await page.type('input[name="email"]', 'dan@dkdev.io');
    await page.type('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 2: Check dashboard
    console.log('2. Testing dashboard...');
    await page.goto(`${prodUrl}/minda/dashboard`, { waitUntil: 'networkidle0' });
    
    const dashboardCards = await page.$$('.crypto-card');
    console.log(`   ✅ Dashboard cards: ${dashboardCards.length}`);
    
    // Test 3: Check Users page (previously blank)
    console.log('3. Testing Users page (was blank before)...');
    await page.goto(`${prodUrl}/minda/users`, { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check for content
    const usersPageContent = await page.evaluate(() => document.body.innerText);
    const hasAccessDenied = usersPageContent.includes('Access Denied');
    const hasUserManagement = usersPageContent.includes('User Management');
    const hasAdminRole = usersPageContent.includes('Admin role:');
    
    if (hasAccessDenied || hasUserManagement) {
      console.log(`   ✅ Users page shows content: ${hasAccessDenied ? 'Access Denied' : 'User Management'}`);
      if (hasAdminRole) {
        const roleMatch = usersPageContent.match(/Admin role: (\w+)/);
        console.log(`   📝 Admin role detected: ${roleMatch ? roleMatch[1] : 'Unknown'}`);
      }
    } else {
      console.log('   ❌ Users page still blank');
    }
    
    // Test 4: Check Campaigns page
    console.log('4. Testing Campaigns page...');
    await page.goto(`${prodUrl}/minda/campaigns`, { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const campaignsPageContent = await page.evaluate(() => document.body.innerText);
    const hasCampaignContent = campaignsPageContent.includes('Campaign') || campaignsPageContent.length > 100;
    
    if (hasCampaignContent) {
      console.log('   ✅ Campaigns page has content');
    } else {
      console.log('   ❌ Campaigns page appears blank');
    }
    
    // Test 5: Check console errors
    console.log('5. Checking for console errors...');
    const logs = [];
    page.on('console', message => {
      if (message.type() === 'error') {
        logs.push(message.text());
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (logs.length > 0) {
      console.log('   ⚠️ Console errors found:');
      logs.forEach(log => console.log(`      - ${log.slice(0, 80)}`));
    } else {
      console.log('   ✅ No console errors detected');
    }
    
    // Summary
    console.log('\n===============================================');
    console.log('🎯 VERIFICATION SUMMARY:');
    console.log('===============================================');
    console.log(`Dashboard: ✅ Working (${dashboardCards.length} cards)`);
    console.log(`Users Page: ${hasAccessDenied || hasUserManagement ? '✅' : '❌'} ${hasAccessDenied ? 'Access Denied' : hasUserManagement ? 'Working' : 'Still Blank'}`);
    console.log(`Campaigns Page: ${hasCampaignContent ? '✅' : '❌'} ${hasCampaignContent ? 'Working' : 'Blank'}`);
    console.log(`Console Errors: ${logs.length === 0 ? '✅' : '❌'} ${logs.length} errors`);
    
    const success = dashboardCards.length > 0 && (hasAccessDenied || hasUserManagement) && hasCampaignContent;
    console.log(`\n🎉 Overall Status: ${success ? '✅ ADMIN PAGES WORKING' : '❌ ISSUES REMAIN'}`);
    
    return { success, details: { dashboardCards: dashboardCards.length, usersWorking: hasAccessDenied || hasUserManagement, campaignsWorking: hasCampaignContent, errors: logs.length }};
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return { error: error.message };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run verification
verifyMindaProduction().then(result => {
  console.log('\n✅ Production verification complete');
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  console.error('💥 Verification script failed:', error);
  process.exit(1);
});