import puppeteer from 'puppeteer';

async function inspectPage() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3000/campaigns/auth', { waitUntil: 'networkidle0' });
    
    // Get the complete HTML and search for the emoji
    const html = await page.content();
    const lines = html.split('\n');
    const emojiLines = lines.filter(line => line.includes('🔧'));
    
    console.log('Lines containing 🔧:');
    emojiLines.forEach((line, index) => {
      console.log(`${index + 1}. ${line.trim()}`);
    });
    
    // Also get the DOM structure around the emoji
    const emojiContext = await page.evaluate(() => {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      const results = [];
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent.includes('🔧')) {
          const element = node.parentElement;
          results.push({
            text: node.textContent,
            parentTag: element?.tagName,
            parentClass: element?.className,
            parentStyle: element?.getAttribute('style'),
            siblingText: Array.from(element?.parentElement?.children || []).map(el => el.textContent?.trim()),
            fullHTML: element?.outerHTML
          });
        }
      }
      return results;
    });
    
    console.log('\nDOM Context:');
    emojiContext.forEach((item, index) => {
      console.log(`\n${index + 1}. "${item.text}"`);
      console.log(`   Parent: <${item.parentTag} class="${item.parentClass}">`);
      console.log(`   Siblings: ${item.siblingText.join(' | ')}`);
      console.log(`   HTML: ${item.fullHTML?.substring(0, 300)}`);
    });
    
    await new Promise(resolve => setTimeout(resolve, 10000)); // Keep browser open for 10 seconds
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

inspectPage().catch(console.error);