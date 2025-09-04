import puppeteer from 'puppeteer';

async function navigateToStep2() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 720 },
  });

  const page = await browser.newPage();

  try {
    console.log('🚀 Navigating to setup step 2...');

    // Go to setup page
    await page.goto('http://localhost:5173/campaigns/auth/setup?bypass=dev', {
      waitUntil: 'networkidle0',
    });

    // Fill out step 1 form to advance to step 2
    try {
      // Fill campaign name
      const campaignNameInput = await page.waitForSelector(
        'input[name="campaignName"], input[placeholder*="campaign"], input[placeholder*="Campaign"]',
        { timeout: 5000 }
      );
      await campaignNameInput.type('Test Campaign');

      // Fill website
      const websiteInput = await page.waitForSelector(
        'input[name="website"], input[type="url"], input[placeholder*="website"]',
        { timeout: 5000 }
      );
      await websiteInput.type('https://example.com');

      // Click Next button
      const nextButton = await page.waitForSelector(
        'button:has-text("Next"), button:has-text("Continue"), .btn-primary',
        { timeout: 5000 }
      );
      await nextButton.click();

      // Wait for step 2 to load
      await page.waitForTimeout(3000);
    } catch (e) {
      console.log('Could not advance to step 2:', e.message);
    }

    // Now check step 2 content
    const step2Info = await page.evaluate(() => {
      const stepText =
        document.querySelector('[class*="step"], .step-indicator')?.textContent || '';
      const h2 = document.querySelector('h2');
      const emojis = document.body.textContent.match(/[🔍📝]/g);

      // Find all text with Find Your Committee or Add Committee
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);

      const targetElements = [];
      let node;
      while ((node = walker.nextNode())) {
        if (
          node.textContent.includes('Find Your Committee') ||
          node.textContent.includes('Add Committee Name') ||
          node.textContent.includes('🔍') ||
          node.textContent.includes('📝')
        ) {
          targetElements.push({
            text: node.textContent.trim(),
            parent: node.parentElement?.tagName,
            parentHTML: node.parentElement?.outerHTML?.substring(0, 200),
          });
        }
      }

      return {
        currentStep: stepText,
        h2Text: h2?.textContent?.trim(),
        emojisFound: emojis || [],
        targetElements: targetElements,
        url: window.location.href,
      };
    });

    console.log('\nStep 2 Info:');
    console.log(`Current step: ${step2Info.currentStep}`);
    console.log(`H2 text: ${step2Info.h2Text}`);
    console.log(`Emojis found: ${step2Info.emojisFound}`);
    console.log(`URL: ${step2Info.url}`);

    if (step2Info.targetElements.length > 0) {
      console.log('\nTarget text found:');
      step2Info.targetElements.forEach((el, i) => {
        console.log(`${i + 1}. "${el.text}" in <${el.parent}>`);
        console.log(`   HTML: ${el.parentHTML}`);
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 10000));
  } finally {
    await browser.close();
  }
}

navigateToStep2().catch(console.error);
