#!/usr/bin/env node

/**
 * Iframe Inspector - Deep dive into the donation form iframe
 */

const puppeteer = require('puppeteer');

async function inspectIframe() {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 1000,
    args: ['--disable-web-security', '--disable-features=VizDisplayCompositor'],
  });
  const page = await browser.newPage();

  try {
    await page.goto('https://testy-pink-chancellor.lovable.app', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Click donate button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      const donateBtn = buttons.find((btn) => btn.textContent.toLowerCase().includes('donate'));
      if (donateBtn) donateBtn.click();
    });

    await new Promise((resolve) => setTimeout(resolve, 5000));
    console.log('✅ Donate button clicked, modal should be open');

    const iframeAnalysis = await page.evaluate(() => {
      const iframes = document.querySelectorAll('iframe');
      return Array.from(iframes).map((iframe) => ({
        src: iframe.src,
        visible: iframe.offsetParent !== null,
        width: iframe.width || iframe.style.width,
        height: iframe.height || iframe.style.height,
        id: iframe.id,
        className: iframe.className,
        readyState: iframe.contentDocument?.readyState,
        accessible: !!iframe.contentDocument,
        parentElement: iframe.parentElement?.className,
      }));
    });

    iframeAnalysis.forEach((iframe, i) => {});

    if (iframeAnalysis.length === 0) {
      console.log('❌ No iframes found!');
      return;
    }

    const donationIframe = iframeAnalysis[0]; // Assuming first iframe is the donation form

    // Check if it's actually localhost or a production URL
    const iframeSrc = donationIframe.src;
    const isLocalhost = iframeSrc.includes('localhost') || iframeSrc.includes('127.0.0.1');
    const isProduction = iframeSrc.includes('https://') && !isLocalhost;

    if (isLocalhost) {
      // Try to identify what the production URL should be

      // Common patterns for iframe URLs in production
      const baseUrl = 'https://testy-pink-chancellor.lovable.app';
      const possibleUrls = [
        iframeSrc.replace('localhost:5173', 'testy-pink-chancellor.lovable.app'),
        iframeSrc.replace('http://localhost:5173', baseUrl),
        `${baseUrl}/donate`,
        `${baseUrl}/form`,
        `${baseUrl}/donation-form`,
      ];

      for (const testUrl of possibleUrls) {
        try {
          const response = await fetch(testUrl, { method: 'HEAD' });
          if (response.ok) {
          }
        } catch (error) {
          console.log(`❌ ${testUrl} - Error: ${error.message}`);
        }
      }
    } else {
      console.log('✅ Iframe uses production URL');
    }

    try {
      // Wait for iframe to load
      await page.waitForSelector('iframe', { timeout: 10000 });

      // Get iframe element
      const iframeElement = await page.$('iframe');
      if (!iframeElement) {
        console.log('❌ Could not find iframe element');
        return;
      }

      // Try to access iframe content
      const iframeContent = await page.evaluate((iframe) => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          if (!iframeDoc) return { accessible: false, reason: 'No content document' };

          const forms = iframeDoc.querySelectorAll('form');
          const inputs = iframeDoc.querySelectorAll('input, select, textarea');

          return {
            accessible: true,
            url: iframeDoc.location?.href,
            title: iframeDoc.title,
            formCount: forms.length,
            inputCount: inputs.length,
            inputs: Array.from(inputs)
              .slice(0, 5)
              .map((input) => ({
                type: input.type,
                name: input.name,
                placeholder: input.placeholder,
              })),
            readyState: iframeDoc.readyState,
          };
        } catch (error) {
          return { accessible: false, reason: error.message };
        }
      }, iframeElement);

      if (iframeContent.accessible) {
        console.log('🎉 SUCCESS: Can access iframe content!');
      } else {
        try {
          // Open iframe URL directly in new tab
          const iframePage = await browser.newPage();
          await iframePage.goto(donationIframe.src, { timeout: 30000 });

          const directContent = await iframePage.evaluate(() => ({
            url: window.location.href,
            title: document.title,
            formCount: document.querySelectorAll('form').length,
            inputCount: document.querySelectorAll('input, select, textarea').length,
            bodyText: document.body.textContent.substring(0, 200),
          }));

          if (directContent.formCount > 0) {
          }

          await iframePage.close();
        } catch (error) {
          console.log(`❌ Direct access failed: ${error.message}`);
        }
      }
    } catch (error) {
      console.log(`❌ Iframe access failed: ${error.message}`);
    }

    if (isLocalhost) {
    } else {
      console.log('✅ Iframe uses production URL - should be testable');
    }
  } finally {
    await browser.close();
  }
}

inspectIframe().catch(console.error);
