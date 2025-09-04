import puppeteer from 'puppeteer';

async function verifyChanges() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('🔍 Verifying UI consistency fixes...\n');

    // Test bank connection page
    await page.goto('http://localhost:5173/BankConnection', { waitUntil: 'networkidle0' });

    const bankPageTest = await page.evaluate(() => {
      const heading = document.querySelector('h2');
      const emojis = document.body.textContent.match(/🏦|🎨|🌐|🔗|🗑️|⚠️|⏳|❌|•/g);

      return {
        headingText: heading?.textContent?.trim(),
        hasEmojis: emojis !== null,
        emojiCount: emojis?.length || 0,
        backgroundColor: window.getComputedStyle(document.body).backgroundColor,
      };
    });

    // Test website style page
    await page.goto('http://localhost:5173/WebsiteStyle', { waitUntil: 'networkidle0' });

    const stylePageTest = await page.evaluate(() => {
      const heading = document.querySelector('h2');
      const emojis = document.body.textContent.match(/🏦|🎨|🌐|🔗|🗑️|⚠️|⏳|❌|•/g);

      return {
        headingText: heading?.textContent?.trim(),
        hasEmojis: emojis !== null,
        emojiCount: emojis?.length || 0,
        backgroundColor: window.getComputedStyle(document.body).backgroundColor,
      };
    });

    console.log('📋 VERIFICATION RESULTS:\n');
    console.log('Bank Connection Page:');
    console.log(`  Heading: "${bankPageTest.headingText}"`);
    console.log(
      `  Emojis Found: ${bankPageTest.hasEmojis ? '❌ YES (' + bankPageTest.emojiCount + ')' : '✅ NO'}`
    );
    console.log(`  Background: ${bankPageTest.backgroundColor}`);

    console.log('\nWebsite Style Page:');
    console.log(`  Heading: "${stylePageTest.headingText}"`);
    console.log(
      `  Emojis Found: ${stylePageTest.hasEmojis ? '❌ YES (' + stylePageTest.emojiCount + ')' : '✅ NO'}`
    );
    console.log(`  Background: ${stylePageTest.backgroundColor}`);

    const success = !bankPageTest.hasEmojis && !stylePageTest.hasEmojis;
    console.log(`\n🎯 OVERALL: ${success ? '✅ SUCCESS' : '❌ STILL HAS ISSUES'}`);

    return { bankPageTest, stylePageTest, success };
  } finally {
    await browser.close();
  }
}

verifyChanges().catch(console.error);
