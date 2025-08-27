const puppeteer = require('puppeteer');

async function testNetlifySite() {
    let browser;
    try {
        console.log('🚀 Testing Netlify deployment: https://cryptocampaign.netlify.app/');
        
        browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Set viewport and user agent
        await page.setViewport({ width: 1280, height: 720 });
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
        
        
        // Navigate with timeout
        const response = await page.goto('https://cryptocampaign.netlify.app/', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        
        // Check if page loaded successfully
        if (response.status() === 200) {
            console.log('✅ Site is accessible!');
            
            // Get page title
            const title = await page.title();
            
            // Check for React app mounting
            await page.waitForSelector('body', { timeout: 5000 });
            
            // Get some basic page info
            const bodyText = await page.evaluate(() => {
                return document.body.innerText.slice(0, 200) + '...';
            });
            
            
            // Check for common error indicators
            const hasErrorText = bodyText.toLowerCase().includes('error') || 
                               bodyText.toLowerCase().includes('404') ||
                               bodyText.toLowerCase().includes('not found');
            
            if (hasErrorText) {
                console.log('⚠️  Warning: Page may contain error content');
            }
            
            // Check if it's a React app
            const hasReactRoot = await page.evaluate(() => {
                return !!document.querySelector('#root') || 
                       !!document.querySelector('[data-reactroot]') ||
                       window.React !== undefined;
            });
            
            
            // Take a screenshot for verification
            await page.screenshot({ 
                path: '/Users/Danallovertheplace/crypto-campaign-unified/scripts/netlify-site-screenshot.png',
                fullPage: false
            });
            
            return {
                status: 'SUCCESS',
                statusCode: response.status(),
                title,
                isReactApp: hasReactRoot,
                hasErrors: hasErrorText,
                contentPreview: bodyText
            };
            
        } else {
            return {
                status: 'FAILED',
                statusCode: response.status(),
                error: `HTTP ${response.status()}`
            };
        }
        
    } catch (error) {
        console.error('❌ Error testing site:', error.message);
        return {
            status: 'ERROR',
            error: error.message
        };
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

testNetlifySite().then(result => {
    console.log('\n📊 Final Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.status === 'SUCCESS') {
    } else {
    }
    
    process.exit(result.status === 'SUCCESS' ? 0 : 1);
});