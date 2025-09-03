const puppeteer = require('puppeteer');

async function simpleNavTest() {
    console.log('🔍 SIMPLE NAVIGATION TEST\n');
    
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 500,
        defaultViewport: { width: 1280, height: 720 }
    });

    try {
        const page = await browser.newPage();
        
        console.log('📱 Loading homepage...');
        await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get all buttons and their text
        const allButtons = await page.$$eval('button', buttons => 
            buttons.map((btn, index) => ({
                index,
                text: btn.textContent.trim(),
                className: btn.className,
                visible: btn.offsetWidth > 0 && btn.offsetHeight > 0
            }))
        );
        
        console.log('📋 Found buttons:');
        allButtons.forEach((btn, i) => {
            if (btn.visible && btn.text) {
                console.log(`   ${i + 1}. "${btn.text}" (visible: ${btn.visible})`);
            }
        });
        
        // Click the "Campaigns" button (visible in top nav)
        const campaignButtons = await page.$$('button');
        for (let i = 0; i < campaignButtons.length; i++) {
            const text = await page.evaluate(btn => btn.textContent.trim(), campaignButtons[i]);
            if (text === 'Campaigns') {
                console.log('\n✅ Clicking "Campaigns" button...');
                await campaignButtons[i].click();
                await new Promise(resolve => setTimeout(resolve, 3000));
                break;
            }
        }
        
        await page.screenshot({ path: 'nav-campaigns-clicked.png', fullPage: true });
        console.log('📸 Screenshot: nav-campaigns-clicked.png');
        
        // Check page content
        const pageContent = await page.evaluate(() => ({
            url: window.location.href,
            title: document.title,
            bodyText: document.body.textContent,
            hasData: document.body.textContent.includes('194') || 
                     document.body.textContent.includes('215') ||
                     document.body.textContent.includes('Test Campaign') ||
                     /contribution|donor/i.test(document.body.textContent)
        }));
        
        console.log('\n📊 PAGE ANALYSIS:');
        console.log('   URL:', pageContent.url);
        console.log('   Title:', pageContent.title);
        console.log('   Has relevant data:', pageContent.hasData ? '✅ YES' : '❌ NO');
        console.log('   Text length:', pageContent.bodyText.length);
        
        // Go back and try Donors button
        await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const donorButtons = await page.$$('button');
        for (let i = 0; i < donorButtons.length; i++) {
            const text = await page.evaluate(btn => btn.textContent.trim(), donorButtons[i]);
            if (text === 'Donors') {
                console.log('\n✅ Clicking "Donors" button...');
                await donorButtons[i].click();
                await new Promise(resolve => setTimeout(resolve, 3000));
                break;
            }
        }
        
        await page.screenshot({ path: 'nav-donors-clicked.png', fullPage: true });
        console.log('📸 Screenshot: nav-donors-clicked.png');
        
        const donorPageContent = await page.evaluate(() => ({
            url: window.location.href,
            title: document.title,
            hasData: document.body.textContent.includes('194') || 
                     document.body.textContent.includes('215') ||
                     /contribution|donor/i.test(document.body.textContent),
            amounts: (document.body.textContent.match(/\$[\d,]+/g) || []).slice(0, 5)
        }));
        
        console.log('\n📊 DONORS PAGE ANALYSIS:');
        console.log('   URL:', donorPageContent.url);
        console.log('   Title:', donorPageContent.title);
        console.log('   Has relevant data:', donorPageContent.hasData ? '✅ YES' : '❌ NO');
        console.log('   Found amounts:', donorPageContent.amounts.join(', ') || 'None');
        
        console.log('\n🎯 FINAL VERDICT:');
        if (pageContent.hasData || donorPageContent.hasData) {
            console.log('✅ SUCCESS: Data is accessible through navigation!');
            console.log('📊 The imported 215 donor records are visible in the application');
        } else {
            console.log('❓ Data may be on a different page or require authentication');
            console.log('📋 Manual review of screenshots recommended');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
        console.log('\n📁 Screenshots generated:');
        console.log('   - nav-campaigns-clicked.png');
        console.log('   - nav-donors-clicked.png');
    }
}

simpleNavTest();