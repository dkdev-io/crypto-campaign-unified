import { chromium } from 'playwright';

async function testSimpleForm() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🧪 Testing simple form on test site...');
  
  try {
    // Navigate to test site with campaign ID
    await page.goto('https://testy-pink-chancellor.lovable.app/?campaign=test-id');
    await page.waitForTimeout(3000);
    
    const bodyText = await page.textContent('body');
    console.log('📝 Page Content Length:', bodyText.length);
    console.log('📝 First 300 chars:', bodyText.substring(0, 300));
    
    // Look for form elements
    const forms = await page.$$('form');
    console.log('📋 Forms found:', forms.length);
    
    const inputs = await page.$$('input');
    console.log('🔤 Input fields found:', inputs.length);
    
    const buttons = await page.$$('button');
    console.log('🔘 Buttons found:', buttons.length);
    
    // Look for specific text that indicates our form
    const hasFullName = bodyText.includes('Full Name');
    const hasEmail = bodyText.includes('Email');
    const hasContribution = bodyText.includes('Contribution Amount');
    const hasEmployer = bodyText.includes('Employer');
    const hasOccupation = bodyText.includes('Occupation');
    
    console.log('🔍 Form field indicators:');
    console.log('  Full Name:', hasFullName ? '✅' : '❌');
    console.log('  Email:', hasEmail ? '✅' : '❌'); 
    console.log('  Contribution Amount:', hasContribution ? '✅' : '❌');
    console.log('  Employer:', hasEmployer ? '✅' : '❌');
    console.log('  Occupation:', hasOccupation ? '✅' : '❌');
    
    // Check for React component indicators
    const hasReactComponents = bodyText.includes('SimpleDonorForm') || 
                              bodyText.includes('Support Our Campaign') ||
                              bodyText.includes('Loading campaign');
    
    console.log('⚛️  React component detected:', hasReactComponents ? '✅' : '❌');
    
    // Check for any JavaScript errors
    const jsErrors = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });
    
    await page.waitForTimeout(2000);
    
    if (jsErrors.length > 0) {
      console.log('💥 JavaScript Errors:', jsErrors);
    } else {
      console.log('✅ No JavaScript errors detected');
    }
    
    // Try to interact with the form if it exists
    if (hasFullName && forms.length > 0) {
      console.log('🎯 Attempting to interact with form...');
      
      try {
        await page.fill('input[type="text"]', 'Test User');
        console.log('✅ Successfully filled text input');
      } catch (e) {
        console.log('❌ Could not fill text input:', e.message);
      }
    }
    
    // Take screenshot
    await page.screenshot({ path: '/tmp/simple-form-test.png', fullPage: true });
    console.log('📸 Screenshot saved to /tmp/simple-form-test.png');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testSimpleForm();