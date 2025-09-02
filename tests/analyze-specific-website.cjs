/**
 * Analyze specific website for style guide extraction
 * Shows exactly what styling would be applied to contribution forms
 */

const puppeteer = require('puppeteer');

async function analyzeWebsiteStyles(url) {
  console.log(`🔍 Analyzing website: ${url}`);
  console.log('='.repeat(60));
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false, // Show browser for visual reference
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    console.log('📄 Loading website...');
    await page.goto(url, { 
      waitUntil: 'networkidle0', 
      timeout: 30000 
    });
    
    // Wait for dynamic content to load
    await page.waitForTimeout(3000);
    
    console.log('✅ Website loaded successfully');
    
    // Extract comprehensive style information
    const styleData = await page.evaluate(() => {
      const results = {
        colors: {
          raw: [],
          hex: [],
          rgb: [],
          hsl: []
        },
        fonts: {
          families: [],
          weights: [],
          sizes: []
        },
        layout: {
          borderRadii: [],
          margins: [],
          paddings: []
        },
        elements: {
          headings: [],
          buttons: [],
          backgrounds: []
        }
      };
      
      // Helper function to convert RGB to Hex
      function rgbToHex(rgb) {
        const result = rgb.match(/\d+/g);
        if (result && result.length >= 3) {
          const r = parseInt(result[0]);
          const g = parseInt(result[1]); 
          const b = parseInt(result[2]);
          return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        }
        return rgb;
      }
      
      // Get all elements on the page
      const allElements = document.querySelectorAll('*');
      
      // Extract colors from all elements
      for (let i = 0; i < Math.min(allElements.length, 200); i++) {
        const element = allElements[i];
        const styles = window.getComputedStyle(element);
        
        // Color extraction
        const color = styles.getPropertyValue('color');
        const backgroundColor = styles.getPropertyValue('background-color');
        const borderColor = styles.getPropertyValue('border-color');
        
        [color, backgroundColor, borderColor].forEach(c => {
          if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent' && c !== 'initial') {
            results.colors.raw.push(c);
            if (c.startsWith('rgb')) {
              const hex = rgbToHex(c);
              if (hex.startsWith('#') && hex.length === 7) {
                results.colors.hex.push(hex);
              }
              results.colors.rgb.push(c);
            }
          }
        });
        
        // Font extraction
        const fontFamily = styles.getPropertyValue('font-family');
        const fontWeight = styles.getPropertyValue('font-weight');
        const fontSize = styles.getPropertyValue('font-size');
        
        if (fontFamily && fontFamily !== 'inherit') {
          results.fonts.families.push(fontFamily);
        }
        if (fontWeight && fontWeight !== 'normal') {
          results.fonts.weights.push(fontWeight);
        }
        if (fontSize) {
          results.fonts.sizes.push(fontSize);
        }
        
        // Layout extraction
        const borderRadius = parseFloat(styles.getPropertyValue('border-radius')) || 0;
        const margin = parseFloat(styles.getPropertyValue('margin-top')) || 0;
        const padding = parseFloat(styles.getPropertyValue('padding-top')) || 0;
        
        if (borderRadius > 0) results.layout.borderRadii.push(borderRadius);
        if (margin > 0) results.layout.margins.push(margin);
        if (padding > 0) results.layout.paddings.push(padding);
      }
      
      // Extract specific element styling
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headings.forEach(heading => {
        const styles = window.getComputedStyle(heading);
        results.elements.headings.push({
          tag: heading.tagName.toLowerCase(),
          text: heading.textContent.trim().substring(0, 50),
          color: styles.color,
          fontFamily: styles.fontFamily,
          fontWeight: styles.fontWeight,
          fontSize: styles.fontSize
        });
      });
      
      const buttons = document.querySelectorAll('button, .button, .btn, input[type="submit"], input[type="button"], a[class*="button"]');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        results.elements.buttons.push({
          text: button.textContent.trim().substring(0, 30),
          color: styles.color,
          backgroundColor: styles.backgroundColor,
          fontFamily: styles.fontFamily,
          fontWeight: styles.fontWeight,
          fontSize: styles.fontSize,
          borderRadius: styles.borderRadius,
          padding: styles.padding
        });
      });
      
      // Get page background and main container colors
      const body = document.body;
      const bodyStyles = window.getComputedStyle(body);
      results.elements.backgrounds.push({
        element: 'body',
        backgroundColor: bodyStyles.backgroundColor,
        color: bodyStyles.color
      });
      
      const mainContainers = document.querySelectorAll('main, .main, .container, .content, #main, #content');
      mainContainers.forEach(container => {
        const styles = window.getComputedStyle(container);
        results.elements.backgrounds.push({
          element: container.tagName || container.className,
          backgroundColor: styles.backgroundColor,
          color: styles.color
        });
      });
      
      return results;
    });
    
    // Take screenshot for reference
    await page.screenshot({
      path: '/Users/Danallovertheplace/crypto-campaign-unified/tests/analyzed-website-screenshot.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved: tests/analyzed-website-screenshot.png');
    
    await browser.close();
    
    return styleData;
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    if (browser) await browser.close();
    throw error;
  }
}

