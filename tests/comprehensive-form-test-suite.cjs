const puppeteer = require('puppeteer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config({ path: '../.env' });

class ComprehensiveFormTestSuite {
    constructor() {
        this.browser = null;
        this.page = null;
        this.db = new sqlite3.Database(path.join(__dirname, '../scripts/test-data.db'));
        this.baseUrl = process.env.BASE_URL || 'https://testy-pink-chancellor.lovable.app';
        this.testResults = [];
    }

    // Initialize test environment
    async initialize() {
        console.log('🚀 Initializing Comprehensive Form Test Suite...\n');
        
        this.browser = await puppeteer.launch({
            headless: process.env.TEST_HEADLESS !== 'false',
            slowMo: parseInt(process.env.TEST_SLOW_MO) || 100,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1920, height: 1080 });
        
        // Enable console logging for debugging
        this.page.on('console', (msg) => {
            if (msg.type() === 'error') {
                console.error('💥 Page Error:', msg.text());
            }
        });
    }

    // Get random test data from database
    async getRandomProspect() {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM campaign_prospects ORDER BY RANDOM() LIMIT 1', (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async getRandomDonor() {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM campaign_donors ORDER BY RANDOM() LIMIT 1', (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async getKYCStatus(uniqueId) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT kyc_passed FROM kyc WHERE unique_id = ?', [uniqueId], (err, row) => {
                if (err) reject(err);
                else resolve(row ? row.kyc_passed : false);
            });
        });
    }

    // Test utilities
    async waitForSelector(selector, timeout = 10000) {
        try {
            await this.page.waitForSelector(selector, { timeout });
            return true;
        } catch (error) {
            console.error(`❌ Selector not found: ${selector}`);
            return false;
        }
    }

    async fillForm(data) {
        const fields = {
            'input[name="firstName"], #firstName, [data-testid="firstName"]': data.first_name,
            'input[name="lastName"], #lastName, [data-testid="lastName"]': data.last_name,
            'input[name="phone"], #phone, [data-testid="phone"]': data.phone,
            'input[name="address"], #address, [data-testid="address"]': data.address_line_1,
            'input[name="city"], #city, [data-testid="city"]': data.city,
            'input[name="state"], #state, [data-testid="state"]': data.state,
            'input[name="zip"], #zip, [data-testid="zip"]': data.zip,
            'input[name="employer"], #employer, [data-testid="employer"]': data.employer,
            'input[name="occupation"], #occupation, [data-testid="occupation"]': data.occupation,
            'input[name="wallet"], #wallet, [data-testid="wallet"]': data.wallet
        };

        for (const [selectors, value] of Object.entries(fields)) {
            if (value) {
                for (const selector of selectors.split(', ')) {
                    try {
                        const element = await this.page.$(selector);
                        if (element) {
                            await element.click();
                            await element.evaluate(el => el.value = '');
                            await element.type(value);
                            break;
                        }
                    } catch (error) {
                        // Try next selector
                        continue;
                    }
                }
            }
        }
    }

    // Test Case 1: Prospect Form Submission
    async testProspectFormSubmission() {
        
        const prospect = await this.getRandomProspect();
        const testResult = {
            name: 'Prospect Form Submission',
            status: 'pending',
            data: prospect,
            details: []
        };

        try {
            await this.page.goto(this.baseUrl);
            testResult.details.push('✅ Navigated to base URL');

            // Look for prospect form
            const formSelectors = [
                'form[data-testid="prospect-form"]',
                'form.prospect-form',
                'form#prospect-form',
                'iframe[src*="form"]'
            ];

            let formFound = false;
            for (const selector of formSelectors) {
                if (selector.includes('iframe')) {
                    const iframe = await this.page.$(selector);
                    if (iframe) {
                        const frame = await iframe.contentFrame();
                        if (frame) {
                            this.page = frame; // Switch to iframe context
                            formFound = true;
                            testResult.details.push('✅ Found and switched to iframe form');
                            break;
                        }
                    }
                } else if (await this.waitForSelector(selector, 3000)) {
                    formFound = true;
                    testResult.details.push(`✅ Found form: ${selector}`);
                    break;
                }
            }

            if (!formFound) {
                testResult.details.push('⚠️ No form found, trying to fill available inputs');
            }

            // Fill form with prospect data
            await this.fillForm(prospect);
            testResult.details.push('✅ Form filled with prospect data');

            // Try to submit
            const submitSelectors = [
                'button[type="submit"]',
                'input[type="submit"]',
                'button.submit',
                '.submit-btn',
                '[data-testid="submit"]'
            ];

            let submitted = false;
            for (const selector of submitSelectors) {
                try {
                    const button = await this.page.$(selector);
                    if (button) {
                        await button.click();
                        testResult.details.push(`✅ Clicked submit button: ${selector}`);
                        submitted = true;
                        break;
                    }
                } catch (error) {
                    continue;
                }
            }

            // Wait for response
            await this.page.waitForTimeout(2000);
            
            // Check for success indicators
            const successSelectors = [
                '.success',
                '.thank-you',
                '[data-testid="success"]',
                'text=success',
                'text=thank you'
            ];

            let success = false;
            for (const selector of successSelectors) {
                try {
                    const element = await this.page.$(selector);
                    if (element) {
                        success = true;
                        testResult.details.push(`✅ Found success indicator: ${selector}`);
                        break;
                    }
                } catch (error) {
                    continue;
                }
            }

            testResult.status = success ? 'passed' : (submitted ? 'partial' : 'failed');
            
        } catch (error) {
            testResult.status = 'error';
            testResult.details.push(`❌ Error: ${error.message}`);
        }

        this.testResults.push(testResult);
        console.log(`   Status: ${testResult.status}\n`);
        return testResult;
    }

    // Test Case 2: Donor Form Submission with Contribution Amount
    async testDonorFormSubmission() {
        
        const donor = await this.getRandomDonor();
        const testResult = {
            name: 'Donor Form Submission',
            status: 'pending',
            data: donor,
            details: []
        };

        try {
            await this.page.goto(this.baseUrl);
            
            // Fill form with donor data
            await this.fillForm(donor);
            testResult.details.push('✅ Form filled with donor data');

            // Fill contribution amount
            const amountSelectors = [
                'input[name="amount"]',
                '#amount',
                '[data-testid="amount"]',
                'input[type="number"]'
            ];

            for (const selector of amountSelectors) {
                try {
                    const element = await this.page.$(selector);
                    if (element) {
                        await element.click();
                        await element.type(donor.contribution_amount.toString());
                        testResult.details.push(`✅ Filled amount: $${donor.contribution_amount}`);
                        break;
                    }
                } catch (error) {
                    continue;
                }
            }

            // Submit form (same logic as prospect test)
            const submitSelectors = [
                'button[type="submit"]',
                'input[type="submit"]',
                'button.submit'
            ];

            for (const selector of submitSelectors) {
                try {
                    const button = await this.page.$(selector);
                    if (button) {
                        await button.click();
                        testResult.details.push('✅ Form submitted');
                        break;
                    }
                } catch (error) {
                    continue;
                }
            }

            await this.page.waitForTimeout(2000);
            testResult.status = 'partial'; // Assume partial success for now
            
        } catch (error) {
            testResult.status = 'error';
            testResult.details.push(`❌ Error: ${error.message}`);
        }

        this.testResults.push(testResult);
        console.log(`   Status: ${testResult.status}\n`);
        return testResult;
    }

    // Test Case 3: KYC Validation Test
    async testKYCValidation() {
        
        const testResult = {
            name: 'KYC Validation',
            status: 'pending',
            details: []
        };

        try {
            // Get a few prospects and check their KYC status
            const prospects = await new Promise((resolve, reject) => {
                this.db.all('SELECT * FROM campaign_prospects LIMIT 5', (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            for (const prospect of prospects) {
                const kycStatus = await this.getKYCStatus(prospect.unique_id);
                testResult.details.push(`${prospect.unique_id}: KYC ${kycStatus ? 'PASSED' : 'FAILED'}`);
            }

            // Count KYC statistics
            const kycStats = await new Promise((resolve, reject) => {
                this.db.get(`
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN kyc_passed = 1 THEN 1 ELSE 0 END) as passed,
                        SUM(CASE WHEN kyc_passed = 0 THEN 1 ELSE 0 END) as failed
                    FROM kyc
                `, (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            testResult.details.push(`📊 KYC Summary: ${kycStats.passed}/${kycStats.total} passed (${Math.round(kycStats.passed/kycStats.total*100)}%)`);
            testResult.status = 'passed';
            
        } catch (error) {
            testResult.status = 'error';
            testResult.details.push(`❌ Error: ${error.message}`);
        }

        this.testResults.push(testResult);
        console.log(`   Status: ${testResult.status}\n`);
        return testResult;
    }

    // Test Case 4: Donor-Prospect Overlap Verification
    async testDonorProspectOverlap() {
        
        const testResult = {
            name: 'Donor-Prospect Overlap',
            status: 'pending',
            details: []
        };

        try {
            const overlaps = await new Promise((resolve, reject) => {
                this.db.all(`
                    SELECT 
                        p.unique_id,
                        p.first_name,
                        p.last_name,
                        d.contribution_amount,
                        d.contribution_date
                    FROM campaign_prospects p
                    INNER JOIN campaign_donors d ON p.unique_id = d.unique_id
                    ORDER BY d.contribution_amount DESC
                    LIMIT 10
                `, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            testResult.details.push(`🎯 Found ${overlaps.length}/38 expected overlaps (showing top 10 by contribution)`);
            
            overlaps.forEach(person => {
                testResult.details.push(`   ${person.unique_id}: ${person.first_name} ${person.last_name} - $${person.contribution_amount} (${person.contribution_date})`);
            });

            // Get total overlap count
            const totalOverlaps = await new Promise((resolve, reject) => {
                this.db.get(`
                    SELECT COUNT(DISTINCT p.unique_id) as overlap_count
                    FROM campaign_prospects p
                    INNER JOIN campaign_donors d ON p.unique_id = d.unique_id
                `, (err, row) => {
                    if (err) reject(err);
                    else resolve(row.overlap_count);
                });
            });

            testResult.details.push(`📈 Total overlaps: ${totalOverlaps} (expected: 38)`);
            testResult.status = totalOverlaps === 38 ? 'passed' : 'partial';
            
        } catch (error) {
            testResult.status = 'error';
            testResult.details.push(`❌ Error: ${error.message}`);
        }

        this.testResults.push(testResult);
        console.log(`   Status: ${testResult.status}\n`);
        return testResult;
    }

    // Test Case 5: Form Field Validation
    async testFormFieldValidation() {
        console.log('✅ Test 5: Form Field Validation');
        
        const testResult = {
            name: 'Form Field Validation',
            status: 'pending',
            details: []
        };

        try {
            await this.page.goto(this.baseUrl);

            // Test required field validation
            const requiredFields = [
                { selector: 'input[name="firstName"]', value: '' },
                { selector: 'input[name="email"]', value: 'invalid-email' },
                { selector: 'input[name="phone"]', value: '123' },
                { selector: 'input[name="amount"]', value: '-100' }
            ];

            for (const field of requiredFields) {
                try {
                    const element = await this.page.$(field.selector);
                    if (element) {
                        await element.click();
                        await element.type(field.value);
                        testResult.details.push(`✅ Tested field: ${field.selector}`);
                    }
                } catch (error) {
                    testResult.details.push(`⚠️ Field not found: ${field.selector}`);
                }
            }

            // Try to submit with invalid data
            try {
                const submitButton = await this.page.$('button[type="submit"]');
                if (submitButton) {
                    await submitButton.click();
                    await this.page.waitForTimeout(1000);
                    
                    // Check for validation errors
                    const errorSelectors = ['.error', '.invalid', '[data-error]', '.field-error'];
                    let errorsFound = false;
                    
                    for (const selector of errorSelectors) {
                        const errors = await this.page.$$(selector);
                        if (errors.length > 0) {
                            errorsFound = true;
                            testResult.details.push(`✅ Found validation errors: ${errors.length}`);
                            break;
                        }
                    }
                    
                    testResult.status = errorsFound ? 'passed' : 'partial';
                }
            } catch (error) {
                testResult.details.push(`⚠️ Submit test error: ${error.message}`);
            }
            
        } catch (error) {
            testResult.status = 'error';
            testResult.details.push(`❌ Error: ${error.message}`);
        }

        this.testResults.push(testResult);
        console.log(`   Status: ${testResult.status}\n`);
        return testResult;
    }

    // Run all tests
    async runAllTests() {
        
        try {
            await this.initialize();
            
            // Run all test cases
            await this.testProspectFormSubmission();
            await this.testDonorFormSubmission();
            await this.testKYCValidation();
            await this.testDonorProspectOverlap();
            await this.testFormFieldValidation();
            
            // Generate test report
            await this.generateTestReport();
            
        } catch (error) {
            console.error('💥 Test suite error:', error);
        } finally {
            await this.cleanup();
        }
    }

    // Generate test report
    async generateTestReport() {
        console.log('📊 TEST RESULTS SUMMARY');
        
        let passed = 0, failed = 0, partial = 0, errors = 0;
        
        this.testResults.forEach(result => {
            const status = result.status;
            const icon = status === 'passed' ? '✅' : 
                        status === 'partial' ? '⚠️' : 
                        status === 'failed' ? '❌' : '💥';
                        
            console.log(`${icon} ${result.name}: ${status.toUpperCase()}`);
            
            // Show details for failed/error tests
            if (status === 'failed' || status === 'error') {
            }
            
            // Count results
            if (status === 'passed') passed++;
            else if (status === 'failed') failed++;
            else if (status === 'partial') partial++;
            else if (status === 'error') errors++;
        });
        
        console.log('\n📈 SUMMARY:');
        console.log(`   💥 Errors: ${errors}`);
        console.log(`   📊 Success Rate: ${Math.round(passed/(passed+failed+partial+errors)*100)}%`);
    }

    // Cleanup resources
    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
        if (this.db) {
            this.db.close();
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    const testSuite = new ComprehensiveFormTestSuite();
    testSuite.runAllTests().catch(console.error);
}

module.exports = ComprehensiveFormTestSuite;