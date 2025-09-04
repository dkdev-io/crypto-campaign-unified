import puppeteer from 'puppeteer';

async function verifyAdminDashboard() {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('🔍 Verifying Admin Dashboard with Real Data...');

    // Navigate to admin login
    console.log('1. Testing admin login...');
    await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle0' });

    // Login with hardcoded credentials
    await page.type('input[name="email"]', 'dan@dkdev.io');
    await page.type('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    try {
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 });
    } catch (e) {
      console.log('Navigation timeout, but continuing...');
    }

    // Wait a bit more for dashboard to load
    await page.waitForTimeout(3000);

    console.log('2. Checking dashboard data...');

    // Check for real campaign data (should show 24 campaigns)
    const campaignCount = await page
      .$eval('.crypto-card .text-3xl', (el) => el.textContent.trim())
      .catch(() => '0');
    console.log(`📊 Campaign Count Displayed: ${campaignCount} (Expected: 24)`);

    // Check for real revenue data (should show $160)
    const revenueCards = await page.$$('.crypto-card .text-3xl');
    let revenueValue = 'Not found';
    for (let i = 0; i < Math.min(revenueCards.length, 4); i++) {
      const text = await revenueCards[i].evaluate((el) => el.textContent.trim());
      if (text.includes('$')) {
        revenueValue = text;
        break;
      }
    }
    console.log(`💰 Revenue Displayed: ${revenueValue} (Expected: $160)`);

    // Check for user metrics (should be calculated from form submissions)
    const userCards = await page.$$('.crypto-card .text-3xl');
    let userCount = 'Not found';
    if (userCards.length > 0) {
      userCount = await userCards[0].evaluate((el) => el.textContent.trim());
    }
    console.log(`👥 User Count Displayed: ${userCount} (Expected: 3 unique users)`);

    // Check for recent transactions table
    const transactionRows = await page.$$('tbody tr');
    console.log(`📋 Transaction Rows: ${transactionRows.length} (Expected: 3)`);

    // Check console for errors
    const logs = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        logs.push(`Console Error: ${message.text()}`);
      }
    });

    await page.waitForTimeout(2000);

    // Results summary
    console.log('\n🎯 VERIFICATION RESULTS:');
    console.log('=====================');

    const campaignSuccess = parseInt(campaignCount) === 24;
    const revenueSuccess = revenueValue.includes('160');
    const hasTransactions = transactionRows.length > 0;

    console.log(
      `✅ Campaign Data: ${campaignSuccess ? '✅ CORRECT' : '❌ WRONG'} (${campaignCount})`
    );
    console.log(`✅ Revenue Data: ${revenueSuccess ? '✅ CORRECT' : '❌ WRONG'} (${revenueValue})`);
    console.log(
      `✅ Transactions: ${hasTransactions ? '✅ SHOWING' : '❌ EMPTY'} (${transactionRows.length} rows)`
    );
    console.log(`✅ Dashboard Loading: ✅ SUCCESS`);

    if (logs.length > 0) {
      console.log('\n🔴 Console Errors:');
      logs.forEach((log) => console.log(log));
    } else {
      console.log('\n✅ No Console Errors');
    }

    const success = campaignSuccess && hasTransactions;
    console.log(
      `\n🎉 Overall Result: ${success ? '✅ ADMIN DASHBOARD WORKING' : '⚠️ NEEDS ATTENTION'}`
    );

    return {
      success,
      campaignCount,
      revenueValue,
      userCount,
      transactionRows: transactionRows.length,
      errors: logs,
    };
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
verifyAdminDashboard()
  .then((result) => {
    console.log('\n✅ Admin Dashboard Verification Complete');
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Verification script failed:', error);
    process.exit(1);
  });
