import puppeteer from 'puppeteer';

async function createTestyCampaign() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'],
    slowMo: 100
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('🚀 Creating Testy campaign with test@dkdev.io...');
    
    // 1. Navigate to campaign auth
    await page.goto('http://localhost:5174/campaigns/auth');
    await page.waitForSelector('h2');
    
    // 2. Try to sign in first
    console.log('1. Attempting sign in...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await page.type('input[name="email"]', 'test@dkdev.io');
    await page.type('input[name="password"]', 'TestDonor123!');
    
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if login worked or if we need to sign up
    const currentUrl = page.url();
    if (currentUrl.includes('/campaigns/auth/setup')) {
      console.log('   ✅ Login successful, redirected to setup');
    } else {
      // Try signup instead
      console.log('   Login failed, trying signup...');
      const signUpTab = await page.$('button');
      const tabs = await page.$$('button');
      for (const tab of tabs) {
        const text = await tab.evaluate(el => el.textContent);
        if (text.includes('Sign Up')) {
          await tab.click();
          break;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await page.type('input[name="fullName"]', 'Test User');
      await page.type('input[name="email"]', 'test@dkdev.io');  
      await page.type('input[name="password"]', 'TestDonor123!');
      await page.type('input[name="confirmPassword"]', 'TestDonor123!');
      await page.check('input[name="agreeToTerms"]');
      
      await page.click('button[type="submit"]');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
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
    await page.waitForSelector('h2, h1');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Find campaign name input
    const inputs = await page.$$('input');
    for (const input of inputs) {
      const type = await input.evaluate(el => el.type);
      const name = await input.evaluate(el => el.name);
      if (type === 'text' || name === 'campaignName') {
        await input.click();
        await input.type('Testy');
        break;
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find Next button
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await button.evaluate(el => el.textContent);
      if (text.includes('Next')) {
        await button.click();
        break;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 4. Step 2: Committee Search  
    console.log('3. Step 2 - Committee Search');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Look for skip or next button
    const buttons2 = await page.$$('button');
    for (const button of buttons2) {
      const text = await button.evaluate(el => el.textContent);
      if (text.includes('Skip') || text.includes('Next')) {
        await button.click();
        break;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 5. Step 3: Bank Connection
    console.log('4. Step 3 - Bank Connection');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const buttons3 = await page.$$('button');
    for (const button of buttons3) {
      const text = await button.evaluate(el => el.textContent);
      if (text.includes('Skip') || text.includes('Next')) {
        await button.click();
        break;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 6. Step 4: Form Customization (Style Guide)
    console.log('5. Step 4 - Form Customization (Style Guide)');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Look for URL input field
    const urlInputs = await page.$$('input');
    let foundUrlInput = false;
    for (const input of urlInputs) {
      const type = await input.evaluate(el => el.type);
      const placeholder = await input.evaluate(el => el.placeholder);
      if (type === 'url' || placeholder.toLowerCase().includes('site') || placeholder.toLowerCase().includes('url')) {
        await input.click();
        await input.type('https://testy-pink-chancellor.lovable.app/');
        foundUrlInput = true;
        console.log('   📝 Entered style guide URL');
        break;
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (foundUrlInput) {
      // Look for analyze button
      const analyzeButtons = await page.$$('button');
      let foundAnalyze = false;
      for (const button of analyzeButtons) {
        const text = await button.evaluate(el => el.textContent);
        if (text.toLowerCase().includes('analyze')) {
          console.log('   🔍 Clicking analyze website button...');
          await button.click();
          foundAnalyze = true;
          break;
        }
      }
      
      if (foundAnalyze) {
        // Wait for analysis to complete
        console.log('   ⏳ Waiting for style analysis...');
        await new Promise(resolve => setTimeout(resolve, 8000));
        
        // Look for continue/review button after analysis
        const reviewButtons = await page.$$('button');
        for (const button of reviewButtons) {
          const text = await button.evaluate(el => el.textContent);
          if (text.toLowerCase().includes('review') || text.toLowerCase().includes('continue') || text.toLowerCase().includes('apply')) {
            console.log('   ✅ Analysis complete, continuing...');
            await button.click();
            break;
          }
        }
      }
    }
    
    // If no analysis or as fallback, look for next/skip
    await new Promise(resolve => setTimeout(resolve, 1000));
    const buttons4 = await page.$$('button');
    for (const button of buttons4) {
      const text = await button.evaluate(el => el.textContent);
      if (text.includes('Next') || text.includes('Skip')) {
        await button.click();
        break;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 7. Step 5: Style Confirmation
    console.log('6. Step 5 - Style Confirmation');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const buttons5 = await page.$$('button');
    for (const button of buttons5) {
      const text = await button.evaluate(el => el.textContent);
      if (text.includes('Next')) {
        await button.click();
        break;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 8. Step 6: Terms Agreement
    console.log('7. Step 6 - Terms Agreement');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Accept all terms checkboxes
    const checkboxes = await page.$$('input[type="checkbox"]');
    console.log(`   📋 Found ${checkboxes.length} terms checkboxes`);
    for (const checkbox of checkboxes) {
      await checkbox.click();
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const buttons6 = await page.$$('button');
    for (const button of buttons6) {
      const text = await button.evaluate(el => el.textContent);
      if (text.includes('Next') || text.includes('Complete') || text.includes('Finish')) {
        await button.click();
        break;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 9. Step 7: Launch & QR Code
    console.log('8. Step 7 - Launch & QR Code');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Look for embed code in various elements
    let embedCode = '';
    const codeElements = await page.$$('textarea, pre, code, div[style*="monospace"], div[style*="Monaco"]');
    for (const element of codeElements) {
      const text = await element.evaluate(el => el.textContent || el.value || '');
      if (text.includes('iframe') || text.includes('script') || text.includes('embed')) {
        embedCode = text.trim();
        console.log('   ✅ Embed code found');
        break;
      }
    }
    
    // Look for campaign page URL
    let campaignPageUrl = '';
    const allElements = await page.$$('*');
    for (const element of allElements) {
      try {
        const text = await element.evaluate(el => el.textContent || el.href || '');
        if (text.includes('localhost:5174/testy') || text.includes('/testy') && text.includes('http')) {
          campaignPageUrl = text.trim();
          console.log('   ✅ Campaign page URL found:', campaignPageUrl);
          break;
        }
      } catch (e) {
        // Skip elements that can't be evaluated
      }
    }
    
    // Check for QR code
    const qrImages = await page.$$('img');
    let hasQR = false;
    for (const img of qrImages) {
      const src = await img.evaluate(el => el.src);
      const alt = await img.evaluate(el => el.alt);
      if ((src && src.includes('data:image')) || (alt && alt.toLowerCase().includes('qr'))) {
        hasQR = true;
        console.log('   ✅ QR code found');
        break;
      }
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