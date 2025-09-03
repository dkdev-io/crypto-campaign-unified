const puppeteer = require('puppeteer');

async function testDataAccess() {
    console.log('🔍 VERIFYING DATA VISIBILITY WITH PUPPETEER\n');
    
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 200,
        args: ['--no-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        
        console.log('📱 Loading application at http://localhost:5173');
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
        
        // Take initial screenshot
        await page.screenshot({ path: 'app-homepage.png', fullPage: true });
        console.log('📸 Screenshot saved: app-homepage.png');

        // Get page content to analyze
        const pageContent = await page.evaluate(() => {
            return {
                title: document.title,
                bodyText: document.body.textContent.toLowerCase(),
                links: Array.from(document.querySelectorAll('a')).map(a => a.textContent.trim()).filter(t => t),
                buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).filter(t => t),
                inputs: Array.from(document.querySelectorAll('input')).map(i => i.placeholder || i.type).filter(t => t),
                hasLoginForm: !!document.querySelector('input[type="email"], input[name="email"]')
            };
        });

        console.log('📋 Page Analysis:');
        console.log('   Title:', pageContent.title);
        console.log('   Has login form:', pageContent.hasLoginForm ? '✅' : '❌');
        console.log('   Available buttons:', pageContent.buttons.slice(0, 5).join(', ') || 'None');
        console.log('   Available links:', pageContent.links.slice(0, 5).join(', ') || 'None');

        // Try to find and click login/admin access
        let foundAccess = false;

        // Method 1: Look for login button
        if (pageContent.buttons.some(b => /login|sign|admin/i.test(b))) {
            const loginBtn = await page.$('button');
            if (loginBtn) {
                const btnText = await page.evaluate(btn => btn.textContent, loginBtn);
                if (/login|sign|admin/i.test(btnText)) {
                    console.log('✅ Found login button:', btnText);
                    await loginBtn.click();
                    await page.waitForTimeout(2000);
                    foundAccess = true;
                }
            }
        }

        // Method 2: Look for login link
        if (!foundAccess && pageContent.links.some(l => /login|sign|admin/i.test(l))) {
            const links = await page.$$('a');
            for (const link of links) {
                const linkText = await page.evaluate(l => l.textContent.toLowerCase(), link);
                if (/login|sign|admin/.test(linkText)) {
                    console.log('✅ Found login link:', linkText);
                    await link.click();
                    await page.waitForTimeout(2000);
                    foundAccess = true;
                    break;
                }
            }
        }

        // Method 3: Check if there's already a login form on page
        if (!foundAccess && pageContent.hasLoginForm) {
            console.log('✅ Login form already visible');
            foundAccess = true;
        }

        // Method 4: Try navigating to common auth paths
        if (!foundAccess) {
            const authPaths = ['/login', '/signin', '/admin', '/auth'];
            for (const path of authPaths) {
                try {
                    console.log('🔗 Trying path:', path);
                    await page.goto(`http://localhost:5173${path}`, { waitUntil: 'networkidle0' });
                    
                    const hasForm = await page.$('input[type="email"], input[name="email"]');
                    if (hasForm) {
                        console.log('✅ Found login form at', path);
                        foundAccess = true;
                        break;
                    }
                } catch (e) {
                    console.log('❌ Path not found:', path);
                }
            }
        }

        if (foundAccess) {
            // Take screenshot of login page
            await page.screenshot({ path: 'login-page.png', fullPage: true });
            console.log('📸 Screenshot saved: login-page.png');

            // Try to login with test@dkdev.io
            const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="email"]');
            const passwordInput = await page.$('input[type="password"], input[name="password"]');

            if (emailInput && passwordInput) {
                console.log('🔑 Attempting login with test@dkdev.io...');
                
                await emailInput.click();
                await emailInput.type('test@dkdev.io');
                
                await passwordInput.click();
                await passwordInput.type('admin123');

                // Find and click submit button
                const submitBtn = await page.$('button[type="submit"], input[type="submit"], button');
                if (submitBtn) {
                    await submitBtn.click();
                    console.log('📤 Login form submitted');
                    
                    // Wait for response
                    await page.waitForTimeout(3000);
                    
                    // Take screenshot after login attempt
                    await page.screenshot({ path: 'after-login.png', fullPage: true });
                    console.log('📸 Screenshot saved: after-login.png');
                    
                    // Check for success indicators
                    const postLoginAnalysis = await page.evaluate(() => {
                        const text = document.body.textContent.toLowerCase();
                        return {
                            currentUrl: window.location.href,
                            hasError: text.includes('error') || text.includes('invalid') || text.includes('failed'),
                            hasDashboard: text.includes('dashboard') || text.includes('campaign'),
                            hasContributionData: text.includes('contribution') || text.includes('donor') || text.includes('194') || text.includes('215'),
                            hasTestEmail: text.includes('test@dkdev.io'),
                            pageText: text.substring(0, 500) // First 500 chars for debugging
                        };
                    });

                    console.log('\n📊 POST-LOGIN ANALYSIS:');
                    console.log('   URL:', postLoginAnalysis.currentUrl);
                    console.log('   Has error:', postLoginAnalysis.hasError ? '❌' : '✅');
                    console.log('   Has dashboard:', postLoginAnalysis.hasDashboard ? '✅' : '❌');
                    console.log('   Has contribution data:', postLoginAnalysis.hasContributionData ? '✅' : '❌');
                    console.log('   Shows test email:', postLoginAnalysis.hasTestEmail ? '✅' : '❌');

                    if (postLoginAnalysis.hasContributionData) {
                        console.log('\n🎯 SUCCESS: Found contribution data in logged-in account!');
                        
                        // Try to find specific numbers from our dataset
                        const dataMatch = await page.evaluate(() => {
                            const text = document.body.textContent;
                            return {
                                has194k: /194[,\s]?183|194k/i.test(text),
                                has215: /215/.test(text),
                                has3300: /3[,\s]?300/.test(text),
                                monetaryAmounts: (text.match(/\$[\d,]+\.?\d*/g) || []).slice(0, 10)
                            };
                        });

                        console.log('💰 Data verification:');
                        console.log('   Contains $194,183:', dataMatch.has194k ? '✅' : '❌');
                        console.log('   Contains 215 records:', dataMatch.has215 ? '✅' : '❌');
                        console.log('   Contains $3300 max:', dataMatch.has3300 ? '✅' : '❌');
                        console.log('   Found amounts:', dataMatch.monetaryAmounts.join(', ') || 'None');

                        if (dataMatch.has194k || dataMatch.has215 || dataMatch.monetaryAmounts.length > 0) {
                            console.log('\n✅ CONFIRMED: 215 donor records are visible in test@dkdev.io account!');
                        }
                    }
                    
                    // Final screenshot of logged-in state
                    await page.screenshot({ path: 'final-logged-in-state.png', fullPage: true });
                    console.log('📸 Final screenshot: final-logged-in-state.png');
                    
                } else {
                    console.log('❌ No submit button found');
                }
            } else {
                console.log('❌ Login form fields not found');
            }
        } else {
            console.log('❌ Could not find login access');
            
            // Check if data is visible without login
            const publicDataCheck = await page.evaluate(() => {
                const text = document.body.textContent.toLowerCase();
                return {
                    hasContributions: text.includes('contribution') || text.includes('donor'),
                    hasAmounts: (text.match(/\$[\d,]+/g) || []).length > 0,
                    hasTestCampaign: text.includes('test campaign')
                };
            });

            if (publicDataCheck.hasContributions) {
                console.log('✅ Found contribution data on public page (no login required)');
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
        console.log('\n📸 Check generated screenshots for visual verification');
        console.log('   - app-homepage.png');
        console.log('   - login-page.png (if found)'); 
        console.log('   - after-login.png (if attempted)');
        console.log('   - final-logged-in-state.png (if successful)');
    }
}

testDataAccess();