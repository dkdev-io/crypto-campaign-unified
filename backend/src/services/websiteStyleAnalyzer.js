/**
 * Website Style Analysis Service
 * Analyzes websites to extract color palettes, typography, and styling information
 * for automatic form style matching
 */

const puppeteer = require('puppeteer');
const {
  handleAnalysisError,
  validateUrl,
  retryOperation,
  logError,
} = require('../utils/errorHandler');

class WebsiteStyleAnalyzer {
  constructor() {
    this.browser = null;
    this.colorCache = new Map();
    this.fontCache = new Map();
  }

  /**
   * Main analysis function - extracts all styling information from a website
   */
  async analyzeWebsite(url, context = {}) {
    try {
      console.log('🔍 Starting website style analysis for:', url);

      // Validate and normalize URL
      const normalizedUrl = this.normalizeUrl(url);

      // Check cache first
      const cacheKey = normalizedUrl;
      if (this.colorCache.has(cacheKey)) {
        console.log('📄 Using cached analysis for:', url);
        return this.colorCache.get(cacheKey);
      }

      // Perform analysis with retry logic
      const analysis = await retryOperation(
        async () => {
          // Initialize browser if needed
          await this.initBrowser();

          // Analyze the website
          return await this.performAnalysis(normalizedUrl);
        },
        2,
        1500
      );

      // Cache the results
      this.colorCache.set(cacheKey, analysis);

      console.log('✅ Website analysis completed:', analysis.summary);
      return analysis;
    } catch (error) {
      // Handle and log the error
      const handledError = handleAnalysisError(error, url, context);
      await logError(handledError, url, context);

      console.error('❌ Website analysis failed:', handledError.message);
      return this.generateFallbackAnalysis(url, handledError);
    }
  }

  /**
   * Normalize and validate URL
   */
  normalizeUrl(url) {
    // Use the error handler's validation
    const validatedUrl = validateUrl(url);

    try {
      // Add protocol if missing
      if (!validatedUrl.startsWith('http://') && !validatedUrl.startsWith('https://')) {
        url = 'https://' + validatedUrl;
      } else {
        url = validatedUrl;
      }

      const urlObj = new URL(url);
      return urlObj.href;
    } catch (error) {
      throw new Error(`Invalid URL format: ${url}`);
    }
  }

