import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function takeScreenshots() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  try {
    // Take screenshots of key pages
    const pages = [
      { name: 'campaign-auth', url: '/campaigns/auth' },
      { name: 'donor-auth', url: '/donors/auth' },
      { name: 'campaign-setup', url: '/campaigns/auth/setup' }
    ];
    
    for (const pageInfo of pages) {
      try {
        console.log(`Taking screenshot of ${pageInfo.name}...`);
        await page.goto(`http://localhost:3000${pageInfo.url}`, { waitUntil: 'networkidle0' });
        await page.screenshot({ 
          path: `/private/tmp/${pageInfo.name}-current.png`,
          fullPage: true 
        });
        console.log(`✅ Screenshot saved: /private/tmp/${pageInfo.name}-current.png`);
      } catch (error) {
        console.log(`❌ Failed to screenshot ${pageInfo.name}: ${error.message}`);
      }
    }
    
  } finally {
    await browser.close();
  }
}

takeScreenshots().catch(console.error);