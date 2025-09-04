import puppeteer from 'puppeteer';

async function findEmojiSource() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 720 },
  });

  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:5173/campaigns/auth', { waitUntil: 'networkidle0' });

    // Find all elements containing the wrench emoji
    const emojiElements = await page.evaluate(() => {
      const emojiRegex = /🔧/g;
      const elements = [];

      function walkNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          if (emojiRegex.test(node.textContent)) {
            elements.push({
              text: node.textContent,
              parentElement: node.parentElement?.tagName,
              parentClass: node.parentElement?.className,
              parentId: node.parentElement?.id,
              outerHTML: node.parentElement?.outerHTML?.substring(0, 200),
            });
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          for (let child of node.childNodes) {
            walkNode(child);
          }
        }
      }

      walkNode(document.body);
      return elements;
    });

    console.log('🔧 Emoji found in these elements:');
    emojiElements.forEach((element, index) => {
      console.log(`\n${index + 1}. Text: "${element.text}"`);
      console.log(`   Parent: ${element.parentElement}`);
      console.log(`   Class: ${element.parentClass}`);
      console.log(`   ID: ${element.parentId}`);
      console.log(`   HTML: ${element.outerHTML}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

findEmojiSource().catch(console.error);
