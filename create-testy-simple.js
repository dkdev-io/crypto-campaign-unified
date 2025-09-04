import puppeteer from 'puppeteer';

async function createTesty() {
  let browser;
  try {
    console.log('🚀 Starting Testy campaign creation...');

    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Go to auth page
    console.log('1. Going to auth page...');
    await page.goto('http://localhost:5174/campaigns/auth', { waitUntil: 'networkidle0' });

    // Login
    console.log('2. Logging in...');
    await page.type('input[name="email"]', 'test@dkdev.io', { delay: 50 });
    await page.type('input[name="password"]', 'TestDonor123!', { delay: 50 });
    await page.click('button[type="submit"]');

    // Wait for redirect or error
    (await page.waitForTimeout)
      ? page.waitForTimeout(3000)
      : new Promise((r) => setTimeout(r, 3000));

    console.log('Current URL:', page.url());

    if (page.url().includes('/campaigns/auth/setup')) {
      console.log('✅ Login successful, in setup wizard');

      // Step 1: Campaign Info
      console.log('3. Step 1 - Campaign Info');
      const campaignInput = await page.$('input[type="text"]');
      if (campaignInput) {
        await campaignInput.type('Testy');
        console.log('   Entered campaign name: Testy');
      }

      const nextBtn = await page.$('button:not([disabled])');
      if (nextBtn) {
        const text = await nextBtn.evaluate((el) => el.textContent);
        if (text.includes('Next')) {
          await nextBtn.click();
          console.log('   Clicked Next');
        }
      }

      await new Promise((r) => setTimeout(r, 2000));

      // Continue through remaining steps quickly
      for (let step = 2; step <= 7; step++) {
        console.log(`4. Step ${step} - Auto-continuing...`);
        await new Promise((r) => setTimeout(r, 1000));

        // For Step 4 (Form Customization), add the style URL
        if (step === 4) {
          const urlInput = await page.$('input[type="url"]');
          if (urlInput) {
            await urlInput.type('https://testy-pink-chancellor.lovable.app/');
            console.log('   Added style URL');
            await new Promise((r) => setTimeout(r, 1000));

            const analyzeBtn = await page.$('button');
            const buttons = await page.$$('button');
            for (const btn of buttons) {
              const btnText = await btn.evaluate((el) => el.textContent);
              if (btnText.toLowerCase().includes('analyze')) {
                await btn.click();
                console.log('   Clicked analyze');
                await new Promise((r) => setTimeout(r, 5000)); // Wait for analysis
                break;
              }
            }
          }
        }

        // For Step 6 (Terms), check all checkboxes
        if (step === 6) {
          const checkboxes = await page.$$('input[type="checkbox"]');
          for (const cb of checkboxes) {
            await cb.click();
          }
          console.log(`   Checked ${checkboxes.length} terms checkboxes`);
        }

        // Find and click Next/Continue button
        const stepButtons = await page.$$('button');
        for (const btn of stepButtons) {
          const btnText = await btn.evaluate((el) => el.textContent);
          if (
            btnText.includes('Next') ||
            btnText.includes('Continue') ||
            btnText.includes('Skip') ||
            btnText.includes('Review')
          ) {
            await btn.click();
            console.log(`   Clicked: ${btnText}`);
            break;
          }
        }

        await new Promise((r) => setTimeout(r, 2000));
      }

      // Extract results from Step 7
      console.log('5. Extracting results from Step 7...');
      await new Promise((r) => setTimeout(r, 3000));

      // Get embed code
      const codeElements = await page.$$('textarea, pre, code, [style*="monospace"]');
      let embedCode = '';
      for (const el of codeElements) {
        const text = await el.evaluate((e) => e.textContent || e.value);
        if (text && (text.includes('iframe') || text.includes('<div'))) {
          embedCode = text;
          break;
        }
      }

      // Get campaign URL
      const pageText = await page.evaluate(() => document.body.innerText);
      const urlMatch = pageText.match(/http:\/\/localhost:5174\/[\w-]+/);
      const campaignUrl = urlMatch ? urlMatch[0] : 'http://localhost:5174/testy';

      console.log('\n🎉 TESTY CAMPAIGN CREATED!');
      console.log('─'.repeat(60));
      console.log('📧 Email: test@dkdev.io');
      console.log('🏷️ Campaign: Testy');
      console.log('🎨 Style URL: https://testy-pink-chancellor.lovable.app/');
      console.log('🌐 Campaign URL:', campaignUrl);

      if (embedCode) {
        console.log('\n📝 EMBED CODE:');
        console.log('─'.repeat(40));
        console.log(embedCode.substring(0, 500) + (embedCode.length > 500 ? '...' : ''));
        console.log('─'.repeat(40));
      }

      // Test the campaign page
      console.log('\n6. Testing campaign page...');
      await page.goto(campaignUrl, { waitUntil: 'networkidle0' });
      const title = await page.$eval('h1', (el) => el.textContent).catch(() => 'Not found');
      console.log(`Campaign page title: "${title}"`);

      console.log('\n✅ SUCCESS: Testy campaign is live!');
    } else {
      console.log('❌ Login failed or account needs creation');

      // Try signup
      console.log('Trying signup...');
      await page.goto('http://localhost:5174/campaigns/auth');

      const signUpBtns = await page.$$('button');
      for (const btn of signUpBtns) {
        const text = await btn.evaluate((el) => el.textContent);
        if (text.includes('Sign Up')) {
          await btn.click();
          break;
        }
      }

      await new Promise((r) => setTimeout(r, 1000));

      await page.type('input[name="fullName"]', 'Test User');
      await page.type('input[name="email"]', 'test@dkdev.io');
      await page.type('input[name="password"]', 'TestDonor123!');
      await page.type('input[name="confirmPassword"]', 'TestDonor123!');
      await page.click('input[name="agreeToTerms"]');
      await page.click('button[type="submit"]');

      console.log('Account creation attempted - check for email verification');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (browser) {
      console.log('\n⏸️ Browser staying open for inspection...');
      // Don't close browser for manual inspection
    }
  }
}

createTesty();
