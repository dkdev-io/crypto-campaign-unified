#!/usr/bin/env node

/**
 * Working Form Testing Agent
 * Fixed Puppeteer automation that actually works with modern forms
 */

const fs = require('fs');
const csv = require('csv-parser');
const puppeteer = require('puppeteer');

const BASE_URL = process.env.BASE_URL || 'https://testy-pink-chancellor.lovable.app';

class WorkingFormTestingAgent {
  constructor() {
    this.prospects = [];
    this.donors = [];
    this.testResults = [];
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    await this.loadCSVData();

    this.browser = await puppeteer.launch({
      headless: false,
      slowMo: 500,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
      defaultViewport: { width: 1400, height: 900 },
    });
    this.page = await this.browser.newPage();

    // Set longer timeouts for dynamic content
    this.page.setDefaultTimeout(30000);
    this.page.setDefaultNavigationTimeout(30000);
  }

  async loadCSVData() {
    this.prospects = await this.loadCSV('../data/prospects.csv');
    this.donors = await this.loadCSV('../data/donors.csv');
  }

  loadCSV(filepath) {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filepath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  getPersonaById(uniqueId) {
    const prospect = this.prospects.find((p) => p.unique_id === uniqueId);
    const donations = this.donors.filter((d) => d.unique_id === uniqueId);

    return {
      profile: prospect,
      donations: donations,
      isDonor: donations.length > 0,
    };
  }

  async testBothForms(persona, testIndex, totalTests) {
    const results = {
      persona: `${persona.profile.first_name} ${persona.profile.last_name}`,
      uniqueId: persona.profile.unique_id,
      homepageTest: null,
      modalTest: null,
      timestamp: new Date().toISOString(),
    };

    // Test homepage first
    results.homepageTest = await this.testHomepageForm(persona);
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Test modal form
    results.modalTest = await this.testModalForm(persona);

    this.testResults.push(results);
    return results;
  }

  async testHomepageForm(persona) {
    try {
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle2' });

      // Wait for page to fully load
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Look for ANY form elements on homepage
      const formElements = await this.page.evaluate(() => {
        const inputs = document.querySelectorAll('input:not([type="hidden"]), select, textarea');
        return {
          inputCount: inputs.length,
          inputs: Array.from(inputs).map((input) => ({
            type: input.type,
            name: input.name,
            id: input.id,
            placeholder: input.placeholder,
            visible: input.offsetParent !== null && getComputedStyle(input).visibility !== 'hidden',
          })),
        };
      });

      if (formElements.inputs.filter((i) => i.visible).length === 0) {
        return {
          success: false,
          type: 'homepage',
          message: 'No visible form inputs on homepage',
          formElements,
        };
      }

      // Try to fill homepage form
      const fillResult = await this.fillVisibleForm(persona, 'homepage');
      const submitResult = await this.submitForm('homepage');

      return {
        success: fillResult.success && submitResult.success,
        type: 'homepage',
        fillResult,
        submitResult,
        formElements,
      };
    } catch (error) {
      return {
        success: false,
        type: 'homepage',
        error: error.message,
      };
    }
  }

  async testModalForm(persona) {
    try {
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle2' });
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Multiple strategies to click donate
      let donateClicked = false;

      // Strategy 1: Direct text search
      const donateButtons = await this.page.$$eval('*', (els) => {
        return els
          .filter(
            (el) =>
              el.textContent &&
              el.textContent.trim().toLowerCase().includes('donate') &&
              (el.tagName === 'BUTTON' || el.tagName === 'A')
          )
          .map((el) => ({
            tagName: el.tagName,
            text: el.textContent.trim(),
            id: el.id,
            className: el.className,
          }));
      });

      // Try clicking the first donate button
      if (donateButtons.length > 0) {
        try {
          await this.page.evaluate(() => {
            const donateEl = Array.from(document.querySelectorAll('*')).find(
              (el) =>
                el.textContent &&
                el.textContent.trim().toLowerCase().includes('donate') &&
                (el.tagName === 'BUTTON' || el.tagName === 'A')
            );
            if (donateEl) {
              donateEl.click();
              return true;
            }
            return false;
          });
          donateClicked = true;
          console.log('✅ Donate button clicked successfully');
        } catch (clickError) {
          console.log('❌ Click failed:', clickError.message);
        }
      }

      if (!donateClicked) {
        return {
          success: false,
          type: 'modal',
          message: 'Could not click donate button',
        };
      }

      // Wait for modal to appear and form to load

      // Wait longer and check multiple times
      let modalFound = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!modalFound && attempts < maxAttempts) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const modalCheck = await this.page.evaluate(() => {
          // Look for modal indicators
          const modals = document.querySelectorAll('[role="dialog"], .modal, [data-modal], .popup');
          const inputs = document.querySelectorAll('input:not([type="hidden"]), select, textarea');
          const visibleInputs = Array.from(inputs).filter(
            (input) =>
              input.offsetParent !== null &&
              getComputedStyle(input).visibility !== 'hidden' &&
              getComputedStyle(input).opacity !== '0'
          );

          return {
            modals: modals.length,
            totalInputs: inputs.length,
            visibleInputs: visibleInputs.length,
            inputDetails: visibleInputs.map((input) => ({
              type: input.type,
              name: input.name,
              id: input.id,
              placeholder: input.placeholder,
            })),
          };
        });

        if (modalCheck.visibleInputs > 0) {
          modalFound = true;
          break;
        }
      }

      if (!modalFound) {
        // Take screenshot for debugging
        await this.page.screenshot({
          path: `test-results/screenshots/modal-debug-${Date.now()}.png`,
          fullPage: true,
        });

        return {
          success: false,
          type: 'modal',
          message: `No form inputs found after ${attempts} attempts`,
        };
      }

      // Fill the modal form
      const fillResult = await this.fillVisibleForm(persona, 'modal');
      const submitResult = await this.submitForm('modal');

      return {
        success: fillResult.success && submitResult.success,
        type: 'modal',
        fillResult,
        submitResult,
      };
    } catch (error) {
      console.error('Modal test error:', error.message);

      // Debug screenshot
      try {
        await this.page.screenshot({
          path: `test-results/screenshots/modal-error-${Date.now()}.png`,
          fullPage: true,
        });
      } catch (screenshotError) {}

      return {
        success: false,
        type: 'modal',
        error: error.message,
      };
    }
  }

  async fillVisibleForm(persona, context) {
    const profile = persona.profile;
    const donation = persona.donations[0] || { contribution_amount: '100.00' };

    const formData = {
      first: profile.first_name,
      last: profile.last_name,
      email: `${profile.first_name.toLowerCase()}.${profile.last_name.toLowerCase()}@test.com`,
      phone: profile.phone_number,
      address: profile.address_line_1,
      city: profile.city,
      state: profile.state,
      zip: profile.zip,
      employer: profile.employer,
      occupation: profile.occupation,
      amount: donation.contribution_amount || '100.00',
    };

    try {
      let fieldsFilled = 0;

      // Get all visible, interactive inputs
      const inputs = await this.page.$$(
        'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea'
      );

      for (let i = 0; i < inputs.length; i++) {
        try {
          const input = inputs[i];

          // Check if input is actually visible and interactable
          const inputInfo = await input.evaluate((el) => {
            const rect = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            return {
              visible: el.offsetParent !== null,
              inViewport: rect.width > 0 && rect.height > 0,
              notHidden: style.visibility !== 'hidden' && style.opacity !== '0',
              type: el.type,
              name: el.name,
              id: el.id,
              placeholder: el.placeholder,
              required: el.required,
            };
          });

          if (!inputInfo.visible || !inputInfo.inViewport || !inputInfo.notHidden) {
            continue;
          }

          // Match input to our data
          const value = this.smartMatch(inputInfo, formData);

          if (value) {
            console.log(
              `📍 Filling ${inputInfo.name || inputInfo.id || inputInfo.placeholder} with: ${value}`
            );

            // Scroll to input and make sure it's visible
            await input.scrollIntoView();
            await input.focus();
            await input.click();

            // Clear and type
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('KeyA');
            await this.page.keyboard.up('Control');
            await input.type(value, { delay: 100 });

            fieldsFilled++;

            // Small delay between fields
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        } catch (inputError) {
          console.log(`⚠️  Error with input ${i}: ${inputError.message}`);
        }
      }

      console.log(`✅ ${context}: Successfully filled ${fieldsFilled} fields`);

      return {
        success: fieldsFilled > 0,
        fieldsFilled,
        message: `${context}: Filled ${fieldsFilled} fields`,
      };
    } catch (error) {
      return {
        success: false,
        message: `${context}: Fill error - ${error.message}`,
      };
    }
  }

  smartMatch(inputInfo, formData) {
    const name = (inputInfo.name || '').toLowerCase();
    const id = (inputInfo.id || '').toLowerCase();
    const placeholder = (inputInfo.placeholder || '').toLowerCase();
    const type = (inputInfo.type || '').toLowerCase();

    // Comprehensive matching
    if (name.includes('first') || id.includes('first') || placeholder.includes('first'))
      return formData.first;
    if (name.includes('last') || id.includes('last') || placeholder.includes('last'))
      return formData.last;
    if (type === 'email' || name.includes('email') || id.includes('email')) return formData.email;
    if (type === 'tel' || name.includes('phone') || placeholder.includes('phone'))
      return formData.phone;
    if (name.includes('address') || placeholder.includes('address')) return formData.address;
    if (name.includes('city') || id.includes('city')) return formData.city;
    if (name.includes('state') || id.includes('state')) return formData.state;
    if (name.includes('zip') || name.includes('postal')) return formData.zip;
    if (name.includes('employer')) return formData.employer;
    if (name.includes('occupation')) return formData.occupation;
    if (name.includes('amount') || placeholder.includes('amount') || placeholder.includes('$'))
      return formData.amount;

    return null;
  }

  async submitForm(context) {
    try {
      // Look for submit buttons with multiple strategies
      const submitStrategies = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:not([type="button"])',
        '[data-testid*="submit"]',
        '.submit-btn',
        '.donate-btn',
      ];

      let submitted = false;

      for (const selector of submitStrategies) {
        try {
          const submitBtn = await this.page.$(selector);
          if (submitBtn) {
            const isVisible = await submitBtn.evaluate((el) => {
              const rect = el.getBoundingClientRect();
              const style = getComputedStyle(el);
              return (
                rect.width > 0 &&
                rect.height > 0 &&
                style.visibility !== 'hidden' &&
                style.opacity !== '0' &&
                el.offsetParent !== null
              );
            });

            if (isVisible) {
              await submitBtn.scrollIntoView();
              await submitBtn.click();
              submitted = true;
              break;
            }
          }
        } catch (error) {
          continue;
        }
      }

      if (!submitted) {
        // Try finding by text content
        const textBasedSubmit = await this.page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]'));
          const submitBtn = buttons.find((btn) => {
            const text = btn.textContent || btn.value || '';
            return /submit|donate|contribute|send|continue/i.test(text.trim());
          });
          if (submitBtn) {
            submitBtn.click();
            return true;
          }
          return false;
        });

        submitted = textBasedSubmit;
      }

      if (submitted) {
        console.log('✅ Form submitted! Waiting for response...');

        // Wait for potential navigation or success message
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Check for success/error indicators
        const result = await this.page.evaluate(() => {
          const bodyText = document.body.textContent.toLowerCase();
          const hasSuccess = /success|thank you|confirmed|submitted|received/i.test(bodyText);
          const hasError = /error|failed|invalid|required/i.test(bodyText);

          return {
            url: window.location.href,
            hasSuccess,
            hasError,
            bodyText: bodyText.substring(0, 200),
          };
        });

        return {
          success: !result.hasError,
          submitted: true,
          message: result.hasSuccess
            ? 'Form submitted successfully'
            : result.hasError
              ? 'Form submission failed'
              : 'Form submitted - status unclear',
          result,
        };
      } else {
        return {
          success: false,
          submitted: false,
          message: 'No submit button found',
        };
      }
    } catch (error) {
      return {
        success: false,
        submitted: false,
        message: `Submit error: ${error.message}`,
      };
    }
  }

  async runTestSuite(options = {}) {
    const { count = 2, testType = 'mixed' } = options;

    // Get test personas
    let testPersonas = [];
    switch (testType) {
      case 'donors':
        const donorIds = [...new Set(this.donors.map((d) => d.unique_id))];
        testPersonas = donorIds.slice(0, count).map((id) => this.getPersonaById(id));
        break;
      case 'prospects':
        const nonDonorIds = this.prospects
          .filter((p) => !this.donors.some((d) => d.unique_id === p.unique_id))
          .map((p) => p.unique_id);
        testPersonas = nonDonorIds.slice(0, count).map((id) => this.getPersonaById(id));
        break;
      default:
        const allIds = this.prospects.map((p) => p.unique_id);
        const shuffled = allIds.sort(() => 0.5 - Math.random());
        testPersonas = shuffled.slice(0, count).map((id) => this.getPersonaById(id));
    }

    fs.mkdirSync('test-results/screenshots', { recursive: true });

    for (let i = 0; i < testPersonas.length; i++) {
      const persona = testPersonas[i];
      await this.testBothForms(persona, i + 1, testPersonas.length);

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    this.generateReport();
  }

  generateReport() {
    console.log('\\n📊 WORKING FORM TESTING RESULTS');

    const totalPersonas = this.testResults.length;
    let homepageSuccess = 0;
    let modalSuccess = 0;
    let submissions = 0;

    this.testResults.forEach((result) => {
      if (result.homepageTest?.success) homepageSuccess++;
      if (result.modalTest?.success) modalSuccess++;
      if (result.homepageTest?.submitResult?.submitted) submissions++;
      if (result.modalTest?.submitResult?.submitted) submissions++;
    });

    console.log(`Homepage Success: ${homepageSuccess}/${totalPersonas}`);
    console.log(`Modal Success: ${modalSuccess}/${totalPersonas}`);

    console.log('\\n📋 DETAILED RESULTS:');
    this.testResults.forEach((result, i) => {
      const homeStatus = result.homepageTest?.success ? '✅' : '❌';
      const modalStatus = result.modalTest?.success ? '✅' : '❌';
      console.log(`${i + 1}. ${result.persona}: Home ${homeStatus} | Modal ${modalStatus}`);
    });

    // Save report
    const reportPath = `test-results/working-form-test-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// CLI
async function main() {
  const agent = new WorkingFormTestingAgent();

  try {
    await agent.initialize();

    const args = process.argv.slice(2);
    const options = {
      count: parseInt(args.find((arg) => arg.startsWith('--count='))?.split('=')[1]) || 2,
      testType: args.find((arg) => arg.startsWith('--type='))?.split('=')[1] || 'mixed',
    };

    await agent.runTestSuite(options);
  } catch (error) {
    console.error('💥 WORKING Agent failed:', error);
  } finally {
    await agent.cleanup();
  }
}

if (require.main === module) {
  main();
}

module.exports = WorkingFormTestingAgent;
