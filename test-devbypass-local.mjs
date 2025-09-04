import puppeteer from 'puppeteer';

async function testDevBypass() {
  console.log('🔍 Testing DEV BYPASS button functionality...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    devtools: true
  });

  const page = await browser.newPage();

  // Enable console logging
  page.on('console', msg => {
    console.log('Browser Console:', msg.text());
  });

  page.on('pageerror', error => {
    console.error('Page Error:', error.message);
  });

  try {
    console.log('1️⃣ Navigating to campaign auth page...');
    await page.goto('http://localhost:5173/campaigns/auth', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });

    console.log('2️⃣ Checking if page loaded correctly...');
    const title = await page.title();
    console.log('   Page title:', title);

    // Wait a moment for React to render
    await page.waitForSelector('button', { timeout: 5000 });

    console.log('3️⃣ Looking for buttons on the page...');
    const buttons = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      return allButtons.map(btn => ({
        text: btn.innerText,
        className: btn.className,
        visible: btn.offsetParent !== null
      }));
    });

    console.log('   Found buttons:', buttons);

    // Look specifically for DEV BYPASS button
    const bypassButtonExists = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(btn => btn.innerText.includes('DEV BYPASS'));
    });

    if (bypassButtonExists) {
      console.log('✅ DEV BYPASS button found!');
      
      console.log('4️⃣ Clicking the DEV BYPASS button...');
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const bypassBtn = buttons.find(btn => btn.innerText.includes('DEV BYPASS'));
        if (bypassBtn) {
          bypassBtn.click();
        }
      });

      // Wait for navigation or state change
      await page.waitForTimeout(2000);

      const newUrl = page.url();
      console.log('5️⃣ Current URL after click:', newUrl);

      // Check if we navigated to setup
      if (newUrl.includes('/campaigns/auth/setup')) {
        console.log('✅ Successfully navigated to setup page!');
        
        // Check page content
        const pageContent = await page.evaluate(() => document.body.innerText);
        if (pageContent.includes('Committee') || pageContent.includes('Setup') || pageContent.includes('Step')) {
          console.log('✅ Setup wizard is visible!');
        } else if (pageContent.includes('Sign In') || pageContent.includes('Sign Up')) {
          console.log('❌ Still showing auth page - bypass didn\'t work');
        }
      } else {
        console.log('❌ Did not navigate to setup page');
      }
    } else {
      console.log('❌ DEV BYPASS button not found!');
      console.log('   This could mean:');
      console.log('   - Not running in development mode');
      console.log('   - Button conditional rendering issue');
      
      // Check if we're in dev mode
      const isDev = await page.evaluate(() => {
        return window.location.hostname === 'localhost';
      });
      console.log('   Is localhost?', isDev);
    }

    // Take a screenshot for debugging
    await page.screenshot({ path: 'devbypass-test-result.png' });
    console.log('📸 Screenshot saved as devbypass-test-result.png');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testDevBypass().catch(console.error);