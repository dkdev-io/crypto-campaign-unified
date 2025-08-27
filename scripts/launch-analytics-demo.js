const puppeteer = require('puppeteer');

/**
 * Launch Analytics Demo with Real React Components
 * Opens the live Vite server with analytics tracking
 */

async function main() {
  try {
    console.log('🚀 Launching analytics demo with real React components...');
    
    // Launch browser
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      devtools: true, // Open dev tools to see analytics logs
      args: [
        '--start-maximized',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    const page = await browser.newPage();
    
    // Console logging to capture analytics events
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (text.includes('[CampaignAnalytics]') || text.includes('Analytics')) {
      } else if (type === 'error') {
        console.error('❌ Browser Error:', text);
      }
    });

    // Navigate to analytics demo with UTM parameters for testing
    const demoUrl = 'http://localhost:5173/analytics-demo?utm_source=demo&utm_medium=puppeteer&utm_campaign=test&utm_content=main_demo';
    
    await page.goto(demoUrl, { waitUntil: 'networkidle0' });


    // Wait a bit then perform some automated interactions for demo
    setTimeout(async () => {
      
      try {
        // Scroll to trigger scroll events
        await page.evaluate(() => {
          window.scrollTo({ top: 300, behavior: 'smooth' });
        });
        
        setTimeout(async () => {
          await page.evaluate(() => {
            window.scrollTo({ top: 600, behavior: 'smooth' });
          });
        }, 2000);
        
        // Click on a preset amount button after 3 seconds
        setTimeout(async () => {
          const presetButtons = await page.$$('button[style*="2px solid"]');
          if (presetButtons.length > 0) {
            await presetButtons[0].click();
          }
        }, 3000);
        
      } catch (error) {
        console.log('Demo interaction error (this is normal):', error.message);
      }
      
    }, 5000);

    
    // Keep running
    process.on('SIGINT', () => {
      browser.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };