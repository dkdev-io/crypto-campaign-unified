import puppeteer from 'puppeteer';

async function findRemainingEmoji() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:5173/BankConnection', { waitUntil: 'networkidle0' });

    const emojiDetails = await page.evaluate(() => {
      const emojiRegex = /[^\x00-\x7F]/g;
      const textContent = document.body.textContent;
      const matches = textContent.match(emojiRegex);

      // Find the exact location
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);

      const results = [];
      let node;
      while ((node = walker.nextNode())) {
        const nonAscii = node.textContent.match(emojiRegex);
        if (nonAscii) {
          results.push({
            text: node.textContent.trim(),
            emojis: nonAscii,
            parentTag: node.parentElement?.tagName,
            parentClass: node.parentElement?.className,
            parentHTML: node.parentElement?.outerHTML?.substring(0, 200),
          });
        }
      }

      return { allEmojis: matches, details: results };
    });

    console.log('Emojis found:', emojiDetails.allEmojis);
    console.log('\nDetails:');
    emojiDetails.details.forEach((item, index) => {
      console.log(`${index + 1}. "${item.text}" - contains: ${item.emojis.join(', ')}`);
      console.log(`   In: <${item.parentTag} class="${item.parentClass}">`);
    });
  } finally {
    await browser.close();
  }
}

findRemainingEmoji().catch(console.error);
