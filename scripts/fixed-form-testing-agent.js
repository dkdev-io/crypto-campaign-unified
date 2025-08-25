#!/usr/bin/env node

/**
 * FIXED Form Testing Agent
 * Updated with proper navigation settings and robust form detection
 */

const fs = require('fs');
const csv = require('csv-parser');
const puppeteer = require('puppeteer');

const BASE_URL = process.env.BASE_URL || 'https://testy-pink-chancellor.lovable.app';

class FixedFormTestingAgent {
  constructor() {
    this.prospects = [];
    this.donors = [];
    this.testResults = [];
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    console.log('🚀 FIXED Form Testing Agent - Navigation & Selector Issues Resolved');
    
    await this.loadCSVData();
    
    this.browser = await puppeteer.launch({ 
      headless: false, 
      slowMo: 500,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ],
      defaultViewport: { width: 1400, height: 900 }
    });
    
    this.page = await this.browser.newPage();
    
    // Extended timeouts for slow sites
    this.page.setDefaultTimeout(60000);
    this.page.setDefaultNavigationTimeout(60000);
    
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

  async navigateToSite() {
    
    try {
      // Use domcontentloaded instead of networkidle for faster loading
      await this.page.goto(BASE_URL, { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 
      });
      
      // Wait for any dynamic content to settle
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('✅ Site loaded successfully');
      return true;
      
    } catch (error) {
      console.error(`❌ Navigation failed: ${error.message}`);
      return false;
    }
  }

