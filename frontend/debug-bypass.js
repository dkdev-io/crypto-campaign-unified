import puppeteer from 'puppeteer';

async function debugBypassIssues() {
  console.log('🔍 DEEP DEBUGGING AUTH BYPASS ISSUES');
  console.log('==========================================');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    // Test 1: Check environment variables and dev conditions
    console.log('\n📋 1. ENVIRONMENT CHECKS');
    console.log('------------------------');
    
    const page = await browser.newPage();
    
    // Enable console logging from the browser
    page.on('console', msg => console.log('🌐 Browser:', msg.text()));
    page.on('error', err => console.log('❌ Page Error:', err.message));
    page.on('pageerror', err => console.log('❌ JavaScript Error:', err.message));
    
    // Check donor auth page
    console.log('\n🔍 Testing /donors/auth page...');
    await page.goto('http://localhost:5173/donors/auth', { waitUntil: 'networkidle0' });
    
    // Inject debug script to check environment
    const envCheck = await page.evaluate(() => {
      console.log('🔍 ENVIRONMENT DEBUG:');
      console.log('- import.meta.env.DEV:', import.meta.env.DEV);
      console.log('- window.location.hostname:', window.location.hostname);
      console.log('- window.location.href:', window.location.href);
      console.log('- includes netlify.app:', window.location.hostname.includes('netlify.app'));
      
      const devCondition = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname.includes('netlify.app');
      console.log('- Final condition result:', devCondition);
      
      return {
        isDev: import.meta.env.DEV,
        hostname: window.location.hostname,
        href: window.location.href,
        shouldShowButton: devCondition
      };
    });
    
    console.log('📊 Environment Check Results:', envCheck);
    
    // Check for bypass buttons in DOM
    console.log('\n🔍 2. DOM BUTTON ANALYSIS');
    console.log('-------------------------');
    
    const allButtons = await page.$$eval('button', buttons => 
      buttons.map(btn => ({
        text: btn.textContent.trim(),
        className: btn.className,
        disabled: btn.disabled,
        type: btn.type,
        visible: btn.offsetWidth > 0 && btn.offsetHeight > 0
      }))
    );
    
    console.log('📊 All buttons found:', allButtons);
    
    const bypassButton = allButtons.find(btn => 
      btn.text.includes('DEV BYPASS') || btn.text.includes('Dashboard')
    );
    
    if (bypassButton) {
      console.log('✅ Bypass button found:', bypassButton);
    } else {
      console.log('❌ No bypass button found in DOM');
    }
    
    // Test 2: Campaign auth page
    console.log('\n🔍 Testing /campaigns/auth page...');
    await page.goto('http://localhost:5173/campaigns/auth', { waitUntil: 'networkidle0' });
    
    const campaignEnvCheck = await page.evaluate(() => {
      const devCondition = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname.includes('netlify.app');
      console.log('🔍 CAMPAIGN ENVIRONMENT DEBUG:');
      console.log('- Final condition result:', devCondition);
      return { shouldShowButton: devCondition };
    });
    
    const campaignButtons = await page.$$eval('button', buttons => 
      buttons.map(btn => ({
        text: btn.textContent.trim(),
        className: btn.className,
        disabled: btn.disabled,
        visible: btn.offsetWidth > 0 && btn.offsetHeight > 0
      }))
    );
    
    console.log('📊 Campaign buttons found:', campaignButtons);
    
    const campaignBypassButton = campaignButtons.find(btn => 
      btn.text.includes('DEV BYPASS') || btn.text.includes('Setup')
    );
    
    if (campaignBypassButton) {
      console.log('✅ Campaign bypass button found:', campaignBypassButton);
      
      // Try clicking it
      console.log('\n🖱️ Testing campaign button click...');
      const buttonElement = await page.$(`button:has-text("${campaignBypassButton.text}")`);
      if (!buttonElement) {
        // Alternative approach
        const buttons = await page.$$('button');
        for (let btn of buttons) {
          const text = await btn.evaluate(el => el.textContent);
          if (text.includes('DEV BYPASS')) {
            console.log('🖱️ Clicking bypass button...');
            await btn.click();
            
            // Wait and check where we ended up
            await page.waitForTimeout(2000);
            const finalUrl = page.url();
            console.log('📍 After click, URL is:', finalUrl);
            break;
          }
        }
      }
    } else {
      console.log('❌ No campaign bypass button found');
    }
    
    // Test 3: Check if protected routes are working
    console.log('\n🔍 3. PROTECTED ROUTE TEST');
    console.log('---------------------------');
    
    // Clear any existing auth state
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await page.goto('http://localhost:5173/campaigns/auth/setup?bypass=true', { 
      waitUntil: 'networkidle0' 
    });
    
    const protectedRouteUrl = page.url();
    console.log('📍 Protected route final URL:', protectedRouteUrl);
    
    if (protectedRouteUrl.includes('/campaigns/auth/setup')) {
      console.log('✅ Protected route bypass working');
    } else {
      console.log('❌ Protected route redirected, bypass not working');
    }
    
    // Check for any React errors or warnings
    const hasErrors = await page.evaluate(() => {
      return window.__REACT_DEVTOOLS_GLOBAL_HOOK__ && 
             window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot;
    });
    
    console.log('\n📊 FINAL ANALYSIS:');
    console.log('==================');
    console.log('- Donor bypass button found:', !!bypassButton);
    console.log('- Campaign bypass button found:', !!campaignBypassButton);
    console.log('- Environment conditions met:', envCheck.shouldShowButton);
    console.log('- Protected route working:', protectedRouteUrl.includes('/campaigns/auth/setup'));
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await browser.close();
  }
}

debugBypassIssues().catch(console.error);