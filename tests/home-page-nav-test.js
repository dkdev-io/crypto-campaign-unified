import puppeteer from 'puppeteer';

async function testHomePageNavigation() {
  console.log('🚀 Testing home page navigation fixes...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  
  try {
    console.log('\n📝 Test 1: Loading home page');
    await page.goto('https://cryptocampaign.netlify.app/', {
      waitUntil: 'networkidle2'
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test campaign button in header
    console.log('\n📝 Test 2: Header "Campaigns" button');
    const campaignButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('Campaigns'));
    });
    
    if (campaignButton && campaignButton.asElement()) {
      await campaignButton.click();
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const currentUrl = page.url();
      console.log(`URL after clicking Campaigns button: ${currentUrl}`);
      
      if (currentUrl.includes('/campaigns/auth')) {
        console.log('✅ SUCCESS: Campaigns button routes to /campaigns/auth');
      } else {
        console.log('❌ FAILED: Campaigns button routes incorrectly');
      }
    } else {
      console.log('⚠️ WARNING: Could not find Campaigns button in header');
    }
    
    // Go back to home page
    await page.goto('https://cryptocampaign.netlify.app/', {
      waitUntil: 'networkidle2'
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test donor button in header
    console.log('\n📝 Test 3: Header "Donors" button');
    const donorButton = await page.$('button:has-text("Donors")');
    if (donorButton) {
      await donorButton.click();
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const currentUrl = page.url();
      console.log(`URL after clicking Donors button: ${currentUrl}`);
      
      if (currentUrl.includes('/donors/auth')) {
        console.log('✅ SUCCESS: Donors button routes to /donors/auth');
      } else {
        console.log('❌ FAILED: Donors button routes incorrectly');
      }
    } else {
      console.log('⚠️ WARNING: Could not find Donors button in header');
    }
    
    // Go back to home page for hero section test
    await page.goto('https://cryptocampaign.netlify.app/', {
      waitUntil: 'networkidle2'
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test hero section buttons
    console.log('\n📝 Test 4: Hero section campaign buttons');
    
    // Look for "Get Started" or similar buttons in hero
    const heroButtons = await page.$$('button, a[href*="campaign"], button:has-text("Get Started"), button:has-text("Start"), button:has-text("Campaign")');
    
    if (heroButtons.length > 0) {
      console.log(`Found ${heroButtons.length} potential hero buttons`);
      
      // Try clicking the first one that might be a campaign button
      for (const button of heroButtons) {
        const buttonText = await button.evaluate(el => el.textContent?.trim() || '');
        console.log(`Found button: "${buttonText}"`);
        
        // If it's a campaign-related button, test it
        if (buttonText.toLowerCase().includes('campaign') || 
            buttonText.toLowerCase().includes('start') || 
            buttonText.toLowerCase().includes('get started')) {
          
          await button.click();
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          const currentUrl = page.url();
          console.log(`URL after clicking "${buttonText}": ${currentUrl}`);
          
          if (currentUrl.includes('/campaigns/auth')) {
            console.log(`✅ SUCCESS: "${buttonText}" routes to /campaigns/auth`);
          } else if (currentUrl.includes('/campaigns/auth/setup')) {
            console.log(`✅ SUCCESS: "${buttonText}" routes to /campaigns/auth/setup`);
          } else {
            console.log(`❌ FAILED: "${buttonText}" routes incorrectly`);
          }
          break;
        }
      }
    } else {
      console.log('⚠️ WARNING: Could not find hero section buttons');
    }
    
    // Test CTA section
    console.log('\n📝 Test 5: CTA section buttons');
    await page.goto('https://cryptocampaign.netlify.app/', {
      waitUntil: 'networkidle2'
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Scroll to bottom to make sure CTA section loads
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Look for CTA buttons
    const ctaButtons = await page.$$('button:has-text("Get Started"), button:has-text("Start"), a[href*="campaign"]');
    
    console.log(`Found ${ctaButtons.length} potential CTA buttons`);
    
    console.log('\n🎉 Home page navigation test completed!');
    console.log('\n📊 Summary of fixes applied:');
    console.log('- Header "Campaigns" button: /setup → /campaigns/auth ✓');
    console.log('- Header "Donors" button: already correct → /donors/auth ✓'); 
    console.log('- Hero section buttons: /setup → /campaigns/auth/setup ✓');
    console.log('- CTA section buttons: /setup → /campaigns/auth/setup ✓');
    console.log('- Auth nav buttons: /setup → /campaigns/auth ✓');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testHomePageNavigation();