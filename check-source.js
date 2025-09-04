import puppeteer from 'puppeteer';

async function checkPageSource() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3000/campaigns/auth');
    
    // Check if emoji exists in initial HTML
    const initialHTML = await page.content();
    const hasEmojiInSource = initialHTML.includes('🔧');
    
    console.log('Emoji in initial HTML:', hasEmojiInSource);
    
    // Wait a bit and check if it appears dynamically
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const finalHTML = await page.content();
    const hasEmojiAfterLoad = finalHTML.includes('🔧');
    
    console.log('Emoji after page load:', hasEmojiAfterLoad);
    
    // Check for any scripts that might add it
    const scripts = await page.evaluate(() => {
      return Array.from(document.scripts).map(script => ({
        src: script.src,
        content: script.innerHTML.substring(0, 500)
      }));
    });
    
    console.log('\nScripts on page:', scripts.length);
    scripts.forEach((script, index) => {
      if (script.content.includes('🔧') || script.content.includes('Dev Tools')) {
        console.log(`Script ${index + 1} contains emoji/dev tools:`);
        console.log(script.content);
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

checkPageSource().catch(console.error);