import { chromium } from 'playwright';

async function testViteEmbed() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🧪 Testing embed form via Vite dev server...');
  
  // Enable console logging
  page.on('console', msg => {
    console.log('🖥️  Browser console:', msg.type(), msg.text());
  });
  
  page.on('pageerror', error => {
    console.log('💥 Browser error:', error.message);
  });
  
  try {
    // Test the embed form via Vite public folder
    await page.goto('http://localhost:5173/embed-form.html?campaign=test-id');
    await page.waitForTimeout(5000); // Wait longer for async loading
    
    const bodyText = await page.textContent('body');
    console.log('📝 Page Content Length:', bodyText.length);
    console.log('📝 Content preview:', bodyText.substring(0, 400));
    
    // Check for form elements
    const forms = await page.$$('form');
    console.log('📋 Forms found:', forms.length);
    
    const inputs = await page.$$('input');
    console.log('🔤 Input fields found:', inputs.length);
    
    const buttons = await page.$$('button');
    console.log('🔘 Buttons found:', buttons.length);
    
    // Check for specific form fields
    const hasFullName = bodyText.includes('Full Name');
    const hasEmail = bodyText.includes('Email');
    const hasContribution = bodyText.includes('Contribution Amount');
    const hasEmployer = bodyText.includes('Employer');
    const hasOccupation = bodyText.includes('Occupation');
    const hasCompliance = bodyText.includes('U.S. citizen');
    const hasLoadingMsg = bodyText.includes('Loading campaign');
    const hasErrorMsg = bodyText.includes('Error');
    
    console.log('🔍 Form indicators:');
    console.log('  Full Name:', hasFullName ? '✅' : '❌');
    console.log('  Email:', hasEmail ? '✅' : '❌'); 
    console.log('  Contribution Amount:', hasContribution ? '✅' : '❌');
    console.log('  Employer:', hasEmployer ? '✅' : '❌');
    console.log('  Occupation:', hasOccupation ? '✅' : '❌');
    console.log('  Compliance checkbox:', hasCompliance ? '✅' : '❌');
    console.log('  Loading message:', hasLoadingMsg ? '⏳' : '❌');
    console.log('  Error message:', hasErrorMsg ? '❌' : '✅');
    
    // Take screenshot
    await page.screenshot({ path: '/tmp/vite-embed-test.png', fullPage: true });
    console.log('📸 Screenshot saved to /tmp/vite-embed-test.png');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testViteEmbed();