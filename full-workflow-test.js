import puppeteer from 'puppeteer';

async function fullWorkflowTest() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 720 },
  });

  const page = await browser.newPage();

  const results = {
    steps: [],
    summary: {
      totalSteps: 0,
      emojisRemoved: 0,
      backgroundsFixed: 0,
      fontsFixed: 0,
      overallPercentage: 0,
    },
  };

  try {
    console.log('🚀 COMPREHENSIVE WORKFLOW TEST - Going through ALL steps...\n');

    // Get home page reference first
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    const homeRef = await page.evaluate(() => {
      const body = document.body;
      const bodyStyles = window.getComputedStyle(body);
      return {
        backgroundColor: bodyStyles.backgroundColor,
        fontFamily: bodyStyles.fontFamily,
      };
    });
    console.log('📏 Home page reference:', homeRef);

    // Start setup wizard
    await page.goto('http://localhost:5173/campaigns/auth/setup?bypass=dev', {
      waitUntil: 'networkidle0',
    });

    // STEP 1: Campaign Information
    console.log('\n📋 STEP 1: Campaign Information');
    const step1 = await testCurrentStep(page, homeRef, 1);
    results.steps.push(step1);
    await page.screenshot({ path: `/private/tmp/step-1-verification.png` });

    // Advance to step 2
    try {
      // Fill required fields
      await page.type('input[name="campaignName"]', 'Test Campaign');
      await page.type('input[name="website"]', 'https://example.com');
      await page.click('button:has-text("Next"), .btn-primary');
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('   ❌ Could not advance to step 2:', e.message);
    }

    // STEP 2: Committee Search
    console.log('\n🔍 STEP 2: Committee Search');
    const step2 = await testCurrentStep(page, homeRef, 2);
    results.steps.push(step2);
    await page.screenshot({ path: `/private/tmp/step-2-verification.png` });

    // Try to advance to step 3
    try {
      // Skip committee search
      await page.click('button:has-text("Skip"), button:has-text("Next")');
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('   ❌ Could not advance to step 3:', e.message);
    }

    // STEP 3: Bank Connection
    console.log('\n🏦 STEP 3: Bank Connection');
    const step3 = await testCurrentStep(page, homeRef, 3);
    results.steps.push(step3);
    await page.screenshot({ path: `/private/tmp/step-3-verification.png` });

    // Try to advance to step 4
    try {
      await page.click('button:has-text("Skip"), button:has-text("Next")');
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('   ❌ Could not advance to step 4:', e.message);
    }

    // STEP 4: Website Style
    console.log('\n🎨 STEP 4: Website Style');
    const step4 = await testCurrentStep(page, homeRef, 4);
    results.steps.push(step4);
    await page.screenshot({ path: `/private/tmp/step-4-verification.png` });

    // Calculate final percentages
    const validSteps = results.steps.filter((s) => !s.error);
    results.summary.totalSteps = validSteps.length;

    results.summary.emojisRemoved = Math.round(
      (validSteps.filter((s) => s.emojisFound === 0).length / validSteps.length) * 100
    );

    results.summary.backgroundsFixed = Math.round(
      (validSteps.filter((s) => s.backgroundMatches).length / validSteps.length) * 100
    );

    results.summary.fontsFixed = Math.round(
      (validSteps.filter((s) => s.fontMatches).length / validSteps.length) * 100
    );

    results.summary.overallPercentage = Math.round(
      (results.summary.emojisRemoved +
        results.summary.backgroundsFixed +
        results.summary.fontsFixed) /
        3
    );

    // Generate final honest report
    console.log('\n🎯 COMPREHENSIVE TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Steps tested: ${results.summary.totalSteps}`);
    console.log(`Emojis removed: ${results.summary.emojisRemoved}%`);
    console.log(`Backgrounds consistent: ${results.summary.backgroundsFixed}%`);
    console.log(`Fonts consistent: ${results.summary.fontsFixed}%`);
    console.log(`\n🏆 OVERALL SUCCESS RATE: ${results.summary.overallPercentage}%`);

    console.log('\n📋 DETAILED BREAKDOWN:');
    validSteps.forEach((step) => {
      console.log(`\nStep ${step.stepNumber}: ${step.stepName}`);
      console.log(`  Heading: "${step.headingText}"`);
      console.log(
        `  Emojis: ${step.emojisFound === 0 ? '✅ None' : '❌ Found ' + step.emojisFound}`
      );
      console.log(`  Background: ${step.backgroundMatches ? '✅ Matches home' : '❌ Different'}`);
      console.log(`  Fonts: ${step.fontMatches ? '✅ Matches home' : '❌ Different'}`);
      if (step.emojisInText && step.emojisInText.length > 0) {
        console.log(`  Emoji details: ${step.emojisInText}`);
      }
    });

    return results;
  } finally {
    await browser.close();
  }
}

async function testCurrentStep(page, homeRef, stepNumber) {
  try {
    return await page.evaluate(
      (homeRef, stepNumber) => {
        const body = document.body;
        const bodyStyles = window.getComputedStyle(body);
        const setupContainer = document.querySelector('.setup-container');
        const containerStyles = setupContainer ? window.getComputedStyle(setupContainer) : null;

        // Get main heading
        const h1 = document.querySelector('h1');
        const h2 = document.querySelector('h2');
        const mainHeading = h2 || h1;
        const headingStyles = mainHeading ? window.getComputedStyle(mainHeading) : null;

        // Check for ALL types of emojis
        const emojiRegex =
          /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
        const textContent = document.body.textContent || '';
        const emojis = textContent.match(emojiRegex) || [];

        // Get step indicator text
        const stepIndicator = document.querySelector('.step-indicator, [class*="step"]');

        return {
          stepNumber: stepNumber,
          stepName: stepIndicator?.textContent?.trim() || 'Unknown',
          url: window.location.href,
          headingText: mainHeading?.textContent?.trim(),
          emojisFound: emojis.length,
          emojisInText: emojis,

          // Background comparison
          backgroundColor: containerStyles?.backgroundColor || bodyStyles.backgroundColor,
          backgroundMatches:
            (containerStyles?.backgroundColor || bodyStyles.backgroundColor) ===
            homeRef.backgroundColor,

          // Font comparison
          fontFamily: bodyStyles.fontFamily,
          fontMatches: bodyStyles.fontFamily === homeRef.fontFamily,

          // Heading font analysis
          headingFontSize: headingStyles?.fontSize,
          headingUsesDesignSystem:
            mainHeading?.getAttribute('style')?.includes('var(--text-heading') || false,

          error: null,
        };
      },
      homeRef,
      stepNumber
    );
  } catch (error) {
    return {
      stepNumber: stepNumber,
      stepName: `Step ${stepNumber}`,
      error: error.message,
      emojisFound: 999, // Mark as failed
      backgroundMatches: false,
      fontMatches: false,
    };
  }
}

fullWorkflowTest().catch(console.error);