  async findAndClickDonateButton() {
    
    // Multiple strategies to find donate button
    const strategies = [
      // Strategy 1: Direct text search
      () => this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));
        const donateBtn = buttons.find(btn => 
          btn.textContent.toLowerCase().includes('donate') ||
          btn.innerHTML.toLowerCase().includes('donate')
        );
        if (donateBtn) {
          donateBtn.click();
          return true;
        }
        return false;
      }),
      
      // Strategy 2: Class/ID based
      () => this.page.click('button[class*="donate"], a[class*="donate"], #donate-btn').then(() => true).catch(() => false),
      
      // Strategy 3: XPath
      () => this.page.$x("//button[contains(text(), 'Donate')] | //a[contains(text(), 'Donate')]")
        .then(elements => {
          if (elements.length > 0) {
            elements[0].click();
            return true;
          }
          return false;
        }).catch(() => false)
    ];
    
    for (let i = 0; i < strategies.length; i++) {
      try {
        const success = await strategies[i]();
        if (success) {
          return true;
        }
      } catch (error) {
        console.log(`Strategy ${i + 1} failed:`, error.message);
      }
    }
    
    console.log('❌ No donate button found with any strategy');
    return false;
  }

  async waitForModal() {
    
    // Wait for modal indicators
    const modalSelectors = [
      '[role="dialog"]',
      '.modal',
      '.Modal',
      '[data-modal]',
      '.dialog',
      '.popup',
      'form[class*="modal"]',
      '[class*="overlay"]'
    ];
    
    const maxAttempts = 15;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      
      const modalFound = await this.page.evaluate((selectors) => {
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            const visibleModal = Array.from(elements).find(el => 
              el.offsetParent !== null && 
              getComputedStyle(el).display !== 'none' &&
              getComputedStyle(el).visibility !== 'hidden'
            );
            if (visibleModal) return selector;
          }
        }
        return null;
      }, modalSelectors);
      
      if (modalFound) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Let it fully load
        return modalFound;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('❌ No modal appeared after 15 attempts');
    return null;
  }

  async findFormInputs() {
    
    const inputAnalysis = await this.page.evaluate(() => {
      const results = {
        allInputs: [],
        visibleInputs: [],
        strategies: {}
      };
      
      // Strategy 1: All inputs
      const allInputs = document.querySelectorAll('input, select, textarea');
      results.allInputs = Array.from(allInputs).map(input => ({
        type: input.type,
        name: input.name,
        id: input.id,
        placeholder: input.placeholder,
        visible: input.offsetParent !== null,
        display: getComputedStyle(input).display,
        opacity: getComputedStyle(input).opacity
      }));
      
      // Strategy 2: Visible inputs only
      results.visibleInputs = results.allInputs.filter(input => input.visible);
      
      // Strategy 3: Different selector strategies
      const strategies = [
        'input',
        'form input',
        '[role="dialog"] input',
        '.modal input',
        'input[type="text"]',
        'input[type="email"]',
        'input[name*="name"]',
        'input[placeholder*="name"]'
      ];
      
      strategies.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          results.strategies[selector] = {
            total: elements.length,
            visible: Array.from(elements).filter(el => el.offsetParent !== null).length
          };
        } catch (error) {
          results.strategies[selector] = { error: error.message };
        }
      });
      
      return results;
    });
    
    console.log('📊 Input Analysis:');
    
    if (inputAnalysis.visibleInputs.length === 0) {
      Object.entries(inputAnalysis.strategies).forEach(([selector, result]) => {
        if (result.error) {
          console.log(`❌ ${selector}: Error - ${result.error}`);
        } else {
          console.log(`📋 ${selector}: ${result.total} total, ${result.visible} visible`);
        }
      });
      
      inputAnalysis.allInputs.forEach((input, i) => {
      });
    }
    
    return inputAnalysis;
  }

  async testFormInteraction(persona) {
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
      // Step 1: Navigate to site
      testResult.steps.navigation = await this.navigateToSite();
      if (!testResult.steps.navigation) {
        throw new Error('Site navigation failed');
      }
      
      // Step 2: Find and click donate button
      testResult.steps.donateButtonClick = await this.findAndClickDonateButton();
      if (!testResult.steps.donateButtonClick) {
        throw new Error('Donate button not found or click failed');
      }
      
      // Step 3: Wait for modal
      testResult.steps.modalSelector = await this.waitForModal();
      if (!testResult.steps.modalSelector) {
        throw new Error('Modal did not appear');
      }
      
      // Step 4: Find form inputs
      testResult.steps.inputAnalysis = await this.findFormInputs();
      
      if (testResult.steps.inputAnalysis.visibleInputs.length > 0) {
        console.log(`✅ SUCCESS: Found ${testResult.steps.inputAnalysis.visibleInputs.length} visible form inputs!`);
        testResult.success = true;
        
        // TODO: Implement actual form filling here
        console.log('🚀 Ready for form filling implementation');
      } else {
        console.log('❌ No visible form inputs found');
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

  async runDiagnosticTests(count = 1) {
    
    const testPersonas = this.prospects
      .slice(0, count)
      .map(p => this.getPersonaById(p.unique_id));
    
    for (let i = 0; i < testPersonas.length; i++) {
      
      const result = await this.testFormInteraction(testPersonas[i]);
      this.testResults.push(result);
      
      // Add delay between tests
      if (i < testPersonas.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    this.generateDiagnosticReport();
  }

  generateDiagnosticReport() {
    
    const successful = this.testResults.filter(r => r.success);
    const failed = this.testResults.filter(r => !r.success);
    
    console.log(`✅ Successful tests: ${successful.length}`);
    console.log(`📈 Success rate: ${((successful.length / this.testResults.length) * 100).toFixed(1)}%`);
    
    if (successful.length > 0) {
      console.log('\n🎉 SUCCESS CASES:');
      successful.forEach(result => {
        console.log(`✅ ${result.persona}: Found ${result.steps.inputAnalysis?.visibleInputs?.length || 0} inputs`);
      });
    }
    
    if (failed.length > 0) {
      failed.forEach(result => {
        console.log(`❌ ${result.persona}: ${result.error}`);
        console.log(`   Steps completed:`, Object.entries(result.steps)
          .map(([step, success]) => `${step}:${success ? '✅' : '❌'}`)
          .join(', ')
        );
      });
    }
    
    // Save report
    const reportPath = `test-results/diagnostic-report-${Date.now()}.json`;
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
  const agent = new FixedFormTestingAgent();
  
  try {
    await agent.initialize();
    
    // Run diagnostic test first
    await agent.runDiagnosticTests(1);
    
    
  } catch (error) {
    console.error('💥 Agent initialization failed:', error);
  } finally {
    await agent.cleanup();
  }
}

if (require.main === module) {
  main();
}

module.exports = FixedFormTestingAgent;