  /**
   * Initialize Puppeteer browser
   */
  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
        ],
      });
    }
  }

  /**
   * Perform comprehensive website analysis
   */
  async performAnalysis(url) {
    const page = await this.browser.newPage();

    try {
      // Set viewport and user agent
      await page.setViewport({ width: 1280, height: 720 });
      await page.setUserAgent('Mozilla/5.0 (compatible; StyleAnalyzer/1.0)');

      // Navigate to page with timeout
      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      // Wait for page to be fully loaded
      await page.waitForTimeout(2000);

      // Extract all style information
      const [colors, fonts, layout, content] = await Promise.all([
        this.extractColors(page),
        this.extractFonts(page),
        this.extractLayout(page),
        this.extractContent(page),
      ]);

      // Take screenshot for visual reference
      const screenshot = await this.takeScreenshot(page, url);

      return {
        url,
        timestamp: new Date().toISOString(),
        colors,
        fonts,
        layout,
        content,
        screenshot,
        summary: this.generateSummary(colors, fonts, layout),
        confidence: this.calculateConfidence(colors, fonts, layout),
      };
    } finally {
      await page.close();
    }
  }

  /**
   * Extract color palette from website
   */
  async extractColors(page) {
    console.log('🎨 Extracting color palette...');

    const colors = await page.evaluate(() => {
      const colorExtractor = {
        // Extract colors from computed styles
        getComputedColors() {
          const elements = document.querySelectorAll('*');
          const colors = new Set();

          for (let i = 0; i < Math.min(elements.length, 500); i++) {
            const element = elements[i];
            const styles = window.getComputedStyle(element);

            // Get various color properties
            [
              'color',
              'background-color',
              'border-color',
              'border-top-color',
              'border-right-color',
              'border-bottom-color',
              'border-left-color',
              'outline-color',
              'text-decoration-color',
            ].forEach((prop) => {
              const value = styles.getPropertyValue(prop);
              if (value && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') {
                colors.add(value);
              }
            });
          }

          return Array.from(colors);
        },

        // Convert colors to hex format
        rgbToHex(rgb) {
          const result = rgb.match(/\d+/g);
          if (result && result.length >= 3) {
            const r = parseInt(result[0]);
            const g = parseInt(result[1]);
            const b = parseInt(result[2]);
            return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
          }
          return rgb;
        },

        // Get dominant colors from images
        getImageColors() {
          const images = document.querySelectorAll('img');
          const colors = [];

          // This would need additional processing for actual color extraction
          // For now, we'll focus on CSS colors

          return colors;
        },
      };

      const rawColors = colorExtractor.getComputedColors();
      const hexColors = rawColors.map((color) => {
        if (color.startsWith('rgb')) {
          return colorExtractor.rgbToHex(color);
        }
        return color;
      });

      // Filter and categorize colors
      const validHexColors = hexColors.filter((color) => color.match(/^#[0-9A-F]{6}$/i));

      return {
        raw: rawColors,
        hex: validHexColors,
        count: validHexColors.length,
      };
    });

    // Analyze and categorize the extracted colors
    const analyzed = this.analyzeColors(colors.hex);

    return {
      ...colors,
      ...analyzed,
    };
  }

  /**
   * Analyze colors to find primary, secondary, accent colors
   */
  analyzeColors(hexColors) {
    if (!hexColors.length) {
      return {
        primary: '#2a2a72',
        secondary: '#666666',
        accent: '#28a745',
        background: '#ffffff',
        text: '#333333',
        palette: [],
      };
    }

    // Count color frequency and remove duplicates
    const colorCount = {};
    hexColors.forEach((color) => {
      const normalized = color.toLowerCase();
      colorCount[normalized] = (colorCount[normalized] || 0) + 1;
    });

    // Sort by frequency
    const sortedColors = Object.entries(colorCount)
      .sort(([, a], [, b]) => b - a)
      .map(([color]) => color);

    // Filter out very common colors (white, black, gray variants)
    const filteredColors = sortedColors.filter((color) => {
      const c = color.toLowerCase();
      return (
        c !== '#ffffff' &&
        c !== '#000000' &&
        !c.match(/^#f{6}$/) &&
        !c.match(/^#0{6}$/) &&
        !c.match(/^#(.)\1(.)\2(.)\3$/)
      ); // Skip repeated chars like #aaaaaa
    });

    // Categorize colors
    const primary = filteredColors[0] || '#2a2a72';
    const secondary = filteredColors[1] || '#666666';
    const accent = filteredColors[2] || '#28a745';

    // Generate a refined palette
    const palette = filteredColors.slice(0, 8).map((color, index) => ({
      hex: color,
      name: this.getColorName(color, index),
      usage: Math.round((colorCount[color] / hexColors.length) * 100) + '%',
      category: index === 0 ? 'primary' : index === 1 ? 'secondary' : 'accent',
    }));

    return {
      primary,
      secondary,
      accent,
      background: '#ffffff',
      text: '#333333',
      palette,
    };
  }

  /**
   * Generate color names for better UX
   */
  getColorName(hex, index) {
    const colorNames = [
      'Primary Brand',
      'Secondary',
      'Accent',
      'Highlight',
      'Support',
      'Detail',
      'Emphasis',
      'Feature',
    ];
    return colorNames[index] || `Color ${index + 1}`;
  }

  /**
   * Extract typography information
   */
  async extractFonts(page) {
    console.log('🔤 Extracting typography...');

    const fonts = await page.evaluate(() => {
      const fontExtractor = {
        // Get unique font families used on the page
        getFontFamilies() {
          const elements = document.querySelectorAll('*');
          const fonts = new Set();

          for (let i = 0; i < Math.min(elements.length, 200); i++) {
            const element = elements[i];
            const styles = window.getComputedStyle(element);
            const fontFamily = styles.getPropertyValue('font-family');

            if (fontFamily && fontFamily !== 'inherit') {
              fonts.add(fontFamily);
            }
          }

          return Array.from(fonts);
        },

        // Get font styles for different elements
        getFontStyles() {
          const selectors = [
            'h1',
            'h2',
            'h3',
            'h4',
            'h5',
            'h6',
            'p',
            'span',
            'div',
            'a',
            'button',
            '.title',
            '.heading',
            '.subtitle',
            '.content',
          ];

          const styles = {};

          selectors.forEach((selector) => {
            const element = document.querySelector(selector);
            if (element) {
              const computed = window.getComputedStyle(element);
              styles[selector] = {
                fontFamily: computed.fontFamily,
                fontSize: computed.fontSize,
                fontWeight: computed.fontWeight,
                lineHeight: computed.lineHeight,
                letterSpacing: computed.letterSpacing,
                textTransform: computed.textTransform,
              };
            }
          });

          return styles;
        },
      };

      const families = fontExtractor.getFontFamilies();
      const styles = fontExtractor.getFontStyles();

      return {
        families,
        styles,
        count: families.length,
      };
    });

    // Analyze and categorize fonts
    const analyzed = this.analyzeFonts(fonts);

    return {
      ...fonts,
      ...analyzed,
    };
  }

  /**
   * Analyze fonts to determine primary heading and body fonts
   */
  analyzeFonts(fonts) {
    const { families, styles } = fonts;

    // Extract clean font names
    const cleanFamilies = families
      .map((family) => {
        return family.split(',')[0].replace(/['"]/g, '').trim();
      })
      .filter(
        (family) =>
          !family.includes('serif') &&
          !family.includes('sans-serif') &&
          !family.includes('monospace')
      );

    // Determine primary fonts
    const headingFont =
      this.extractFontFromStyles(styles, ['h1', 'h2', 'h3']) ||
      cleanFamilies[0] ||
      'Arial, sans-serif';

    const bodyFont =
      this.extractFontFromStyles(styles, ['p', 'div', 'span']) ||
      cleanFamilies[1] ||
      cleanFamilies[0] ||
      'Arial, sans-serif';

    // Create font recommendations
    const recommendations = {
      heading: {
        family: headingFont,
        weight: this.extractFontWeight(styles, ['h1', 'h2']) || '600',
        size: this.extractFontSize(styles, ['h1']) || '2rem',
        suggested: this.suggestWebFont(headingFont, 'heading'),
      },
      body: {
        family: bodyFont,
        weight: this.extractFontWeight(styles, ['p', 'div']) || '400',
        size: this.extractFontSize(styles, ['p']) || '1rem',
        suggested: this.suggestWebFont(bodyFont, 'body'),
      },
      button: {
        family: this.extractFontFromStyles(styles, ['button', 'a']) || headingFont,
        weight: '500',
        size: '1rem',
      },
    };

    return {
      cleanFamilies,
      recommendations,
      primary: headingFont,
      secondary: bodyFont,
    };
  }

  /**
   * Extract font family from specific styles
   */
  extractFontFromStyles(styles, selectors) {
    for (const selector of selectors) {
      if (styles[selector] && styles[selector].fontFamily) {
        return styles[selector].fontFamily.split(',')[0].replace(/['"]/g, '').trim();
      }
    }
    return null;
  }

  /**
   * Extract font weight
   */
  extractFontWeight(styles, selectors) {
    for (const selector of selectors) {
      if (styles[selector] && styles[selector].fontWeight) {
        return styles[selector].fontWeight;
      }
    }
    return null;
  }

  /**
   * Extract font size
   */
  extractFontSize(styles, selectors) {
    for (const selector of selectors) {
      if (styles[selector] && styles[selector].fontSize) {
        return styles[selector].fontSize;
      }
    }
    return null;
  }

  /**
   * Suggest web-safe alternatives
   */
  suggestWebFont(fontFamily, type) {
    const webSafeFonts = {
      heading: [
        'Inter',
        'Roboto',
        'Open Sans',
        'Lato',
        'Poppins',
        'Montserrat',
        'Source Sans Pro',
        'Nunito',
      ],
      body: [
        'Inter',
        'Roboto',
        'Open Sans',
        'Lato',
        'Source Sans Pro',
        'PT Sans',
        'Nunito Sans',
        'IBM Plex Sans',
      ],
    };

    const candidates = webSafeFonts[type] || webSafeFonts.body;

    // Try to find a similar web font
    const lowerFont = fontFamily.toLowerCase();
    for (const webFont of candidates) {
      if (lowerFont.includes(webFont.toLowerCase()) || webFont.toLowerCase().includes(lowerFont)) {
        return webFont;
      }
    }

    return candidates[0]; // Default to first option
  }

  /**
   * Extract layout information
   */
  async extractLayout(page) {
    console.log('📐 Extracting layout information...');

    const layout = await page.evaluate(() => {
      const layoutExtractor = {
        getSpacing() {
          const elements = document.querySelectorAll('*');
          const margins = [];
          const paddings = [];

          for (let i = 0; i < Math.min(elements.length, 100); i++) {
            const styles = window.getComputedStyle(elements[i]);
            const margin = parseFloat(styles.marginTop) || 0;
            const padding = parseFloat(styles.paddingTop) || 0;

            if (margin > 0) margins.push(margin);
            if (padding > 0) paddings.push(padding);
          }

          return {
            margins: margins.sort((a, b) => a - b),
            paddings: paddings.sort((a, b) => a - b),
          };
        },

        getBorderRadius() {
          const elements = document.querySelectorAll('*');
          const radii = [];

          for (let i = 0; i < Math.min(elements.length, 100); i++) {
            const styles = window.getComputedStyle(elements[i]);
            const radius = parseFloat(styles.borderRadius) || 0;
            if (radius > 0) radii.push(radius);
          }

          return radii.sort((a, b) => a - b);
        },

        getButtonStyles() {
          const buttons = document.querySelectorAll(
            'button, .button, .btn, input[type="submit"], input[type="button"]'
          );
          const styles = [];

          buttons.forEach((button) => {
            const computed = window.getComputedStyle(button);
            styles.push({
              borderRadius: computed.borderRadius,
              padding: computed.padding,
              backgroundColor: computed.backgroundColor,
              color: computed.color,
              border: computed.border,
              fontSize: computed.fontSize,
              fontWeight: computed.fontWeight,
            });
          });

          return styles;
        },
      };

      const spacing = layoutExtractor.getSpacing();
      const borderRadii = layoutExtractor.getBorderRadius();
      const buttonStyles = layoutExtractor.getButtonStyles();

      return {
        spacing,
        borderRadii,
        buttonStyles,
      };
    });

    // Analyze layout patterns
    const analyzed = this.analyzeLayout(layout);

    return {
      ...layout,
      ...analyzed,
    };
  }

  /**
   * Analyze layout to determine common patterns
   */
  analyzeLayout(layout) {
    const { spacing, borderRadii, buttonStyles } = layout;

    // Determine common spacing values
    const commonMargins = this.findCommonValues(spacing.margins);
    const commonPaddings = this.findCommonValues(spacing.paddings);
    const commonRadii = this.findCommonValues(borderRadii);

    // Analyze button patterns
    let buttonPattern = null;
    if (buttonStyles.length > 0) {
      const firstButton = buttonStyles[0];
      buttonPattern = {
        borderRadius: firstButton.borderRadius,
        padding: firstButton.padding,
        backgroundColor: firstButton.backgroundColor,
        fontSize: firstButton.fontSize,
        fontWeight: firstButton.fontWeight,
      };
    }

    return {
      recommendations: {
        margin: commonMargins[0] || '1rem',
        padding: commonPaddings[0] || '1rem',
        borderRadius: commonRadii[0] || '4px',
        buttonStyle: buttonPattern,
      },
    };
  }

  /**
   * Find most common values in an array
   */
  findCommonValues(values) {
    if (!values.length) return [];

    const counts = {};
    values.forEach((value) => {
      const rounded = Math.round(value);
      counts[rounded] = (counts[rounded] || 0) + 1;
    });

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([value]) => parseInt(value) + 'px')
      .slice(0, 3);
  }

  /**
   * Extract content information
   */
  async extractContent(page) {
    const content = await page.evaluate(() => {
      return {
        title: document.title,
        headings: Array.from(document.querySelectorAll('h1, h2, h3'))
          .slice(0, 5)
          .map((h) => h.textContent.trim()),
        description: document.querySelector('meta[name="description"]')?.content || '',
        brandName: this.extractBrandName(),
      };
    });

    return content;
  }

  /**
   * Take screenshot for visual reference
   */
  async takeScreenshot(page, url) {
    try {
      const screenshot = await page.screenshot({
        fullPage: false,
        type: 'png',
        encoding: 'base64',
      });

      return {
        data: screenshot,
        url,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.warn('Screenshot failed:', error);
      return null;
    }
  }

  /**
   * Generate analysis summary
   */
  generateSummary(colors, fonts, layout) {
    return {
      colorsExtracted: colors.palette?.length || 0,
      fontsFound: fonts.cleanFamilies?.length || 0,
      primaryColor: colors.primary,
      primaryFont: fonts.primary,
      confidence: this.calculateConfidence(colors, fonts, layout),
    };
  }

  /**
   * Calculate confidence score for the analysis
   */
  calculateConfidence(colors, fonts, layout) {
    let score = 0;

    // Color analysis confidence
    if (colors.palette && colors.palette.length >= 3) score += 30;
    else if (colors.palette && colors.palette.length >= 1) score += 15;

    // Font analysis confidence
    if (fonts.cleanFamilies && fonts.cleanFamilies.length >= 2) score += 30;
    else if (fonts.cleanFamilies && fonts.cleanFamilies.length >= 1) score += 15;

    // Layout analysis confidence
    if (layout.recommendations) score += 20;

    // Basic extraction success
    score += 20;

    return Math.min(score, 100);
  }

  /**
   * Generate fallback analysis when main analysis fails
   */
  generateFallbackAnalysis(url, error) {
    console.warn('Using fallback analysis for:', url);

    return {
      url,
      timestamp: new Date().toISOString(),
      error: error.message,
      colors: {
        primary: '#2a2a72',
        secondary: '#666666',
        accent: '#28a745',
        background: '#ffffff',
        text: '#333333',
        palette: [
          { hex: '#2a2a72', name: 'Primary', usage: '40%', category: 'primary' },
          { hex: '#666666', name: 'Secondary', usage: '30%', category: 'secondary' },
          { hex: '#28a745', name: 'Accent', usage: '20%', category: 'accent' },
        ],
      },
      fonts: {
        recommendations: {
          heading: { family: 'Inter', weight: '600', size: '2rem', suggested: 'Inter' },
          body: { family: 'Inter', weight: '400', size: '1rem', suggested: 'Inter' },
          button: { family: 'Inter', weight: '500', size: '1rem' },
        },
        primary: 'Inter',
        secondary: 'Inter',
      },
      layout: {
        recommendations: {
          margin: '1rem',
          padding: '1rem',
          borderRadius: '4px',
        },
      },
      screenshot: null,
      summary: {
        colorsExtracted: 3,
        fontsFound: 1,
        primaryColor: '#2a2a72',
        primaryFont: 'Inter',
        confidence: 50,
      },
      confidence: 50,
      fallback: true,
    };
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = WebsiteStyleAnalyzer;
