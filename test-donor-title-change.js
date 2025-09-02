import puppeteer from 'puppeteer';
import fs from 'fs';

async function testDonorTitleChange() {
    console.log('🚀 Testing donor page title change on live Netlify site...');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: { width: 1280, height: 720 }
    });
    
    const page = await browser.newPage();
    
    // Test both potential Netlify URLs
    const urls = [
        'https://cryptocampaign.netlify.app/donors/auth',
        'https://crypto-campaign-unified.netlify.app/donors/auth'
    ];
    
    let successUrl = null;
    let titleFound = null;
    
    for (const url of urls) {
        try {
            console.log(`\n📍 Testing URL: ${url}`);
            
            // Navigate to the page
            await page.goto(url, { 
                waitUntil: 'networkidle2',
                timeout: 10000 
            });
            
            // Wait for the page to load
            await page.waitForTimeout(2000);
            
            // Check if the page loaded successfully
            const title = await page.title();
            console.log(`📄 Page Title: ${title}`);
            
            // Look for the donor header text
            const headerText = await page.evaluate(() => {
                const headers = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
                for (let header of headers) {
                    const text = header.textContent.trim();
                    console.log('Found header:', text);
                    if (text === 'Donors' || text === 'Donor Portal') {
                        return text;
                    }
                }
                return null;
            });
            
            console.log(`🎯 Header Text Found: "${headerText}"`);
            
            // Take a screenshot
            const filename = `donor-title-test-${url.includes('crypto-campaign-unified') ? 'unified' : 'main'}.png`;
            await page.screenshot({ 
                path: filename,
                fullPage: true
            });
            console.log(`📸 Screenshot saved: ${filename}`);
            
            if (headerText) {
                successUrl = url;
                titleFound = headerText;
                break;
            }
            
        } catch (error) {
            console.log(`❌ Error testing ${url}:`, error.message);
        }
    }
    
    await browser.close();
    
    // Results
    console.log('\n=== RESULTS ===');
    if (successUrl) {
        console.log(`✅ Working URL: ${successUrl}`);
        console.log(`📝 Title Found: "${titleFound}"`);
        
        if (titleFound === 'Donors') {
            console.log('🎉 SUCCESS: Title correctly shows "Donors"');
        } else if (titleFound === 'Donor Portal') {
            console.log('⚠️  ISSUE: Title still shows "Donor Portal" - deployment may not have completed yet');
        } else {
            console.log(`❓ UNEXPECTED: Title shows "${titleFound}"`);
        }
    } else {
        console.log('❌ FAILED: Could not access donor auth page on either URL');
        
        // Let's try to check if the sites are accessible at all
        console.log('\n🔍 Testing if sites are accessible...');
        for (const baseUrl of ['https://cryptocampaign.netlify.app', 'https://crypto-campaign-unified.netlify.app']) {
            try {
                await page.goto(baseUrl, { timeout: 5000 });
                console.log(`✅ ${baseUrl} is accessible`);
            } catch (error) {
                console.log(`❌ ${baseUrl} is not accessible: ${error.message}`);
            }
        }
    }
}

testDonorTitleChange().catch(console.error);