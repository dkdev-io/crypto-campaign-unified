const puppeteer = require('puppeteer');

async function testDashboardContent() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('PAGE LOG:', msg.text());
  });
  
  try {
    console.log('1. Going directly to dashboard with bypass...');
    await page.goto('https://cryptocampaign.netlify.app/donors/dashboard?bypass=true');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('2. Taking screenshot...');
    await page.screenshot({ path: 'dashboard-bypass-test.png', fullPage: true });
    
    console.log('3. Getting page content...');
    const title = await page.title();
    console.log('Page title:', title);
    
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('Body text (first 500 chars):', bodyText.substring(0, 500));
    
    const hasContent = bodyText.includes('Dashboard') || bodyText.includes('Welcome');
    console.log('Has dashboard content:', hasContent);
    
    if (!hasContent) {
      console.log('❌ DASHBOARD IS EMPTY OR BROKEN');
      console.log('Full body text:', bodyText);
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
  
  console.log('4. Closing browser...');
  await browser.close();
}

testDashboardContent().catch(console.error);