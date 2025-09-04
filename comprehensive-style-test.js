import puppeteer from 'puppeteer';

async function comprehensiveStyleTest() {
  console.log('🔍 COMPREHENSIVE STYLING TEST - localhost:5173\n');

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });

  const allPages = [
    { name: 'Homepage', url: 'http://localhost:5173' },
    { name: 'Campaign Auth', url: 'http://localhost:5173/campaigns/auth' },
    { name: 'Donor Auth', url: 'http://localhost:5173/donors/auth' },
    { name: 'Campaign Setup', url: 'http://localhost:5173/campaigns/auth/setup' },
    { name: 'Campaign Info Form', url: 'http://localhost:5173/YourInfo' },
    { name: 'Committee Search', url: 'http://localhost:5173/CommitteeSearch' },
    { name: 'Bank Connection', url: 'http://localhost:5173/BankConnection' },
    { name: 'Website Style', url: 'http://localhost:5173/WebsiteStyle' },
    { name: 'Donor Dashboard', url: 'http://localhost:5173/donors/dashboard' },
  ];

  let results = [];
  let consistentPages = 0;

  for (const pageInfo of allPages) {
    console.log(`📸 Testing ${pageInfo.name}...`);

    try {
      await page.goto(pageInfo.url, { waitUntil: 'networkidle0', timeout: 10000 });

      // Take screenshot
      await page.screenshot({
        path: `/private/tmp/comprehensive-${pageInfo.name.toLowerCase().replace(/[ \/]/g, '-')}.png`,
      });

      // Check if page has proper styling
      const styleCheck = await page.evaluate(() => {
        // Check for dark blue background
        const darkElement = document.querySelector(
          '[style*="crypto-navy"], .min-h-screen[style*="214"], [style*="1a237e"]'
        );
        const hasDarkBackground =
          !!darkElement ||
          document.body.style.background.includes('navy') ||
          getComputedStyle(document.body).background.includes('navy');

        // Check for white input fields
        const inputs = document.querySelectorAll(
          'input[type="text"], input[type="email"], input[type="password"]'
        );
        const whiteInputs = Array.from(inputs).filter((input) => {
          const style = getComputedStyle(input);
          return (
            style.backgroundColor === 'rgb(255, 255, 255)' ||
            style.backgroundColor.includes('255, 255, 255')
          );
        });

        // Check Inter font
        const hasInterFont = getComputedStyle(document.body)
          .fontFamily.toLowerCase()
          .includes('inter');

        // Check for emojis in text content
        const emojiRegex =
          /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
        const emojis = document.body.innerText.match(emojiRegex) || [];

        // Check for hardcoded colors
        const allElements = document.querySelectorAll('*');
        const hardcodedColors = [];
        Array.from(allElements).forEach((el) => {
          const style = el.getAttribute('style');
          if (style && (style.includes('#') || style.includes('rgb(') || style.includes('rgba('))) {
            if (!style.includes('crypto-') && !style.includes('hsl(var(--')) {
              hardcodedColors.push(style);
            }
          }
        });

        return {
          hasDarkBackground,
          whiteInputCount: whiteInputs.length,
          totalInputCount: inputs.length,
          hasInterFont,
          emojiCount: emojis.length,
          emojis: emojis.slice(0, 5), // First 5 emojis
          hardcodedColorCount: hardcodedColors.length,
          hardcodedColors: hardcodedColors.slice(0, 3), // First 3 examples
        };
      });

      // Calculate score
      let score = 0;
      if (styleCheck.hasDarkBackground) score += 25;
      if (
        styleCheck.totalInputCount === 0 ||
        styleCheck.whiteInputCount === styleCheck.totalInputCount
      )
        score += 25;
      if (styleCheck.hasInterFont) score += 25;
      if (styleCheck.emojiCount === 0) score += 25;

      const isConsistent = score === 100;
      if (isConsistent) consistentPages++;

      console.log(`  📊 Score: ${score}/100 ${isConsistent ? '✅' : '❌'}`);
      console.log(`    🎨 Dark blue background: ${styleCheck.hasDarkBackground ? '✅' : '❌'}`);
      console.log(
        `    📝 White inputs: ${styleCheck.whiteInputCount}/${styleCheck.totalInputCount} ${styleCheck.totalInputCount === 0 || styleCheck.whiteInputCount === styleCheck.totalInputCount ? '✅' : '❌'}`
      );
      console.log(`    🔤 Inter font: ${styleCheck.hasInterFont ? '✅' : '❌'}`);
      console.log(
        `    😀 No emojis: ${styleCheck.emojiCount === 0 ? '✅' : '❌'} (${styleCheck.emojiCount} found)`
      );
      if (styleCheck.hardcodedColorCount > 0) {
        console.log(`    ⚠️ Hardcoded colors: ${styleCheck.hardcodedColorCount} found`);
      }

      results.push({
        name: pageInfo.name,
        url: pageInfo.url,
        score: score,
        ...styleCheck,
      });
    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}`);
      results.push({
        name: pageInfo.name,
        url: pageInfo.url,
        score: 0,
        error: error.message,
      });
    }
  }

  await browser.close();

  const totalPages = results.length;
  const consistencyPercentage = Math.round((consistentPages / totalPages) * 100);
  const averageScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / totalPages);

  console.log(`\n🎯 COMPREHENSIVE RESULTS:`);
  console.log(`${consistentPages}/${totalPages} pages are perfectly consistent`);
  console.log(`${consistencyPercentage}% of pages have perfect styling`);
  console.log(`Average styling score: ${averageScore}/100`);

  // Detail breakdown
  console.log(`\n📋 PAGE BREAKDOWN:`);
  results.forEach((result) => {
    console.log(`${result.name}: ${result.score}/100 ${result.score === 100 ? '✅' : '❌'}`);
  });

  return { consistencyPercentage, averageScore, consistentPages, totalPages };
}

comprehensiveStyleTest().catch(console.error);
