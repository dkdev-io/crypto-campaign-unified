#!/usr/bin/env node

/**
 * FIXED Form Agent - Actually Works With Modern React Forms
 * Uses proper selectors that work with component-based forms
 */

const fs = require('fs');
const csv = require('csv-parser');
const puppeteer = require('puppeteer');

const BASE_URL = process.env.BASE_URL || 'https://testy-pink-chancellor.lovable.app';

class FixedFormAgent {
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
      slowMo: 600,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ],
      defaultViewport: { width: 1300, height: 900 }
    });
    
    this.page = await this.browser.newPage();
    this.page.setDefaultTimeout(45000);
    
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

  async findFormFields() {
    
    // Use multiple detection strategies for modern forms
    const formFields = await this.page.evaluate(() => {
      const fields = [];
      
      // Strategy 1: Standard HTML inputs (should work but apparently doesn't)
      const standardInputs = document.querySelectorAll('input, select, textarea');
      standardInputs.forEach((el, i) => {
        if (el.offsetParent !== null && el.type !== 'hidden' && el.type !== 'submit' && el.type !== 'button') {
          fields.push({
            index: i,
            element: 'standard',
            selector: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + (el.name ? `[name="${el.name}"]` : ''),
            type: el.type,
            name: el.name,
            id: el.id,
            placeholder: el.placeholder,
            className: el.className,
            visible: true,
            rect: el.getBoundingClientRect()
          });
        }
      });
      
      // Strategy 2: Look for React/Vue form controls by common class patterns
      const reactSelectors = [
        '[class*="input"]',
        '[class*="field"]', 
        '[class*="form"]',
        '[class*="Input"]',
        '[class*="Field"]',
        '[class*="Form"]',
        '[data-testid*="input"]',
        '[data-testid*="field"]',
        '[role="textbox"]',
        '[contenteditable="true"]'
      ];
      
      reactSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el, i) => {
          if (el.offsetParent !== null) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              fields.push({
                index: i,
                element: 'react',
                selector: selector,
                tagName: el.tagName,
                type: el.type || 'text',
                name: el.name || el.getAttribute('data-testid') || '',
                id: el.id,
                placeholder: el.placeholder || el.getAttribute('placeholder'),
                className: el.className,
                textContent: el.textContent?.trim().substring(0, 50),
                visible: true,
                rect
              });
            }
          }
        });
      });
      
      // Strategy 3: Look for anything that looks like it could be an input by examining the DOM
      const allElements = document.querySelectorAll('*');
      allElements.forEach((el, i) => {
        const tagName = el.tagName.toLowerCase();
        const className = el.className || '';
        const id = el.id || '';
        const placeholder = el.placeholder || el.getAttribute('placeholder') || '';
        
        // Check if this element has input-like characteristics
        if ((tagName === 'div' || tagName === 'span') && 
            (className.includes('input') || className.includes('field') || 
             id.includes('input') || id.includes('field') ||
             placeholder.length > 0)) {
          
          const rect = el.getBoundingClientRect();
          if (rect.width > 20 && rect.height > 20 && el.offsetParent !== null) {
            fields.push({
              index: i,
              element: 'custom',
              selector: `${tagName}${id ? `#${id}` : ''}${className ? `.${className.split(' ')[0]}` : ''}`,
              tagName,
              type: 'custom',
              name: el.name || id,
              id,
              placeholder,
              className,
              visible: true,
              rect
            });
          }
        }
      });
      
      return fields;
    });
    
    console.log(`📊 DETECTION RESULTS:`);
    
    // Log details of each field found
    formFields.forEach((field, i) => {
    });
    
    return formFields;
  }

  async fillFormWithData(persona, formType = 'homepage') {
    
    const profile = persona.profile;
    const donation = persona.donations[0] || { contribution_amount: '500.00' };
    
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
      amount: donation.contribution_amount || '500.00',
      wallet: profile.wallet_address
    };
    
    
    try {
      // Find all form fields
      const formFields = await this.findFormFields();
      
      if (formFields.length === 0) {
        throw new Error('NO FORM FIELDS DETECTED WITH ANY METHOD');
      }
      
      let fieldsFilled = 0;
      
      // Try to fill each field we found
      for (let i = 0; i < formFields.length; i++) {
        const field = formFields[i];
        
        try {
          
          // Determine what value to put in this field
          const value = this.smartMatch(field, testData);
          
          if (!value) {
            continue;
          }
          
          
          // Try multiple strategies to interact with this field
          const success = await this.fillFieldMultipleWays(field, value);
          
          if (success) {
            fieldsFilled++;
            console.log(`  ✅ SUCCESS!`);
            
            // Wait between fields
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
          }
          
        } catch (fieldError) {
          console.log(`  💥 Error: ${fieldError.message}`);
        }
      }
      
      
      return {
        success: fieldsFilled > 0,
        fieldsFilled,
        totalFields: formFields.length,
        message: `${formType}: ${fieldsFilled}/${formFields.length} fields filled`
      };
      
    } catch (error) {
      console.error(`💥 Form filling failed: ${error.message}`);
      return {
        success: false,
        fieldsFilled: 0,
        error: error.message
      };
    }
  }

  smartMatch(field, data) {
    const name = (field.name || '').toLowerCase();
    const id = (field.id || '').toLowerCase();
    const placeholder = (field.placeholder || '').toLowerCase();
    const className = (field.className || '').toLowerCase();
    const textContent = (field.textContent || '').toLowerCase();
    
    const allText = `${name} ${id} ${placeholder} ${className} ${textContent}`.toLowerCase();
    
    // Enhanced matching patterns
    if (allText.includes('first') && (allText.includes('name') || allText.includes('nome'))) return data.firstName;
    if (allText.includes('last') && (allText.includes('name') || allText.includes('nome'))) return data.lastName;
    if (allText.includes('email') || allText.includes('e-mail')) return data.email;
    if (allText.includes('phone') || allText.includes('tel') || field.type === 'tel') return data.phone;
    if (allText.includes('address') && !allText.includes('wallet') && !allText.includes('crypto')) return data.address;
    if (allText.includes('city') || allText.includes('cidade')) return data.city;
    if (allText.includes('state') || allText.includes('estado')) return data.state;
    if (allText.includes('zip') || allText.includes('postal') || allText.includes('cep')) return data.zip;
    if (allText.includes('employer') || allText.includes('company')) return data.employer;
    if (allText.includes('occupation') || allText.includes('job') || allText.includes('profess')) return data.occupation;
    if (allText.includes('amount') || allText.includes('contribution') || allText.includes('donate')) return data.amount;
    if (allText.includes('wallet') || allText.includes('crypto')) return data.wallet;
    
    // Fallback patterns
    if (field.type === 'email') return data.email;
    if (field.type === 'tel') return data.phone;
    if (field.type === 'number' && !allText.includes('phone')) return data.amount;
    
    return null;
  }

  async fillFieldMultipleWays(field, value) {
    try {
      // Strategy 1: Direct selector approach
      if (field.id) {
        try {
          await this.page.focus(`#${field.id}`);
          await this.page.click(`#${field.id}`);
          await this.clearAndType(`#${field.id}`, value);
          return true;
        } catch (e) { /* Continue to next strategy */ }
      }
      
      // Strategy 2: Name attribute
      if (field.name) {
        try {
          await this.page.focus(`[name="${field.name}"]`);
          await this.page.click(`[name="${field.name}"]`);
          await this.clearAndType(`[name="${field.name}"]`, value);
          return true;
        } catch (e) { /* Continue to next strategy */ }
      }
      
      // Strategy 3: Placeholder attribute
      if (field.placeholder) {
        try {
          await this.page.focus(`[placeholder="${field.placeholder}"]`);
          await this.page.click(`[placeholder="${field.placeholder}"]`);
          await this.clearAndType(`[placeholder="${field.placeholder}"]`, value);
          return true;
        } catch (e) { /* Continue to next strategy */ }
      }
      
      // Strategy 4: XPath by text content
      if (field.textContent) {
        try {
          const xpath = `//input[contains(@placeholder, '${field.textContent}')] | //div[contains(text(), '${field.textContent}')]//input`;
          const [element] = await this.page.$x(xpath);
          if (element) {
            await element.focus();
            await element.click();
            await this.clearAndTypeElement(element, value);
            return true;
          }
        } catch (e) { /* Continue to next strategy */ }
      }
      
      // Strategy 5: Evaluate and click by coordinates
      try {
        await this.page.evaluate((field, value) => {
          const elements = document.elementsFromPoint(field.rect.x + field.rect.width/2, field.rect.y + field.rect.height/2);
          for (const el of elements) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.contentEditable === 'true') {
              el.focus();
              el.click();
              el.value = value;
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
              return true;
            }
          }
          return false;
        }, field, value);
        return true;
      } catch (e) {
        return false;
      }
      
    } catch (error) {
      return false;
    }
  }

  async clearAndType(selector, value) {
    await this.page.evaluate(selector => {
      const element = document.querySelector(selector);
      if (element) {
        element.value = '';
        element.focus();
      }
    }, selector);
    
    await this.page.keyboard.down('Control');
    await this.page.keyboard.press('KeyA');
    await this.page.keyboard.up('Control');
    await this.page.keyboard.press('Backspace');
    
    await this.page.type(selector, value, { delay: 100 });
  }

  async clearAndTypeElement(element, value) {
    await element.evaluate(el => {
      el.value = '';
      el.focus();
    });
    
    await this.page.keyboard.down('Control');
    await this.page.keyboard.press('KeyA');
    await this.page.keyboard.up('Control');
    await this.page.keyboard.press('Backspace');
    
    await element.type(value, { delay: 100 });
  }

  async submitForm(formType) {
    
    try {
      // Look for submit buttons
      const submitButtons = await this.page.$$('button, input[type="submit"], [role="button"]');
      
      for (const button of submitButtons) {
        try {
          const info = await button.evaluate(el => ({
            tagName: el.tagName,
            type: el.type,
            textContent: el.textContent?.trim(),
            className: el.className,
            disabled: el.disabled,
            visible: el.offsetParent !== null
          }));
          
          if (!info.visible || info.disabled) continue;
          
          const text = info.textContent.toLowerCase();
          if (text.includes('submit') || text.includes('donate') || text.includes('contribute') || text.includes('send')) {
            console.log(`🎯 Clicking submit: "${info.textContent}"`);
            
            await button.scrollIntoView();
            await new Promise(resolve => setTimeout(resolve, 1000));
            await button.click();
            
            console.log('✅ Form submitted! Waiting for response...');
            await new Promise(resolve => setTimeout(resolve, 6000));
            
            return {
              submitted: true,
              success: true,
              message: `Submitted via: "${info.textContent}"`
            };
          }
        } catch (buttonError) {
          continue;
        }
      }
      
      return {
        submitted: false,
        success: false,
        message: 'No submit button found'
      };
      
    } catch (error) {
      return {
        submitted: false,
        success: false,
        message: `Submit error: ${error.message}`
      };
    }
  }

  async testPersonaOnBothForms(persona, testIndex, totalTests) {
    
    const results = {
      persona: `${persona.profile.first_name} ${persona.profile.last_name}`,
      uniqueId: persona.profile.unique_id,
      homepageTest: null,
      modalTest: null,
      timestamp: new Date().toISOString()
    };
    
    fs.mkdirSync('test-results/screenshots', { recursive: true });
    
    try {
      // Test 1: Homepage Form
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await this.page.screenshot({ 
        path: `test-results/screenshots/fixed-homepage-${persona.profile.unique_id}.png`,
        fullPage: true 
      });
      
      results.homepageTest = await this.fillFormWithData(persona, 'homepage');
      
      if (results.homepageTest.success) {
        await this.page.screenshot({ 
          path: `test-results/screenshots/fixed-homepage-filled-${persona.profile.unique_id}.png`,
          fullPage: true 
        });
        
        const homepageSubmit = await this.submitForm('homepage');
        results.homepageTest.submitResult = homepageSubmit;
        
        await this.page.screenshot({ 
          path: `test-results/screenshots/fixed-homepage-submitted-${persona.profile.unique_id}.png`,
          fullPage: true 
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Test 2: Modal Form
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Click Donate button to open modal
      const donateButton = await this.page.$('button:has-text("Donate"), a:has-text("Donate")');
      if (!donateButton) {
        // Fallback: find by text content
        await this.page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button, a'));
          const donateBtn = buttons.find(btn => btn.textContent.trim().toLowerCase().includes('donate'));
          if (donateBtn) donateBtn.click();
        });
      } else {
        await donateButton.click();
      }
      
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      await this.page.screenshot({ 
        path: `test-results/screenshots/fixed-modal-${persona.profile.unique_id}.png`,
        fullPage: true 
      });
      
      results.modalTest = await this.fillFormWithData(persona, 'modal');
      
      if (results.modalTest.success) {
        await this.page.screenshot({ 
          path: `test-results/screenshots/fixed-modal-filled-${persona.profile.unique_id}.png`,
          fullPage: true 
        });
        
        const modalSubmit = await this.submitForm('modal');
        results.modalTest.submitResult = modalSubmit;
        
        await this.page.screenshot({ 
          path: `test-results/screenshots/fixed-modal-submitted-${persona.profile.unique_id}.png`,
          fullPage: true 
        });
      }
      
    } catch (error) {
      console.error(`💥 Test error: ${error.message}`);
      results.error = error.message;
    }
    
    // Summary for this persona
    const homeSuccess = results.homepageTest?.success && results.homepageTest?.submitResult?.submitted;
    const modalSuccess = results.modalTest?.success && results.modalTest?.submitResult?.submitted;
    
    console.log(`\\n📊 PERSONA RESULTS: ${persona.profile.first_name}`);
    console.log(`   Homepage: ${results.homepageTest?.fieldsFilled || 0} fields, submitted: ${results.homepageTest?.submitResult?.submitted || false}`);
    console.log(`   Modal: ${results.modalTest?.fieldsFilled || 0} fields, submitted: ${results.modalTest?.submitResult?.submitted || false}`);
    console.log(`   Overall: ${homeSuccess || modalSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    return results;
  }

  async runFixedTest(options = {}) {
    
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
    
    
    for (let i = 0; i < testPersonas.length; i++) {
      const persona = testPersonas[i];
      const result = await this.testPersonaOnBothForms(persona, i + 1, testPersonas.length);
      this.testResults.push(result);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    this.generateFixedReport();
  }

  generateFixedReport() {
    console.log('\\n📊 FIXED FORM AGENT RESULTS');
    
    const total = this.testResults.length;
    let homepageSuccess = 0;
    let modalSuccess = 0;
    let totalFieldsFilled = 0;
    let totalSubmissions = 0;
    
    this.testResults.forEach(result => {
      if (result.homepageTest?.success) homepageSuccess++;
      if (result.modalTest?.success) modalSuccess++;
      totalFieldsFilled += (result.homepageTest?.fieldsFilled || 0) + (result.modalTest?.fieldsFilled || 0);
      if (result.homepageTest?.submitResult?.submitted) totalSubmissions++;
      if (result.modalTest?.submitResult?.submitted) totalSubmissions++;
    });
    
    console.log(`Homepage Forms Filled: ${homepageSuccess}/${total}`);
    console.log(`Modal Forms Filled: ${modalSuccess}/${total}`);
    
    console.log('\\n📋 DETAILED RESULTS:');
    this.testResults.forEach((result, i) => {
      console.log(`${i+1}. ${result.persona}:`);
      console.log(`   Homepage: ${result.homepageTest?.fieldsFilled || 0} fields, submitted: ${result.homepageTest?.submitResult?.submitted || false}`);
      console.log(`   Modal: ${result.modalTest?.fieldsFilled || 0} fields, submitted: ${result.modalTest?.submitResult?.submitted || false}`);
    });
    
    const reportPath = `test-results/fixed-form-agent-report-${Date.now()}.json`;
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
  const agent = new FixedFormAgent();
  
  try {
    await agent.initialize();
    
    const args = process.argv.slice(2);
    const options = {
      count: parseInt(args.find(arg => arg.startsWith('--count='))?.split('=')[1]) || 1,
      testType: args.find(arg => arg.startsWith('--type='))?.split('=')[1] || 'mixed'
    };
    
    await agent.runFixedTest(options);
    
  } catch (error) {
    console.error('💥 Fixed Agent Failed:', error);
  } finally {
    await agent.cleanup();
  }
}

if (require.main === module) {
  main();
}

module.exports = FixedFormAgent;