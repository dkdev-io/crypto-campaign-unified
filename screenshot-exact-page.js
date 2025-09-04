import puppeteer from 'puppeteer';

async function screenshotExactPage() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('📸 Taking screenshot of exact page user is viewing...');
    
    // Navigate to the exact URL from user's screenshot
    await page.goto('http://localhost:5173/campaigns/auth/setup?bypass=dev', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait a bit to ensure everything loads
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot
    await page.screenshot({ 
      path: '/private/tmp/user-page-screenshot.png',
      fullPage: true 
    });
    
    console.log('✅ Screenshot saved to: /private/tmp/user-page-screenshot.png');
    
    // Get page info
    const pageInfo = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        h1Text: document.querySelector('h1')?.textContent?.trim(),
        h2Text: document.querySelector('h2')?.textContent?.trim(),
        allText: document.body.textContent.substring(0, 500),
        hasEmojis: /[🔍📝]/.test(document.body.textContent)
      };
    });
    
    console.log('\nPage Info:');
    console.log(`URL: ${pageInfo.url}`);
    console.log(`Title: ${pageInfo.title}`);
    console.log(`H1: ${pageInfo.h1Text}`);
    console.log(`H2: ${pageInfo.h2Text}`);
    console.log(`Has target emojis: ${pageInfo.hasEmojis}`);
    console.log(`First 500 chars: ${pageInfo.allText}`);
    
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

screenshotExactPage().catch(console.error);