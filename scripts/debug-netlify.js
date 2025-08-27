const puppeteer = require('puppeteer');

async function debugNetlify() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    // Listen for console errors
    page.on('console', msg => {
    });
    
    // Listen for page errors
    page.on('pageerror', error => {
        console.log('PAGE ERROR:', error.message);
    });
    
    // Listen for failed requests
    page.on('requestfailed', request => {
        console.log('FAILED REQUEST:', request.url(), request.failure().errorText);
    });
    
    await page.goto('https://cryptocampaign.netlify.app/', { 
        waitUntil: 'networkidle0',
        timeout: 30000 
    });
    
    // Check what's actually loaded
    const bodyContent = await page.evaluate(() => {
        return {
            innerHTML: document.body.innerHTML.slice(0, 1000),
            scripts: Array.from(document.scripts).map(s => s.src || 'inline'),
            hasRoot: !!document.querySelector('#root'),
            rootContent: document.querySelector('#root')?.innerHTML || 'empty'
        };
    });
    
    
    // Wait a bit to see if anything loads
    await page.waitForTimeout(5000);
    
    await browser.close();
}

debugNetlify().catch(console.error);