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
        console.log(`📊 ${type.toUpperCase()}:`, text);
      } else if (type === 'error') {
        console.error('❌ Browser Error:', text);
      }
    });

    // Navigate to analytics demo with UTM parameters for testing
    const demoUrl = 'http://localhost:5173/analytics-demo?utm_source=demo&utm_medium=puppeteer&utm_campaign=test&utm_content=main_demo';
    console.log('📱 Opening analytics demo:', demoUrl);
    
    await page.goto(demoUrl, { waitUntil: 'networkidle0' });

    console.log('\n✅ Analytics demo is now running!');
    console.log('\n🎯 Try these interactions to see analytics in action:');
    console.log('   • Fill out the form fields (watch console for field focus events)');
    console.log('   • Change the contribution amount (milestone tracking)');
    console.log('   • Try to submit the form (validation tracking)');
    console.log('   • Scroll the page (scroll depth tracking)');
    console.log('   • Open browser dev tools to see detailed analytics logs');
    console.log('   • Check the privacy banner and consent options');
    console.log('\n🔧 Test commands in browser console:');
    console.log('   window.getAnalyticsStatus() - See analytics status');
    console.log('   window.trackEvent("test", {custom: true}) - Track custom event');
    console.log('   window.campaignAnalytics - Access analytics instance');

    // Wait a bit then perform some automated interactions for demo
    setTimeout(async () => {
      console.log('\n🤖 Performing demo interactions...');
      
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
            console.log('🤖 Clicked preset amount button (should trigger analytics)');
          }
        }, 3000);
        
      } catch (error) {
        console.log('Demo interaction error (this is normal):', error.message);
      }
      
    }, 5000);

    console.log('\n⚠️ Keep this process running to maintain the demo');
    console.log('Press Ctrl+C to stop the demo');
    
    // Keep running
    process.on('SIGINT', () => {
      console.log('\n👋 Shutting down analytics demo...');
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