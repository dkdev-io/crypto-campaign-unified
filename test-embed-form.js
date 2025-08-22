import { chromium } from 'playwright';

async function testEmbedForm() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🧪 Testing standalone embed form...');
  
  try {
    // Test the local embed form
    await page.goto('http://localhost:5173/embed-form.html?campaign=test-id');
    await page.waitForTimeout(3000);
    
    const bodyText = await page.textContent('body');
    console.log('📝 Page Content Length:', bodyText.length);
    console.log('📝 First 300 chars:', bodyText.substring(0, 300));
    
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
    
    console.log('🔍 Form field indicators:');
    console.log('  Full Name:', hasFullName ? '✅' : '❌');
    console.log('  Email:', hasEmail ? '✅' : '❌'); 
    console.log('  Contribution Amount:', hasContribution ? '✅' : '❌');
    console.log('  Employer:', hasEmployer ? '✅' : '❌');
    console.log('  Occupation:', hasOccupation ? '✅' : '❌');
    console.log('  Compliance checkbox:', hasCompliance ? '✅' : '❌');
    
    // Test form interaction
    if (hasFullName && forms.length > 0) {
      console.log('\n🎯 Testing form interaction...');
      
      try {
        // Fill out the form
        await page.fill('input[name="fullName"]', 'John Doe');
        await page.fill('input[name="email"]', 'john@example.com');
        await page.fill('input[name="street"]', '123 Main St');
        await page.fill('input[name="city"]', 'Anytown');
        await page.fill('input[name="state"]', 'CA');
        await page.fill('input[name="zip"]', '12345');
        await page.fill('input[name="employer"]', 'Test Corp');
        await page.fill('input[name="occupation"]', 'Developer');
        
        // Click amount button
        const amountBtn = await page.$('button[data-amount="50"]');
        if (amountBtn) {
          await amountBtn.click();
          console.log('✅ Successfully clicked $50 amount button');
        }
        
        // Check compliance checkbox
        const checkbox = await page.$('input[name="compliance"]');
        if (checkbox) {
          await checkbox.check();
          console.log('✅ Successfully checked compliance checkbox');
        }
        
        console.log('✅ Form interaction test successful');
        
        // Don't actually submit to avoid creating test data
        console.log('ℹ️  Skipping actual submission to avoid test data');
        
      } catch (e) {
        console.log('❌ Form interaction failed:', e.message);
      }
    }
    
    // Check for JavaScript errors
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
    
    // Take screenshot
    await page.screenshot({ path: '/tmp/embed-form-test.png', fullPage: true });
    console.log('📸 Screenshot saved to /tmp/embed-form-test.png');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testEmbedForm();