function analyzeExtractedData(styleData) {
  console.log('\n📊 ANALYZING EXTRACTED STYLE DATA');
  console.log('='.repeat(60));
  
  // Process colors
  const uniqueHexColors = [...new Set(styleData.colors.hex)];
  const colorFrequency = {};
  styleData.colors.hex.forEach(color => {
    colorFrequency[color] = (colorFrequency[color] || 0) + 1;
  });
  
  const sortedColors = Object.entries(colorFrequency)
    .sort(([,a], [,b]) => b - a)
    .map(([color]) => color);
  
  // Filter out very common colors (white, black, grays)
  const brandColors = sortedColors.filter(color => {
    const c = color.toLowerCase();
    return c !== '#ffffff' && c !== '#000000' && 
           !c.match(/^#f{6}$/) && !c.match(/^#0{6}$/) &&
           !c.match(/^#(.)\1(.)\2(.)\3$/); // Skip repeated chars
  });
  
  console.log(`🎨 COLORS ANALYSIS:`);
  console.log(`   - Total unique colors found: ${uniqueHexColors.length}`);
  console.log(`   - Brand colors (filtered): ${brandColors.length}`);
  console.log(`   - Top 5 colors by frequency:`);
  
  sortedColors.slice(0, 5).forEach((color, i) => {
    const frequency = colorFrequency[color];
    const percentage = Math.round((frequency / styleData.colors.hex.length) * 100);
    console.log(`     ${i + 1}. ${color} (${percentage}% usage, ${frequency} occurrences)`);
  });
  
  // Process fonts
  const uniqueFonts = [...new Set(styleData.fonts.families.map(f => 
    f.split(',')[0].replace(/['"]/g, '').trim()
  ))];
  
  const cleanFonts = uniqueFonts.filter(font => 
    !font.includes('serif') && 
    !font.includes('sans-serif') && 
    !font.includes('monospace') &&
    !font.includes('system')
  );
  
  console.log(`\n🔤 TYPOGRAPHY ANALYSIS:`);
  console.log(`   - Total font families found: ${uniqueFonts.length}`);
  console.log(`   - Clean web fonts: ${cleanFonts.length}`);
  console.log(`   - Top fonts detected:`);
  cleanFonts.slice(0, 5).forEach((font, i) => {
    console.log(`     ${i + 1}. ${font}`);
  });
  
  // Analyze headings specifically
  console.log(`\n📝 HEADING ANALYSIS:`);
  styleData.elements.headings.forEach((heading, i) => {
    if (i < 3) { // Show first 3 headings
      const font = heading.fontFamily.split(',')[0].replace(/['"]/g, '');
      console.log(`   - ${heading.tag.toUpperCase()}: "${heading.text}"`);
      console.log(`     Color: ${heading.color}, Font: ${font}, Weight: ${heading.fontWeight}`);
    }
  });
  
  // Analyze buttons specifically  
  console.log(`\n🔘 BUTTON ANALYSIS:`);
  styleData.elements.buttons.slice(0, 3).forEach((button, i) => {
    const font = button.fontFamily.split(',')[0].replace(/['"]/g, '');
    console.log(`   - Button ${i + 1}: "${button.text}"`);
    console.log(`     Background: ${button.backgroundColor}, Color: ${button.color}`);
    console.log(`     Font: ${font}, Weight: ${button.fontWeight}, Border Radius: ${button.borderRadius}`);
  });
  
  // Generate final style recommendations
  return {
    colors: {
      primary: brandColors[0] || sortedColors[0] || '#2a2a72',
      secondary: brandColors[1] || sortedColors[1] || '#666666',
      accent: brandColors[2] || sortedColors[2] || '#28a745',
      background: '#ffffff',
      text: '#333333',
      palette: brandColors.slice(0, 8).map((color, i) => ({
        hex: color,
        name: `Brand Color ${i + 1}`,
        usage: `${Math.round((colorFrequency[color] / styleData.colors.hex.length) * 100)}%`,
        category: i === 0 ? 'primary' : i === 1 ? 'secondary' : 'accent'
      }))
    },
    fonts: {
      recommendations: {
        heading: {
          suggested: cleanFonts[0] || 'Inter',
          family: `${cleanFonts[0] || 'Inter'}, system-ui, -apple-system, sans-serif`,
          weight: '600',
          size: '1.5rem'
        },
        body: {
          suggested: cleanFonts[1] || cleanFonts[0] || 'Inter',
          family: `${cleanFonts[1] || cleanFonts[0] || 'Inter'}, system-ui, -apple-system, sans-serif`,
          weight: '400', 
          size: '1rem'
        },
        button: {
          suggested: cleanFonts[0] || 'Inter',
          family: `${cleanFonts[0] || 'Inter'}, system-ui, -apple-system, sans-serif`,
          weight: '500',
          size: '1rem'
        }
      },
      cleanFamilies: cleanFonts,
      primary: cleanFonts[0] || 'Inter'
    },
    layout: {
      recommendations: {
        borderRadius: '8px',
        margin: '1rem',
        padding: '1rem'
      }
    },
    confidence: Math.min(90, 20 + (brandColors.length * 15) + (cleanFonts.length * 10))
  };
}

function generateFormPreview(analysis) {
  console.log('\n🎨 CONTRIBUTION FORM STYLING PREVIEW');
  console.log('='.repeat(60));
  
  const { colors, fonts, layout } = analysis;
  
  console.log('📝 FORM ELEMENTS THAT WOULD BE STYLED:');
  console.log('');
  
  console.log('🏷️  CAMPAIGN TITLE:');
  console.log(`   - Color: ${colors.primary}`);
  console.log(`   - Font: ${fonts.recommendations.heading.family}`);
  console.log(`   - Weight: ${fonts.recommendations.heading.weight}`);
  console.log(`   - Size: ${fonts.recommendations.heading.size}`);
  console.log('');
  
  console.log('🔘 PRIMARY BUTTONS (Donate/Contribute):');
  console.log(`   - Background: ${colors.primary}`);
  console.log(`   - Text Color: #ffffff`);
  console.log(`   - Font: ${fonts.recommendations.button.family}`);
  console.log(`   - Weight: ${fonts.recommendations.button.weight}`);
  console.log(`   - Border Radius: ${layout.recommendations.borderRadius}`);
  console.log('');
  
  console.log('🔘 SECONDARY BUTTONS (Amount Selection):');
  console.log(`   - Background: ${colors.background}`);
  console.log(`   - Border: 2px solid ${colors.primary}`);
  console.log(`   - Text Color: ${colors.primary}`);
  console.log(`   - Font: ${fonts.recommendations.button.family}`);
  console.log(`   - When Selected - Background: ${colors.primary}, Text: #ffffff`);
  console.log('');
  
  console.log('📄 FORM LABELS & TEXT:');
  console.log(`   - Color: ${colors.text}`);
  console.log(`   - Font: ${fonts.recommendations.body.family}`);
  console.log(`   - Weight: ${fonts.recommendations.body.weight}`);
  console.log('');
  
  console.log('📦 FORM CONTAINER:');
  console.log(`   - Background: ${colors.background}`);
  console.log(`   - Border Radius: ${layout.recommendations.borderRadius}`);
  console.log(`   - Spacing: ${layout.recommendations.margin}`);
  console.log('');
  
  // Generate CSS that would be applied
  const cssPreview = `
/* CSS that would be applied to contribution form */
.campaign-form {
  background: ${colors.background};
  border-radius: ${layout.recommendations.borderRadius};
  font-family: ${fonts.recommendations.body.family};
  color: ${colors.text};
}

.campaign-title {
  color: ${colors.primary};
  font-family: ${fonts.recommendations.heading.family};
  font-weight: ${fonts.recommendations.heading.weight};
  font-size: ${fonts.recommendations.heading.size};
}

.primary-button {
  background-color: ${colors.primary};
  color: #ffffff;
  font-family: ${fonts.recommendations.button.family};
  font-weight: ${fonts.recommendations.button.weight};
  border-radius: ${layout.recommendations.borderRadius};
  border: none;
}

.amount-button {
  background-color: ${colors.background};
  border: 2px solid ${colors.primary};
  color: ${colors.primary};
  font-family: ${fonts.recommendations.button.family};
  border-radius: ${layout.recommendations.borderRadius};
}

.amount-button.selected {
  background-color: ${colors.primary};
  color: #ffffff;
}`;
  
  console.log('💻 GENERATED CSS:');
  console.log(cssPreview);
  
  return cssPreview;
}

// Main execution
async function main() {
  const targetUrl = process.argv[2] || 'https://testy-pink-chancellor.lovable.app/';
  
  try {
    console.log('🚀 WEBSITE STYLE GUIDE EXTRACTION');
    console.log('='.repeat(60));
    
    const styleData = await analyzeWebsiteStyles(targetUrl);
    const analysis = analyzeExtractedData(styleData);
    const cssPreview = generateFormPreview(analysis);
    
    console.log('\n✅ ANALYSIS COMPLETE!');
    console.log(`   - Confidence Score: ${analysis.confidence}%`);
    console.log(`   - Colors Extracted: ${analysis.colors.palette.length}`);
    console.log(`   - Fonts Detected: ${analysis.fonts.cleanFamilies.length}`);
    console.log('\n📸 Visual reference saved to: tests/analyzed-website-screenshot.png');
    
    // Save CSS to file
    require('fs').writeFileSync(
      '/Users/Danallovertheplace/crypto-campaign-unified/tests/extracted-form-styles.css',
      cssPreview
    );
    console.log('💾 CSS preview saved to: tests/extracted-form-styles.css');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}