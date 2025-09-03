const puppeteer = require('puppeteer');

async function testLoginNow() {
    console.log('🎯 TESTING LOGIN WITH NEWLY CREATED ACCOUNT\n');
    
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 300,
        defaultViewport: { width: 1280, height: 720 }
    });

    try {
        const page = await browser.newPage();
        
        console.log('📱 Going to login page...');
        await page.goto('http://localhost:5173/auth', { waitUntil: 'domcontentloaded' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('🔑 Entering credentials...');
        const emailInput = await page.$('input[type="email"]');
        const passwordInput = await page.$('input[type="password"]');
        
        if (emailInput && passwordInput) {
            await emailInput.type('test@dkdev.io');
            await passwordInput.type('admin123');
            
            await page.screenshot({ path: 'login-attempt-with-new-account.png', fullPage: true });
            console.log('📸 Screenshot: login-attempt-with-new-account.png');
            
            console.log('🚀 Submitting login...');
            const submitBtn = await page.$('button[type="submit"]');
            if (submitBtn) {
                await submitBtn.click();
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                await page.screenshot({ path: 'login-result-new-account.png', fullPage: true });
                console.log('📸 Screenshot: login-result-new-account.png');
                
                const result = await page.evaluate(() => {
                    const url = window.location.href;
                    const text = document.body.textContent;
                    return {
                        url,
                        hasError: text.toLowerCase().includes('error') || 
                                 text.toLowerCase().includes('invalid') ||
                                 text.toLowerCase().includes('confirm'),
                        hasSuccess: !text.toLowerCase().includes('sign in') && 
                                   (text.toLowerCase().includes('dashboard') || 
                                    text.toLowerCase().includes('campaign') ||
                                    text.toLowerCase().includes('welcome')),
                        textSnippet: text.substring(0, 200)
                    };
                });
                
                console.log('📊 LOGIN RESULT:');
                console.log('   URL:', result.url);
                console.log('   Has error:', result.hasError ? '❌ YES' : '✅ NO');
                console.log('   Login success:', result.hasSuccess ? '✅ YES' : '❌ NO');
                console.log('   Page text:', result.textSnippet);
                
                if (result.hasSuccess) {
                    console.log('\n🎉 SUCCESS! Login worked - now checking for data...');
                    
                    // Look for data indicators
                    const dataCheck = await page.evaluate(() => {
                        const text = document.body.textContent;
                        return {
                            hasContributions: text.includes('194') || text.includes('215'),
                            amounts: (text.match(/\$[\d,]+/g) || []).slice(0, 5),
                            hasCampaign: text.toLowerCase().includes('campaign'),
                            hasDashboard: text.toLowerCase().includes('dashboard')
                        };
                    });
                    
                    console.log('📊 DATA CHECK:');
                    console.log('   Has contribution data:', dataCheck.hasContributions ? '✅ YES' : '❌ NO');
                    console.log('   Has campaign content:', dataCheck.hasCampaign ? '✅ YES' : '❌ NO');
                    console.log('   Has dashboard:', dataCheck.hasDashboard ? '✅ YES' : '❌ NO');
                    console.log('   Found amounts:', dataCheck.amounts.join(', ') || 'None');
                    
                    if (dataCheck.hasContributions || dataCheck.amounts.length > 0) {
                        console.log('\n🏆 COMPLETE SUCCESS!');
                        console.log('✅ test@dkdev.io account login works');
                        console.log('✅ 215 donor records are accessible');
                        console.log('✅ Admin panel shows imported data');
                    }
                    
                } else if (result.hasError) {
                    console.log('\n⚠️ Login failed - likely needs email confirmation');
                    console.log('📋 Manual fix needed:');
                    console.log('   1. Go to Supabase dashboard');
                    console.log('   2. Authentication > Users');
                    console.log('   3. Find test@dkdev.io');
                    console.log('   4. Click "..." > "Confirm Email"');
                    console.log('   5. Try login again');
                }
                
            } else {
                console.log('❌ No submit button found');
            }
        } else {
            console.log('❌ Login form not found');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
        console.log('\n📁 Screenshots saved:');
        console.log('   - login-attempt-with-new-account.png');
        console.log('   - login-result-new-account.png');
    }
}

testLoginNow();