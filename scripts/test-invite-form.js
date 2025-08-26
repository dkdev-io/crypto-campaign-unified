#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testInviteForm() {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    slowMo: 100
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('🔍 Testing invite form at /invite-test');
    await page.goto('http://localhost:5175/invite-test', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Analyze the invite form
    const inviteAnalysis = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      
      return {
        // Required elements from your prompt
        hasEmailInputs: document.querySelectorAll('input[type="email"], input[placeholder*="Email"], input[placeholder*="email"]').length,
        hasAdminCheckbox: bodyText.includes('Admin'),
        hasExportCheckbox: bodyText.includes('Export'), 
        hasViewCheckbox: bodyText.includes('View'),
        hasSendButton: bodyText.includes('Send'),
        hasInviteButton: bodyText.includes('Invite'),
        hasAddMoreOption: bodyText.includes('Add'),
        hasRemoveOption: bodyText.includes('Remove'),
        
        // Form structure
        totalInputs: document.querySelectorAll('input').length,
        totalCheckboxes: document.querySelectorAll('input[type="checkbox"]').length,
        totalButtons: document.querySelectorAll('button').length,
        
        // Content analysis
        bodyText: bodyText,
        
        // Specific requirement checks
        canAddMultipleEmails: bodyText.includes('Add') && bodyText.includes('Another'),
        hasPermissionSelection: bodyText.includes('Admin') && bodyText.includes('Export') && bodyText.includes('View'),
        hasActionButton: bodyText.includes('Send') || bodyText.includes('Invite')
      };
    });
    
    console.log('\n📊 INVITE FORM ANALYSIS:');
    console.log('=' * 50);
    
    // Check against your specific requirements
    console.log('\n🎯 YOUR REQUIREMENTS CHECK:');
    console.log('Required: "User only needs to see a screen where they can add emails and select permissions, and a button to invite other users"');
    
    console.log(`\n✅ Email inputs: ${inviteAnalysis.hasEmailInputs > 0 ? '✓' : '✗'} (Found: ${inviteAnalysis.hasEmailInputs})`);
    console.log(`✅ Admin permission: ${inviteAnalysis.hasAdminCheckbox ? '✓' : '✗'}`);
    console.log(`✅ Export permission: ${inviteAnalysis.hasExportCheckbox ? '✓' : '✗'}`);
    console.log(`✅ View permission: ${inviteAnalysis.hasViewCheckbox ? '✓' : '✗'}`);
    console.log(`✅ Send/Invite button: ${inviteAnalysis.hasSendButton || inviteAnalysis.hasInviteButton ? '✓' : '✗'}`);
    console.log(`✅ Add more emails: ${inviteAnalysis.canAddMultipleEmails ? '✓' : '✗'}`);
    
    // Calculate match percentage
    const requirements = [
      inviteAnalysis.hasEmailInputs > 0,
      inviteAnalysis.hasAdminCheckbox,
      inviteAnalysis.hasExportCheckbox,
      inviteAnalysis.hasViewCheckbox,
      inviteAnalysis.hasSendButton || inviteAnalysis.hasInviteButton,
      inviteAnalysis.canAddMultipleEmails
    ];
    
    const matchCount = requirements.filter(Boolean).length;
    const matchPercentage = Math.round((matchCount / requirements.length) * 100);
    
    console.log(`\n🏆 MATCHES YOUR REQUIREMENTS: ${matchPercentage}%`);
    
    if (matchPercentage === 100) {
      console.log('🎉 PERFECT MATCH - Form meets 100% of requirements!');
    } else {
      console.log('⚠️ Issues found:');
      if (inviteAnalysis.hasEmailInputs === 0) console.log('  - Missing email input fields');
      if (!inviteAnalysis.hasAdminCheckbox) console.log('  - Missing Admin permission checkbox');
      if (!inviteAnalysis.hasExportCheckbox) console.log('  - Missing Export permission checkbox');
      if (!inviteAnalysis.hasViewCheckbox) console.log('  - Missing View permission checkbox');
      if (!inviteAnalysis.hasSendButton && !inviteAnalysis.hasInviteButton) console.log('  - Missing Send/Invite button');
      if (!inviteAnalysis.canAddMultipleEmails) console.log('  - Missing ability to add multiple emails');
    }
    
    console.log('\n📝 FORM CONTENT:');
    console.log(inviteAnalysis.bodyText);
    
    console.log('\n📊 FORM STRUCTURE:');
    console.log(`Total inputs: ${inviteAnalysis.totalInputs}`);
    console.log(`Email inputs: ${inviteAnalysis.hasEmailInputs}`);
    console.log(`Checkboxes: ${inviteAnalysis.totalCheckboxes}`);
    console.log(`Buttons: ${inviteAnalysis.totalButtons}`);
    
    // Test adding another invite row
    console.log('\n🔄 Testing "Add Another" functionality...');
    try {
      // Look for Add Another button
      const addButtons = await page.$$('button');
      let addButtonFound = false;
      
      for (let button of addButtons) {
        const buttonText = await page.evaluate(el => el.textContent, button);
        if (buttonText.includes('Add')) {
          console.log(`Found Add button: "${buttonText}"`);
          await button.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          addButtonFound = true;
          break;
        }
      }
      
      if (addButtonFound) {
        // Check if another row was added
        const afterAdd = await page.evaluate(() => ({
          emailInputs: document.querySelectorAll('input[type="email"], input[placeholder*="Email"], input[placeholder*="email"]').length
        }));
        
        console.log(`Email inputs after clicking Add: ${afterAdd.emailInputs}`);
        console.log(`✅ Add functionality works: ${afterAdd.emailInputs > inviteAnalysis.hasEmailInputs ? '✓' : '✗'}`);
      } else {
        console.log('❌ Add Another button not found');
      }
    } catch (error) {
      console.log('Error testing Add functionality:', error.message);
    }
    
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/scripts/invite-form-test.png',
      fullPage: true 
    });
    
    console.log('\n📸 Screenshot saved to: scripts/invite-form-test.png');
    console.log('\n🔍 Browser staying open for 8 seconds for inspection...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

testInviteForm().catch(console.error);