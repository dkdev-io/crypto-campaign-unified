#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testRealEmailInvites() {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    slowMo: 100
  });
  
  try {
    const page = await browser.newPage();
    
    // Capture console messages
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Error') || text.includes('failed')) {
        console.log(`❌ Console error: ${text}`);
      } else if (text.includes('Success') || text.includes('sent')) {
      }
    });
    
    
    await page.goto('http://localhost:5175/invite-test', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Wait for form to load
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    
    // Check if the new component loaded
    const pageContent = await page.evaluate(() => {
      return {
        hasTitle: document.body.innerText.includes('Invite Team Members'),
        hasEmailWorking: document.body.innerText.includes('Email Invitations Now Working'),
        hasWarning: document.body.innerText.includes('Please use real'),
        bodyText: document.body.innerText.slice(0, 500)
      };
    });
    
    console.log(`✅ Real email warning: ${pageContent.hasWarning ? '✓' : '✗'}`);
    
    // Test with invalid email first
    await page.type('input[type="email"]', 'test@example.com');
    
    // Check if validation warning appears
    await new Promise(resolve => setTimeout(resolve, 500));
    const validationWarning = await page.evaluate(() => {
      const small = document.querySelector('small[style*="color"]');
      return small ? small.innerText : null;
    });
    
    if (validationWarning) {
      console.log(`✅ Validation working: "${validationWarning}"`);
    }
    
    // Clear and test with valid email
    await page.evaluate(() => {
      document.querySelector('input[type="email"]').value = '';
    });
    
    const testEmail = `testuser${Date.now()}@gmail.com`;
    await page.type('input[type="email"]', testEmail);
    await page.click('input[type="checkbox"]'); // Check first permission
    
    // Listen for alerts
    let alertMessage = null;
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      await dialog.accept();
    });
    
    // Click Send Invitations
    await page.click('button[type="submit"]');
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check results
    const results = await page.evaluate(() => {
      const h3Elements = Array.from(document.querySelectorAll('h3'));
      const resultsSection = h3Elements.find(h3 => h3.innerText.includes('Invitation Results'));
      if (!resultsSection) {
        return null;
      }
      
      const resultDivs = document.querySelectorAll('div[style*="border: 2px solid"]');
      const results = [];
      resultDivs.forEach(div => {
        const email = div.querySelector('strong')?.innerText;
        const message = div.querySelector('div[style*="color: #6c757d"]')?.innerText;
        const hasSuccess = div.style.border.includes('40, 167, 69'); // green
        const hasInfo = div.style.border.includes('23, 162, 184'); // blue
        const hasError = div.style.border.includes('220, 53, 69'); // red
        
        if (email) {
          results.push({
            email,
            message,
            status: hasSuccess ? 'sent' : hasInfo ? 'exists' : hasError ? 'error' : 'unknown'
          });
        }
      });
      
      return results;
    });
    
    console.log('\n📊 INVITATION RESULTS:');
    if (results && results.length > 0) {
      results.forEach(result => {
        const icon = result.status === 'sent' ? '✅' : 
                     result.status === 'exists' ? 'ℹ️' : '❌';
        console.log(`${icon} ${result.email}:`);
        console.log(`   Status: ${result.status}`);
        console.log(`   Message: ${result.message}`);
      });
      
      const sentCount = results.filter(r => r.status === 'sent').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      
      console.log(`\n📈 Summary: ${sentCount} sent, ${errorCount} errors`);
      
      if (sentCount > 0) {
        console.log('\n✅ SUCCESS: Real email invitations are working!');
      }
    } else if (alertMessage) {
      if (alertMessage.includes('Success')) {
        console.log('\n✅ SUCCESS: Alert indicates emails were sent!');
      } else if (alertMessage.includes('Invalid email')) {
      } else {
      }
    }
    
    // Check for Continue button
    const hasContinueButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const continueButton = buttons.find(btn => 
        btn.innerText.includes('Continue to Campaign Setup') ||
        (btn.style.background && btn.style.background.includes('28a745'))
      );
      return !!continueButton;
    });
    
    if (hasContinueButton) {
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/scripts/real-email-invites.png',
      fullPage: true 
    });
    
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

testRealEmailInvites().catch(console.error);