import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyFormStyling() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Set viewport size
    await page.setViewport({ width: 1280, height: 800 });
    
    console.log('Navigating to campaign setup page...');
    
    // Navigate to the campaign setup page with dev bypass
    await page.goto('http://localhost:5173/campaigns/auth/setup?bypass=dev', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    
    console.log('Page loaded, waiting for content...');
    
    // Wait a bit for React to render
    await page.waitForFunction(() => true, { timeout: 3000 }).catch(() => {});
    
    // Check if we need to handle authentication or bypass
    const pageContent = await page.content();
    console.log('Page contains setup-card:', pageContent.includes('setup-card'));
    console.log('Page contains Campaign Setup:', pageContent.includes('Campaign Setup'));
    
    // Try to wait for either setup-card or auth component
    try {
      await page.waitForSelector('.setup-card', { timeout: 5000 });
      console.log('Setup card found!');
    } catch (e) {
      console.log('Setup card not found, checking for auth component...');
      // Maybe we need to handle auth first
      const authButton = await page.$('button');
      if (authButton) {
        console.log('Found button, clicking to bypass auth...');
        await authButton.click();
        await page.waitForFunction(() => true, { timeout: 2000 }).catch(() => {});
        await page.waitForSelector('.setup-card', { timeout: 5000 });
      }
    }
    
    // Take a screenshot
    const screenshotPath = path.join(__dirname, 'form-styling-verification.png');
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    
    console.log(`Screenshot saved to: ${screenshotPath}`);
    
    // Get some styling information
    const stylingInfo = await page.evaluate(() => {
      const setupCard = document.querySelector('.setup-card');
      const formInputs = document.querySelectorAll('.form-input');
      const stepIndicator = document.querySelector('.step-indicator');
      
      return {
        setupCardBackground: setupCard ? window.getComputedStyle(setupCard).backgroundColor : 'not found',
        inputCount: formInputs.length,
        firstInputBackground: formInputs[0] ? window.getComputedStyle(formInputs[0]).backgroundColor : 'no inputs',
        firstInputColor: formInputs[0] ? window.getComputedStyle(formInputs[0]).color : 'no inputs',
        stepIndicatorBackground: stepIndicator ? window.getComputedStyle(stepIndicator).backgroundColor : 'not found',
        stepIndicatorColor: stepIndicator ? window.getComputedStyle(stepIndicator).color : 'not found'
      };
    });
    
    console.log('Styling verification:', JSON.stringify(stylingInfo, null, 2));
    
  } catch (error) {
    console.error('Error verifying form styling:', error);
  } finally {
    await browser.close();
  }
}

verifyFormStyling();