#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testFullWorkflow() {
  const browser = await puppeteer.launch({
    headless: false, // Show browser for debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    slowMo: 500, // Slow down for visibility
  });

  try {
    const page = await browser.newPage();

    // Capture console messages
    page.on('console', (msg) => {});

    await page.goto('http://localhost:5175/', {
      waitUntil: 'networkidle0',
      timeout: 10000,
    });

    // Check what's initially loaded
    const initialState = await page.evaluate(() => ({
      title: document.title,
      hasSignIn: document.body.innerText.includes('Sign In'),
      hasSignUp: document.body.innerText.includes('Sign up'),
      hasContactForm:
        document.body.innerText.includes('Full Name') && document.body.innerText.includes('Phone'),
      hasInviteForm:
        document.body.innerText.includes('Email address') &&
        document.body.innerText.includes('Admin'),
      bodyText: document.body.innerText.slice(0, 300),
    }));

    // If we see Sign In form, try to switch to Sign Up
    if (initialState.hasSignIn && !initialState.hasContactForm && !initialState.hasInviteForm) {
      try {
        await page.click('button:has-text("Need an account? Sign up")');
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        // Try finding link with different selector
        const signupLinks = await page.$$('button, a');
        for (let link of signupLinks) {
          const text = await page.evaluate((el) => el.textContent, link);
          if (text.includes('Sign up') || text.includes('account')) {
            await link.click();
            break;
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Check state after potential signup switch
    const afterSignup = await page.evaluate(() => ({
      hasCreateAccount: document.body.innerText.includes('Create Account'),
      hasFullNameInput: !!document.querySelector(
        'input[placeholder*="Full Name"], input[placeholder*="Name"]'
      ),
      hasEmailInput: !!document.querySelector('input[type="email"], input[placeholder*="Email"]'),
      bodyText: document.body.innerText.slice(0, 300),
    }));

    // If we have signup form, simulate filling it out to test the next steps
    if (afterSignup.hasCreateAccount || afterSignup.hasFullNameInput) {
      // Inject a mock authenticated user into localStorage to simulate login
      await page.evaluate(() => {
        // Mock Supabase auth token
        const mockAuth = {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          expires_in: 3600,
          user: {
            id: 'mock-user-id',
            email: 'test@example.com',
            user_metadata: {
              full_name: 'Test User',
            },
          },
        };
        localStorage.setItem('supabase.auth.token', JSON.stringify(mockAuth));

        // Trigger a page refresh to load authenticated state
        window.location.reload();
      });

      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });

      // Check if we now see contact form
      const contactFormState = await page.evaluate(() => ({
        hasContactForm:
          document.body.innerText.includes('Full Name') &&
          document.body.innerText.includes('Phone') &&
          document.body.innerText.includes('Submit'),
        hasSubmitButton: !!document.querySelector('button[type="submit"]'),
        inputCount: document.querySelectorAll('input').length,
        bodyText: document.body.innerText.slice(0, 400),
      }));

      // If contact form is visible, simulate filling it out
      if (contactFormState.hasContactForm) {
        try {
          await page.type(
            'input[placeholder*="Full Name"], input[placeholder*="Name"]',
            'John Doe'
          );
          await page.type('input[placeholder*="Phone"]', '555-1234');
          await page.type('input[placeholder*="Company"]', 'Test Company');
          await page.type('input[placeholder*="Job Title"]', 'Manager');

          // Click submit
          await page.click('button[type="submit"]');
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Check if we now see invite form
          const inviteFormState = await page.evaluate(() => ({
            hasInviteForm:
              document.body.innerText.includes('Email address') &&
              (document.body.innerText.includes('Admin') ||
                document.body.innerText.includes('Export') ||
                document.body.innerText.includes('View')),
            hasPermissionCheckboxes:
              document.querySelectorAll('input[type="checkbox"]').length >= 3,
            hasSendButton: document.body.innerText.includes('Send'),
            hasAddAnother: document.body.innerText.includes('Add'),
            emailInputs: document.querySelectorAll(
              'input[type="email"], input[placeholder*="Email"]'
            ).length,
            checkboxes: document.querySelectorAll('input[type="checkbox"]').length,
            bodyText: document.body.innerText.slice(0, 500),
          }));

          // Verify this matches the requirements

          const requirementsMet =
            inviteFormState.emailInputs > 0 &&
            inviteFormState.bodyText.includes('Admin') &&
            inviteFormState.bodyText.includes('Export') &&
            inviteFormState.bodyText.includes('View') &&
            inviteFormState.hasSendButton;
        } catch (error) {
          console.log('Error filling contact form:', error.message);
        }
      } else {
        console.log('❌ Contact form not found after authentication simulation');
      }
    }

    await page.screenshot({
      path: '/Users/Danallovertheplace/crypto-campaign-unified/scripts/full-workflow-test.png',
      fullPage: true,
    });

    await new Promise((resolve) => setTimeout(resolve, 10000));
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

testFullWorkflow().catch(console.error);
