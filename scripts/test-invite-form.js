#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testInviteForm() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    slowMo: 100,
  });

  try {
    const page = await browser.newPage();

    await page.goto('http://localhost:5175/invite-test', {
      waitUntil: 'networkidle0',
      timeout: 10000,
    });

    // Analyze the invite form
    const inviteAnalysis = await page.evaluate(() => {
      const bodyText = document.body.innerText;

      return {
        // Required elements from your prompt
        hasEmailInputs: document.querySelectorAll(
          'input[type="email"], input[placeholder*="Email"], input[placeholder*="email"]'
        ).length,
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
        hasPermissionSelection:
          bodyText.includes('Admin') && bodyText.includes('Export') && bodyText.includes('View'),
        hasActionButton: bodyText.includes('Send') || bodyText.includes('Invite'),
      };
    });

    // Check against your specific requirements

    // Calculate match percentage
    const requirements = [
      inviteAnalysis.hasEmailInputs > 0,
      inviteAnalysis.hasAdminCheckbox,
      inviteAnalysis.hasExportCheckbox,
      inviteAnalysis.hasViewCheckbox,
      inviteAnalysis.hasSendButton || inviteAnalysis.hasInviteButton,
      inviteAnalysis.canAddMultipleEmails,
    ];

    const matchCount = requirements.filter(Boolean).length;
    const matchPercentage = Math.round((matchCount / requirements.length) * 100);

    if (matchPercentage === 100) {
    } else {
      console.log('⚠️ Issues found:');
    }

    // Test adding another invite row
    try {
      // Look for Add Another button
      const addButtons = await page.$$('button');
      let addButtonFound = false;

      for (let button of addButtons) {
        const buttonText = await page.evaluate((el) => el.textContent, button);
        if (buttonText.includes('Add')) {
          await button.click();
          await new Promise((resolve) => setTimeout(resolve, 1000));
          addButtonFound = true;
          break;
        }
      }

      if (addButtonFound) {
        // Check if another row was added
        const afterAdd = await page.evaluate(() => ({
          emailInputs: document.querySelectorAll(
            'input[type="email"], input[placeholder*="Email"], input[placeholder*="email"]'
          ).length,
        }));
      } else {
        console.log('❌ Add Another button not found');
      }
    } catch (error) {
      console.log('Error testing Add functionality:', error.message);
    }

    await page.screenshot({
      path: '/Users/Danallovertheplace/crypto-campaign-unified/scripts/invite-form-test.png',
      fullPage: true,
    });

    await new Promise((resolve) => setTimeout(resolve, 8000));
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

testInviteForm().catch(console.error);
