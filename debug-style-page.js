import puppeteer from 'puppeteer';

async function debugStylePage() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:5173/WebsiteStyle', { waitUntil: 'networkidle0' });

    const pageInfo = await page.evaluate(() => {
      const h2 = document.querySelector('h2');
      const allHeadings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(
        (h) => ({
          tag: h.tagName,
          text: h.textContent?.trim(),
          innerHTML: h.innerHTML,
          className: h.className,
          style: h.getAttribute('style'),
        })
      );

      return {
        h2Text: h2?.textContent?.trim(),
        h2InnerHTML: h2?.innerHTML,
        allHeadings: allHeadings,
        pageTitle: document.title,
        bodyContent: document.body.textContent?.substring(0, 500),
      };
    });

    console.log('H2 text:', pageInfo.h2Text);
    console.log('H2 innerHTML:', pageInfo.h2InnerHTML);
    console.log('Page title:', pageInfo.pageTitle);
    console.log('\nAll headings:');
    pageInfo.allHeadings.forEach((h, i) => {
      console.log(`${i + 1}. <${h.tag}> "${h.text}" (class: ${h.className})`);
    });

    await new Promise((resolve) => setTimeout(resolve, 5000));
  } finally {
    await browser.close();
  }
}

debugStylePage().catch(console.error);
