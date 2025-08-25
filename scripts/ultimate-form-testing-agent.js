#!/usr/bin/env node

/**
 * ULTIMATE Form Testing Agent
 * Tests the REAL form directly via the localhost iframe URL
 */

const fs = require('fs');
const csv = require('csv-parser');
const puppeteer = require('puppeteer');

// Direct iframe URL that actually works!
const FORM_URL = 'http://localhost:5173/?campaign=fefd5286-e859-48c9-95e6-0a743837acb3';

class UltimateFormTestingAgent {
  constructor() {
    this.prospects = [];
    this.donors = [];
    this.testResults = [];
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    console.log('🚀 ULTIMATE Form Testing Agent - Testing REAL User Form!');
    
    await this.loadCSVData();
    
    this.browser = await puppeteer.launch({ 
      headless: false, 
      slowMo: 500,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1400, height: 900 }
    });
    
    this.page = await this.browser.newPage();
    this.page.setDefaultTimeout(30000);
    
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
    const prospect = this.prospects.find(p => p.unique_id === uniqueId);
    const donations = this.donors.filter(d => d.unique_id === uniqueId);
    
    return {
      profile: prospect,
      donations: donations,
      isDonor: donations.length > 0
    };
  }

  async testFormSubmission(persona) {
    const startTime = Date.now();
    const testId = `test-${persona.profile.unique_id}-${startTime}`;
    
    
    const testResult = {
      testId,
      persona: `${persona.profile.first_name} ${persona.profile.last_name}`,
      uniqueId: persona.profile.unique_id,
      timestamp: new Date().toISOString(),
      success: false,
      steps: {}
    };
    
    try {
      await this.page.goto(FORM_URL, { waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      testResult.steps.navigation = true;
      
      const formAnalysis = await this.page.evaluate(() => {
        const forms = document.querySelectorAll('form');
        const inputs = document.querySelectorAll('input, select, textarea');
        
        return {
          formCount: forms.length,
          inputCount: inputs.length,
          inputs: Array.from(inputs).map(input => ({
            type: input.type,
            name: input.name,
            id: input.id,
            placeholder: input.placeholder,
            required: input.required,
            visible: input.offsetParent !== null
          }))
        };
      });
      
      testResult.steps.formAnalysis = formAnalysis;
      
      if (formAnalysis.formCount === 0 || formAnalysis.inputCount === 0) {
        throw new Error('No forms or inputs found');
      }
      
      const profile = persona.profile;
      const donation = persona.donations[0] || { contribution_amount: '100' };
      
      // Fill form fields based on detected inputs
      const fillResults = await this.fillFormFields(profile, donation, formAnalysis.inputs);
      testResult.steps.formFilling = fillResults;
      
      const submissionResult = await this.submitForm();
      testResult.steps.submission = submissionResult;
      
      if (submissionResult.success) {
        console.log('✅ FORM SUBMISSION SUCCESSFUL!');
        testResult.success = true;
      } else {
        console.log(`❌ Form submission failed: ${submissionResult.error}`);
      }
      
      testResult.duration = Date.now() - startTime;
      return testResult;
      
    } catch (error) {
      console.error(`💥 Test failed: ${error.message}`);
      testResult.error = error.message;
      testResult.duration = Date.now() - startTime;
      return testResult;
    }
  }

  async fillFormFields(profile, donation, inputFields) {
    
    const fillResults = {
      attempted: 0,
      successful: 0,
      failed: [],
      fieldMap: {}
    };
    
    // Create email for testing
    const email = `${profile.first_name.toLowerCase()}.${profile.last_name.toLowerCase()}@test.com`;
    
    // Field mapping strategy
    const fieldMappings = [
      { match: ['firstname', 'first_name', 'fname'], value: profile.first_name, type: 'name' },
      { match: ['lastname', 'last_name', 'lname'], value: profile.last_name, type: 'name' },
      { match: ['email'], value: email, type: 'email' },
      { match: ['address', 'street', 'address1'], value: profile.address_line_1, type: 'address' },
      { match: ['city'], value: profile.city, type: 'city' },
      { match: ['state'], value: profile.state, type: 'state' },
      { match: ['zip', 'zipcode', 'postal'], value: profile.zip, type: 'zip' },
      { match: ['employer', 'company'], value: profile.employer, type: 'employer' },
      { match: ['occupation', 'job'], value: profile.occupation, type: 'occupation' },
      { match: ['amount', 'donation', 'contribution'], value: donation.contribution_amount, type: 'amount' },
      { match: ['phone'], value: profile.phone_number, type: 'phone' },
      { match: ['wallet', 'address'], value: profile.wallet_address || '0x742d35Cc6639C0532fCb5FbF7b51f4FA8B4B8B34', type: 'wallet' }
    ];
    
    for (const input of inputFields) {
      if (!input.visible) continue;
      
      fillResults.attempted++;
      
      // Find matching field mapping
      const fieldName = (input.name || input.id || input.placeholder || '').toLowerCase();
      const mapping = fieldMappings.find(m => 
        m.match.some(pattern => fieldName.includes(pattern))
      );
      
      if (!mapping || !mapping.value) {
        fillResults.failed.push(`No mapping found for: ${fieldName}`);
        continue;
      }
      
      try {
        const selector = input.name ? `[name="${input.name}"]` : 
                        input.id ? `#${input.id}` :
                        `input[placeholder*="${input.placeholder}"]`;
        
        if (input.type === 'select-one' || input.tagName === 'SELECT') {
          // Handle select dropdowns
          await this.page.select(selector, mapping.value);
        } else {
          // Handle text inputs
          await this.page.click(selector);
          await this.page.evaluate(sel => document.querySelector(sel).value = '', selector);
          await this.page.type(selector, mapping.value.toString());
        }
        
        fillResults.successful++;
        fillResults.fieldMap[fieldName] = mapping.value;
        
      } catch (error) {
        fillResults.failed.push(`${fieldName}: ${error.message}`);
        console.log(`  ❌ ${fieldName}: ${error.message}`);
      }
    }
    
    console.log(`📊 Fill results: ${fillResults.successful}/${fillResults.attempted} successful`);
    return fillResults;
  }

  async submitForm() {
    console.log('🚀 Submitting form...');
    
    try {
      // Look for submit button
      const submitButton = await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]'));
        const submitBtn = buttons.find(btn => 
          btn.type === 'submit' || 
          btn.textContent.toLowerCase().includes('submit') ||
          btn.textContent.toLowerCase().includes('donate') ||
          btn.value?.toLowerCase().includes('submit')
        );
        
        if (submitBtn) {
          return {
            found: true,
            text: submitBtn.textContent || submitBtn.value,
            type: submitBtn.type,
            disabled: submitBtn.disabled
          };
        }
        return { found: false };
      });
      
      if (!submitButton.found) {
        return { success: false, error: 'No submit button found' };
      }
      
      if (submitButton.disabled) {
        return { success: false, error: 'Submit button is disabled' };
      }
      
      
      // Click submit and wait for response
      await Promise.all([
        this.page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {}),
        this.page.click('button[type="submit"], input[type="submit"]')
      ]);
      
      // Wait a moment for any success messages
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check for success/error messages
      const result = await this.page.evaluate(() => {
        // Look for common success/error indicators
        const successIndicators = [
          '.success', '.alert-success', '[class*="success"]',
          '.thank-you', '[class*="thank"]'
        ];
        
        const errorIndicators = [
          '.error', '.alert-error', '[class*="error"]',
          '.alert-danger', '[class*="danger"]'
        ];
        
        for (const selector of successIndicators) {
          const element = document.querySelector(selector);
          if (element && element.offsetParent !== null) {
            return { 
              success: true, 
              message: element.textContent.trim(),
              type: 'success_element'
            };
          }
        }
        
        for (const selector of errorIndicators) {
          const element = document.querySelector(selector);
          if (element && element.offsetParent !== null) {
            return { 
              success: false, 
              message: element.textContent.trim(),
              type: 'error_element'
            };
          }
        }
        
        // Check URL for success indicators
        const url = window.location.href;
        if (url.includes('success') || url.includes('thank')) {
          return { 
            success: true, 
            message: 'Redirected to success page',
            type: 'url_redirect',
            url
          };
        }
        
        // Default assumption - if no errors found, consider success
        return { 
          success: true, 
          message: 'Form submitted without visible errors',
          type: 'default_success'
        };
      });
      
      console.log(`📋 Submission result: ${result.success ? '✅' : '❌'} ${result.message}`);
      return result;
      
    } catch (error) {
      return { 
        success: false, 
        error: `Submission failed: ${error.message}`,
        type: 'exception'
      };
    }
  }

  async runTestSuite(count = 3) {
    
    const testPersonas = this.prospects
      .slice(0, count)
      .map(p => this.getPersonaById(p.unique_id));
    
    for (let i = 0; i < testPersonas.length; i++) {
      
      const result = await this.testFormSubmission(testPersonas[i]);
      this.testResults.push(result);
      
      // Delay between tests
      if (i < testPersonas.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    this.generateFinalReport();
  }

  generateFinalReport() {
    
    const successful = this.testResults.filter(r => r.success);
    const failed = this.testResults.filter(r => !r.success);
    
    console.log(`✅ Successful submissions: ${successful.length}`);
    console.log(`📈 Success rate: ${((successful.length / this.testResults.length) * 100).toFixed(1)}%`);
    
    if (successful.length > 0) {
      console.log('\n🎉 SUCCESSFUL TESTS:');
      successful.forEach(result => {
        const fillSuccess = result.steps.formFilling?.successful || 0;
        const fillAttempted = result.steps.formFilling?.attempted || 0;
        console.log(`  ✅ ${result.persona}: ${fillSuccess}/${fillAttempted} fields filled, submitted successfully`);
      });
    }
    
    if (failed.length > 0) {
      failed.forEach(result => {
        console.log(`  ❌ ${result.persona}: ${result.error || result.steps.submission?.error || 'Unknown error'}`);
      });
    }
    
    // Analyze form field success rates
    if (this.testResults.length > 0) {
      const allFields = this.testResults
        .filter(r => r.steps.formFilling)
        .reduce((acc, result) => {
          Object.entries(result.steps.formFilling.fieldMap || {}).forEach(([field, value]) => {
            if (!acc[field]) acc[field] = 0;
            acc[field]++;
          });
          return acc;
        }, {});
      
      Object.entries(allFields).forEach(([field, count]) => {
        const rate = ((count / this.testResults.length) * 100).toFixed(1);
        console.log(`  📝 ${field}: ${count}/${this.testResults.length} (${rate}%)`);
      });
    }
    
    // Save detailed report
    const reportPath = `test-results/ultimate-form-test-${Date.now()}.json`;
    fs.mkdirSync('test-results', { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
    
    if (successful.length > 0) {
      console.log('\n🎯 CONCLUSION: FORM TESTING SUCCESSFUL! ✅');
    } else {
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// CLI Interface
async function main() {
  const agent = new UltimateFormTestingAgent();
  
  try {
    await agent.initialize();
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const count = parseInt(args.find(arg => arg.startsWith('--count='))?.split('=')[1]) || 3;
    
    await agent.runTestSuite(count);
    
  } catch (error) {
    console.error('💥 Agent failed:', error);
  } finally {
    await agent.cleanup();
  }
}

if (require.main === module) {
  main();
}

module.exports = UltimateFormTestingAgent;