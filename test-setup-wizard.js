import { chromium } from 'playwright';

async function testSetupWizard() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🧪 Testing SetupWizard component...');
  
  page.on('console', msg => {
    console.log('🖥️  Browser:', msg.type(), msg.text());
  });
  
  page.on('pageerror', error => {
    console.log('💥 Error:', error.message);
  });
  
  try {
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(3000);
    
    const bodyText = await page.textContent('body');
    console.log('📝 Page content length:', bodyText.length);
    console.log('📝 Content preview:', bodyText.substring(0, 400));
    
    // Check for SetupWizard content
    const hasSetupContent = bodyText.includes('Setup') || bodyText.includes('Campaign') || bodyText.includes('Step');
    const hasForm = await page.$('form');
    const hasInputs = await page.$$('input');
    
    console.log('🔍 SetupWizard check:');
    console.log('  Has setup content:', hasSetupContent ? '✅' : '❌');
    console.log('  Has form elements:', hasForm ? '✅' : '❌');
    console.log('  Input fields found:', hasInputs.length);
    
    if (hasSetupContent || hasForm) {
      console.log('🎉 SUCCESS: SetupWizard is loading!');
      
      // Take screenshot
      await page.screenshot({ path: '/tmp/setup-wizard.png', fullPage: true });
      console.log('📸 Screenshot saved to /tmp/setup-wizard.png');
    } else {
      console.log('❌ SetupWizard not loading properly');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testSetupWizard();