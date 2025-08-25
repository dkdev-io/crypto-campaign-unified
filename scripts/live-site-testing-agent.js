#!/usr/bin/env node

/**
 * Live Site Form Testing Agent
 * Tests donation forms on live site using CSV test data
 */

const fs = require('fs');
const csv = require('csv-parser');
const puppeteer = require('puppeteer');

// Configuration
const BASE_URL = process.env.BASE_URL || 'https://testy-pink-chancellor.lovable.app';

class LiveSiteTestingAgent {
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
      headless: false, // Visible browser for debugging
      slowMo: 200, // Slow down for visibility
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1280, height: 720 }
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
    const prospect = this.prospects.find(p => p.unique_id === uniqueId);
    const donations = this.donors.filter(d => d.unique_id === uniqueId);
    const kycStatus = this.kyc.find(k => k.unique_id === uniqueId);
    
    return {
      profile: prospect,
      donations: donations,
      kyc: kycStatus,
      isDonor: donations.length > 0
    };
  }

  async inspectPageStructure() {
    
    try {
      // Get all form elements
      const formInfo = await this.page.evaluate(() => {
        const forms = document.querySelectorAll('form');
        const inputs = document.querySelectorAll('input, select, textarea');
        const buttons = document.querySelectorAll('button');
        
        return {
          forms: Array.from(forms).map(f => ({
            action: f.action,
            method: f.method,
            id: f.id,
            className: f.className
          })),
          inputs: Array.from(inputs).map(i => ({
            type: i.type,
            name: i.name,
            id: i.id,
            placeholder: i.placeholder,
            className: i.className,
            selector: i.tagName.toLowerCase() + (i.id ? `#${i.id}` : '') + (i.name ? `[name="${i.name}"]` : '')
          })),
          buttons: Array.from(buttons).map(b => ({
            text: b.textContent.trim(),
            type: b.type,
            className: b.className,
            id: b.id
          }))
        };
      });
      
      console.log(`Forms found: ${formInfo.forms.length}`);
      console.log(`Input fields: ${formInfo.inputs.length}`);
      console.log(`Buttons: ${formInfo.buttons.length}`);
      
      return formInfo;
      
    } catch (error) {
      console.error('Error analyzing page structure:', error.message);
      return null;
    }
  }

  async testFormSubmission(persona, testConfig = {}) {
    const startTime = Date.now();
    const testId = `test-${persona.profile.unique_id}-${startTime}`;
    
    
    try {
      // Navigate to the site
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Take screenshot of initial page
      await this.page.screenshot({ 
        path: `test-results/screenshots/initial-${testId}.png`,
        fullPage: true 
      });
      
      // Analyze page structure first
      const pageStructure = await this.inspectPageStructure();
      
      // Wait for any potential form to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Try to find and fill the form
      const fillResult = await this.smartFormFill(persona, testConfig);
      
      // Take screenshot after filling
      await this.page.screenshot({ 
        path: `test-results/screenshots/filled-${testId}.png`,
        fullPage: true 
      });
      
      // Attempt to submit
      const submissionResult = await this.smartFormSubmit();
      
      // Take final screenshot
      await this.page.screenshot({ 
        path: `test-results/screenshots/result-${testId}.png`,
        fullPage: true 
      });
      
      const testResult = {
        testId,
        persona: `${persona.profile.first_name} ${persona.profile.last_name}`,
        uniqueId: persona.profile.unique_id,
        success: fillResult.success && submissionResult.success,
        duration: Date.now() - startTime,
        pageStructure,
        fillResult,
        submissionResult,
        screenshots: [
          `test-results/screenshots/initial-${testId}.png`,
          `test-results/screenshots/filled-${testId}.png`,
          `test-results/screenshots/result-${testId}.png`
        ],
        timestamp: new Date().toISOString()
      };
      
      this.testResults.push(testResult);
      
      if (testResult.success) {
      } else {
      }
      
      return testResult;
      
    } catch (error) {
      console.error(`💥 Test error for ${persona.profile.first_name}:`, error.message);
      
      // Take error screenshot
      try {
        await this.page.screenshot({ 
          path: `test-results/screenshots/error-${testId}.png`,
          fullPage: true 
        });
      } catch (screenshotError) {
        console.error('Could not take error screenshot:', screenshotError.message);
      }
      
      const testResult = {
        testId,
        persona: `${persona.profile.first_name} ${persona.profile.last_name}`,
        uniqueId: persona.profile.unique_id,
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
      
      this.testResults.push(testResult);
      return testResult;
    }
  }

  async smartFormFill(persona, testConfig) {
    const profile = persona.profile;
    const donation = persona.donations[0] || { contribution_amount: '100.00' };
    
    
    try {
      let fieldsFound = 0;
      let fieldsFilled = 0;
      
      // Common field patterns to try
      const fieldPatterns = {
        firstName: ['input[name*="first"]', 'input[id*="first"]', 'input[placeholder*="First"]'],
        lastName: ['input[name*="last"]', 'input[id*="last"]', 'input[placeholder*="Last"]'],
        email: ['input[type="email"]', 'input[name*="email"]', 'input[id*="email"]'],
        phone: ['input[type="tel"]', 'input[name*="phone"]', 'input[id*="phone"]'],
        address: ['input[name*="address"]', 'input[id*="address"]', 'input[placeholder*="Address"]'],
        city: ['input[name*="city"]', 'input[id*="city"]', 'input[placeholder*="City"]'],
        state: ['select[name*="state"]', 'input[name*="state"]', 'select[id*="state"]'],
        zip: ['input[name*="zip"]', 'input[name*="postal"]', 'input[id*="zip"]'],
        employer: ['input[name*="employer"]', 'input[id*="employer"]', 'input[placeholder*="Employer"]'],
        occupation: ['input[name*="occupation"]', 'input[id*="occupation"]', 'input[placeholder*="Occupation"]'],
        amount: ['input[name*="amount"]', 'input[id*="amount"]', 'input[placeholder*="Amount"]']
      };
      
      const testData = {
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
        amount: testConfig.amount || donation.contribution_amount
      };
      
      // Try to fill each field type
      for (const [fieldType, selectors] of Object.entries(fieldPatterns)) {
        fieldsFound++;
        let filled = false;
        
        for (const selector of selectors) {
          try {
            const element = await this.page.$(selector);
            if (element) {
              await this.page.focus(selector);
              await this.page.click(selector);
              await this.page.keyboard.down('Control');
              await this.page.keyboard.press('KeyA');
              await this.page.keyboard.up('Control');
              await this.page.type(selector, testData[fieldType] || '', { delay: 50 });
              fieldsFilled++;
              filled = true;
              break;
            }
          } catch (error) {
            // Continue to next selector
            continue;
          }
        }
        
        if (!filled) {
        }
      }
      
      
      return {
        success: fieldsFilled > 0,
        fieldsFound,
        fieldsFilled,
        message: `Filled ${fieldsFilled}/${fieldsFound} fields`
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Form filling error: ${error.message}`
      };
    }
  }

  async smartFormSubmit() {
    console.log('🚀 Attempting form submission...');
    
    try {
      // Look for submit buttons
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:contains("Submit")',
        'button:contains("Donate")',
        'button:contains("Continue")',
        '.submit-btn',
        '.donate-btn'
      ];
      
      for (const selector of submitSelectors) {
        try {
          const button = await this.page.$(selector);
          if (button) {
            await button.click();
            
            // Wait for navigation or response
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Check for success indicators
            const successIndicators = await this.page.evaluate(() => {
              const successTexts = ['success', 'thank you', 'confirmed', 'complete'];
              const errorTexts = ['error', 'failed', 'invalid', 'required'];
              
              const bodyText = document.body.textContent.toLowerCase();
              
              const hasSuccess = successTexts.some(text => bodyText.includes(text));
              const hasError = errorTexts.some(text => bodyText.includes(text));
              
              return { hasSuccess, hasError, url: window.location.href };
            });
            
            if (successIndicators.hasSuccess) {
              return { success: true, message: 'Form submitted successfully' };
            } else if (successIndicators.hasError) {
              return { success: false, message: 'Form submission failed - errors detected' };
            } else {
              return { success: true, message: 'Form submitted - status unclear' };
            }
          }
        } catch (error) {
          continue;
        }
      }
      
      return { success: false, message: 'No submit button found' };
      
    } catch (error) {
      return { success: false, message: `Submission error: ${error.message}` };
    }
  }

  async runTestSuite(options = {}) {
    
    const {
      count = 5,
      testType = 'mixed', // 'donors', 'prospects', 'mixed'
    } = options;
    
    // Create screenshots directory
    fs.mkdirSync('test-results/screenshots', { recursive: true });
    
    let testPersonas = [];
    
    // Select test personas based on type
    switch (testType) {
      case 'donors':
        const donorIds = [...new Set(this.donors.map(d => d.unique_id))];
        testPersonas = donorIds.slice(0, count).map(id => this.getPersonaById(id));
        break;
      case 'prospects':
        const nonDonorIds = this.prospects
          .filter(p => !this.donors.some(d => d.unique_id === p.unique_id))
          .map(p => p.unique_id);
        testPersonas = nonDonorIds.slice(0, count).map(id => this.getPersonaById(id));
        break;
      default: // mixed
        const allIds = this.prospects.map(p => p.unique_id);
        const shuffled = allIds.sort(() => 0.5 - Math.random());
        testPersonas = shuffled.slice(0, count).map(id => this.getPersonaById(id));
    }
    
    
    // Run tests
    for (let i = 0; i < testPersonas.length; i++) {
      const persona = testPersonas[i];
      
      await this.testFormSubmission(persona, {});
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Generate test report
    this.generateTestReport();
  }

  generateTestReport() {
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0.0';
    
    console.log(`Success Rate: ${successRate}%`);
    
    if (failedTests > 0) {
      this.testResults
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`❌ ${r.persona} - ${r.error || r.submissionResult?.message || 'Unknown error'}`);
        });
    }
    
    // Save detailed report
    const reportPath = `test-results/live-site-test-report-${Date.now()}.json`;
    fs.mkdirSync('test-results', { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
    
    // Summary for screenshots
    console.log('\\n📸 Screenshots saved in test-results/screenshots/');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// CLI Interface
async function main() {
  const agent = new LiveSiteTestingAgent();
  
  try {
    await agent.initialize();
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const options = {
      count: parseInt(args.find(arg => arg.startsWith('--count='))?.split('=')[1]) || 3,
      testType: args.find(arg => arg.startsWith('--type='))?.split('=')[1] || 'mixed'
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

module.exports = LiveSiteTestingAgent;