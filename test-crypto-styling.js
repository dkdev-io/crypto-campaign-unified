import puppeteer from 'puppeteer';
import fs from 'fs';

async function takeScreenshots() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1200, height: 800 });
  
  console.log('📸 Taking screenshots of localhost:5173...');
  
  // Homepage
  console.log('Taking homepage screenshot...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: '/private/tmp/crypto-homepage.png' });
  
  // Campaign Auth
  console.log('Taking campaign auth screenshot...');
  await page.goto('http://localhost:5173/campaigns/auth', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: '/private/tmp/crypto-campaign-auth.png' });
  
  // Donor Auth  
  console.log('Taking donor auth screenshot...');
  await page.goto('http://localhost:5173/donors/auth', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: '/private/tmp/crypto-donor-auth.png' });
  
  // Campaign Setup Workflow
  console.log('Taking campaign setup screenshot...');
  await page.goto('http://localhost:5173/YourInfo', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: '/private/tmp/crypto-campaign-info.png' });
  
  // Donor Dashboard
  console.log('Taking donor dashboard screenshot...');
  await page.goto('http://localhost:5173/donors/dashboard', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: '/private/tmp/crypto-donor-dashboard.png' });
  
  await browser.close();
  console.log('✅ Screenshots saved to /private/tmp/');
}

takeScreenshots().catch(console.error);