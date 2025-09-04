#!/usr/bin/env node

/**
 * Enhanced Live Site Form Testing Agent
 * Navigates through site buttons to find and test donation forms
 */

const fs = require('fs');
const csv = require('csv-parser');
const puppeteer = require('puppeteer');

const BASE_URL = process.env.BASE_URL || 'https://testy-pink-chancellor.lovable.app';

class EnhancedLiveSiteTestingAgent {
  constructor() {
    this.prospects = [];
    this.donors = [];
    this.kyc = [];
    this.testResults = [];
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    // Load CSV data
    await this.loadCSVData();

    // Start browser
    this.browser = await puppeteer.launch({
      headless: false,
      slowMo: 500,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1280, height: 720 },
    });
    this.page = await this.browser.newPage();
  }

  async loadCSVData() {
    console.log('📊 Loading test data from CSV files...');

    this.prospects = await this.loadCSV('data/prospects.csv');
    this.donors = await this.loadCSV('data/donors.csv');
    this.kyc = await this.loadCSV('data/kyc.csv');
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
    const kycStatus = this.kyc.find((k) => k.unique_id === uniqueId);

    return {
      profile: prospect,
      donations: donations,
      kyc: kycStatus,
      isDonor: donations.length > 0,
    };
  }

  async navigateToForm() {
    try {
      // First, go to the main page
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });

      // Look for donation/contribute buttons
      const donationButtons = [
        'button:has-text("Donate")',
        'a:has-text("Donate")',
        'button:has-text("Support")',
        'a:has-text("Support")',
        'button:has-text("Contribute")',
        'a:has-text("Contribute")',
        '.donate',
        '.contribute',
        '.support',
      ];

      // Try each button selector
      for (const selector of donationButtons) {
        try {
          // Use a more compatible approach for finding buttons
          const buttons = await this.page.$$('button, a');
          for (const button of buttons) {
            const text = await this.page.evaluate(
              (el) => el.textContent.trim().toLowerCase(),
              button
            );
            if (
              text.includes('donate') ||
              text.includes('support') ||
              text.includes('contribute')
            ) {
              await button.click();
              await new Promise((resolve) => setTimeout(resolve, 3000));
              return true;
            }
          }
        } catch (error) {
          continue;
        }
      }

      console.log('⚠️  No donation button found, staying on current page');
      return false;
    } catch (error) {
      console.error('Navigation error:', error.message);
      return false;
    }
  }

  async analyzeCurrentPage() {
    try {
      const analysis = await this.page.evaluate(() => {
        // Get all forms and inputs
        const forms = Array.from(document.querySelectorAll('form')).map((f) => ({
          action: f.action,
          method: f.method,
          id: f.id,
          className: f.className,
        }));

        const inputs = Array.from(document.querySelectorAll('input, select, textarea')).map(
          (i) => ({
            type: i.type,
            name: i.name,
            id: i.id,
            placeholder: i.placeholder,
            className: i.className,
            tagName: i.tagName.toLowerCase(),
          })
        );

        const buttons = Array.from(document.querySelectorAll('button')).map((b) => ({
          text: b.textContent.trim(),
          type: b.type,
          className: b.className,
          id: b.id,
        }));

        // Look for any text that suggests this is a form page
        const pageText = document.body.textContent.toLowerCase();
        const hasFormKeywords = [
          'amount',
          'email',
          'name',
          'address',
          'donation',
          'contribute',
          'payment',
        ].some((keyword) => pageText.includes(keyword));

        return {
          url: window.location.href,
          title: document.title,
          forms: forms,
          inputs: inputs,
          buttons: buttons,
          hasFormKeywords,
          pageText: pageText.substring(0, 500), // First 500 chars for context
        };
      });

      return analysis;
    } catch (error) {
      console.error('Analysis error:', error.message);
      return null;
    }
  }

  async testFormSubmission(persona, testConfig = {}) {
    const startTime = Date.now();
    const testId = `test-${persona.profile.unique_id}-${startTime}`;

    try {
      // Create screenshots directory
      fs.mkdirSync('test-results/screenshots', { recursive: true });

      // Navigate to the site and try to find form
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });

      // Initial screenshot
      await this.page.screenshot({
        path: `test-results/screenshots/step1-landing-${testId}.png`,
        fullPage: true,
      });

      // Try to navigate to form
      const foundFormPage = await this.navigateToForm();

      // Screenshot after navigation attempt
      await this.page.screenshot({
        path: `test-results/screenshots/step2-after-navigation-${testId}.png`,
        fullPage: true,
      });

      // Analyze current page
      const pageAnalysis = await this.analyzeCurrentPage();

      // Try to fill any forms found
      let fillResult = { success: false, message: 'No forms found' };
      if (pageAnalysis && pageAnalysis.inputs.length > 0) {
        fillResult = await this.attemptFormFilling(persona, testConfig);

        // Screenshot after filling
        await this.page.screenshot({
          path: `test-results/screenshots/step3-after-filling-${testId}.png`,
          fullPage: true,
        });
      }

      const testResult = {
        testId,
        persona: `${persona.profile.first_name} ${persona.profile.last_name}`,
        uniqueId: persona.profile.unique_id,
        success: fillResult.success,
        duration: Date.now() - startTime,
        navigationSuccess: foundFormPage,
        pageAnalysis,
        fillResult,
        screenshots: [
          `test-results/screenshots/step1-landing-${testId}.png`,
          `test-results/screenshots/step2-after-navigation-${testId}.png`,
          `test-results/screenshots/step3-after-filling-${testId}.png`,
        ],
        timestamp: new Date().toISOString(),
      };

      this.testResults.push(testResult);

      if (testResult.success) {
      } else {
      }

      return testResult;
    } catch (error) {
      console.error(`💥 Test error for ${persona.profile.first_name}:`, error.message);

      try {
        await this.page.screenshot({
          path: `test-results/screenshots/error-${testId}.png`,
          fullPage: true,
        });
      } catch (screenshotError) {
        console.error('Could not take error screenshot');
      }

      const testResult = {
        testId,
        persona: `${persona.profile.first_name} ${persona.profile.last_name}`,
        uniqueId: persona.profile.unique_id,
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };

      this.testResults.push(testResult);
      return testResult;
    }
  }

  async attemptFormFilling(persona, testConfig) {
    const profile = persona.profile;
    const donation = persona.donations[0] || { contribution_amount: '100.00' };

    try {
      let fieldsFilled = 0;

      // Define the data to fill
      const formData = {
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: `${profile.first_name.toLowerCase()}.${profile.last_name.toLowerCase()}@test.com`,
        phone: profile.phone_number,
        address: profile.address_line_1,
        city: profile.city,
        state: profile.state,
        zip: profile.zip,
        employer: profile.employer,
        occupation: profile.occupation,
        amount: testConfig.amount || donation.contribution_amount,
      };

      // Get all inputs on the page
      const inputs = await this.page.$$('input, select, textarea');

      for (const input of inputs) {
        try {
          const inputInfo = await this.page.evaluate(
            (el) => ({
              type: el.type,
              name: el.name,
              id: el.id,
              placeholder: el.placeholder,
              tagName: el.tagName.toLowerCase(),
            }),
            input
          );

          // Try to match input to our data
          const fieldValue = this.matchInputToData(inputInfo, formData);

          if (fieldValue) {
            console.log(
              `📍 Filling ${inputInfo.name || inputInfo.id || inputInfo.type} with: ${fieldValue}`
            );

            await input.focus();
            await input.click();

            // Clear existing content
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('KeyA');
            await this.page.keyboard.up('Control');
            await this.page.keyboard.press('Backspace');

            // Type new content
            await input.type(fieldValue, { delay: 50 });
            fieldsFilled++;
          }
        } catch (error) {
          console.log(`⚠️  Could not fill input: ${error.message}`);
        }
      }

      return {
        success: fieldsFilled > 0,
        fieldsFilled,
        message: `Filled ${fieldsFilled} fields`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Form filling error: ${error.message}`,
      };
    }
  }

  matchInputToData(inputInfo, formData) {
    const name = (inputInfo.name || '').toLowerCase();
    const id = (inputInfo.id || '').toLowerCase();
    const placeholder = (inputInfo.placeholder || '').toLowerCase();
    const type = (inputInfo.type || '').toLowerCase();

    // Match patterns to data
    if (name.includes('first') || id.includes('first') || placeholder.includes('first')) {
      return formData.firstName;
    }
    if (name.includes('last') || id.includes('last') || placeholder.includes('last')) {
      return formData.lastName;
    }
    if (type === 'email' || name.includes('email') || id.includes('email')) {
      return formData.email;
    }
    if (type === 'tel' || name.includes('phone') || id.includes('phone')) {
      return formData.phone;
    }
    if (name.includes('address') || id.includes('address') || placeholder.includes('address')) {
      return formData.address;
    }
    if (name.includes('city') || id.includes('city')) {
      return formData.city;
    }
    if (name.includes('state') || id.includes('state')) {
      return formData.state;
    }
    if (name.includes('zip') || id.includes('zip') || name.includes('postal')) {
      return formData.zip;
    }
    if (name.includes('employer') || id.includes('employer')) {
      return formData.employer;
    }
    if (name.includes('occupation') || id.includes('occupation')) {
      return formData.occupation;
    }
    if (name.includes('amount') || id.includes('amount') || placeholder.includes('amount')) {
      return formData.amount;
    }

    return null;
  }

  async runTestSuite(options = {}) {
    const { count = 3, testType = 'mixed' } = options;

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
      default: // mixed
        const allIds = this.prospects.map((p) => p.unique_id);
        const shuffled = allIds.sort(() => 0.5 - Math.random());
        testPersonas = shuffled.slice(0, count).map((id) => this.getPersonaById(id));
    }

    for (let i = 0; i < testPersonas.length; i++) {
      const persona = testPersonas[i];

      await this.testFormSubmission(persona, {});

      // Wait between tests
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    this.generateTestReport();
  }

  generateTestReport() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter((r) => r.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0.0';

    console.log(`Success Rate: ${successRate}%`);

    // Detailed analysis
    const navigationSuccesses = this.testResults.filter((r) => r.navigationSuccess).length;
    const formsFound = this.testResults.filter(
      (r) => r.pageAnalysis && r.pageAnalysis.inputs.length > 0
    ).length;

    console.log(`Navigation to form successful: ${navigationSuccesses}/${totalTests}`);

    if (failedTests > 0) {
      this.testResults
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(`❌ ${r.persona} - ${r.error || r.fillResult?.message || 'Unknown error'}`);
        });
    }

    // Save detailed report
    const reportPath = `test-results/enhanced-live-site-test-report-${Date.now()}.json`;
    fs.mkdirSync('test-results', { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
    console.log('📸 Screenshots saved in test-results/screenshots/');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// CLI Interface
async function main() {
  const agent = new EnhancedLiveSiteTestingAgent();

  try {
    await agent.initialize();

    const args = process.argv.slice(2);
    const options = {
      count: parseInt(args.find((arg) => arg.startsWith('--count='))?.split('=')[1]) || 2,
      testType: args.find((arg) => arg.startsWith('--type='))?.split('=')[1] || 'mixed',
    };

    await agent.runTestSuite(options);
  } catch (error) {
    console.error('💥 Agent failed:', error);
  } finally {
    await agent.cleanup();
  }
}

if (require.main === module) {
  main();
}

module.exports = EnhancedLiveSiteTestingAgent;
