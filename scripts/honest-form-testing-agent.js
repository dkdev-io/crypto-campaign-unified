#!/usr/bin/env node

/**
 * Honest Form Testing Agent
 * Actually detects forms that exist (no more lies about "0 inputs found")
 */

const fs = require('fs');
const csv = require('csv-parser');
const puppeteer = require('puppeteer');

const BASE_URL = process.env.BASE_URL || 'https://testy-pink-chancellor.lovable.app';

class HonestFormTestingAgent {
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
      slowMo: 800,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
      defaultViewport: { width: 1400, height: 900 }
    });
    
    this.page = await this.browser.newPage();
    this.page.setDefaultTimeout(60000);
    
  }

  async loadCSVData() {
    this.prospects = await this.loadCSV('data/prospects.csv');
    this.donors = await this.loadCSV('data/donors.csv');
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

  async comprehensiveFormDetection() {
    
    const detection = await this.page.evaluate(() => {
      
      // Get ALL possible form elements with multiple strategies
      const results = {
        // Strategy 1: Standard form elements
        standardInputs: document.querySelectorAll('input'),
        standardSelects: document.querySelectorAll('select'), 
        standardTextareas: document.querySelectorAll('textarea'),
        standardForms: document.querySelectorAll('form'),
        
        // Strategy 2: Custom form-like elements
        divInputs: document.querySelectorAll('[contenteditable="true"]'),
        customInputs: document.querySelectorAll('[role="textbox"]'),
        dataInputs: document.querySelectorAll('[data-testid*="input"], [data-testid*="field"]'),
        
        // Strategy 3: Common class/id patterns
        classInputs: document.querySelectorAll('.input, .field, .form-control, .form-field'),
        idInputs: document.querySelectorAll('[id*="input"], [id*="field"], [id*="form"]'),
        
        // Strategy 4: Placeholder-based detection
        placeholderElements: document.querySelectorAll('[placeholder]'),
        
        // Strategy 5: React/Vue component patterns
        reactInputs: document.querySelectorAll('[data-reactid] input, [data-react-class] input'),
        vueInputs: document.querySelectorAll('[v-model], [v-bind]'),
        
        // Strategy 6: Shadow DOM check
        shadowHosts: document.querySelectorAll('*'),
        
        // Strategy 7: All elements (brute force)
        allElements: document.querySelectorAll('*')
      };
      
      // Analyze each strategy
      const analysis = {};
      
      Object.keys(results).forEach(strategy => {
        const elements = results[strategy];
        analysis[strategy] = {
          count: elements.length,
          elements: Array.from(elements).slice(0, 10).map(el => ({
            tagName: el.tagName,
            type: el.type,
            name: el.name,
            id: el.id,
            className: el.className.substring(0, 100),
            placeholder: el.placeholder,
            textContent: el.textContent ? el.textContent.substring(0, 50) : '',
            visible: el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden',
            rect: el.getBoundingClientRect()
          }))
        };
      });
      
      // Special check for forms that might be hidden initially
      const allDivs = document.querySelectorAll('div');
      const possibleFormContainers = Array.from(allDivs).filter(div => {
        const text = div.textContent.toLowerCase();
        return text.includes('amount') || 
               text.includes('email') || 
               text.includes('name') || 
               text.includes('donate') ||
               text.includes('contribution') ||
               text.includes('first name') ||
               text.includes('last name');
      });
      
      analysis.possibleFormContainers = {
        count: possibleFormContainers.length,
        elements: possibleFormContainers.slice(0, 5).map(div => ({
          textContent: div.textContent.substring(0, 100),
          className: div.className.substring(0, 100),
          childrenCount: div.children.length,
          visible: div.offsetParent !== null
        }))
      };
      
      return analysis;
    });
    
    console.log('📊 COMPREHENSIVE DETECTION RESULTS:');
    Object.keys(detection).forEach(strategy => {
      const result = detection[strategy];
      console.log(`  ${strategy}: ${result.count} elements`);
      if (result.count > 0 && result.elements) {
        result.elements.forEach((el, i) => {
          if (el.visible && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA')) {
          }
        });
      }
    });
    
    return detection;
  }

  async testHomepageFormHonestly(persona) {
    
    try {
      await this.page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      
      // Wait for page to be fully interactive
      await this.page.waitForFunction(() => document.readyState === 'complete');
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second wait for any dynamic content
      
      const detection = await this.comprehensiveFormDetection();
      
      // Take screenshot for manual verification  
      await this.page.screenshot({ 
        path: `test-results/screenshots/honest-homepage-${persona.profile.unique_id}.png`,
        fullPage: true 
      });
      
      // Find actual fillable inputs
      const fillableInputs = await this.page.$$('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea, [contenteditable="true"]');
      
      
      if (fillableInputs.length === 0) {
        console.log('❌ Still no fillable inputs found - taking debug screenshot');
        return {
          success: false,
          message: 'No fillable inputs detected even with comprehensive scanning',
          detection
        };
      }
      
      // Try to fill the forms we found
      return await this.fillHomepageForm(persona, fillableInputs, detection);
      
    } catch (error) {
      console.error(`💥 Homepage test error: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async fillHomepageForm(persona, inputs, detection) {
    
    const profile = persona.profile;
    const donation = persona.donations[0] || { contribution_amount: '100.00' };
    
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
      amount: donation.contribution_amount || '100.00'
    };
    
    
    let fieldsFilled = 0;
    
    for (let i = 0; i < inputs.length; i++) {
      try {
        const input = inputs[i];
        
        // Get detailed info about this input
        const inputDetails = await input.evaluate(el => ({
          tagName: el.tagName,
          type: el.type,
          name: el.name,
          id: el.id,
          placeholder: el.placeholder,
          className: el.className,
          required: el.required,
          disabled: el.disabled,
          readonly: el.readOnly,
          visible: el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).opacity !== '0',
          rect: el.getBoundingClientRect()
        }));
        
        
        if (!inputDetails.visible || inputDetails.disabled || inputDetails.readonly) {
          continue;
        }
        
        // Match to our test data
        const value = this.matchInputToData(inputDetails, testData);
        
        if (value) {
          
          // Scroll to input and make it fully visible
          await input.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Focus and clear
          await input.focus();
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Clear existing content
          await this.page.keyboard.down('Control');
          await this.page.keyboard.press('KeyA');
          await this.page.keyboard.up('Control');
          await this.page.keyboard.press('Backspace');
          
          // Type new value
          await input.type(value, { delay: 150 });
          
          fieldsFilled++;
          console.log(`  ✅ Successfully filled!`);
          
          // Wait between fields
          await new Promise(resolve => setTimeout(resolve, 800));
        } else {
        }
        
      } catch (inputError) {
        console.log(`  💥 Error with input ${i+1}: ${inputError.message}`);
      }
    }
    
    
    // Take screenshot after filling
    await this.page.screenshot({ 
      path: `test-results/screenshots/honest-filled-${persona.profile.unique_id}.png`,
      fullPage: true 
    });
    
    // Try to submit
    const submitResult = await this.submitFormHonestly();
    
    return {
      success: fieldsFilled > 0 && submitResult.submitted,
      fieldsFilled,
      submitResult,
      detection
    };
  }

  matchInputToData(inputDetails, data) {
    const name = (inputDetails.name || '').toLowerCase();
    const id = (inputDetails.id || '').toLowerCase();  
    const placeholder = (inputDetails.placeholder || '').toLowerCase();
    const type = (inputDetails.type || '').toLowerCase();
    const className = (inputDetails.className || '').toLowerCase();
    
    // Enhanced matching with more patterns
    if (name.includes('first') || id.includes('first') || placeholder.includes('first') || className.includes('first')) return data.firstName;
    if (name.includes('last') || id.includes('last') || placeholder.includes('last') || className.includes('last')) return data.lastName;
    if (type === 'email' || name.includes('email') || id.includes('email') || placeholder.includes('email')) return data.email;
    if (type === 'tel' || name.includes('phone') || id.includes('phone') || placeholder.includes('phone')) return data.phone;
    if (name.includes('address') || id.includes('address') || placeholder.includes('address')) return data.address;
    if (name.includes('city') || id.includes('city') || placeholder.includes('city')) return data.city;
    if (name.includes('state') || id.includes('state') || placeholder.includes('state')) return data.state;
    if (name.includes('zip') || name.includes('postal') || id.includes('zip')) return data.zip;
    if (name.includes('employer') || id.includes('employer') || placeholder.includes('employer')) return data.employer;
    if (name.includes('occupation') || id.includes('occupation') || placeholder.includes('occupation')) return data.occupation;
    if (name.includes('amount') || id.includes('amount') || placeholder.includes('amount') || placeholder.includes('$')) return data.amount;
    
    // Generic name field fallback
    if ((name.includes('name') && !name.includes('last') && !name.includes('first')) || 
        (placeholder.includes('name') && !placeholder.includes('last') && !placeholder.includes('first'))) {
      return `${data.firstName} ${data.lastName}`;
    }
    
    return null;
  }

  async submitFormHonestly() {
    console.log('🚀 HONEST FORM SUBMISSION ATTEMPT');
    
    try {
      // Find submit buttons with comprehensive search
      const submitButtons = await this.page.$$('button[type="submit"], input[type="submit"], button:not([type]), .submit-btn, .donate-btn, [data-testid*="submit"]');
      
      
      for (let i = 0; i < submitButtons.length; i++) {
        const button = submitButtons[i];
        
        try {
          const buttonDetails = await button.evaluate(el => ({
            tagName: el.tagName,
            type: el.type,
            textContent: el.textContent.trim(),
            className: el.className,
            disabled: el.disabled,
            visible: el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden'
          }));
          
          
          if (buttonDetails.visible && !buttonDetails.disabled && 
              (buttonDetails.textContent.toLowerCase().includes('submit') || 
               buttonDetails.textContent.toLowerCase().includes('donate') ||
               buttonDetails.textContent.toLowerCase().includes('contribute') ||
               buttonDetails.type === 'submit')) {
            
            
            await button.scrollIntoView();
            await new Promise(resolve => setTimeout(resolve, 500));
            await button.click();
            
            
            // Wait for submission response
            await new Promise(resolve => setTimeout(resolve, 8000));
            
            // Take final screenshot
            await this.page.screenshot({ 
              path: `test-results/screenshots/honest-submitted-${Date.now()}.png`,
              fullPage: true 
            });
            
            return {
              submitted: true,
              success: true,
              message: `Submitted via button: "${buttonDetails.textContent}"`
            };
          }
          
        } catch (buttonError) {
          console.log(`  💥 Button ${i+1} error: ${buttonError.message}`);
        }
      }
      
      return {
        submitted: false,
        success: false,
        message: 'No clickable submit buttons found'
      };
      
    } catch (error) {
      return {
        submitted: false,
        success: false,
        message: `Submit error: ${error.message}`
      };
    }
  }

  async runHonestTest(options = {}) {
    
    const { count = 2, testType = 'mixed' } = options;
    
    let testPersonas = [];
    switch (testType) {
      case 'donors':
        const donorIds = [...new Set(this.donors.map(d => d.unique_id))];
        testPersonas = donorIds.slice(0, count).map(id => this.getPersonaById(id));
        break;
      default:
        const allIds = this.prospects.map(p => p.unique_id);
        const shuffled = allIds.sort(() => 0.5 - Math.random());
        testPersonas = shuffled.slice(0, count).map(id => this.getPersonaById(id));
    }
    
    
    fs.mkdirSync('test-results/screenshots', { recursive: true });
    
    for (let i = 0; i < testPersonas.length; i++) {
      const persona = testPersonas[i];
      
      const result = await this.testHomepageFormHonestly(persona);
      this.testResults.push({
        persona: `${persona.profile.first_name} ${persona.profile.last_name}`,
        result,
        timestamp: new Date().toISOString()
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    this.generateHonestReport();
  }

  generateHonestReport() {
    console.log('\\n📊 HONEST FORM TESTING RESULTS');
    
    const totalTests = this.testResults.length;
    const successfulFills = this.testResults.filter(r => r.result.fieldsFilled > 0).length;
    const successfulSubmits = this.testResults.filter(r => r.result.submitResult?.submitted).length;
    
    console.log(`Forms Found & Filled: ${successfulFills}/${totalTests}`);
    console.log(`Forms Submitted: ${successfulSubmits}/${totalTests}`);
    
    this.testResults.forEach((test, i) => {
      console.log(`${i+1}. ${test.persona}: ${test.result.fieldsFilled || 0} fields filled, submitted: ${test.result.submitResult?.submitted || false}`);
    });
    
    const reportPath = `test-results/honest-form-test-report-${Date.now()}.json`;
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
  const agent = new HonestFormTestingAgent();
  
  try {
    await agent.initialize();
    
    const args = process.argv.slice(2);
    const options = {
      count: parseInt(args.find(arg => arg.startsWith('--count='))?.split('=')[1]) || 2,
      testType: args.find(arg => arg.startsWith('--type='))?.split('=')[1] || 'mixed'
    };
    
    await agent.runHonestTest(options);
    
  } catch (error) {
    console.error('💥 Honest Agent failed:', error);
  } finally {
    await agent.cleanup();
  }
}

if (require.main === module) {
  main();
}

module.exports = HonestFormTestingAgent;