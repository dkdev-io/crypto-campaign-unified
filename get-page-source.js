import puppeteer from 'puppeteer';

async function getPageSource() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5173/campaigns/auth/setup?bypass=dev', { waitUntil: 'networkidle0' });
    
    // Get the raw HTML source
    const html = await page.content();
    
    // Find lines with emojis
    const lines = html.split('\n');
    const emojiLines = lines.filter(line => 
      line.includes('🔍') || 
      line.includes('📝') ||
      line.includes('Find Your Committee') ||
      line.includes('Add Committee Name')
    );
    
    console.log('Lines with emojis or target text:');
    emojiLines.forEach((line, index) => {
      console.log(`${index + 1}. ${line.trim()}`);
    });
    
    // Also get the DOM structure
    const titleStructure = await page.evaluate(() => {
      const elements = [];
      
      // Find all text nodes containing these strings
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent.includes('Find Your Committee') || 
            node.textContent.includes('Add Committee Name') ||
            node.textContent.includes('🔍') ||
            node.textContent.includes('📝')) {
          elements.push({
            text: node.textContent.trim(),
            parent: node.parentElement?.tagName,
            parentClass: node.parentElement?.className,
            grandparent: node.parentElement?.parentElement?.tagName,
            outerHTML: node.parentElement?.outerHTML?.substring(0, 300)
          });
        }
      }
      
      return elements;
    });
    
    console.log('\nDOM structure:');
    titleStructure.forEach((item, index) => {
      console.log(`\n${index + 1}. "${item.text}"`);
      console.log(`   Parent: <${item.parent} class="${item.parentClass}">`);
      console.log(`   Grandparent: <${item.grandparent}>`);
      console.log(`   HTML: ${item.outerHTML}`);
    });
    
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } finally {
    await browser.close();
  }
}

getPageSource().catch(console.error);