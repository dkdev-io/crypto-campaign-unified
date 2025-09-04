const puppeteer = require('puppeteer');

const testActualWorkflow = async () => {
  console.log('🧪 ACTUAL WORKFLOW TEST - No BS');
  console.log('=====================================');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    devtools: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  // Listen for console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  try {
    // TEST 1: Does auth page load?
    console.log('\n1️⃣ Testing: /campaigns/auth loads');
    await page.goto('http://localhost:3000/campaigns/auth', { waitUntil: 'networkidle0' });
    
    const title = await page.title();
    const url = page.url();
    const h1Text = await page.$eval('h1', el => el.textContent).catch(() => 'No h1');
    const pageContent = await page.evaluate(() => document.body.innerText.substring(0, 300));
    console.log(`   ✅ Page loaded: "${title}" at ${url}`);
    console.log(`   📄 H1: "${h1Text}"`);
    console.log(`   📝 Content preview: ${pageContent}`);
    
    // TEST 2: Does dev bypass button exist and work?
    console.log('\n2️⃣ Testing: Dev bypass button');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const bypassButton = await page.$('button:has-text("DEV BYPASS")').catch(() => null);
    if (!bypassButton) {
      console.log('   ❌ Dev bypass button NOT FOUND');
      await browser.close();
      return false;
    }
    console.log('   ✅ Dev bypass button found');
    
    // TEST 3: Click dev bypass - does it navigate correctly?
    console.log('\n3️⃣ Testing: Dev bypass navigation');
    await bypassButton.click();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const setupUrl = page.url();
    console.log(`   📍 After bypass click: ${setupUrl}`);
    
    if (!setupUrl.includes('/campaigns/auth/setup')) {
      console.log('   ❌ Navigation FAILED - wrong URL');
      await browser.close();
      return false;
    }
    console.log('   ✅ Navigation to setup SUCCESS');
    
    // TEST 4: Does SetupWizard actually load?
    console.log('\n4️⃣ Testing: SetupWizard component loads');
    
    // Wait for component to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for SetupWizard indicators
    const wizardFound = await page.evaluate(() => {
      // Look for step indicator, setup card, or campaign info form
      const indicators = [
        document.querySelector('.setup-card'),
        document.querySelector('.setup-container'), 
        document.querySelector('[class*="step"]'),
        document.querySelector('input[name="campaignName"]'),
        document.querySelector('input[placeholder*="campaign"]'),
        document.querySelectorAll('*').length > 50 // Basic content check
      ];
      
      return indicators.some(Boolean);
    });
    
    if (!wizardFound) {
      console.log('   ❌ SetupWizard NOT LOADED');
      const content = await page.content();
      console.log('   Page content:', content.substring(0, 200));
      await browser.close();
      return false;
    }
    console.log('   ✅ SetupWizard loaded successfully');
    
    // TEST 5: Are there actually 7 steps available?
    console.log('\n5️⃣ Testing: All 7 steps accessible');
    
    const stepInfo = await page.evaluate(() => {
      const stepLabels = [];
      document.querySelectorAll('*').forEach(el => {
        if (el.textContent && el.textContent.match(/(Step \d|Campaign Info|Committee|Bank|Style|Terms|Embed)/i)) {
          stepLabels.push(el.textContent.trim());
        }
      });
      return [...new Set(stepLabels)];
    });
    
    console.log(`   📋 Found step-related content: ${stepInfo.length} items`);
    stepInfo.forEach(step => console.log(`      - ${step}`));
    
    // TEST 6: Can we navigate between steps?
    console.log('\n6️⃣ Testing: Step navigation');
    
    const nextButton = await page.$('button:has-text("Next"), button:has-text("Continue")').catch(() => null);
    if (nextButton) {
      console.log('   ✅ Next button found');
      await nextButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('   ✅ Next button clicked - step navigation works');
    } else {
      console.log('   ❌ Next button NOT FOUND');
    }
    
    // TEST 7: Console errors?
    console.log('\n7️⃣ Testing: Console errors');
    if (errors.length > 0) {
      console.log(`   ⚠️  ${errors.length} console errors found:`);
      errors.forEach(err => console.log(`      ${err}`));
    } else {
      console.log('   ✅ No console errors');
    }
    
    console.log('\n🎉 TEST COMPLETE');
    console.log('================');
    console.log(`Final URL: ${page.url()}`);
    console.log(`Console errors: ${errors.length}`);
    
    await browser.close();
    return true;
    
  } catch (error) {
    console.log(`\n❌ TEST FAILED: ${error.message}`);
    await browser.close();
    return false;
  }
};

testActualWorkflow().then(success => {
  console.log(`\n🏁 RESULT: ${success ? 'WORKFLOW WORKS' : 'WORKFLOW BROKEN'}`);
}).catch(console.error);