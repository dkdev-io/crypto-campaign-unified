#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function quickCheck() {
  console.log('🔍 Quick Breadcrumb Check on Live Site');
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('📍 Loading https://cryptocampaign.netlify.app/auth...');
    await page.goto('https://cryptocampaign.netlify.app/auth', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    // Wait for React to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check what's actually in the page
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        hasNav: !!document.querySelector('nav'),
        allNavs: Array.from(document.querySelectorAll('nav')).map(nav => ({
          text: nav.textContent.slice(0, 100),
          ariaLabel: nav.getAttribute('aria-label'),
          className: nav.className
        })),
        hasHomeLink: !!document.querySelector('a[href="/"]'),
        bodyClasses: document.body.className,
        bodyText: document.body.textContent.slice(0, 200)
      };
    });
    
    console.log('📊 Page Analysis:');
    console.log('   Title:', pageInfo.title);
    console.log('   Has nav elements:', pageInfo.hasNav);
    console.log('   Number of navs:', pageInfo.allNavs.length);
    console.log('   Has home link:', pageInfo.hasHomeLink);
    console.log('   Body classes:', pageInfo.bodyClasses);
    console.log('   Body text start:', pageInfo.bodyText);
    
    if (pageInfo.allNavs.length > 0) {
      console.log('\n📍 Nav elements found:');
      pageInfo.allNavs.forEach((nav, i) => {
        console.log(`   ${i + 1}. "${nav.text}" (aria: ${nav.ariaLabel}, class: ${nav.className})`);
      });
    }
    
    // Check if it's the expected page content
    const isAuthPage = pageInfo.bodyText.includes('Sign') || pageInfo.bodyText.includes('auth');
    console.log('\n✅ Verification:', isAuthPage ? 'Auth page loaded correctly' : 'Unexpected page content');
    
    return pageInfo;
    
  } finally {
    await browser.close();
  }
}

quickCheck().catch(console.error);