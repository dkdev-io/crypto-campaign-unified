const puppeteer = require('puppeteer');

async function debugAppVersion() {
  console.log('🔍 Debugging App Version and Scripts');
  console.log('===================================\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox'] 
  });
  
  try {
    const page = await browser.newPage();
    
    // Listen for all requests
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('src/')) {
        requests.push(request.url());
      }
    });
    
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    
    console.log('📍 JavaScript files loaded:');
    requests.forEach(url => console.log(`   ${url}`));
    
    // Check what's actually in the DOM
    const scripts = await page.evaluate(() => {
      const scriptTags = Array.from(document.querySelectorAll('script[src]'));
      return scriptTags.map(script => script.src);
    });
    
    console.log('\n📍 Script tags in HTML:');
    scripts.forEach(src => console.log(`   ${src}`));
    
    // Check if there are multiple app roots or React instances
    const reactInfo = await page.evaluate(() => {
      const roots = Array.from(document.querySelectorAll('[id*="root"], [class*="root"], [data-reactroot]'));
      const reactElements = Array.from(document.querySelectorAll('[data-react*]'));
      
      return {
        roots: roots.length,
        reactElements: reactElements.length,
        hasReactDevtools: typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined'
      };
    });
    
    console.log('\n📍 React Info:');
    console.log(`   React roots found: ${reactInfo.roots}`);
    console.log(`   React elements: ${reactInfo.reactElements}`);
    console.log(`   React DevTools: ${reactInfo.hasReactDevtools}`);
    
    await page.screenshot({ path: 'app-debug.png' });
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await browser.close();
  }
}

debugAppVersion();