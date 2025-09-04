#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testWorkingInvites() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    slowMo: 200,
  });

  try {
    const page = await browser.newPage();

    // Capture console messages
    page.on('console', (msg) => {});

    await page.goto('http://localhost:5175/invite-test', {
      waitUntil: 'networkidle0',
      timeout: 10000,
    });

    // Fill in invite form
    await page.type('input[type="email"]', 'test@example.com');
    await page.click('input[type="checkbox"]'); // Check first permission

    // Listen for alerts
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // Click Send Invitations
    await page.click('button[type="submit"]');

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Check if invite links are displayed
    const pageContent = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return {
        hasInviteLinks: bodyText.includes('Invitation Links'),
        hasEmailSent: bodyText.includes('Email sent') || bodyText.includes('Emails sent'),
        hasManualShare:
          bodyText.includes('Copy and send manually') || bodyText.includes('Share these links'),
        hasCopyableLinks: !!document.querySelector('[title="Click to copy"]'),
        hasContinueButton: bodyText.includes('Continue to Campaign Setup'),
        linkElements: document.querySelectorAll('[style*="monospace"]').length,
        bodyText: bodyText.slice(0, 800),
      };
    });

    console.log('\n📊 RESULTS:');

    // Try to find and display an actual invite link
    const inviteLink = await page.evaluate(() => {
      const linkElement = document.querySelector('[style*="monospace"]');
      return linkElement ? linkElement.textContent : null;
    });

    if (inviteLink) {
    }

    // Check if Continue button works
    const continueButton = await page.$(
      'button:has-text("Continue to Campaign Setup"), button[style*="28a745"]'
    );
    if (continueButton) {
      await continueButton.click();
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const newUrl = page.url();
    }

    const success = pageContent.hasInviteLinks && (pageContent.hasCopyableLinks || inviteLink);
    console.log(`\n🏆 INVITE SYSTEM WORKING: ${success ? '✅ YES' : '❌ NO'}`);

    if (success) {
    }

    await page.screenshot({
      path: '/Users/Danallovertheplace/crypto-campaign-unified/scripts/working-invites.png',
      fullPage: true,
    });

    await new Promise((resolve) => setTimeout(resolve, 10000));
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

testWorkingInvites().catch(console.error);
