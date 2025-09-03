import puppeteer from 'puppeteer';

async function createTestyCampaign() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('🚀 Creating Testy campaign with test@dkdev.io...');
    
    // 1. Navigate to campaign auth
    await page.goto('http://localhost:5174/campaigns/auth');
    await page.waitForSelector('h2');
    
    // 2. Try to sign in first
    console.log('1. Attempting sign in...');
    // Sign in tab should already be active by default
    await page.waitForTimeout(500);
    
    await page.fill('input[name="email"]', 'test@dkdev.io');
    await page.fill('input[name="password"]', 'TestDonor123!');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Check if login worked or if we need to sign up
    const currentUrl = page.url();
    if (currentUrl.includes('/campaigns/auth/setup')) {
      console.log('   ✅ Login successful, redirected to setup');
    } else {
      // Try signup instead
      console.log('   Login failed, trying signup...');
      await page.click('button:has-text("Sign Up")');
      await page.waitForTimeout(500);
      
      await page.fill('input[name="fullName"]', 'Test User');
      await page.fill('input[name="email"]', 'test@dkdev.io');
      await page.fill('input[name="password"]', 'TestDonor123!');
      await page.fill('input[name="confirmPassword"]', 'TestDonor123!');
      await page.check('input[name="agreeToTerms"]');
      
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      
      // Check for success message
      const successMessage = await page.$('text=/Account created/');
      if (successMessage) {
        console.log('   ✅ Account created, need email verification');
        console.log('   ⚠️ Manual email verification required to continue');
        return;
      }
    }
    
    // 3. Now we should be in setup wizard - Step 1: Campaign Info
    console.log('2. Step 1 - Campaign Info');
    await page.waitForSelector('h2:has-text("Campaign Information"), h2');
    await page.waitForTimeout(1000);
    
    await page.fill('input[value=""]', 'Testy'); // Campaign name
    await page.waitForTimeout(500);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    
    // 4. Step 2: Committee Search
    console.log('3. Step 2 - Committee Search');
    await page.waitForTimeout(1000);
    // Skip committee search
    const skipButton = await page.$('button:has-text("Skip")');
    if (skipButton) {
      await skipButton.click();
    } else {
      await page.click('button:has-text("Next")');
    }
    await page.waitForTimeout(1000);
    
    // 5. Step 3: Bank Connection
    console.log('4. Step 3 - Bank Connection');
    await page.waitForTimeout(1000);
    const skipBankButton = await page.$('button:has-text("Skip")');
    if (skipBankButton) {
      await skipBankButton.click();
    } else {
      await page.click('button:has-text("Next")');
    }
    await page.waitForTimeout(1000);
    
    // 6. Step 4: Form Customization (Style Guide)
    console.log('5. Step 4 - Form Customization (Style Guide)');
    await page.waitForTimeout(1000);
    
    // Enter the style guide website
    const urlInput = await page.$('input[type="url"], input[placeholder*="site"], input[placeholder*="URL"]');
    if (urlInput) {
      await urlInput.fill('https://testy-pink-chancellor.lovable.app/');
      await page.waitForTimeout(500);
      
      // Click analyze website button
      const analyzeButton = await page.$('button:has-text("Analyze")');
      if (analyzeButton) {
        console.log('   🔍 Analyzing website styles...');
        await analyzeButton.click();
        await page.waitForTimeout(5000); // Wait for analysis
        
        // Check if analysis completed
        const analysisResult = await page.$('text=/Analysis Complete/');
        if (analysisResult) {
          console.log('   ✅ Style analysis completed');
          await page.click('button:has-text("Review")');
        } else {
          console.log('   ⚠️ Style analysis may have failed, continuing...');
          const skipStyleButton = await page.$('button:has-text("Skip")');
          if (skipStyleButton) {
            await skipStyleButton.click();
          }
        }
      } else {
        console.log('   ⚠️ Analyze button not found, skipping...');
        const nextButton = await page.$('button:has-text("Next")');
        if (nextButton) await nextButton.click();
      }
    } else {
      console.log('   ⚠️ URL input not found, skipping...');
      const nextButton = await page.$('button:has-text("Next")');
      if (nextButton) await nextButton.click();
    }
    await page.waitForTimeout(1000);
    
    // 7. Step 5: Style Confirmation
    console.log('6. Step 5 - Style Confirmation');
    await page.waitForTimeout(1000);
    const nextButton5 = await page.$('button:has-text("Next")');
    if (nextButton5) await nextButton5.click();
    await page.waitForTimeout(1000);
    
    // 8. Step 6: Terms Agreement
    console.log('7. Step 6 - Terms Agreement');
    await page.waitForTimeout(1000);
    // Accept all terms
    const checkboxes = await page.$$('input[type="checkbox"]');
    for (const checkbox of checkboxes) {
      await checkbox.check();
    }
    await page.waitForTimeout(500);
    const nextButton6 = await page.$('button:has-text("Next")');
    if (nextButton6) await nextButton6.click();
    await page.waitForTimeout(2000);
    
    // 9. Step 7: Launch & QR Code
    console.log('8. Step 7 - Launch & QR Code');
    await page.waitForTimeout(2000);
    
    // Look for embed code
    const embedCodeElement = await page.$('textarea, pre, code, div[style*="monospace"]');
    let embedCode = '';
    if (embedCodeElement) {
      embedCode = await embedCodeElement.evaluate(el => el.textContent || el.value);
      console.log('   ✅ Embed code generated');
    } else {
      console.log('   ⚠️ Embed code not found');
    }
    
    // Look for campaign page URL
    let campaignPageUrl = '';
    const campaignUrlElements = await page.$$('div[style*="monospace"], span[style*="monospace"], a[href*="/testy"]');
    for (const element of campaignUrlElements) {
      const text = await element.evaluate(el => el.textContent || el.href);
      if (text && (text.includes('/testy') || text.includes('testy'))) {
        campaignPageUrl = text;
        break;
      }
    }
    
    if (campaignPageUrl) {
      console.log('   ✅ Campaign page URL generated:', campaignPageUrl);
    } else {
      console.log('   ⚠️ Campaign page URL not found');
    }
    
    // Check for QR code
    const qrCode = await page.$('img[alt*="QR"], img[src*="data:image"]');
    if (qrCode) {
      console.log('   ✅ QR code generated');
    } else {
      console.log('   ⚠️ QR code not found');
    }
    
    console.log('\n🎉 TESTY CAMPAIGN RESULTS:');
    console.log('📧 Email: test@dkdev.io');
    console.log('🏷️ Campaign: Testy');
    console.log('🎨 Style URL: https://testy-pink-chancellor.lovable.app/');
    
    if (embedCode) {
      console.log('\n📝 EMBED CODE:');
      console.log('─'.repeat(80));
      console.log(embedCode);
      console.log('─'.repeat(80));
    }
    
    if (campaignPageUrl) {
      console.log('\n🌐 CAMPAIGN PAGE URL:');
      console.log(campaignPageUrl);
    }
    
    // Test the campaign page
    if (campaignPageUrl && campaignPageUrl.includes('localhost')) {
      console.log('\n🔍 Testing campaign page...');
      await page.goto(campaignPageUrl);
      await page.waitForTimeout(2000);
      
      const pageTitle = await page.$eval('h1', el => el.textContent).catch(() => 'Title not found');
      console.log(`   Campaign page title: "${pageTitle}"`);
    }
    
  } catch (error) {
    console.error('❌ Error creating Testy campaign:', error.message);
  } finally {
    console.log('\n⏸️ Browser will stay open for manual inspection...');
    // Keep browser open for inspection
    // await browser.close();
  }
}

createTestyCampaign();