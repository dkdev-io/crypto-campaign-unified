/**
 * End-to-End Integration Testing Script
 * Tests complete user journeys through the crypto campaign platform
 */

import puppeteer from 'puppeteer';
import { expect } from 'chai';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = 'http://localhost:5176';
const TEST_TIMEOUT = 60000; // 60 seconds per test

class IntegrationTester {
  constructor() {
    this.results = {
      newUserJourney: [],
      adminJourney: [],
      returningUserJourney: [],
      criticalChecks: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        critical: []
      }
    };
  }

  async setup() {
    this.browser = await puppeteer.launch({
      headless: false,
      slowMo: 100,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Set up console log capture
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.logResult('Console Error', false, msg.text(), 'CRITICAL');
      }
    });
    
    // Set up error capture
    this.page.on('pageerror', error => {
      this.logResult('Page Error', false, error.message, 'CRITICAL');
    });
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  logResult(testName, passed, details = '', severity = 'MEDIUM') {
    const result = {
      test: testName,
      passed,
      details,
      severity,
      timestamp: new Date().toISOString()
    };
    
    this.results.summary.totalTests++;
    if (passed) {
      this.results.summary.passed++;
    } else {
      this.results.summary.failed++;
      if (severity === 'CRITICAL') {
        this.results.summary.critical.push(testName);
      }
    }
    
    return result;
  }

  async testNewUserJourney() {
    console.log('\n🧪 Testing New User Journey...\n');
    const journey = [];

    try {
      // 1. Land on homepage
      console.log('  1. Landing on homepage...');
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle2' });
      journey.push(this.logResult('Homepage Load', true));

      // Check for hero section
      const heroExists = await this.page.$('.hero-section') !== null;
      journey.push(this.logResult('Hero Section Visible', heroExists));

      // 2. Navigate to signup
      console.log('  2. Navigating to signup...');
      const signupButton = await this.page.$('a[href="/signup"], button:has-text("Sign Up")');
      if (signupButton) {
        await signupButton.click();
        await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
        journey.push(this.logResult('Navigate to Signup', true));
      } else {
        journey.push(this.logResult('Navigate to Signup', false, 'Signup button not found', 'HIGH'));
      }

      // 3. Fill signup form
      console.log('  3. Filling signup form...');
      const timestamp = Date.now();
      const testEmail = `testuser${timestamp}@test.com`;
      
      await this.page.type('input[name="email"], input[type="email"]', testEmail);
      await this.page.type('input[name="password"], input[type="password"]', 'TestPass123!');
      await this.page.type('input[name="confirmPassword"], input[placeholder*="confirm" i]', 'TestPass123!');
      
      journey.push(this.logResult('Fill Signup Form', true));

      // 4. Submit signup
      console.log('  4. Submitting signup...');
      const submitButton = await this.page.$('button[type="submit"], button:has-text("Sign Up")');
      if (submitButton) {
        await submitButton.click();
        await this.page.waitForTimeout(3000);
        journey.push(this.logResult('Submit Signup', true));
      } else {
        journey.push(this.logResult('Submit Signup', false, 'Submit button not found', 'HIGH'));
      }

      // 5. Check for KYC flow
      console.log('  5. Checking KYC flow...');
      await this.page.waitForTimeout(2000);
      const kycForm = await this.page.$('.kyc-form, form[class*="kyc"]');
      if (kycForm) {
        journey.push(this.logResult('KYC Form Displayed', true));
        
        // Fill mock KYC data
        await this.page.type('input[name="firstName"], input[placeholder*="first" i]', 'Test');
        await this.page.type('input[name="lastName"], input[placeholder*="last" i]', 'User');
        await this.page.type('input[name="dateOfBirth"], input[type="date"]', '01/01/1990');
        
        const kycSubmit = await this.page.$('button:has-text("Submit KYC"), button:has-text("Complete")');
        if (kycSubmit) {
          await kycSubmit.click();
          await this.page.waitForTimeout(2000);
        }
      } else {
        journey.push(this.logResult('KYC Form Displayed', false, 'KYC form not found', 'MEDIUM'));
      }

      // 6. Browse campaigns
      console.log('  6. Browsing campaigns...');
      await this.page.goto(`${BASE_URL}/campaigns`, { waitUntil: 'networkidle2' });
      const campaignCards = await this.page.$$('.campaign-card, .campaign-item');
      journey.push(this.logResult('Campaign List Displayed', campaignCards.length > 0, 
        `Found ${campaignCards.length} campaigns`));

      // 7. Make a contribution
      console.log('  7. Making a contribution...');
      if (campaignCards.length > 0) {
        await campaignCards[0].click();
        await this.page.waitForTimeout(2000);
        
        const contributeButton = await this.page.$('button:has-text("Contribute"), button:has-text("Donate")');
        if (contributeButton) {
          await contributeButton.click();
          await this.page.waitForTimeout(1000);
          
          // Fill contribution amount
          await this.page.type('input[name="amount"], input[type="number"]', '0.1');
          
          const confirmButton = await this.page.$('button:has-text("Confirm"), button:has-text("Submit")');
          if (confirmButton) {
            await confirmButton.click();
            journey.push(this.logResult('Make Contribution', true));
          }
        } else {
          journey.push(this.logResult('Make Contribution', false, 'Contribute button not found', 'HIGH'));
        }
      }

      // 8. View contribution history
      console.log('  8. Viewing contribution history...');
      await this.page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle2' });
      const historySection = await this.page.$('.contribution-history, .transaction-history');
      journey.push(this.logResult('Contribution History', historySection !== null));

    } catch (error) {
      journey.push(this.logResult('New User Journey', false, error.message, 'CRITICAL'));
    }

    this.results.newUserJourney = journey;
    return journey;
  }

  async testAdminJourney() {
    console.log('\n🧪 Testing Admin Journey...\n');
    const journey = [];

    try {
      // 1. Login as admin
      console.log('  1. Logging in as admin...');
      await this.page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
      
      await this.page.type('input[name="email"], input[type="email"]', 'admin@crypto-campaign.com');
      await this.page.type('input[name="password"], input[type="password"]', 'AdminPass123!');
      
      const loginButton = await this.page.$('button[type="submit"], button:has-text("Login")');
      if (loginButton) {
        await loginButton.click();
        await this.page.waitForTimeout(3000);
        journey.push(this.logResult('Admin Login', true));
      } else {
        journey.push(this.logResult('Admin Login', false, 'Login button not found', 'HIGH'));
      }

      // 2. View admin dashboard
      console.log('  2. Viewing admin dashboard...');
      await this.page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle2' });
      const dashboard = await this.page.$('.admin-dashboard, .dashboard');
      journey.push(this.logResult('Admin Dashboard Access', dashboard !== null));

      // 3. Create new campaign
      console.log('  3. Creating new campaign...');
      const createCampaignButton = await this.page.$('button:has-text("Create Campaign"), a[href*="create"]');
      if (createCampaignButton) {
        await createCampaignButton.click();
        await this.page.waitForTimeout(2000);
        
        // Fill campaign form
        await this.page.type('input[name="title"], input[placeholder*="title" i]', 'Test Campaign');
        await this.page.type('textarea[name="description"], textarea', 'Test campaign description');
        await this.page.type('input[name="goal"], input[placeholder*="goal" i]', '10');
        
        const submitCampaign = await this.page.$('button:has-text("Create"), button:has-text("Submit")');
        if (submitCampaign) {
          await submitCampaign.click();
          journey.push(this.logResult('Create Campaign', true));
        }
      } else {
        journey.push(this.logResult('Create Campaign', false, 'Create button not found', 'MEDIUM'));
      }

      // 4. View all contributions
      console.log('  4. Viewing all contributions...');
      const contributionsLink = await this.page.$('a[href*="contributions"], button:has-text("Contributions")');
      if (contributionsLink) {
        await contributionsLink.click();
        await this.page.waitForTimeout(2000);
        const contributionsList = await this.page.$('.contributions-list, table');
        journey.push(this.logResult('View Contributions', contributionsList !== null));
      } else {
        journey.push(this.logResult('View Contributions', false, 'Contributions link not found', 'LOW'));
      }

    } catch (error) {
      journey.push(this.logResult('Admin Journey', false, error.message, 'HIGH'));
    }

    this.results.adminJourney = journey;
    return journey;
  }

  async testReturningUserJourney() {
    console.log('\n🧪 Testing Returning User Journey...\n');
    const journey = [];

    try {
      // 1. Login with existing account
      console.log('  1. Logging in with existing account...');
      await this.page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
      
      await this.page.type('input[name="email"], input[type="email"]', 'test@example.com');
      await this.page.type('input[name="password"], input[type="password"]', 'TestPass123!');
      
      const loginButton = await this.page.$('button[type="submit"], button:has-text("Login")');
      if (loginButton) {
        await loginButton.click();
        await this.page.waitForTimeout(3000);
        journey.push(this.logResult('User Login', true));
      } else {
        journey.push(this.logResult('User Login', false, 'Login button not found', 'HIGH'));
      }

      // 2. View previous contributions
      console.log('  2. Viewing previous contributions...');
      await this.page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle2' });
      const contributions = await this.page.$$('.contribution-item, .transaction-item');
      journey.push(this.logResult('View Previous Contributions', true, 
        `Found ${contributions.length} previous contributions`));

      // 3. Make another contribution
      console.log('  3. Making another contribution...');
      await this.page.goto(`${BASE_URL}/campaigns`, { waitUntil: 'networkidle2' });
      const campaignCards = await this.page.$$('.campaign-card');
      if (campaignCards.length > 0) {
        await campaignCards[0].click();
        await this.page.waitForTimeout(2000);
        
        const contributeButton = await this.page.$('button:has-text("Contribute")');
        if (contributeButton) {
          await contributeButton.click();
          journey.push(this.logResult('Make Another Contribution', true));
        }
      } else {
        journey.push(this.logResult('Make Another Contribution', false, 'No campaigns found', 'MEDIUM'));
      }

      // 4. Update profile information
      console.log('  4. Updating profile information...');
      await this.page.goto(`${BASE_URL}/profile/edit`, { waitUntil: 'networkidle2' });
      const profileForm = await this.page.$('form.profile-form, form[class*="profile"]');
      if (profileForm) {
        await this.page.evaluate(() => {
          const input = document.querySelector('input[name="displayName"], input[name="name"]');
          if (input) {
            input.value = 'Updated Name';
          }
        });
        
        const saveButton = await this.page.$('button:has-text("Save"), button:has-text("Update")');
        if (saveButton) {
          await saveButton.click();
          journey.push(this.logResult('Update Profile', true));
        }
      } else {
        journey.push(this.logResult('Update Profile', false, 'Profile form not found', 'LOW'));
      }

    } catch (error) {
      journey.push(this.logResult('Returning User Journey', false, error.message, 'HIGH'));
    }

    this.results.returningUserJourney = journey;
    return journey;
  }

  async performCriticalChecks() {
    console.log('\n🧪 Performing Critical Checks...\n');
    const checks = [];

    try {
      // 1. Check all main pages load without errors
      console.log('  1. Checking all pages load...');
      const pages = ['/', '/campaigns', '/about', '/contact'];
      for (const path of pages) {
        try {
          await this.page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle2' });
          checks.push(this.logResult(`Page Load: ${path}`, true));
        } catch (error) {
          checks.push(this.logResult(`Page Load: ${path}`, false, error.message, 'HIGH'));
        }
      }

      // 2. Check for console errors
      console.log('  2. Checking for console errors...');
      const consoleErrors = await this.page.evaluate(() => {
        return window.__consoleErrors || [];
      });
      checks.push(this.logResult('No Console Errors', consoleErrors.length === 0, 
        `Found ${consoleErrors.length} console errors`));

      // 3. Check mobile responsiveness
      console.log('  3. Checking mobile responsiveness...');
      await this.page.setViewport({ width: 375, height: 667 });
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle2' });
      const mobileMenu = await this.page.$('.mobile-menu, .hamburger, button[aria-label*="menu" i]');
      checks.push(this.logResult('Mobile Responsive', mobileMenu !== null));
      await this.page.setViewport({ width: 1366, height: 768 });

      // 4. Check loading states
      console.log('  4. Checking loading states...');
      await this.page.goto(`${BASE_URL}/campaigns`, { waitUntil: 'domcontentloaded' });
      const loadingIndicator = await this.page.$('.loading, .spinner, [class*="load"]');
      checks.push(this.logResult('Loading States Present', loadingIndicator !== null));

      // 5. Check form validation
      console.log('  5. Checking form validation...');
      await this.page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
      const submitButton = await this.page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        await this.page.waitForTimeout(500);
        const errorMessage = await this.page.$('.error, .invalid, [class*="error"]');
        checks.push(this.logResult('Form Validation Works', errorMessage !== null));
      }

      // 6. Check images load
      console.log('  6. Checking image loading...');
      const brokenImages = await this.page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        return images.filter(img => !img.complete || img.naturalWidth === 0).length;
      });
      checks.push(this.logResult('All Images Load', brokenImages === 0, 
        `${brokenImages} broken images found`));

      // 7. Check API connectivity
      console.log('  7. Checking API connectivity...');
      const apiResponse = await this.page.evaluate(async () => {
        try {
          const response = await fetch('/api/health');
          return response.ok;
        } catch {
          return false;
        }
      });
      checks.push(this.logResult('API Connectivity', apiResponse));

      // 8. Check blockchain connectivity
      console.log('  8. Checking blockchain connectivity...');
      const web3Connected = await this.page.evaluate(() => {
        return typeof window.ethereum !== 'undefined';
      });
      checks.push(this.logResult('Web3 Available', web3Connected));

    } catch (error) {
      checks.push(this.logResult('Critical Checks', false, error.message, 'CRITICAL'));
    }

    this.results.criticalChecks = checks;
    return checks;
  }

  generateReport() {
    const report = [];
    
    report.push('# END-TO-END INTEGRATION TEST REPORT');
    report.push(`\nGenerated: ${new Date().toISOString()}`);
    report.push(`\n## SUMMARY`);
    report.push(`- Total Tests: ${this.results.summary.totalTests}`);
    report.push(`- Passed: ${this.results.summary.passed} ✅`);
    report.push(`- Failed: ${this.results.summary.failed} ❌`);
    report.push(`- Pass Rate: ${((this.results.summary.passed / this.results.summary.totalTests) * 100).toFixed(1)}%`);
    
    if (this.results.summary.critical.length > 0) {
      report.push(`\n### ⚠️ CRITICAL ISSUES`);
      this.results.summary.critical.forEach(issue => {
        report.push(`- ${issue}`);
      });
    }

    // New User Journey
    report.push(`\n## NEW USER JOURNEY`);
    this.formatJourneyResults(report, this.results.newUserJourney);

    // Admin Journey
    report.push(`\n## ADMIN JOURNEY`);
    this.formatJourneyResults(report, this.results.adminJourney);

    // Returning User Journey
    report.push(`\n## RETURNING USER JOURNEY`);
    this.formatJourneyResults(report, this.results.returningUserJourney);

    // Critical Checks
    report.push(`\n## CRITICAL CHECKS`);
    this.formatJourneyResults(report, this.results.criticalChecks);

    // Bug Summary
    report.push(`\n## BUG SUMMARY`);
    const bugs = this.categorizeBugs();
    
    if (bugs.critical.length > 0) {
      report.push(`\n### CRITICAL (Must Fix Immediately)`);
      bugs.critical.forEach(bug => report.push(`- ${bug}`));
    }
    
    if (bugs.high.length > 0) {
      report.push(`\n### HIGH (Should Fix Soon)`);
      bugs.high.forEach(bug => report.push(`- ${bug}`));
    }
    
    if (bugs.medium.length > 0) {
      report.push(`\n### MEDIUM (Can Fix Later)`);
      bugs.medium.forEach(bug => report.push(`- ${bug}`));
    }
    
    if (bugs.low.length > 0) {
      report.push(`\n### LOW (Nice to Have)`);
      bugs.low.forEach(bug => report.push(`- ${bug}`));
    }

    // Recommendations
    report.push(`\n## RECOMMENDATIONS`);
    report.push(this.generateRecommendations());

    return report.join('\n');
  }

  formatJourneyResults(report, results) {
    results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      const severity = result.passed ? '' : ` [${result.severity}]`;
      report.push(`- ${status} ${result.test}${severity}`);
      if (!result.passed && result.details) {
        report.push(`  - Details: ${result.details}`);
      }
    });
  }

  categorizeBugs() {
    const bugs = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };

    const allResults = [
      ...this.results.newUserJourney,
      ...this.results.adminJourney,
      ...this.results.returningUserJourney,
      ...this.results.criticalChecks
    ];

    allResults.forEach(result => {
      if (!result.passed) {
        const bug = `${result.test}: ${result.details || 'Failed'}`;
        switch (result.severity) {
          case 'CRITICAL':
            bugs.critical.push(bug);
            break;
          case 'HIGH':
            bugs.high.push(bug);
            break;
          case 'MEDIUM':
            bugs.medium.push(bug);
            break;
          case 'LOW':
            bugs.low.push(bug);
            break;
        }
      }
    });

    return bugs;
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.summary.critical.length > 0) {
      recommendations.push('1. **IMMEDIATE ACTION REQUIRED**: Fix all critical bugs before deployment');
    }
    
    const passRate = (this.results.summary.passed / this.results.summary.totalTests) * 100;
    if (passRate < 80) {
      recommendations.push('2. **Quality Concerns**: Pass rate below 80%, significant improvements needed');
    }
    
    recommendations.push('3. Add comprehensive error handling for all user interactions');
    recommendations.push('4. Implement proper loading states for all async operations');
    recommendations.push('5. Add user feedback for all actions (success/error messages)');
    recommendations.push('6. Ensure all forms have proper validation');
    recommendations.push('7. Test with real MetaMask integration');
    recommendations.push('8. Add automated E2E tests to CI/CD pipeline');

    return recommendations.join('\n');
  }

  async run() {
    console.log('🚀 Starting End-to-End Integration Tests...\n');
    
    try {
      await this.setup();
      
      // Run all test suites
      await this.testNewUserJourney();
      await this.testAdminJourney();
      await this.testReturningUserJourney();
      await this.performCriticalChecks();
      
      // Generate and save report
      const report = this.generateReport();
      console.log('\n' + report);
      
      // Save report to file
      fs.writeFileSync('./test-results/integration-test-report.md', report);
      console.log('\n✅ Report saved to test-results/integration-test-report.md');
      
    } catch (error) {
      console.error('Test suite failed:', error);
    } finally {
      await this.teardown();
    }
    
    return this.results;
  }
}

// Run tests if executed directly
const tester = new IntegrationTester();
tester.run().then(results => {
  process.exit(results.summary.critical.length > 0 ? 1 : 0);
});

export default IntegrationTester;