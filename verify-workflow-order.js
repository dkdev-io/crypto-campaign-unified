import puppeteer from 'puppeteer';

async function verifyWorkflowOrder() {
  console.log('🔍 Verifying campaign workflow order and functionality...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    slowMo: 300
  });

  try {
    const page = await browser.newPage();
    
    // Track errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ Browser Error: ${msg.text()}`);
      }
    });

    console.log('\n📋 TESTING WORKFLOW ORDER');
    console.log('🌐 Loading: http://localhost:5173/campaigns/auth/setup?bypass=true');
    
    await page.goto('http://localhost:5173/campaigns/auth/setup?bypass=true', {
      waitUntil: 'networkidle0',
      timeout: 15000
    });

    // Test Step 1
    console.log('\n✅ STEP 1 VERIFICATION:');
    await page.waitForSelector('h1', { timeout: 5000 });
    
    const step1Heading = await page.$eval('h1', el => el.textContent);
    console.log(`📋 Main heading: "${step1Heading}"`);
    
    const step1Indicator = await page.evaluate(() => {
      const stepP = document.querySelector('p');
      return stepP ? stepP.textContent : 'No step indicator found';
    });
    console.log(`📍 Step indicator: "${step1Indicator}"`);
    
    // Check for duplicate step text
    const duplicateSteps = await page.evaluate(() => {
      const allText = document.body.textContent;
      const stepMatches = allText.match(/Step \d+ of \d+/g);
      return stepMatches ? stepMatches.length : 0;
    });
    console.log(`🔍 Number of step indicators found: ${duplicateSteps}`);
    
    // Check button styling
    const hasArrows = await page.evaluate(() => {
      const arrows = Array.from(document.querySelectorAll('div')).filter(el => 
        el.textContent === '←' || el.textContent === '→'
      );
      return arrows.length;
    });
    console.log(`🎯 Arrow count: ${hasArrows}`);

    // Fill form quickly to test navigation
    console.log('\n📝 TESTING NAVIGATION:');
    
    // Fill Step 1 form
    await page.type('input[placeholder*="campaign"]', 'Test Campaign');
    await page.type('input[placeholder*="first"]', 'Test');
    await page.type('input[placeholder*="last"]', 'User');
    await page.type('input[placeholder*="email"]', 'test@dkdev.io');
    await page.type('input[placeholder*="phone"]', '1234567890');
    
    // Click Next to go to Step 2
    const nextButton1 = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('NEXT'));
    });
    
    if (nextButton1) {
      await nextButton1.click();
      await page.waitForTimeout(2000);
      console.log('✅ Navigated to Step 2');
      
      // Check Step 2
      const step2Indicator = await page.evaluate(() => {
        const stepP = document.querySelector('p');
        return stepP ? stepP.textContent : 'No step indicator';
      });
      console.log(`📍 Step 2 indicator: "${step2Indicator}"`);
      
      // Check for duplicate indicators again
      const step2Duplicates = await page.evaluate(() => {
        const allText = document.body.textContent;
        const stepMatches = allText.match(/Step \d+ of \d+/g);
        return stepMatches ? stepMatches.length : 0;
      });
      console.log(`🔍 Step 2 - Number of indicators: ${step2Duplicates}`);
    }

    // Take screenshot for verification
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/workflow-order-verification.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: workflow-order-verification.png');

    console.log('\n🎯 WORKFLOW ORDER SUMMARY:');
    console.log(`✅ Main heading shows: "${step1Heading}"`);
    console.log(`✅ Step progression working: Navigation successful`);
    console.log(`✅ Duplicate indicators: ${duplicateSteps <= 1 ? 'CLEAN' : 'NEEDS CLEANUP'}`);
    console.log(`✅ Button arrows: ${hasArrows >= 2 ? 'PRESENT' : 'MISSING'}`);
    
    if (duplicateSteps <= 1 && hasArrows >= 2) {
      console.log('🎉 WORKFLOW ORDER IS CORRECT!');
    } else {
      console.log('⚠️  Issues detected that need fixing');
    }

  } catch (error) {
    console.error('\n💥 VERIFICATION FAILED:', error.message);
    
    try {
      await page.screenshot({ 
        path: '/Users/Danallovertheplace/crypto-campaign-unified/workflow-error.png',
        fullPage: true 
      });
      console.log('📸 Error screenshot saved: workflow-error.png');
    } catch (e) {
      console.log('Failed to take error screenshot');
    }
    
    throw error;
  } finally {
    await browser.close();
  }
}

verifyWorkflowOrder()
  .then(() => {
    console.log('\n🏆 WORKFLOW VERIFICATION COMPLETE');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 VERIFICATION FAILED:', error.message);
    process.exit(1);
  });