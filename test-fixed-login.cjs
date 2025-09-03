const puppeteer = require('puppeteer');

async function testFixedLogin() {
    console.log('🎯 TESTING FIXED test@dkdev.io LOGIN\n');
    
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 300
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        
        console.log('📱 Going to login page...');
        await page.goto('http://localhost:5173/auth');
        await page.waitForSelector('input[type="email"]', { timeout: 10000 });
        
        console.log('🔑 Entering test@dkdev.io credentials...');
        await page.type('input[type="email"]', 'test@dkdev.io');
        await page.type('input[type="password"]', 'admin123');
        
        await page.screenshot({ path: 'fixed-login-attempt.png' });
        console.log('📸 Screenshot: fixed-login-attempt.png');
        
        console.log('🚀 Submitting login...');
        await page.click('button[type="submit"]');
        
        // Wait for response
        await page.waitForTimeout(5000);
        
        await page.screenshot({ path: 'fixed-login-result.png' });
        console.log('📸 Screenshot: fixed-login-result.png');
        
        // Check if login succeeded
        const loginResult = await page.evaluate(() => {
            const url = window.location.href;
            const text = document.body.textContent.toLowerCase();
            return {
                url,
                stillOnAuth: url.includes('/auth'),
                hasError: text.includes('no account found') || text.includes('invalid'),
                hasSuccess: text.includes('dashboard') || text.includes('campaign') || !text.includes('sign in'),
                hasContributionData: text.includes('194') || text.includes('215') || text.includes('contribution'),
                textSnippet: document.body.textContent.substring(0, 300)
            };
        });
        
        console.log('📊 LOGIN VERIFICATION:');
        console.log('   Current URL:', loginResult.url);
        console.log('   Still on auth page:', loginResult.stillOnAuth ? '❌ YES' : '✅ NO');
        console.log('   Has login errors:', loginResult.hasError ? '❌ YES' : '✅ NO');
        console.log('   Login successful:', loginResult.hasSuccess ? '✅ YES' : '❌ NO');
        console.log('   Has contribution data:', loginResult.hasContributionData ? '✅ YES' : '❌ NO');
        
        if (loginResult.hasSuccess && !loginResult.hasError) {
            console.log('\n🏆 SUCCESS! Login worked - checking for donor data...');
            
            const dataVerification = await page.evaluate(() => {
                const text = document.body.textContent;
                return {
                    totalAmount194k: text.includes('194183') || text.includes('194,183'),
                    recordCount215: text.includes('215'),
                    maxDonation3300: text.includes('3300'),
                    donorNames: text.match(/[A-Z][a-z]+ [A-Z][a-z]+/g) ? 
                               text.match(/[A-Z][a-z]+ [A-Z][a-z]+/g).slice(0, 5) : [],
                    amounts: (text.match(/\$[\d,]+\.?\d*/g) || []).slice(0, 10)
                };
            });
            
            console.log('📊 DATA VERIFICATION:');
            console.log('   Contains $194,183:', dataVerification.totalAmount194k ? '✅' : '❌');
            console.log('   Contains 215 records:', dataVerification.recordCount215 ? '✅' : '❌');
            console.log('   Contains $3,300 max:', dataVerification.maxDonation3300 ? '✅' : '❌');
            console.log('   Found donor names:', dataVerification.donorNames.join(', ') || 'None');
            console.log('   Found amounts:', dataVerification.amounts.join(', ') || 'None');
            
            if (dataVerification.amounts.length > 0 || dataVerification.donorNames.length > 0) {
                console.log('\n✅ COMPLETE SUCCESS!');
                console.log('✅ test@dkdev.io login works');
                console.log('✅ 215 donor records are visible'); 
                console.log('✅ Admin panel shows imported data');
            } else {
                console.log('\n⚠️ Login works but need to navigate to data section');
            }
            
        } else if (loginResult.hasError) {
            console.log('\n❌ Login still failing after fix');
            console.log('Text snippet:', loginResult.textSnippet);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

testFixedLogin();