#!/usr/bin/env node

/**
 * Form Testing Agent
 * Automatically tests donor forms using CSV test data
 */

const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const BASE_URL = process.env.BASE_URL || 'https://testy-pink-chancellor.lovable.app';

class FormTestingAgent {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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
      headless: false, // Set to true for headless mode
      slowMo: 100, // Slow down actions for demo
    });
    this.page = await this.browser.newPage();
  }

  async loadCSVData() {
    console.log('📊 Loading test data from CSV files...');

    // Load prospects
    this.prospects = await this.loadCSV('data/prospects.csv');

    // Load donors
    this.donors = await this.loadCSV('data/donors.csv');

    // Load KYC data
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

  async testFormSubmission(persona, testConfig = {}) {
    const startTime = Date.now();
    const testId = `test-${persona.profile.unique_id}-${startTime}`;

    try {
      // Navigate to form
      await this.page.goto(`${BASE_URL}/donate`);
      await this.page.waitForSelector('form', { timeout: 10000 });

      // Fill out form fields
      await this.fillFormFields(persona, testConfig);

      // Submit form
      const submissionResult = await this.submitForm();

      // Verify database entry
      const dbVerification = await this.verifyDatabaseEntry(persona, submissionResult);

      const testResult = {
        testId,
        persona: `${persona.profile.first_name} ${persona.profile.last_name}`,
        uniqueId: persona.profile.unique_id,
        success: submissionResult.success && dbVerification.success,
        duration: Date.now() - startTime,
        submissionResult,
        dbVerification,
        timestamp: new Date().toISOString(),
      };

      this.testResults.push(testResult);

      if (testResult.success) {
      } else {
      }

      return testResult;
    } catch (error) {
      console.error(`💥 Test error for ${persona.profile.first_name}:`, error.message);

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

  async fillFormFields(persona, testConfig) {
    const profile = persona.profile;
    const donation = persona.donations[0] || { contribution_amount: '100.00' };

    // Personal Information
    await this.fillField('input[name="firstName"]', profile.first_name);
    await this.fillField('input[name="lastName"]', profile.last_name);
    await this.fillField(
      'input[name="email"]',
      `${profile.first_name.toLowerCase()}.${profile.last_name.toLowerCase()}@test.com`
    );
    await this.fillField('input[name="phone"]', profile.phone_number);

    // Address Information
    await this.fillField('input[name="address"]', profile.address_line_1);
    if (profile.address_line_2) {
      await this.fillField('input[name="address2"]', profile.address_line_2);
    }
    await this.fillField('input[name="city"]', profile.city);
    await this.fillField('select[name="state"]', profile.state);
    await this.fillField('input[name="zipCode"]', profile.zip);

    // Employment Information (FEC Required)
    await this.fillField('input[name="employer"]', profile.employer);
    await this.fillField('input[name="occupation"]', profile.occupation);

    // Contribution Information
    const amount = testConfig.amount || donation.contribution_amount;
    await this.fillField('input[name="amount"]', amount);

    // Payment Method
    if (testConfig.paymentMethod === 'crypto' || !testConfig.paymentMethod) {
      await this.page.click('input[value="crypto"]');
      // Add wallet address if needed
      if (profile.wallet_address) {
        await this.fillField('input[name="walletAddress"]', profile.wallet_address);
      }
    } else {
      await this.page.click('input[value="traditional"]');
    }

    // FEC Compliance Checkboxes
    await this.page.click('input[name="usCitizen"]');
    await this.page.click('input[name="acknowledgment"]');
  }

  async fillField(selector, value) {
    try {
      await this.page.waitForSelector(selector, { timeout: 5000 });
      await this.page.click(selector);
      await this.page.evaluate((sel) => (document.querySelector(sel).value = ''), selector);
      await this.page.type(selector, value.toString());
    } catch (error) {
      console.warn(`⚠️  Could not fill field ${selector}:`, error.message);
    }
  }

  async submitForm() {
    console.log('🚀 Submitting form...');

    try {
      // Click submit button
      await this.page.click('button[type="submit"]');

      // Wait for submission result
      await this.page.waitForSelector('.success-message, .error-message', { timeout: 15000 });

      // Check for success or error
      const successElement = await this.page.$('.success-message');
      const errorElement = await this.page.$('.error-message');

      if (successElement) {
        const successText = await this.page.evaluate((el) => el.textContent, successElement);
        return { success: true, message: successText };
      } else if (errorElement) {
        const errorText = await this.page.evaluate((el) => el.textContent, errorElement);
        return { success: false, message: errorText };
      }

      return { success: false, message: 'Unknown submission result' };
    } catch (error) {
      return { success: false, message: `Submission error: ${error.message}` };
    }
  }

  async verifyDatabaseEntry(persona, submissionResult) {
    if (!submissionResult.success) {
      return { success: false, message: 'Skipped DB verification - submission failed' };
    }

    try {
      // Query recent submissions for this persona
      const { data, error } = await this.supabase
        .from('form_submissions')
        .select('*')
        .eq('first_name', persona.profile.first_name)
        .eq('last_name', persona.profile.last_name)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        return { success: false, message: `DB query error: ${error.message}` };
      }

      if (!data || data.length === 0) {
        return { success: false, message: 'No database entry found' };
      }

      const dbEntry = data[0];

      // Verify key fields match
      const verification = {
        name:
          dbEntry.first_name === persona.profile.first_name &&
          dbEntry.last_name === persona.profile.last_name,
        address: dbEntry.city === persona.profile.city && dbEntry.state === persona.profile.state,
        employer: dbEntry.employer === persona.profile.employer,
        hasAmount: dbEntry.amount > 0,
      };

      const allValid = Object.values(verification).every((v) => v);

      return {
        success: allValid,
        message: allValid ? 'Database entry verified' : 'Database verification failed',
        verification,
        dbEntry: dbEntry.id,
      };
    } catch (error) {
      return { success: false, message: `DB verification error: ${error.message}` };
    }
  }

  async runTestSuite(options = {}) {
    const {
      count = 5,
      testType = 'mixed', // 'donors', 'prospects', 'mixed'
      paymentMethod = 'crypto',
    } = options;

    let testPersonas = [];

    // Select test personas based on type
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

    // Run tests
    for (let i = 0; i < testPersonas.length; i++) {
      const persona = testPersonas[i];

      await this.testFormSubmission(persona, { paymentMethod });

      // Wait between tests
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Generate test report
    this.generateTestReport();
  }

  generateTestReport() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter((r) => r.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);

    console.log(`Success Rate: ${successRate}%`);

    if (failedTests > 0) {
      this.testResults
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(
            `❌ ${r.persona} - ${r.error || r.submissionResult?.message || 'Unknown error'}`
          );
        });
    }

    // Save detailed report
    const reportPath = `test-results/form-test-report-${Date.now()}.json`;
    fs.mkdirSync('test-results', { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// CLI Interface
async function main() {
  const agent = new FormTestingAgent();

  try {
    await agent.initialize();

    // Parse command line arguments
    const args = process.argv.slice(2);
    const options = {
      count: parseInt(args.find((arg) => arg.startsWith('--count='))?.split('=')[1]) || 5,
      testType: args.find((arg) => arg.startsWith('--type='))?.split('=')[1] || 'mixed',
      paymentMethod: args.find((arg) => arg.startsWith('--payment='))?.split('=')[1] || 'crypto',
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

module.exports = FormTestingAgent;
