import puppeteer from 'puppeteer';

async function debugAdminAuth() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Clear authentication state
    console.log('🔍 Clearing authentication state...');
    await page.goto('http://localhost:5173');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Check localStorage after clearing
    const localStorageAfterClear = await page.evaluate(() => {
      return JSON.stringify(localStorage);
    });
    console.log('localStorage after clear:', localStorageAfterClear);
    
    console.log('🔍 Navigating to /minda...');
    await page.goto('http://localhost:5173/minda');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const currentUrl = page.url();
    console.log('Final URL:', currentUrl);
    
    // Check if we can see the page content
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    const bodyText = await page.evaluate(() => {
      return document.body.innerText.substring(0, 200);
    });
    console.log('Page content preview:', bodyText);
    
    // Check localStorage again
    const localStorage2 = await page.evaluate(() => {
      return JSON.stringify(localStorage);
    });
    console.log('localStorage after navigation:', localStorage2);
    
    // Keep browser open for manual inspection
    console.log('🔍 Browser will stay open for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    await browser.close();
  }
}

debugAdminAuth().catch(console.error);