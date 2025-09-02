import puppeteer from 'puppeteer';

async function testDonorTitle() {
    console.log('🚀 Testing donor page title change...');
    
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: { width: 1280, height: 720 }
        });
        
        const page = await browser.newPage();
        
        // Test the main Netlify site first
        const testUrl = 'https://cryptocampaign.netlify.app/donors/auth';
        console.log(`\n📍 Testing URL: ${testUrl}`);
        
        try {
            // Navigate to the page
            const response = await page.goto(testUrl, { 
                waitUntil: 'domcontentloaded',
                timeout: 15000 
            });
            
            console.log(`📡 Response Status: ${response.status()}`);
            
            if (response.status() === 200) {
                // Wait for content to load
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // Check page content
                const pageContent = await page.content();
                console.log(`📄 Page loaded, content length: ${pageContent.length}`);
                
                // Look for the specific donor header
                const headerText = await page.evaluate(() => {
                    const h2Elements = document.querySelectorAll('h2');
                    for (let h2 of h2Elements) {
                        const text = h2.textContent.trim();
                        if (text === 'Donors' || text === 'Donor Portal') {
                            return text;
                        }
                    }
                    
                    // Also check for any text containing "Donor"
                    const allText = document.body.textContent;
                    if (allText.includes('Donor Portal')) {
                        return 'Donor Portal (found in body)';
                    } else if (allText.includes('Donors')) {
                        return 'Donors (found in body)';
                    }
                    
                    return 'Not found';
                });
                
                console.log(`🎯 Header Analysis: "${headerText}"`);
                
                // Take screenshot
                await page.screenshot({ 
                    path: 'donor-auth-test.png',
                    fullPage: true
                });
                console.log('📸 Screenshot saved: donor-auth-test.png');
                
                // Check if title was updated correctly
                if (headerText === 'Donors') {
                    console.log('🎉 SUCCESS: Title correctly shows "Donors"');
                } else if (headerText.includes('Donor Portal')) {
                    console.log('⚠️  ISSUE: Title still shows "Donor Portal"');
                    console.log('This suggests the deployment may not have completed yet or there was a caching issue.');
                } else {
                    console.log(`❓ UNEXPECTED: Title shows "${headerText}"`);
                }
                
            } else {
                console.log(`❌ Page returned ${response.status()}`);
            }
            
        } catch (navError) {
            console.log(`❌ Navigation error: ${navError.message}`);
            
            // Try the alternative URL
            const altUrl = 'https://crypto-campaign-unified.netlify.app/donors/auth';
            console.log(`\n📍 Trying alternative URL: ${altUrl}`);
            
            try {
                const altResponse = await page.goto(altUrl, { 
                    waitUntil: 'domcontentloaded',
                    timeout: 15000 
                });
                console.log(`📡 Alternative Response Status: ${altResponse.status()}`);
                
                if (altResponse.status() === 200) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    
                    const headerText = await page.evaluate(() => {
                        const h2Elements = document.querySelectorAll('h2');
                        for (let h2 of h2Elements) {
                            const text = h2.textContent.trim();
                            if (text === 'Donors' || text === 'Donor Portal') {
                                return text;
                            }
                        }
                        return 'Not found';
                    });
                    
                    console.log(`🎯 Alternative site header: "${headerText}"`);
                    
                    await page.screenshot({ 
                        path: 'donor-auth-alt-test.png',
                        fullPage: true
                    });
                    console.log('📸 Alt screenshot saved: donor-auth-alt-test.png');
                }
                
            } catch (altError) {
                console.log(`❌ Alternative URL also failed: ${altError.message}`);
            }
        }
        
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

testDonorTitle().catch(console.error);