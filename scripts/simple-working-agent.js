#!/usr/bin/env node

/**
 * Simple Working Agent - No BS, Just Fill Forms
 * Stops making excuses and actually fills the forms that clearly exist
 */

const fs = require('fs');
const csv = require('csv-parser');
const puppeteer = require('puppeteer');

const BASE_URL = process.env.BASE_URL || 'https://testy-pink-chancellor.lovable.app';

class SimpleWorkingAgent {
  constructor() {
    this.prospects = [];
    this.donors = [];
    this.testResults = [];
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    console.log('✅ Simple Working Agent - NO MORE EXCUSES');
    console.log(`🎯 Target: ${BASE_URL}`);
    
    await this.loadCSVData();
    
    this.browser = await puppeteer.launch({ 
      headless: false, 
      slowMo: 1000,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-dev-shm-usage'
      ],
      defaultViewport: { width: 1200, height: 800 }
    });
    
    this.page = await this.browser.newPage();
    this.page.setDefaultTimeout(30000);
    
    console.log(`✅ Loaded ${this.prospects.length} prospects, ${this.donors.length} contributions`);
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

  async testFormWithPersona(persona, testIndex, totalTests) {
    console.log(`\\n🎯 TEST ${testIndex}/${totalTests}: ${persona.profile.first_name} ${persona.profile.last_name}`);
    
    const startTime = Date.now();
    
    try {
      // Navigate to site
      console.log('🌐 Loading site...');
      await this.page.goto(BASE_URL, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      console.log('✅ Site loaded successfully');
      
      // Take initial screenshot
      await this.page.screenshot({ 
        path: `test-results/screenshots/simple-${persona.profile.unique_id}-start.png`,
        fullPage: true 
      });
      
      // Wait for any dynamic content
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Fill the form with actual data
      const fillResult = await this.fillAnyForm(persona);
      
      // Take screenshot after filling
      await this.page.screenshot({ 
        path: `test-results/screenshots/simple-${persona.profile.unique_id}-filled.png`,
        fullPage: true 
      });
      
      // Submit the form
      const submitResult = await this.submitAnyForm();
      
      // Take final screenshot
      await this.page.screenshot({ 
        path: `test-results/screenshots/simple-${persona.profile.unique_id}-final.png`,
        fullPage: true 
      });
      
      const result = {
        persona: `${persona.profile.first_name} ${persona.profile.last_name}`,
        uniqueId: persona.profile.unique_id,
        success: fillResult.fieldsFilled > 0 && submitResult.submitted,
        duration: Date.now() - startTime,
        fillResult,
        submitResult,
        timestamp: new Date().toISOString()
      };
      
      this.testResults.push(result);
      
      console.log(`${result.success ? '✅ SUCCESS' : '❌ FAILED'}: Filled ${fillResult.fieldsFilled} fields, Submitted: ${submitResult.submitted}`);
      
      return result;
      
    } catch (error) {
      console.error(`💥 Test failed: ${error.message}`);
      
      const result = {
        persona: `${persona.profile.first_name} ${persona.profile.last_name}`,
        uniqueId: persona.profile.unique_id,
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
      
      this.testResults.push(result);
      return result;
    }
  }

  async fillAnyForm(persona) {
    console.log('📝 Filling forms with real data...');
    
    const profile = persona.profile;
    const donation = persona.donations[0] || { contribution_amount: '250.00' };
    
    const testData = {
      firstName: profile.first_name,
      lastName: profile.last_name,
      fullName: `${profile.first_name} ${profile.last_name}`,
      email: `${profile.first_name.toLowerCase()}.${profile.last_name.toLowerCase()}@test.com`,
      phone: profile.phone_number,
      address: profile.address_line_1,
      city: profile.city,
      state: profile.state,
      zip: profile.zip,
      employer: profile.employer,
      occupation: profile.occupation,
      amount: donation.contribution_amount || '250.00'
    };
    
    console.log(`📋 Using: ${testData.fullName}, ${testData.email}, $${testData.amount}`);
    
    let fieldsFilled = 0;
    
    try {
      // Get ALL inputs on the page - no more selective nonsense
      const allInputs = await this.page.$$('input, select, textarea');
      console.log(`🔍 Found ${allInputs.length} total input elements`);
      
      // Try to fill every single input we can find
      for (let i = 0; i < allInputs.length; i++) {
        try {
          const input = allInputs[i];
          
          const info = await input.evaluate(el => ({
            tag: el.tagName,
            type: el.type || 'text',
            name: el.name || '',
            id: el.id || '',
            placeholder: el.placeholder || '',
            className: el.className || '',
            hidden: el.type === 'hidden',
            disabled: el.disabled,
            readonly: el.readOnly,
            visible: el.offsetParent !== null
          }));
          
          // Skip hidden, disabled, or invisible inputs
          if (info.hidden || info.disabled || info.readonly || !info.visible) {
            continue;
          }
          
          console.log(`📍 Input ${i+1}: ${info.tag} type="${info.type}" name="${info.name}" placeholder="${info.placeholder}"`);
          
          // Determine what value to put in this field
          const value = this.determineValue(info, testData);
          
          if (value) {
            console.log(`  ➤ FILLING: "${value}"`);
            
            // Scroll to input
            await input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Focus and clear
            await input.focus();
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Clear existing content multiple ways
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('KeyA');
            await this.page.keyboard.up('Control');
            await this.page.keyboard.press('Backspace');
            
            // For select elements, set value directly
            if (info.tag === 'SELECT') {
              await this.page.select(`[name="${info.name}"], #${info.id}`, value);
            } else {
              // Type the value
              await input.type(value, { delay: 100 });
            }
            
            fieldsFilled++;
            console.log(`  ✅ FILLED!`);
            
            // Brief pause between fields
            await new Promise(resolve => setTimeout(resolve, 800));
          } else {
            console.log(`  ⚠️  No matching value`);
          }
          
        } catch (inputError) {
          console.log(`  💥 Error: ${inputError.message}`);
        }
      }
      
      console.log(`\\n✅ TOTAL FIELDS FILLED: ${fieldsFilled}`);
      
      return {
        fieldsFilled,
        success: fieldsFilled > 0,
        message: `Filled ${fieldsFilled} fields`
      };
      
    } catch (error) {
      return {
        fieldsFilled: 0,
        success: false,
        message: `Fill error: ${error.message}`
      };
    }
  }

  determineValue(inputInfo, data) {
    const name = inputInfo.name.toLowerCase();
    const id = inputInfo.id.toLowerCase();
    const placeholder = inputInfo.placeholder.toLowerCase();
    const type = inputInfo.type.toLowerCase();
    const className = inputInfo.className.toLowerCase();
    
    // All possible matching patterns
    const allText = `${name} ${id} ${placeholder} ${className}`.toLowerCase();
    
    // Email fields
    if (type === 'email' || allText.includes('email')) return data.email;
    
    // Name fields
    if (allText.includes('firstname') || allText.includes('first_name') || allText.includes('first-name')) return data.firstName;
    if (allText.includes('lastname') || allText.includes('last_name') || allText.includes('last-name')) return data.lastName;
    if (allText.includes('fullname') || allText.includes('full_name') || allText.includes('full-name')) return data.fullName;
    if (allText.includes('name') && !allText.includes('first') && !allText.includes('last')) return data.fullName;
    
    // Phone fields
    if (type === 'tel' || allText.includes('phone') || allText.includes('tel')) return data.phone;
    
    // Address fields
    if (allText.includes('address')) return data.address;
    if (allText.includes('city')) return data.city;
    if (allText.includes('state')) return data.state;
    if (allText.includes('zip') || allText.includes('postal')) return data.zip;
    
    // Employment fields
    if (allText.includes('employer')) return data.employer;
    if (allText.includes('occupation') || allText.includes('job')) return data.occupation;
    
    // Amount/donation fields
    if (allText.includes('amount') || allText.includes('donation') || allText.includes('contribute')) return data.amount;
    if (type === 'number' && allText.includes('$')) return data.amount;
    
    // Default fallbacks based on type
    if (type === 'text' && !name && !id) return data.fullName; // Generic text field
    if (type === 'number') return data.amount; // Generic number field
    
    return null;
  }

  async submitAnyForm() {
    console.log('🚀 Attempting to submit form...');
    
    try {
      // Find ALL possible submit buttons
      const submitElements = await this.page.$$('button, input[type="submit"], [role="button"], .btn, .button');
      console.log(`🔍 Found ${submitElements.length} potential submit elements`);
      
      for (let i = 0; i < submitElements.length; i++) {
        try {
          const element = submitElements[i];
          
          const info = await element.evaluate(el => ({
            tag: el.tagName,
            type: el.type || '',
            text: el.textContent?.trim() || '',
            value: el.value || '',
            className: el.className || '',
            disabled: el.disabled,
            visible: el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden'
          }));
          
          if (!info.visible || info.disabled) continue;
          
          const allText = `${info.text} ${info.value} ${info.className}`.toLowerCase();
          
          console.log(`📍 Element ${i+1}: ${info.tag} "${info.text}" type="${info.type}"`);
          
          // Check if this looks like a submit button
          if (info.type === 'submit' || 
              allText.includes('submit') || 
              allText.includes('donate') || 
              allText.includes('contribute') ||
              allText.includes('send') ||
              allText.includes('continue')) {
            
            console.log(`🎯 CLICKING SUBMIT: "${info.text}"`);
            
            // Scroll to button
            await element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Click the submit button
            await element.click();
            
            console.log('✅ Submit clicked! Waiting for response...');
            
            // Wait for form submission to process
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Check if page changed or form was processed
            const currentUrl = this.page.url();
            console.log(`📍 Current URL: ${currentUrl}`);
            
            return {
              submitted: true,
              success: true,
              message: `Submitted via: "${info.text}"`,
              url: currentUrl
            };
          }
          
        } catch (elementError) {
          console.log(`💥 Element ${i+1} error: ${elementError.message}`);
        }
      }
      
      return {
        submitted: false,
        success: false,
        message: 'No submit buttons found'
      };
      
    } catch (error) {
      return {
        submitted: false,
        success: false,
        message: `Submit error: ${error.message}`
      };
    }
  }

  async runSimpleTest(options = {}) {
    console.log('\\n✅ SIMPLE WORKING TEST - NO EXCUSES\\n');
    
    const { count = 2, testType = 'mixed' } = options;
    
    // Get test personas
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
    
    console.log(`🎯 Testing ${testPersonas.length} personas with NO EXCUSES`);
    
    fs.mkdirSync('test-results/screenshots', { recursive: true });
    
    for (let i = 0; i < testPersonas.length; i++) {
      const persona = testPersonas[i];
      await this.testFormWithPersona(persona, i + 1, testPersonas.length);
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    this.generateSimpleReport();
  }

  generateSimpleReport() {
    console.log('\\n📊 SIMPLE WORKING RESULTS');
    console.log('==========================================');
    
    const total = this.testResults.length;
    const successful = this.testResults.filter(r => r.success).length;
    const fieldsFilled = this.testResults.reduce((sum, r) => sum + (r.fillResult?.fieldsFilled || 0), 0);
    const submitted = this.testResults.filter(r => r.submitResult?.submitted).length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Successful: ${successful}/${total} (${(successful/total*100).toFixed(1)}%)`);
    console.log(`Total Fields Filled: ${fieldsFilled}`);
    console.log(`Forms Submitted: ${submitted}/${total}`);
    
    console.log('\\n📋 INDIVIDUAL RESULTS:');
    this.testResults.forEach((result, i) => {
      console.log(`${i+1}. ${result.persona}: ${result.success ? '✅ SUCCESS' : '❌ FAILED'} - ${result.fillResult?.fieldsFilled || 0} fields - submitted: ${result.submitResult?.submitted || false}`);
    });
    
    // Save report
    const reportPath = `test-results/simple-working-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
    console.log(`\\n📁 Report saved: ${reportPath}`);
    console.log('📸 Screenshots in test-results/screenshots/');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// CLI
async function main() {
  const agent = new SimpleWorkingAgent();
  
  try {
    await agent.initialize();
    
    const args = process.argv.slice(2);
    const options = {
      count: parseInt(args.find(arg => arg.startsWith('--count='))?.split('=')[1]) || 2,
      testType: args.find(arg => arg.startsWith('--type='))?.split('=')[1] || 'mixed'
    };
    
    await agent.runSimpleTest(options);
    
  } catch (error) {
    console.error('💥 Simple Agent Failed:', error);
  } finally {
    await agent.cleanup();
  }
}

if (require.main === module) {
  main();
}

module.exports = SimpleWorkingAgent;