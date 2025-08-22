import { chromium } from 'playwright';

async function testMinimalApp() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🧪 Testing minimal React app...');
  
  // Enable console logging
  page.on('console', msg => {
    console.log('🖥️  Browser console:', msg.type(), msg.text());
  });
  
  page.on('pageerror', error => {
    console.log('💥 Browser error:', error.message);
  });
  
  try {
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(3000);
    
    const bodyText = await page.textContent('body');
    console.log('📝 Page content length:', bodyText.length);
    console.log('📝 Content preview:', bodyText.substring(0, 300));
    
    const hasTitle = bodyText.includes('Campaign Setup System');
    const hasReactText = bodyText.includes('React is working');
    
    console.log('🔍 Content check:');
    console.log('  Has title:', hasTitle ? '✅' : '❌');
    console.log('  Has React text:', hasReactText ? '✅' : '❌');
    
    if (hasTitle && hasReactText) {
      console.log('🎉 SUCCESS: React app is rendering correctly!');
    } else {
      console.log('❌ React app not rendering properly');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testMinimalApp();