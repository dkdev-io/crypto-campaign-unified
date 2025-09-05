import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to localhost:5173
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Wait for header to load and get button colors
    await page.waitForSelector('header', { timeout: 10000 });
    
    // Get button colors
    const campaignButtonColor = await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.trim() === 'Campaigns');
      return button ? window.getComputedStyle(button).backgroundColor : null;
    });
    
    const donorButtonColor = await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.trim() === 'Donors');
      return button ? window.getComputedStyle(button).backgroundColor : null;
    });
    
    console.log('Campaign button background color:', campaignButtonColor);
    console.log('Donor button background color:', donorButtonColor);
    
    // Verify colors
    const isGoldish = campaignButtonColor && (
      campaignButtonColor.includes('rgb(255, 215, 0)') || // gold
      campaignButtonColor.includes('rgb(255, 204, 0)') || // yellow-400
      campaignButtonColor.includes('hsl(45') || // gold hue
      campaignButtonColor.includes('255, 215') // gold RGB values
    );
    
    const isLightBlue = donorButtonColor && (
      donorButtonColor.includes('lightblue') ||
      donorButtonColor.includes('rgb(173, 216, 230)') || // lightblue RGB
      donorButtonColor.includes('hsl(195') // light blue hue
    );
    
    console.log('\n=== VERIFICATION RESULTS ===');
    console.log('Campaign button is gold/yellow:', isGoldish ? '✅ PASS' : '❌ FAIL');
    console.log('Donor button is light blue:', isLightBlue ? '✅ PASS' : '❌ FAIL');
    
    if (isGoldish && isLightBlue) {
      console.log('\n🎉 SUCCESS: Both buttons have the correct colors!');
    } else {
      console.log('\n⚠️  WARNING: Button colors may not match expectations');
    }
    
  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await browser.close();
  }
})();