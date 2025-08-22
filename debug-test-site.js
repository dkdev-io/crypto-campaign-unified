import { chromium } from 'playwright';

async function debugTestSite() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🔍 Investigating test site...');
  
  try {
    // Navigate to the test site
    await page.goto('https://testy-pink-chancellor.lovable.app/');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Get page title and basic info
    const title = await page.title();
    console.log('📄 Page Title:', title);
    
    // Check for any visible content
    const bodyText = await page.textContent('body');
    console.log('📝 Body Text Length:', bodyText.length);
    console.log('📝 First 200 chars:', bodyText.substring(0, 200));
    
    // Check for React errors
    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(`${msg.type()}: ${msg.text()}`));
    
    // Check for any error messages
    const errorElements = await page.$$('[role="alert"], .error, [class*="error"]');
    console.log('❌ Error elements found:', errorElements.length);
    
    // Check if any forms are present
    const forms = await page.$$('form');
    console.log('📋 Forms found:', forms.length);
    
    // Check for specific components
    const campaignElements = await page.$$('[class*="campaign"], [id*="campaign"]');
    console.log('🏛️ Campaign elements found:', campaignElements.length);
    
    // Check for loading states
    const loadingElements = await page.$$('[class*="loading"], [aria-live="polite"]');
    console.log('⏳ Loading elements found:', loadingElements.length);
    
    // Check network requests
    const responses = [];
    page.on('response', response => {
      if (response.url().includes('supabase') || response.url().includes('api')) {
        responses.push(`${response.status()} ${response.url()}`);
      }
    });
    
    await page.waitForTimeout(2000);
    console.log('🌐 Network responses:', responses);
    
    // Check JavaScript errors
    page.on('pageerror', error => {
      console.log('💥 JavaScript Error:', error.message);
    });
    
    // Try visiting debug page
    console.log('\n🔧 Testing debug page...');
    await page.goto('https://testy-pink-chancellor.lovable.app/debug');
    await page.waitForTimeout(2000);
    
    const debugBodyText = await page.textContent('body');
    console.log('🐛 Debug Page Text Length:', debugBodyText.length);
    console.log('🐛 Debug First 200 chars:', debugBodyText.substring(0, 200));
    
    // Try visiting admin page
    console.log('\n👩‍💼 Testing admin page...');
    await page.goto('https://testy-pink-chancellor.lovable.app/admin');
    await page.waitForTimeout(2000);
    
    const adminBodyText = await page.textContent('body');
    console.log('👩‍💼 Admin Page Text Length:', adminBodyText.length);
    console.log('👩‍💼 Admin First 200 chars:', adminBodyText.substring(0, 200));
    
    // Test setup wizard
    console.log('\n🧙‍♂️ Testing setup wizard...');
    await page.goto('https://testy-pink-chancellor.lovable.app/');
    await page.waitForTimeout(2000);
    
    const setupBodyText = await page.textContent('body');
    console.log('🧙‍♂️ Setup Page Text Length:', setupBodyText.length);
    console.log('🧙‍♂️ Setup First 200 chars:', setupBodyText.substring(0, 200));
    
    // Check for specific campaign ID
    console.log('\n🆔 Testing with campaign ID...');
    await page.goto('https://testy-pink-chancellor.lovable.app/?campaign=test-id');
    await page.waitForTimeout(2000);
    
    const campaignBodyText = await page.textContent('body');
    console.log('🆔 Campaign Page Text Length:', campaignBodyText.length);
    console.log('🆔 Campaign First 200 chars:', campaignBodyText.substring(0, 200));
    
    console.log('\n📋 Console Messages:', consoleMessages.slice(0, 10));
    
    // Take a screenshot
    await page.screenshot({ path: '/tmp/test-site-screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved to /tmp/test-site-screenshot.png');
    
  } catch (error) {
    console.error('❌ Error during investigation:', error);
  } finally {
    await browser.close();
  }
}

debugTestSite();