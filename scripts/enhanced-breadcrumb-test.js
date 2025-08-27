#!/usr/bin/env node

const puppeteer = require('puppeteer');

const SITE_URL = 'https://cryptocampaign.netlify.app';

async function testBreadcrumbPresence() {
  console.log('\n🔍 Enhanced Breadcrumb Test - Live Site Analysis');
  console.log('='.repeat(60));
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser for debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Test Auth Page with detailed analysis
    console.log('\n📍 Testing Auth Page: /auth');
    await page.goto(`${SITE_URL}/auth`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take a screenshot for manual verification
    await page.screenshot({ path: '/tmp/auth-page-test.png', fullPage: true });
    console.log('   📸 Screenshot saved to /tmp/auth-page-test.png');
    
    // Check for any navigation elements
    const navElements = await page.evaluate(() => {
      const elements = {
        breadcrumbNavs: [],
        anyNavs: [],
        homeLinks: [],
        campaignRefs: [],
        divWithBreadcrumb: []
      };
      
      // Look for breadcrumb-specific nav
      document.querySelectorAll('nav[aria-label*="readcrumb"], nav[aria-label*="Breadcrumb"]').forEach(nav => {
        elements.breadcrumbNavs.push({
          tagName: nav.tagName,
          ariaLabel: nav.getAttribute('aria-label'),
          textContent: nav.textContent.trim(),
          className: nav.className
        });
      });
      
      // Look for any nav elements
      document.querySelectorAll('nav').forEach(nav => {
        elements.anyNavs.push({
          tagName: nav.tagName,
          ariaLabel: nav.getAttribute('aria-label'),
          textContent: nav.textContent.slice(0, 100), // First 100 chars
          className: nav.className
        });
      });
      
      // Look for Home links
      document.querySelectorAll('a[href="/"], button').forEach(link => {
        if (link.textContent.toLowerCase().includes('home')) {
          elements.homeLinks.push({
            tagName: link.tagName,
            href: link.href,
            textContent: link.textContent.trim(),
            className: link.className
          });
        }
      });
      
      // Look for "Campaign" text
      document.querySelectorAll('*').forEach(el => {
        if (el.textContent && el.textContent.toLowerCase().includes('campaign') && el.children.length === 0) {
          elements.campaignRefs.push({
            tagName: el.tagName,
            textContent: el.textContent.trim(),
            className: el.className
          });
        }
      });
      
      // Look for divs with breadcrumb-related classes
      document.querySelectorAll('div[class*="breadcrumb"], div[class*="nav"]').forEach(div => {
        elements.divWithBreadcrumb.push({
          tagName: div.tagName,
          className: div.className,
          textContent: div.textContent.slice(0, 100)
        });
      });
      
      return elements;
    });
    
    console.log('\n📊 Elements Found:');
    console.log(`   Breadcrumb Navs: ${navElements.breadcrumbNavs.length}`);
    if (navElements.breadcrumbNavs.length > 0) {
      navElements.breadcrumbNavs.forEach((nav, i) => {
        console.log(`     ${i + 1}. ${nav.tagName} - "${nav.textContent}" (${nav.ariaLabel})`);
      });
    }
    
    console.log(`   Any Navs: ${navElements.anyNavs.length}`);
    if (navElements.anyNavs.length > 0) {
      navElements.anyNavs.forEach((nav, i) => {
        console.log(`     ${i + 1}. ${nav.tagName} - "${nav.textContent.slice(0, 50)}..."`);
      });
    }
    
    console.log(`   Home Links: ${navElements.homeLinks.length}`);
    console.log(`   Campaign References: ${navElements.campaignRefs.length}`);
    console.log(`   Breadcrumb Divs: ${navElements.divWithBreadcrumb.length}`);
    
    // Check page source for CampaignBreadcrumb
    const pageContent = await page.content();
    const hasBreadcrumbComponent = pageContent.includes('CampaignBreadcrumb') || 
                                  pageContent.includes('breadcrumb') ||
                                  pageContent.includes('Breadcrumb');
    
    console.log(`\n🔍 Page Analysis:`);
    console.log(`   Contains breadcrumb text: ${hasBreadcrumbComponent ? 'Yes' : 'No'}`);
    console.log(`   React components loaded: ${pageContent.includes('react') ? 'Yes' : 'No'}`);
    console.log(`   Page title: ${await page.title()}`);
    
    // Check network requests for JS errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`   ❌ Console Error: ${msg.text()}`);
      }
    });
    
    // Refresh the page and wait longer
    console.log('\n🔄 Refreshing page and waiting...');
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check again after reload
    const navElementsAfterReload = await page.$$('nav');
    console.log(`   Nav elements after reload: ${navElementsAfterReload.length}`);
    
    // Check if the campaign breadcrumb is in the DOM but maybe hidden
    const hiddenBreadcrumbs = await page.evaluate(() => {
      const allDivs = document.querySelectorAll('div');
      const results = [];
      allDivs.forEach(div => {
        const computedStyle = window.getComputedStyle(div);
        if ((div.textContent.includes('Home') || div.textContent.includes('Campaign')) && 
            (computedStyle.display === 'none' || computedStyle.visibility === 'hidden')) {
          results.push({
            textContent: div.textContent.trim(),
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            className: div.className
          });
        }
      });
      return results;
    });
    
    console.log(`\n🙈 Hidden Elements with Home/Campaign: ${hiddenBreadcrumbs.length}`);
    hiddenBreadcrumbs.forEach((el, i) => {
      console.log(`     ${i + 1}. "${el.textContent}" (display: ${el.display}, visibility: ${el.visibility})`);
    });
    
    return {
      breadcrumbNavsFound: navElements.breadcrumbNavs.length > 0,
      anyNavsFound: navElements.anyNavs.length > 0,
      homeLinksFound: navElements.homeLinks.length > 0,
      campaignRefsFound: navElements.campaignRefs.length > 0,
      pageHasBreadcrumbText: hasBreadcrumbComponent,
      hiddenElementsFound: hiddenBreadcrumbs.length > 0
    };

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    return null;
  } finally {
    // Keep browser open for manual inspection
    console.log('\n⏸️  Browser kept open for manual inspection...');
    console.log('   Close the browser when done inspecting');
    // Don't close automatically: await browser.close();
  }
}

// Run the test
if (require.main === module) {
  testBreadcrumbPresence()
    .then(results => {
      if (results) {
        console.log('\n📋 SUMMARY:');
        console.log(`   Breadcrumbs working: ${results.breadcrumbNavsFound || results.anyNavsFound}`);
        console.log(`   Components present: ${results.pageHasBreadcrumbText}`);
        console.log(`   Navigation found: ${results.homeLinksFound}`);
      }
    })
    .catch(error => {
      console.error('Test script failed:', error);
    });
}

module.exports = { testBreadcrumbPresence };