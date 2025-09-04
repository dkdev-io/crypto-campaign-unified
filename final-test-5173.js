import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();

  console.log('🌐 Testing fixed committee form on port 5173...');
  await page.goto('http://localhost:5173/campaigns/auth/setup?bypass=dev');
  await new Promise((resolve) => setTimeout(resolve, 4000));

  await page.screenshot({ path: 'fixed-committee-5173.png', fullPage: true });

  const pageContent = await page.evaluate(() => document.body.innerText);
  console.log(
    '📄 Page shows:',
    pageContent.includes('Step 2') ? 'Step 2 - Committee' : 'Step 1 or other'
  );

  // Look for committee form
  const committeeInput = await page.$('input[placeholder="Enter your committee name"]');
  console.log('📋 Committee manual form found:', !!committeeInput);

  if (committeeInput) {
    console.log('✅ COMMITTEE FORM WORKING - Testing submission...');

    await committeeInput.type('Final Verification Committee');
    await page.type('input[placeholder="Committee address"]', '123 Verification Ave');
    await page.type('input[placeholder="City"]', 'TestTown');
    await page.type('input[placeholder="State"]', 'TX');
    await page.type('input[placeholder="ZIP"]', '12345');

    console.log('🖱️ Submitting committee form...');

    const submitButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(
        (btn) => btn.textContent.includes('Save Committee') && btn.textContent.includes('Continue')
      );
    });

    if (submitButton.asElement()) {
      await submitButton.asElement().click();
      await new Promise((resolve) => setTimeout(resolve, 4000));

      const finalContent = await page.evaluate(() => document.body.innerText);

      if (
        finalContent.includes('Committee Information Saved') ||
        finalContent.includes('Step 3') ||
        finalContent.includes('Bank')
      ) {
        console.log('🎉 SUCCESS: Committee form saves and advances to next step!');
      } else {
        console.log('❌ Issue detected - final content preview:', finalContent.substring(0, 200));
      }

      await page.screenshot({ path: 'committee-final-result-5173.png', fullPage: true });
    }
  } else {
    console.log('❌ Committee form still not found');
    console.log('Page content:', pageContent.substring(0, 300));
  }

  console.log('✅ Verification complete - check screenshots');
})();
