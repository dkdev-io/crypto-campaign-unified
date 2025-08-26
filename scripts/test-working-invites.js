#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testWorkingInvites() {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    slowMo: 200
  });
  
  try {
    const page = await browser.newPage();
    
    // Capture console messages
    page.on('console', msg => {
      console.log(`Console ${msg.type()}: ${msg.text()}`);
    });
    
    console.log('🧪 TESTING WORKING INVITE SYSTEM');
    console.log('='.repeat(40));
    
    console.log('\n📍 Navigate to /invite-test');
    await page.goto('http://localhost:5175/invite-test', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Fill in invite form
    console.log('\n📝 Filling invite form...');
    await page.type('input[type="email"]', 'test@example.com');
    await page.click('input[type="checkbox"]'); // Check first permission
    
    // Listen for alerts
    page.on('dialog', async dialog => {
      console.log(`\n📢 Alert: ${dialog.message().slice(0, 100)}...`);
      await dialog.accept();
    });
    
    // Click Send Invitations
    console.log('\n📧 Clicking "Send Invitations"...');
    await page.click('button[type="submit"]');
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if invite links are displayed
    const pageContent = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return {
        hasInviteLinks: bodyText.includes('Invitation Links'),
        hasEmailSent: bodyText.includes('Email sent') || bodyText.includes('Emails sent'),
        hasManualShare: bodyText.includes('Copy and send manually') || bodyText.includes('Share these links'),
        hasCopyableLinks: !!document.querySelector('[title="Click to copy"]'),
        hasContinueButton: bodyText.includes('Continue to Campaign Setup'),
        linkElements: document.querySelectorAll('[style*="monospace"]').length,
        bodyText: bodyText.slice(0, 800)
      };
    });
    
    console.log('\n📊 RESULTS:');
    console.log(`✅ Shows invite links section: ${pageContent.hasInviteLinks ? '✓' : '✗'}`);
    console.log(`✅ Shows email status: ${pageContent.hasEmailSent || pageContent.hasManualShare ? '✓' : '✗'}`);
    console.log(`✅ Has copyable links: ${pageContent.hasCopyableLinks ? '✓' : '✗'}`);
    console.log(`✅ Has continue button: ${pageContent.hasContinueButton ? '✓' : '✗'}`);
    console.log(`✅ Link elements found: ${pageContent.linkElements}`);
    
    console.log('\n📝 Page Content:');
    console.log(pageContent.bodyText);
    
    // Try to find and display an actual invite link
    const inviteLink = await page.evaluate(() => {
      const linkElement = document.querySelector('[style*="monospace"]');
      return linkElement ? linkElement.textContent : null;
    });
    
    if (inviteLink) {
      console.log('\n🔗 ACTUAL INVITE LINK GENERATED:');
      console.log(inviteLink);
      console.log('\n✅ Users can now copy this link and share it manually!');
    }
    
    // Check if Continue button works
    const continueButton = await page.$('button:has-text("Continue to Campaign Setup"), button[style*="28a745"]');
    if (continueButton) {
      console.log('\n🚀 Testing "Continue to Campaign Setup" button...');
      await continueButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newUrl = page.url();
      console.log(`Redirected to: ${newUrl}`);
      console.log(`Reached setup page: ${newUrl.includes('/setup') ? '✓' : '✗'}`);
    }
    
    const success = pageContent.hasInviteLinks && (pageContent.hasCopyableLinks || inviteLink);
    console.log(`\n🏆 INVITE SYSTEM WORKING: ${success ? '✅ YES' : '❌ NO'}`);
    
    if (success) {
      console.log('\n✅ SOLUTION: Even though emails may not be sent, users can:');
      console.log('  1. See the invitation links directly on the page');
      console.log('  2. Copy the links by clicking on them');
      console.log('  3. Share the links manually via any method');
      console.log('  4. Continue to campaign setup when ready');
    }
    
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/scripts/working-invites.png',
      fullPage: true 
    });
    
    console.log('\n📸 Screenshot saved to: scripts/working-invites.png');
    console.log('🔍 Browser staying open for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

testWorkingInvites().catch(console.error);