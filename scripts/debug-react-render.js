const puppeteer = require('puppeteer');

async function debugReactRender() {
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser for debugging
    devtools: true, // Open dev tools
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Capture ALL console logs
  page.on('console', msg => {
  });
  
  page.on('pageerror', error => {
    console.log('❌ PAGE ERROR:', error.message);
  });
  
  await page.goto('http://localhost:5173/analytics-demo', { 
    waitUntil: 'networkidle0'
  });
  
  // Wait for React to potentially render
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Check the DOM
  const domInfo = await page.evaluate(() => {
    const root = document.getElementById('root');
    const hasReactRoot = root && root._reactRootContainer;
    const rootChildren = root ? root.children.length : 0;
    const rootHTML = root ? root.innerHTML.substring(0, 500) : 'No root';
    
    // Check React fiber
    const reactFiber = root && root._reactRootContainer ? 
      'Has React Fiber' : 'No React Fiber';
    
    // Check for React DevTools
    const hasReactDevTools = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    
    return {
      hasRoot: !!root,
      hasReactRoot,
      rootChildren,
      rootHTML,
      reactFiber,
      hasReactDevTools: !!hasReactDevTools,
      pathname: window.location.pathname,
      href: window.location.href
    };
  });
  
  console.log('  Has #root element:', domInfo.hasRoot);
  console.log('  Has React root:', domInfo.hasReactRoot);
  console.log('  Root children count:', domInfo.rootChildren);
  console.log('  React Fiber:', domInfo.reactFiber);
  console.log('  React DevTools:', domInfo.hasReactDevTools);
  console.log('  Current pathname:', domInfo.pathname);
  console.log('  Current href:', domInfo.href);
  console.log(domInfo.rootHTML);
  
  // Try to trigger a re-render
  await page.evaluate(() => {
    // Try changing the URL hash to trigger a re-render
    window.location.hash = '#test';
    window.location.hash = '';
  });
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const afterRerender = await page.evaluate(() => {
    const root = document.getElementById('root');
    return {
      rootChildren: root ? root.children.length : 0,
      rootHTML: root ? root.innerHTML.substring(0, 200) : 'No root'
    };
  });
  
  
  
  // Keep browser open
  await new Promise(() => {});
}

debugReactRender().catch(console.error);