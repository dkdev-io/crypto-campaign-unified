const puppeteer = require('puppeteer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

class SimpleFormTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.db = new sqlite3.Database(path.join(__dirname, '../scripts/test-data.db'));
        this.baseUrl = process.env.BASE_URL || 'https://testy-pink-chancellor.lovable.app';
    }

    async initialize() {
        console.log('🚀 Initializing Simple Form Tester...\n');
        
        this.browser = await puppeteer.launch({
            headless: false,
            slowMo: 250,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1920, height: 1080 });
    }

    async getRandomProspect() {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM campaign_prospects ORDER BY RANDOM() LIMIT 1', (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async testBasicFormInteraction() {
        
        try {
            // Navigate to the form
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
            
            // Take a screenshot
            await this.page.screenshot({ 
                path: path.join(__dirname, 'form-page-screenshot.png'),
                fullPage: true 
            });
            
            // Get page title
            const title = await this.page.title();
            
            // Look for forms or iframes
            const forms = await this.page.$$('form');
            const iframes = await this.page.$$('iframe');
            
            
            // Check if we need to work with an iframe
            if (iframes.length > 0) {
                const iframe = iframes[0];
                const frame = await iframe.contentFrame();
                
                if (frame) {
                    // Get iframe URL
                    const iframeUrl = await iframe.evaluate(el => el.src);
                    
                    // Switch context to iframe
                    const iframeForms = await frame.$$('form');
                    
                    // Try to interact with iframe form
                    const inputs = await frame.$$('input');
                    
                    if (inputs.length > 0) {
                        const prospect = await this.getRandomProspect();
                        
                        // Try to fill some basic fields
                        const fieldMappings = [
                            { selectors: ['input[name="firstName"]', 'input[id="firstName"]'], value: prospect.first_name },
                            { selectors: ['input[name="lastName"]', 'input[id="lastName"]'], value: prospect.last_name },
                            { selectors: ['input[name="email"]', 'input[id="email"]'], value: `${prospect.first_name.toLowerCase()}.${prospect.last_name.toLowerCase()}@test.com` },
                            { selectors: ['input[name="phone"]', 'input[id="phone"]'], value: prospect.phone }
                        ];
                        
                        for (const mapping of fieldMappings) {
                            for (const selector of mapping.selectors) {
                                try {
                                    const field = await frame.$(selector);
                                    if (field) {
                                        await field.click();
                                        await field.type(mapping.value);
                                        await this.page.waitForTimeout(500);
                                        break;
                                    }
                                } catch (error) {
                                    // Try next selector
                                }
                            }
                        }
                        
                        // Take screenshot after filling
                        await this.page.screenshot({ 
                            path: path.join(__dirname, 'form-filled-screenshot.png'),
                            fullPage: true 
                        });
                        
                        // Try to find and click submit button
                        const submitSelectors = [
                            'button[type="submit"]',
                            'input[type="submit"]',
                            'button.submit',
                            '.submit-btn'
                        ];
                        
                        for (const selector of submitSelectors) {
                            try {
                                const button = await frame.$(selector);
                                if (button) {
                                    // Don't actually submit for now, just identify
                                    break;
                                }
                            } catch (error) {
                                // Try next selector
                            }
                        }
                    }
                }
            } else {
                // Direct form interaction
                const inputs = await this.page.$$('input');
            }
            
            console.log('✅ Basic form interaction test completed');
            return true;
            
        } catch (error) {
            console.error('❌ Form interaction test failed:', error.message);
            return false;
        }
    }

    async testDatabaseConnectivity() {
        
        try {
            const stats = await new Promise((resolve, reject) => {
                this.db.get(`
                    SELECT 
                        (SELECT COUNT(*) FROM campaign_prospects) as prospects,
                        (SELECT COUNT(*) FROM campaign_donors) as donors,
                        (SELECT COUNT(*) FROM kyc) as kyc,
                        (SELECT COUNT(DISTINCT p.unique_id) FROM campaign_prospects p INNER JOIN campaign_donors d ON p.unique_id = d.unique_id) as overlaps
                `, (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            
            
            return stats;
            
        } catch (error) {
            console.error('❌ Database connectivity test failed:', error.message);
            return null;
        }
    }

    async runTests() {
        
        try {
            await this.initialize();
            
            // Test database first
            const dbStats = await this.testDatabaseConnectivity();
            if (!dbStats) {
                console.log('❌ Database test failed, stopping tests');
                return;
            }
            
            // Test form interaction
            const formTest = await this.testBasicFormInteraction();
            
            console.log('\n📊 TEST SUMMARY:');
            
            // Wait before closing
            await this.page.waitForTimeout(10000);
            
        } catch (error) {
            console.error('💥 Test error:', error);
        } finally {
            await this.cleanup();
        }
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
        if (this.db) {
            this.db.close();
        }
    }
}

// Run tests
if (require.main === module) {
    const tester = new SimpleFormTester();
    tester.runTests().catch(console.error);
}

module.exports = SimpleFormTester;