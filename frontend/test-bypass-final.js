import puppeteer from 'puppeteer';

async function testBypassFinal() {
  console.log('🎯 FINAL BYPASS TEST - After Fixes');
  console.log('==================================');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.text().includes('BYPASS') || msg.text().includes('DEV')) {
        console.log('🌐', msg.text());
      }
    });
    
    // Test 1: Donor Auth - should now show auth form with bypass button
    console.log('\n🔍 Testing Donor Auth (should show form now)...');
    await page.goto('http://localhost:5177/donors/auth', { waitUntil: 'networkidle0' });
    
    const donorButtons = await page.$$eval('button', buttons => 
      buttons.map(btn => ({
        text: btn.textContent.trim(),
        visible: btn.offsetWidth > 0 && btn.offsetHeight > 0
      })).filter(btn => btn.visible)
    );
    
    console.log('📊 Visible donor buttons:', donorButtons.map(b => b.text));
    
    const donorBypassBtn = donorButtons.find(b => b.text.includes('DEV BYPASS'));
    if (donorBypassBtn) {
      console.log('✅ DONOR BYPASS BUTTON FOUND:', donorBypassBtn.text);
      
      // Click it
      const buttons = await page.$$('button');
      for (let btn of buttons) {
        const text = await btn.evaluate(el => el.textContent);
        if (text.includes('DEV BYPASS')) {
          console.log('🖱️ Clicking donor bypass...');
          await btn.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const finalUrl = page.url();
          console.log('📍 Donor final URL:', finalUrl);
          
          if (finalUrl.includes('/donors/dashboard')) {
            console.log('✅ DONOR BYPASS WORKS!');
          } else {
            console.log('❌ DONOR BYPASS FAILED');
          }
          break;
        }
      }
    } else {
      console.log('❌ Donor bypass button still not found');
    }
    
    // Test 2: Campaign Auth
    console.log('\n🔍 Testing Campaign Auth...');
    await page.goto('http://localhost:5177/campaigns/auth', { waitUntil: 'networkidle0' });
    
    const campaignButtons = await page.$$eval('button', buttons => 
      buttons.map(btn => ({
        text: btn.textContent.trim(),
        visible: btn.offsetWidth > 0 && btn.offsetHeight > 0
      })).filter(btn => btn.visible)
    );
    
    console.log('📊 Visible campaign buttons:', campaignButtons.map(b => b.text));
    
    const campaignBypassBtn = campaignButtons.find(b => b.text.includes('DEV BYPASS'));
    if (campaignBypassBtn) {
      console.log('✅ CAMPAIGN BYPASS BUTTON FOUND:', campaignBypassBtn.text);
      
      // Click it
      const buttons = await page.$$('button');
      for (let btn of buttons) {
        const text = await btn.evaluate(el => el.textContent);
        if (text.includes('DEV BYPASS')) {
          console.log('🖱️ Clicking campaign bypass...');
          await btn.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const finalUrl = page.url();
          console.log('📍 Campaign final URL:', finalUrl);
          
          if (finalUrl.includes('/campaigns/auth/setup')) {
            console.log('✅ CAMPAIGN BYPASS WORKS!');
          } else {
            console.log('❌ CAMPAIGN BYPASS FAILED');
          }
          break;
        }
      }
    } else {
      console.log('❌ Campaign bypass button not found');
    }
    
    console.log('\n🏆 FINAL RESULTS:');
    console.log('================');
    console.log('✅ Donor bypass button found:', !!donorBypassBtn);
    console.log('✅ Campaign bypass button found:', !!campaignBypassBtn);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testBypassFinal().catch(console.error);