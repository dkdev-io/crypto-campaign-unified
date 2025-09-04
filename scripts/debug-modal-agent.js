#!/usr/bin/env node

/**
 * Modal Diagnostic Agent
 * Deep inspection of donation form modal to fix automation blocking issues
 */

const puppeteer = require('puppeteer');

const BASE_URL = process.env.BASE_URL || 'https://testy-pink-chancellor.lovable.app';

class ModalDiagnosticAgent {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: false,
      slowMo: 1000,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1400, height: 900 },
    });

    this.page = await this.browser.newPage();
    this.page.setDefaultTimeout(30000);

    // Enable console logging from page
    this.page.on('console', (msg) => {});

    // Enable error logging
    this.page.on('pageerror', (err) => {
      console.log(`💥 PAGE ERROR: ${err.message}`);
    });
  }

  async inspectSite() {
    await this.page.goto(BASE_URL, { waitUntil: 'networkidle0' });

    // Screenshot initial state
    await this.page.screenshot({ path: 'debug-1-initial.png' });

    // Check for any existing forms on homepage
    const homepageForms = await this.page.evaluate(() => {
      const forms = document.querySelectorAll('form');
      const inputs = document.querySelectorAll('input');
      return {
        formCount: forms.length,
        inputCount: inputs.length,
        forms: Array.from(forms).map((form) => ({
          id: form.id,
          className: form.className,
          innerHTML: form.innerHTML.substring(0, 200),
        })),
        inputs: Array.from(inputs).map((input) => ({
          type: input.type,
          name: input.name,
          id: input.id,
          visible: input.offsetParent !== null,
        })),
      };
    });
  }

  async inspectDonateButton() {
    const donateButtons = await this.page.evaluate(() => {
      // Find all potential donate buttons
      const buttons = document.querySelectorAll('button, a, [role="button"]');
      const donateButtons = Array.from(buttons).filter(
        (btn) =>
          btn.textContent.toLowerCase().includes('donate') ||
          btn.getAttribute('href')?.includes('donate') ||
          btn.className.includes('donate')
      );

      return donateButtons.map((btn) => ({
        tagName: btn.tagName,
        text: btn.textContent.trim(),
        href: btn.href,
        id: btn.id,
        className: btn.className,
        onclick: btn.onclick ? btn.onclick.toString() : null,
        visible: btn.offsetParent !== null,
        rect: btn.getBoundingClientRect(),
      }));
    });

    if (donateButtons.length === 0) {
      console.log('❌ NO DONATE BUTTONS FOUND!');
      return false;
    }

    return donateButtons;
  }

  async clickDonateAndInspectModal() {
    const donateButtons = await this.inspectDonateButton();
    if (!donateButtons || donateButtons.length === 0) return;

    // Click the first visible donate button
    const visibleButton = donateButtons.find((btn) => btn.visible);
    if (!visibleButton) {
      console.log('❌ No visible donate buttons found');
      return;
    }

    // Wait for any modals to appear and take screenshot before click
    await this.page.screenshot({ path: 'debug-2-before-click.png' });

    // Click the donate button
    await this.page.evaluate(() => {
      const donateBtn = Array.from(document.querySelectorAll('button')).find((btn) =>
        btn.textContent.includes('Donate')
      );
      if (donateBtn) donateBtn.click();
    });

    // Wait a moment for modal to appear
    await this.page.waitForTimeout(3000);

    // Take screenshot after click
    await this.page.screenshot({ path: 'debug-3-after-click.png' });

    // Deep modal inspection
    const modalAnalysis = await this.page.evaluate(() => {
      const results = {
        modals: [],
        dialogs: [],
        overlays: [],
        forms: [],
        inputs: [],
        allElements: [],
      };

      // Check for modal containers
      const modalSelectors = [
        '[role="dialog"]',
        '.modal',
        '.Modal',
        '[data-modal]',
        '.dialog',
        '.Dialog',
        '.overlay',
        '.popup',
        '.lightbox',
      ];

      modalSelectors.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
          results.modals.push({
            selector,
            id: el.id,
            className: el.className,
            visible: el.offsetParent !== null,
            display: getComputedStyle(el).display,
            opacity: getComputedStyle(el).opacity,
            zIndex: getComputedStyle(el).zIndex,
            innerHTML: el.innerHTML.substring(0, 500),
          });
        });
      });

      // Check for forms within any container
      const allForms = document.querySelectorAll('form');
      allForms.forEach((form) => {
        const formInputs = form.querySelectorAll('input, select, textarea');
        results.forms.push({
          id: form.id,
          className: form.className,
          visible: form.offsetParent !== null,
          display: getComputedStyle(form).display,
          opacity: getComputedStyle(form).opacity,
          inputCount: formInputs.length,
          inputs: Array.from(formInputs).map((input) => ({
            type: input.type,
            name: input.name,
            id: input.id,
            visible: input.offsetParent !== null,
            display: getComputedStyle(input).display,
            opacity: getComputedStyle(input).opacity,
          })),
        });
      });

      // Check all inputs regardless of form
      const allInputs = document.querySelectorAll('input, select, textarea');
      allInputs.forEach((input) => {
        results.inputs.push({
          type: input.type,
          name: input.name,
          id: input.id,
          placeholder: input.placeholder,
          visible: input.offsetParent !== null,
          display: getComputedStyle(input).display,
          opacity: getComputedStyle(input).opacity,
          parentTag: input.parentElement?.tagName,
          parentClass: input.parentElement?.className,
        });
      });

      return results;
    });

    console.log('\n🎭 MODAL ANALYSIS RESULTS:');

    if (modalAnalysis.modals.length > 0) {
      modalAnalysis.modals.forEach((modal, i) => {});
    }

    if (modalAnalysis.forms.length > 0) {
      modalAnalysis.forms.forEach((form, i) => {});
    }

    if (modalAnalysis.inputs.length > 0) {
      modalAnalysis.inputs.forEach((input, i) => {});
    } else {
      console.log('❌ NO INPUTS FOUND AT ALL!');
    }

    return modalAnalysis;
  }

  async testAlternativeSelectors() {
    const selectorTests = [
      // Standard form selectors
      'form input',
      'form input[type="text"]',
      'form input[type="email"]',

      // Modal-specific selectors
      '[role="dialog"] input',
      '.modal input',
      '.Modal input',

      // Generic input searches
      'input[name*="name"]',
      'input[name*="email"]',
      'input[name*="amount"]',

      // Placeholder-based searches
      'input[placeholder*="Name"]',
      'input[placeholder*="Email"]',
      'input[placeholder*="Amount"]',

      // Class-based searches
      'input.form-control',
      'input.input',
      '.form-field input',

      // React/modern framework selectors
      '[data-testid*="input"]',
      '[data-cy*="input"]',
      'input[data-*]',
    ];

    const results = {};

    for (const selector of selectorTests) {
      try {
        const elements = await this.page.$$(selector);
        results[selector] = {
          count: elements.length,
          success: elements.length > 0,
        };

        if (elements.length > 0) {
        }
      } catch (error) {
        results[selector] = {
          count: 0,
          error: error.message,
        };
      }
    }

    const successfulSelectors = Object.entries(results)
      .filter(([_, result]) => result.success)
      .map(([selector, _]) => selector);

    console.log(`\n🎯 WORKING SELECTORS (${successfulSelectors.length}):`);

    return successfulSelectors;
  }

  async generateFixedSelectors(workingSelectors) {
    if (workingSelectors.length === 0) {
      console.log('❌ No working selectors found! Manual inspection required.');
      return null;
    }

    const fixedCode = `
// FIXED FORM SELECTORS - Generated by Diagnostic Agent
const WORKING_SELECTORS = ${JSON.stringify(workingSelectors, null, 2)};

// Updated form detection function
async function findFormInputs(page) {
  for (const selector of WORKING_SELECTORS) {
    try {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        return { selector, elements };
      }
    } catch (error) {
    }
  }
  return null;
}

// Updated form filling function
async function fillFormFields(page, persona) {
  const formResult = await findFormInputs(page);
  if (!formResult) {
    throw new Error('No form inputs found with any selector');
  }
  
  // Use the working selector for form operations
  const baseSelector = formResult.selector.replace(' input', '');
  
  // Fill form fields using working selectors
  await fillField(page, \`\${baseSelector} input[name*="name"], \${baseSelector} input[placeholder*="First"]\`, persona.first_name);
  await fillField(page, \`\${baseSelector} input[name*="email"]\`, \`\${persona.first_name.toLowerCase()}@test.com\`);
  // ... etc
}
`;

    return fixedCode;
  }

  async runFullDiagnostic() {
    try {
      await this.initialize();
      await this.inspectSite();
      await this.inspectDonateButton();
      const modalAnalysis = await this.clickDonateAndInspectModal();
      const workingSelectors = await this.testAlternativeSelectors();
      const fixedCode = await this.generateFixedSelectors(workingSelectors);

      return {
        modalAnalysis,
        workingSelectors,
        fixedCode,
      };
    } catch (error) {
      console.error('💥 Diagnostic failed:', error);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Run diagnostic
async function main() {
  const agent = new ModalDiagnosticAgent();
  await agent.runFullDiagnostic();
}

if (require.main === module) {
  main();
}

module.exports = ModalDiagnosticAgent;
