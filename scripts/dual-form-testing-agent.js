#!/usr/bin/env node

/**
 * Dual Form Testing Agent
 * Tests BOTH homepage form AND modal form with the same CSV data
 * Each persona gets tested twice - once per form
 */

const fs = require('fs');
const csv = require('csv-parser');
const puppeteer = require('puppeteer');

const BASE_URL = process.env.BASE_URL || 'https://testy-pink-chancellor.lovable.app';

class DualFormTestingAgent {
  constructor() {
    this.prospects = [];
    this.donors = [];
    this.kyc = [];
    this.testResults = [];
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    
    await this.loadCSVData();
    
    this.browser = await puppeteer.launch({ 
      headless: false, 
      slowMo: 300,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1400, height: 900 }
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

  async testPersonaOnBothForms(persona, testIndex, totalTests) {
    
    const results = {
      persona: `${persona.profile.first_name} ${persona.profile.last_name}`,
      uniqueId: persona.profile.unique_id,
      homepageForm: null,
      modalForm: null,
      timestamp: new Date().toISOString()
    };

    // Test 1: Homepage Form
    results.homepageForm = await this.testHomepageForm(persona, testIndex);
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Modal Form (after clicking Donate button)
    results.modalForm = await this.testModalForm(persona, testIndex);
    
    this.testResults.push(results);
    
    // Summary for this persona
    const homepageSuccess = results.homepageForm?.success || false;
    const modalSuccess = results.modalForm?.success || false;
    
    console.log(`\\n📊 PERSONA SUMMARY: ${persona.profile.first_name}`);
    console.log(`   Homepage Form: ${homepageSuccess ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Modal Form: ${modalSuccess ? '✅ PASS' : '❌ FAIL'}`);
    
    return results;
  }

  async testHomepageForm(persona, testIndex) {
    const startTime = Date.now();
    const testId = `homepage-${persona.profile.unique_id}-${startTime}`;
    
    try {
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Screenshot of initial page
      fs.mkdirSync('test-results/screenshots', { recursive: true });
      await this.page.screenshot({ 
        path: `test-results/screenshots/${testId}-01-homepage-loaded.png`,
        fullPage: true 
      });
      
      // Look for forms already on the page (not in modals)
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for any dynamic loading
      
      const pageAnalysis = await this.analyzeFormsOnPage('homepage');
      
      if (pageAnalysis.inputs.length === 0) {
        console.log('⚠️  No form inputs found on homepage');
        return {
          success: false,
          formType: 'homepage',
          message: 'No form inputs detected on homepage',
          pageAnalysis,
          duration: Date.now() - startTime
        };
      }
      
      
      // Fill the homepage form
      const fillResult = await this.smartFormFill(persona, 'homepage');
      
      // Screenshot after filling
      await this.page.screenshot({ 
        path: `test-results/screenshots/${testId}-02-homepage-filled.png`,
        fullPage: true 
      });
      
      // Try to submit homepage form
      const submitResult = await this.smartFormSubmit('homepage');
      
      // Final screenshot
      await this.page.screenshot({ 
        path: `test-results/screenshots/${testId}-03-homepage-submitted.png`,
        fullPage: true 
      });
      
      return {
        success: fillResult.success && submitResult.success,
        formType: 'homepage',
        pageAnalysis,
        fillResult,
        submitResult,
        duration: Date.now() - startTime,
        screenshots: [
          `${testId}-01-homepage-loaded.png`,
          `${testId}-02-homepage-filled.png`, 
          `${testId}-03-homepage-submitted.png`
        ]
      };
      
    } catch (error) {
      console.error(`💥 Homepage form test error: ${error.message}`);
      
      try {
        await this.page.screenshot({ 
          path: `test-results/screenshots/${testId}-error.png`,
          fullPage: true 
        });
      } catch (screenshotError) {
        // Ignore screenshot errors
      }
      
      return {
        success: false,
        formType: 'homepage',
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  async testModalForm(persona, testIndex) {
    const startTime = Date.now();
    const testId = `modal-${persona.profile.unique_id}-${startTime}`;
    
    try {
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Screenshot before clicking donate
      await this.page.screenshot({ 
        path: `test-results/screenshots/${testId}-01-before-donate-click.png`,
        fullPage: true 
      });
      
      // Find and click the "Donate" button
      const donateClicked = await this.clickDonateButton();
      
      if (!donateClicked) {
        return {
          success: false,
          formType: 'modal',
          message: 'Could not find or click Donate button',
          duration: Date.now() - startTime
        };
      }
      
      console.log('✅ Donate button clicked, waiting for modal/form to load...');
      
      // Wait for modal/new form to appear
      await new Promise(resolve => setTimeout(resolve, 4000)); // Extended wait
      
      // Screenshot after clicking donate
      await this.page.screenshot({ 
        path: `test-results/screenshots/${testId}-02-after-donate-click.png`,
        fullPage: true 
      });
      
      // Analyze the new form that appeared
      const pageAnalysis = await this.analyzeFormsOnPage('modal');
      
      if (pageAnalysis.inputs.length === 0) {
        console.log('⚠️  No new form inputs found after clicking Donate');
        return {
          success: false,
          formType: 'modal',
          message: 'No form inputs appeared after clicking Donate',
          pageAnalysis,
          duration: Date.now() - startTime
        };
      }
      
      
      // Fill the modal form
      const fillResult = await this.smartFormFill(persona, 'modal');
      
      // Screenshot after filling
      await this.page.screenshot({ 
        path: `test-results/screenshots/${testId}-03-modal-filled.png`,
        fullPage: true 
      });
      
      // Try to submit modal form
      const submitResult = await this.smartFormSubmit('modal');
      
      // Final screenshot
      await this.page.screenshot({ 
        path: `test-results/screenshots/${testId}-04-modal-submitted.png`,
        fullPage: true 
      });
      
      return {
        success: fillResult.success && submitResult.success,
        formType: 'modal',
        pageAnalysis,
        fillResult,
        submitResult,
        duration: Date.now() - startTime,
        screenshots: [
          `${testId}-01-before-donate-click.png`,
          `${testId}-02-after-donate-click.png`,
          `${testId}-03-modal-filled.png`,
          `${testId}-04-modal-submitted.png`
        ]
      };
      
    } catch (error) {
      console.error(`💥 Modal form test error: ${error.message}`);
      
      try {
        await this.page.screenshot({ 
          path: `test-results/screenshots/${testId}-error.png`,
          fullPage: true 
        });
      } catch (screenshotError) {
        // Ignore screenshot errors
      }
      
      return {
        success: false,
        formType: 'modal',
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  async clickDonateButton() {
    try {
      // Try multiple strategies to find donate button
      const donateSelectors = [
        'button:has-text("Donate")',
        'a:has-text("Donate")',
        '[data-testid="donate"]',
        '.donate-btn',
        '.donate-button'
      ];
      
      // First, try standard selectors
      for (const selector of donateSelectors) {
        try {
          await this.page.click(selector, { timeout: 1000 });
          return true;
        } catch (error) {
          continue;
        }
      }
      
      // If standard selectors fail, find by text content
      const buttons = await this.page.$$('button, a');
      for (const button of buttons) {
        try {
          const text = await this.page.evaluate(el => el.textContent.trim().toLowerCase(), button);
          if (text.includes('donate')) {
            await button.click();
            return true;
          }
        } catch (error) {
          continue;
        }
      }
      
      return false;
      
    } catch (error) {
      console.error('Error clicking donate button:', error.message);
      return false;
    }
  }

  async analyzeFormsOnPage(context) {
    
    try {
      const analysis = await this.page.evaluate(() => {
        const forms = Array.from(document.querySelectorAll('form')).map(f => ({
          action: f.action,
          method: f.method,
          id: f.id,
          className: f.className
        }));
        
        const inputs = Array.from(document.querySelectorAll('input, select, textarea')).map((i, index) => ({
          index,
          type: i.type,
          name: i.name,
          id: i.id,
          placeholder: i.placeholder,
          className: i.className,
          tagName: i.tagName.toLowerCase(),
          visible: i.offsetParent !== null,
          required: i.required
        }));
        
        // Filter for visible inputs only
        const visibleInputs = inputs.filter(i => i.visible);
        
        const buttons = Array.from(document.querySelectorAll('button')).map(b => ({
          text: b.textContent.trim(),
          type: b.type,
          className: b.className,
          id: b.id,
          visible: b.offsetParent !== null
        })).filter(b => b.visible);
        
        return {
          url: window.location.href,
          forms: forms,
          inputs: visibleInputs,
          buttons: buttons,
          totalInputs: inputs.length,
          visibleInputs: visibleInputs.length
        };
      });
      
      
      return analysis;
      
    } catch (error) {
      console.error(`Analysis error for ${context}:`, error.message);
      return { inputs: [], forms: [], buttons: [] };
    }
  }

  async smartFormFill(persona, context) {
    
    const profile = persona.profile;
    const donation = persona.donations[0] || { contribution_amount: '100.00' };
    
    try {
      let fieldsFilled = 0;
      
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
        amount: donation.contribution_amount
      };
      
      // Get all visible inputs
      const inputs = await this.page.$$('input:not([type="hidden"]), select, textarea');
      
      for (let i = 0; i < inputs.length; i++) {
        try {
          const input = inputs[i];
          const inputInfo = await this.page.evaluate(el => ({
            type: el.type,
            name: el.name,
            id: el.id,
            placeholder: el.placeholder,
            visible: el.offsetParent !== null,
            tagName: el.tagName.toLowerCase()
          }), input);
          
          if (!inputInfo.visible) continue;
          
          const fieldValue = this.matchInputToData(inputInfo, formData);
          
          if (fieldValue) {
            console.log(`📍 Filling ${inputInfo.name || inputInfo.id || inputInfo.type} with: ${fieldValue.substring(0, 20)}...`);
            
            await input.focus();
            await input.click();
            
            // Clear and type
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('KeyA');
            await this.page.keyboard.up('Control');
            await this.page.keyboard.press('Backspace');
            
            await input.type(fieldValue, { delay: 100 });
            fieldsFilled++;
            
            // Small delay between fields
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          
        } catch (error) {
          console.log(`⚠️  Could not fill input ${i}: ${error.message}`);
        }
      }
      
      
      return {
        success: fieldsFilled > 0,
        fieldsFilled,
        message: `${context}: Filled ${fieldsFilled} fields`
      };
      
    } catch (error) {
      return {
        success: false,
        message: `${context} form filling error: ${error.message}`
      };
    }
  }

  matchInputToData(inputInfo, formData) {
    const name = (inputInfo.name || '').toLowerCase();
    const id = (inputInfo.id || '').toLowerCase();
    const placeholder = (inputInfo.placeholder || '').toLowerCase();
    const type = (inputInfo.type || '').toLowerCase();
    
    // Enhanced matching patterns
    if (name.includes('first') || id.includes('first') || placeholder.includes('first')) return formData.firstName;
    if (name.includes('last') || id.includes('last') || placeholder.includes('last')) return formData.lastName;
    if (type === 'email' || name.includes('email') || id.includes('email')) return formData.email;
    if (type === 'tel' || name.includes('phone') || id.includes('phone') || placeholder.includes('phone')) return formData.phone;
    if (name.includes('address') || id.includes('address') || placeholder.includes('address')) return formData.address;
    if (name.includes('city') || id.includes('city')) return formData.city;
    if (name.includes('state') || id.includes('state')) return formData.state;
    if (name.includes('zip') || id.includes('zip') || name.includes('postal')) return formData.zip;
    if (name.includes('employer') || id.includes('employer')) return formData.employer;
    if (name.includes('occupation') || id.includes('occupation')) return formData.occupation;
    if (name.includes('amount') || id.includes('amount') || placeholder.includes('amount') || placeholder.includes('$')) return formData.amount;
    
    return null;
  }

  async smartFormSubmit(context) {
    
    try {
      // Look for submit buttons
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("Submit")',
        'button:has-text("Donate")',
        'button:has-text("Continue")',
        'button:has-text("Contribute")',
        '.submit-btn',
        '.donate-btn'
      ];
      
      for (const selector of submitSelectors) {
        try {
          const button = await this.page.$(selector);
          if (button) {
            const isVisible = await this.page.evaluate(el => el.offsetParent !== null, button);
            if (isVisible) {
              await button.click();
              
              // Wait for response/navigation
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              return { success: true, message: `${context}: Form submitted successfully` };
            }
          }
        } catch (error) {
          continue;
        }
      }
      
      return { success: false, message: `${context}: No submit button found` };
      
    } catch (error) {
      return { success: false, message: `${context}: Submission error: ${error.message}` };
    }
  }

  async runTestSuite(options = {}) {
    
    const { count = 3, testType = 'mixed' } = options;
    
    let testPersonas = [];
    
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
    
    
    for (let i = 0; i < testPersonas.length; i++) {
      const persona = testPersonas[i];
      await this.testPersonaOnBothForms(persona, i + 1, testPersonas.length);
      
      // Wait between personas
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    this.generateTestReport();
  }

  generateTestReport() {
    
    const totalPersonas = this.testResults.length;
    const totalTests = totalPersonas * 2; // 2 forms per persona
    
    let homepagePasses = 0;
    let modalPasses = 0;
    let bothFormsPasses = 0;
    
    this.testResults.forEach(result => {
      if (result.homepageForm?.success) homepagePasses++;
      if (result.modalForm?.success) modalPasses++;
      if (result.homepageForm?.success && result.modalForm?.success) bothFormsPasses++;
    });
    
    console.log(`\\n📋 FORM-SPECIFIC RESULTS:`);
    console.log(`Homepage Form Success: ${homepagePasses}/${totalPersonas} (${((homepagePasses/totalPersonas) * 100).toFixed(1)}%)`);
    console.log(`Modal Form Success: ${modalPasses}/${totalPersonas} (${((modalPasses/totalPersonas) * 100).toFixed(1)}%)`);
    console.log(`Both Forms Success: ${bothFormsPasses}/${totalPersonas} (${((bothFormsPasses/totalPersonas) * 100).toFixed(1)}%)`);
    
    console.log(`\\n📊 DETAILED RESULTS:`);
    this.testResults.forEach((result, index) => {
      const homeStatus = result.homepageForm?.success ? '✅' : '❌';
      const modalStatus = result.modalForm?.success ? '✅' : '❌';
      console.log(`${index + 1}. ${result.persona}: Homepage ${homeStatus} | Modal ${modalStatus}`);
    });
    
    // Save detailed report
    const reportPath = `test-results/dual-form-test-report-${Date.now()}.json`;
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
  const agent = new DualFormTestingAgent();
  
  try {
    await agent.initialize();
    
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

module.exports = DualFormTestingAgent;