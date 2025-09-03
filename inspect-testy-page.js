import puppeteer from 'puppeteer';

async function inspectTestyPage() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null 
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('🔍 Inspecting Testy campaign page...');
    
    // Go to the campaign page
    await page.goto('http://localhost:5174/testy', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Take screenshot
    const screenshotPath = '/Users/Danallovertheplace/crypto-campaign-unified/testy-page-screenshot.png';
    await page.screenshot({ 
      path: screenshotPath, 
      fullPage: true 
    });
    console.log('📸 Screenshot saved:', screenshotPath);
    
    // Get page info
    const url = page.url();
    const title = await page.title();
    console.log('📍 Current URL:', url);
    console.log('📄 Page Title:', title);
    
    // Check what's visible on page
    const pageContent = await page.evaluate(() => {
      const body = document.body;
      if (!body) return 'No body element';
      
      // Get all text content
      const allText = body.innerText || body.textContent || '';
      
      // Get main headings
      const h1s = Array.from(document.querySelectorAll('h1')).map(el => el.textContent);
      const h2s = Array.from(document.querySelectorAll('h2')).map(el => el.textContent);
      
      // Check for forms
      const forms = document.querySelectorAll('form').length;
      const inputs = document.querySelectorAll('input').length;
      const buttons = document.querySelectorAll('button').length;
      
      // Check for error messages
      const errorElements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && (
          el.textContent.includes('not found') ||
          el.textContent.includes('Not Found') ||
          el.textContent.includes('404') ||
          el.textContent.includes('error')
        )
      ).map(el => el.textContent);
      
      return {
        textLength: allText.length,
        firstChars: allText.substring(0, 500),
        h1s,
        h2s,
        forms,
        inputs, 
        buttons,
        errors: errorElements
      };
    });
    
    console.log('\n🔍 PAGE ANALYSIS:');
    console.log('─'.repeat(50));
    console.log('Text content length:', pageContent.textLength);
    console.log('H1 headings:', pageContent.h1s.length ? pageContent.h1s : 'None found');
    console.log('H2 headings:', pageContent.h2s.length ? pageContent.h2s : 'None found');
    console.log('Forms found:', pageContent.forms);
    console.log('Input fields:', pageContent.inputs);
    console.log('Buttons found:', pageContent.buttons);
    
    if (pageContent.errors.length > 0) {
      console.log('❌ Errors found:', pageContent.errors);
    } else {
      console.log('✅ No error messages detected');
    }
    
    console.log('\n📝 FIRST 500 CHARACTERS:');
    console.log(pageContent.firstChars);
    
    // Check if it's loading React app or showing 404
    const isReactApp = await page.evaluate(() => {
      return document.getElementById('root') !== null;
    });
    
    console.log('\n⚛️ React app container found:', isReactApp ? '✅' : '❌');
    
    // Check network requests
    const responses = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        responses.push({
          url: response.url(),
          status: response.status()
        });
      }
    });
    
    // Wait a bit more to see if content loads
    console.log('\n⏳ Waiting for additional content to load...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check again after waiting
    const finalContent = await page.evaluate(() => {
      const body = document.body;
      const text = body ? (body.innerText || body.textContent || '') : '';
      return {
        hasTestyText: text.toLowerCase().includes('testy'),
        hasCampaignText: text.toLowerCase().includes('campaign'),
        hasDonationText: text.toLowerCase().includes('donation'),
        hasFormElements: document.querySelectorAll('form, input[type="text"], input[type="email"]').length > 0
      };
    });
    
    console.log('\n🔍 CONTENT CHECK:');
    console.log('Contains "Testy":', finalContent.hasTestyText ? '✅' : '❌');
    console.log('Contains "Campaign":', finalContent.hasCampaignText ? '✅' : '❌');
    console.log('Contains "Donation":', finalContent.hasDonationText ? '✅' : '❌');
    console.log('Has form elements:', finalContent.hasFormElements ? '✅' : '❌');
    
    if (responses.length > 0) {
      console.log('\n❌ FAILED REQUESTS:');
      responses.forEach(r => console.log(`${r.status}: ${r.url}`));
    }
    
    console.log('\n📸 Screenshot location:', screenshotPath);
    console.log('🔍 Browser window left open for manual inspection');
    
    // Keep browser open for manual inspection
    console.log('\nPress Ctrl+C when done inspecting...');
    await new Promise(() => {}); // Keep running
    
  } catch (error) {
    console.error('❌ Error inspecting page:', error.message);
  } finally {
    // Browser will be closed when user presses Ctrl+C
  }
}

inspectTestyPage();