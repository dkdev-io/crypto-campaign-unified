import { chromium } from 'playwright';

async function analyzeButtons() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🔍 Analyzing buttons and links on test site...');
  
  try {
    await page.goto('https://testy-pink-chancellor.lovable.app/?campaign=test-id');
    await page.waitForTimeout(2000);
    
    // Get all clickable elements
    const clickableElements = await page.$$eval('button, a, [onclick]', elements => 
      elements.map(el => ({
        tag: el.tagName,
        text: el.textContent?.trim(),
        href: el.href,
        onclick: el.onclick?.toString(),
        class: el.className,
        id: el.id
      }))
    );
    
    console.log('🔘 Clickable elements found:');
    clickableElements.forEach((el, i) => {
      console.log(`  ${i+1}. ${el.tag}: "${el.text}"`);
      if (el.href) console.log(`     href: ${el.href}`);
      if (el.onclick) console.log(`     onclick: ${el.onclick}`);
      if (el.class) console.log(`     class: ${el.class}`);
    });
    
    // Check for any donation/campaign related links
    const donationLinks = clickableElements.filter(el => 
      el.text?.toLowerCase().includes('donat') ||
      el.text?.toLowerCase().includes('contribut') ||
      el.text?.toLowerCase().includes('campaign') ||
      el.href?.includes('campaign')
    );
    
    console.log('\n💰 Donation/Campaign related elements:');
    donationLinks.forEach(el => {
      console.log(`  "${el.text}" -> ${el.href || 'no href'}`);
    });
    
    // Check what happens when we click "Contribute" button
    const contributeButton = await page.$('text=Contribute');
    if (contributeButton) {
      console.log('\n🎯 Found "Contribute" button, checking what happens...');
      await contributeButton.click();
      await page.waitForTimeout(1000);
      
      const newUrl = page.url();
      const newContent = await page.textContent('body');
      
      console.log('📍 New URL after click:', newUrl);
      console.log('📝 New content length:', newContent.length);
      console.log('📝 New content preview:', newContent.substring(0, 200));
    }
    
  } catch (error) {
    console.error('❌ Analysis error:', error);
  } finally {
    await browser.close();
  }
}

analyzeButtons();