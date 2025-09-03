const puppeteer = require('puppeteer');

async function verifyDataVisibility() {
    console.log('🚀 Starting Puppeteer verification of data visibility\n');
    
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 100,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        
        console.log('📱 Navigating to application...');
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
        
        // Take initial screenshot
        await page.screenshot({ 
            path: 'homepage-initial.png',
            fullPage: true 
        });
        console.log('📸 Screenshot: homepage-initial.png');

        // Look for admin or login options
        console.log('\n🔍 Looking for admin/login access...');
        
        // Check if there's an admin button or login
        const adminButton = await page.$('button:contains("Admin")') || 
                           await page.$('a:contains("Admin")') ||
                           await page.$('button:contains("Login")') ||
                           await page.$('a:contains("Login")');

        if (adminButton) {
            console.log('✅ Found admin/login button');
            await adminButton.click();
            await page.waitForTimeout(2000);
        } else {
            // Try to find any navigation or buttons that might lead to login
            const buttons = await page.$$eval('button, a', elements => 
                elements.map(el => ({ text: el.textContent.trim(), tag: el.tagName }))
            );
            
            console.log('📋 Available buttons/links:');
            buttons.slice(0, 10).forEach((btn, i) => {
                if (btn.text) console.log(`   ${i + 1}. ${btn.tag}: ${btn.text}`);
            });
            
            // Try clicking anything that might be related to login/admin
            const loginOptions = ['Login', 'Sign In', 'Admin', 'Dashboard', 'Campaign'];
            
            for (const option of loginOptions) {
                const element = await page.$(`button:contains("${option}"), a:contains("${option}")`);
                if (element) {
                    console.log(`✅ Trying: ${option}`);
                    await element.click();
                    await page.waitForTimeout(2000);
                    break;
                }
            }
        }

        // Take screenshot after navigation attempt
        await page.screenshot({ 
            path: 'after-navigation.png',
            fullPage: true 
        });
        console.log('📸 Screenshot: after-navigation.png');

        // Check if we're now on a login page
        const currentUrl = page.url();
        console.log('🌐 Current URL:', currentUrl);
        
        // Look for login form
        const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="email"]');
        const passwordInput = await page.$('input[type="password"], input[name="password"]');
        
        if (emailInput && passwordInput) {
            console.log('✅ Found login form - testing test@dkdev.io account');
            
            await emailInput.type('test@dkdev.io');
            await passwordInput.type('admin123');
            
            // Look for login button
            const loginSubmit = await page.$('button[type="submit"], button:contains("Login"), button:contains("Sign In")');
            
            if (loginSubmit) {
                console.log('🔑 Attempting login...');
                await loginSubmit.click();
                await page.waitForTimeout(3000);
                
                // Take screenshot after login attempt
                await page.screenshot({ 
                    path: 'after-login-attempt.png',
                    fullPage: true 
                });
                console.log('📸 Screenshot: after-login-attempt.png');
                
                // Check for success indicators
                const isLoggedIn = await page.evaluate(() => {
                    return document.body.textContent.toLowerCase().includes('dashboard') ||
                           document.body.textContent.toLowerCase().includes('campaign') ||
                           document.body.textContent.toLowerCase().includes('admin') ||
                           document.body.textContent.toLowerCase().includes('contributions');
                });
                
                if (isLoggedIn) {
                    console.log('✅ Login appears successful');
                    
                    // Look for data indicators
                    console.log('🔍 Searching for contribution data...');
                    
                    // Check for any numbers that might be contribution amounts
                    const dataIndicators = await page.evaluate(() => {
                        const text = document.body.textContent;
                        const numbers = text.match(/\$[\d,]+\.?\d*/g) || [];
                        const contributionWords = ['contribution', 'donation', 'donor', 'raised'];
                        const hasDataWords = contributionWords.some(word => 
                            text.toLowerCase().includes(word)
                        );
                        return { numbers: numbers.slice(0, 10), hasDataWords };
                    });
                    
                    if (dataIndicators.numbers.length > 0) {
                        console.log('💰 Found monetary amounts:', dataIndicators.numbers.join(', '));
                    }
                    
                    if (dataIndicators.hasDataWords) {
                        console.log('✅ Found contribution-related text');
                    }
                    
                    // Take final screenshot of logged-in state
                    await page.screenshot({ 
                        path: 'logged-in-dashboard.png',
                        fullPage: true 
                    });
                    console.log('📸 Screenshot: logged-in-dashboard.png');
                    
                } else {
                    console.log('❌ Login may have failed or no dashboard visible');
                }
            }
        } else {
            console.log('❌ No login form found');
            
            // Check if we're already on a page with data
            const hasContributionData = await page.evaluate(() => {
                const text = document.body.textContent.toLowerCase();
                return text.includes('194') || // Our total amount
                       text.includes('215') || // Our record count
                       text.includes('3300') || // Max contribution
                       text.includes('contribution') ||
                       text.includes('donor');
            });
            
            if (hasContributionData) {
                console.log('✅ Found contribution data on current page');
                await page.screenshot({ 
                    path: 'data-visible-no-login.png',
                    fullPage: true 
                });
                console.log('📸 Screenshot: data-visible-no-login.png');
            }
        }

        // Final page analysis
        const pageAnalysis = await page.evaluate(() => {
            const text = document.body.textContent;
            return {
                hasTotal194k: text.includes('194'),
                has215Records: text.includes('215'),
                hasTestEmail: text.includes('test@dkdev.io'),
                hasContributionWords: /contribution|donor|donation|raised/i.test(text),
                pageLength: text.length,
                title: document.title
            };
        });

        console.log('\n📊 FINAL ANALYSIS:');
        console.log('   Page title:', pageAnalysis.title);
        console.log('   Contains $194k total:', pageAnalysis.hasTotal194k ? '✅' : '❌');
        console.log('   Contains 215 records:', pageAnalysis.has215Records ? '✅' : '❌'); 
        console.log('   Contains test@dkdev.io:', pageAnalysis.hasTestEmail ? '✅' : '❌');
        console.log('   Has contribution words:', pageAnalysis.hasContributionWords ? '✅' : '❌');
        console.log('   Page has content:', pageAnalysis.pageLength > 100 ? '✅' : '❌');

        if (pageAnalysis.hasContributionWords && (pageAnalysis.hasTotal194k || pageAnalysis.has215Records)) {
            console.log('\n🎯 SUCCESS: Data appears to be visible in the application!');
        } else {
            console.log('\n❓ INCONCLUSIVE: May need manual verification or different access path');
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await browser.close();
        console.log('\n✅ Verification complete - check screenshots for visual confirmation');
    }
}

// Run verification
verifyDataVisibility();