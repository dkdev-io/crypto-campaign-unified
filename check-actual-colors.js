import puppeteer from 'puppeteer';

async function checkActualColors() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🎨 Checking actual colors on https://testy-pink-chancellor.lovable.app/');
    
    await page.goto('https://testy-pink-chancellor.lovable.app/', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take a screenshot to see what we're working with
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/style-guide-actual.png',
      fullPage: true 
    });
    
    // Extract actual colors from the computed styles
    const actualColors = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const colors = new Set();
      const backgrounds = new Set();
      
      elements.forEach(el => {
        const styles = getComputedStyle(el);
        
        // Get text colors
        const color = styles.color;
        if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'rgb(0, 0, 0)') {
          colors.add(color);
        }
        
        // Get background colors
        const bgColor = styles.backgroundColor;
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
          backgrounds.add(bgColor);
        }
        
        // Get border colors
        const borderColor = styles.borderColor;
        if (borderColor && borderColor !== 'rgba(0, 0, 0, 0)') {
          colors.add(borderColor);
        }
      });
      
      return {
        textColors: Array.from(colors).slice(0, 10),
        backgroundColors: Array.from(backgrounds).slice(0, 10),
        pageTitle: document.title,
        mainHeading: document.querySelector('h1')?.textContent || 'No H1 found'
      };
    });
    
    console.log('\n🎨 ACTUAL WEBSITE ANALYSIS:');
    console.log('─'.repeat(50));
    console.log('Page Title:', actualColors.pageTitle);
    console.log('Main Heading:', actualColors.mainHeading);
    console.log('\nText Colors Found:');
    actualColors.textColors.forEach(color => console.log('  -', color));
    console.log('\nBackground Colors Found:');
    actualColors.backgroundColors.forEach(color => console.log('  -', color));
    
    // Convert RGB to hex for easier use
    const rgbToHex = (rgb) => {
      if (rgb.startsWith('#')) return rgb;
      const match = rgb.match(/rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)/);
      if (!match) return rgb;
      const [, r, g, b] = match;
      return '#' + [r, g, b].map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
    };
    
    console.log('\n🔗 SOURCE WEBSITE:');
    console.log('https://testy-pink-chancellor.lovable.app/');
    console.log('\n📸 Screenshot saved:');
    console.log('/Users/Danallovertheplace/crypto-campaign-unified/style-guide-actual.png');
    
  } catch (error) {
    console.error('❌ Error checking colors:', error.message);
  } finally {
    console.log('\n⏸️ Browser staying open - check the actual website colors manually');
  }
}

checkActualColors();