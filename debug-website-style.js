import puppeteer from 'puppeteer';

async function debugWebsiteStyleInputs() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });

  console.log('🔍 Debugging Website Style page inputs...');

  await page.goto('http://localhost:5173/WebsiteStyle', { waitUntil: 'networkidle0' });

  const inputAnalysis = await page.evaluate(() => {
    const allInputs = document.querySelectorAll('input');
    const textInputs = document.querySelectorAll(
      'input[type="text"], input[type="email"], input[type="password"], input[type="url"]'
    );
    const colorInputs = document.querySelectorAll('input[type="color"]');

    const inputDetails = Array.from(allInputs).map((input, index) => {
      const style = getComputedStyle(input);
      return {
        index,
        type: input.type,
        id: input.id || 'no-id',
        placeholder: input.placeholder || 'no-placeholder',
        backgroundColor: style.backgroundColor,
        color: style.color,
        className: input.className,
        isWhite:
          style.backgroundColor === 'rgb(255, 255, 255)' ||
          style.backgroundColor === 'rgba(255, 255, 255, 1)',
      };
    });

    return {
      totalInputs: allInputs.length,
      textInputs: textInputs.length,
      colorInputs: colorInputs.length,
      inputDetails: inputDetails,
      whiteInputs: inputDetails.filter((input) => input.isWhite).length,
    };
  });

  console.log('\n📊 INPUT ANALYSIS:');
  console.log(`Total inputs: ${inputAnalysis.totalInputs}`);
  console.log(`Text inputs: ${inputAnalysis.textInputs}`);
  console.log(`Color inputs: ${inputAnalysis.colorInputs}`);
  console.log(`White inputs: ${inputAnalysis.whiteInputs}`);

  console.log('\n📝 DETAILED INPUT BREAKDOWN:');
  inputAnalysis.inputDetails.forEach((input, i) => {
    console.log(
      `${i + 1}. Type: ${input.type}, ID: ${input.id}, White: ${input.isWhite ? '✅' : '❌'}`
    );
    console.log(`   Background: ${input.backgroundColor}`);
    console.log(`   Placeholder: ${input.placeholder}`);
    if (!input.isWhite && input.type !== 'color') {
      console.log(`   🚨 NON-WHITE TEXT INPUT FOUND!`);
    }
  });

  await browser.close();
}

debugWebsiteStyleInputs().catch(console.error);
