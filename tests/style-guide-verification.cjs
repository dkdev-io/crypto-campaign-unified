/**
 * Puppeteer-based verification test for Style Guide System
 * Tests complete flow: Website Analysis → Database Storage → Form Application
 */

const puppeteer = require('puppeteer');
const { supabase } = require('../backend/src/lib/supabase');
const WebsiteStyleAnalyzer = require('../backend/src/services/websiteStyleAnalyzer');

class StyleGuideVerificationTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.analyzer = new WebsiteStyleAnalyzer();
    this.testResults = {
      websiteAnalysis: { passed: false, details: null, error: null },
      databaseStorage: { passed: false, details: null, error: null },
      formApplication: { passed: false, details: null, error: null },
      endToEnd: { passed: false, details: null, error: null }
    };
  }

  async setup() {
    console.log('🚀 Starting Style Guide System Verification...\n');
    
    try {
      this.browser = await puppeteer.launch({
        headless: false, // Show browser for visual verification
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ]
      });
      
      this.page = await this.browser.newPage();
      await this.page.setViewport({ width: 1280, height: 720 });
      
      console.log('✅ Puppeteer browser launched successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to setup Puppeteer:', error);
      return false;
    }
  }

  async testWebsiteAnalysis() {
    console.log('\n📊 Testing Website Style Analysis...');
    
    try {
      // Test with a well-styled website
      const testUrl = 'https://stripe.com';
      console.log(`🔍 Analyzing: ${testUrl}`);
      
      const analysis = await this.analyzer.analyzeWebsite(testUrl);
      
      // Validate analysis results
      const validationChecks = [
        { name: 'Has URL', condition: analysis.url === testUrl },
        { name: 'Has Colors', condition: analysis.colors && analysis.colors.palette && analysis.colors.palette.length > 0 },
        { name: 'Has Primary Color', condition: analysis.colors && analysis.colors.primary },
        { name: 'Has Fonts', condition: analysis.fonts && analysis.fonts.cleanFamilies && analysis.fonts.cleanFamilies.length > 0 },
        { name: 'Has Layout Info', condition: analysis.layout && analysis.layout.recommendations },
        { name: 'Has Confidence Score', condition: analysis.confidence && analysis.confidence > 0 },
        { name: 'Has Summary', condition: analysis.summary && analysis.summary.colorsExtracted >= 0 }
      ];
      
      const passedChecks = validationChecks.filter(check => check.condition);
      const failedChecks = validationChecks.filter(check => !check.condition);
      
      console.log(`✅ Website Analysis Results:`);
      console.log(`   - URL: ${analysis.url}`);
      console.log(`   - Colors Found: ${analysis.summary?.colorsExtracted || 0}`);
      console.log(`   - Fonts Found: ${analysis.summary?.fontsFound || 0}`);
      console.log(`   - Primary Color: ${analysis.colors?.primary || 'None'}`);
      console.log(`   - Confidence: ${analysis.confidence || 0}%`);
      console.log(`   - Validation: ${passedChecks.length}/${validationChecks.length} checks passed`);
      
      if (failedChecks.length > 0) {
        console.log(`⚠️  Failed checks:`, failedChecks.map(c => c.name));
      }
      
      this.testResults.websiteAnalysis = {
        passed: passedChecks.length >= 5, // At least 5/7 checks must pass
        details: {
          analysis,
          validationChecks: { passed: passedChecks.length, failed: failedChecks.length },
          url: testUrl
        },
        error: null
      };
      
      return analysis;
      
    } catch (error) {
      console.error('❌ Website Analysis Failed:', error.message);
      this.testResults.websiteAnalysis = {
        passed: false,
        details: null,
        error: error.message
      };
      throw error;
    }
  }

  async testDatabaseStorage(analysisData) {
    console.log('\n💾 Testing Database Storage...');
    
    try {
      // Create a test campaign
      const testCampaign = {
        campaign_name: 'Style Guide Test Campaign',
        user_full_name: 'Test User',
        email: 'test@example.com',
        website_analyzed: analysisData.url,
        style_analysis: analysisData,
        applied_styles: {
          colors: analysisData.colors,
          fonts: analysisData.fonts,
          layout: analysisData.layout,
          appliedAt: new Date().toISOString(),
          sourceWebsite: analysisData.url
        },
        styles_applied: true,
        custom_styles: analysisData,
        theme_color: analysisData.colors?.primary
      };
      
      // Insert test campaign
      const { data: campaign, error: insertError } = await supabase
        .from('campaigns')
        .insert([testCampaign])
        .select()
        .single();
        
      if (insertError) {
        throw new Error(`Failed to insert test campaign: ${insertError.message}`);
      }
      
      console.log(`✅ Test campaign created with ID: ${campaign.id}`);
      
      // Verify storage
      const { data: retrieved, error: retrieveError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaign.id)
        .single();
        
      if (retrieveError) {
        throw new Error(`Failed to retrieve test campaign: ${retrieveError.message}`);
      }
      
      // Validate stored data
      const storageChecks = [
        { name: 'Campaign ID exists', condition: !!retrieved.id },
        { name: 'Website analyzed stored', condition: retrieved.website_analyzed === analysisData.url },
        { name: 'Style analysis stored', condition: !!retrieved.style_analysis },
        { name: 'Applied styles stored', condition: !!retrieved.applied_styles },
        { name: 'Styles applied flag', condition: retrieved.styles_applied === true },
        { name: 'Theme color stored', condition: !!retrieved.theme_color },
        { name: 'Custom styles stored', condition: !!retrieved.custom_styles }
      ];
      
      const passedStorage = storageChecks.filter(check => check.condition);
      const failedStorage = storageChecks.filter(check => !check.condition);
      
      console.log(`✅ Database Storage Results:`);
      console.log(`   - Campaign ID: ${retrieved.id}`);
      console.log(`   - Website Analyzed: ${retrieved.website_analyzed}`);
      console.log(`   - Styles Applied: ${retrieved.styles_applied}`);
      console.log(`   - Theme Color: ${retrieved.theme_color}`);
      console.log(`   - Storage Validation: ${passedStorage.length}/${storageChecks.length} checks passed`);
      
      if (failedStorage.length > 0) {
        console.log(`⚠️  Failed storage checks:`, failedStorage.map(c => c.name));
      }
      
      this.testResults.databaseStorage = {
        passed: passedStorage.length >= 6, // At least 6/7 checks must pass
        details: {
          campaignId: campaign.id,
          storedData: retrieved,
          validationChecks: { passed: passedStorage.length, failed: failedStorage.length }
        },
        error: null
      };
      
      return { campaignId: campaign.id, campaignData: retrieved };
      
    } catch (error) {
      console.error('❌ Database Storage Failed:', error.message);
      this.testResults.databaseStorage = {
        passed: false,
        details: null,
        error: error.message
      };
      throw error;
    }
  }

  async testFormApplication(campaignData) {
    console.log('\n🎨 Testing Form Style Application...');
    
    try {
      // Start local development server if not running
      await this.ensureServerRunning();
      
      // Navigate to form with test campaign
      const formUrl = `http://localhost:5173/form/${campaignData.campaignId}`;
      console.log(`🌐 Loading form at: ${formUrl}`);
      
      await this.page.goto(formUrl, { waitUntil: 'networkidle0', timeout: 30000 });
      
      // Wait for form to load
      await this.page.waitForSelector('h1', { timeout: 10000 });
      
      // Extract applied styles from the form
      const formStyles = await this.page.evaluate(() => {
        const h1 = document.querySelector('h1');
        const buttons = document.querySelectorAll('button');
        const primaryButton = Array.from(buttons).find(btn => 
          btn.textContent.includes('Contribute') || 
          btn.textContent.includes('Pay') ||
          btn.textContent.includes('Donate')
        );
        
        return {
          headingColor: h1 ? getComputedStyle(h1).color : null,
          headingFont: h1 ? getComputedStyle(h1).fontFamily : null,
          buttonBackground: primaryButton ? getComputedStyle(primaryButton).backgroundColor : null,
          buttonFont: primaryButton ? getComputedStyle(primaryButton).fontFamily : null,
          formExists: !!h1,
          buttonExists: !!primaryButton,
          campaignName: h1 ? h1.textContent.trim() : null
        };
      });
      
      // Validate style application
      const styleChecks = [
        { name: 'Form loads successfully', condition: formStyles.formExists },
        { name: 'Campaign name displayed', condition: formStyles.campaignName && formStyles.campaignName.includes('Style Guide Test') },
        { name: 'Heading has custom color', condition: formStyles.headingColor && formStyles.headingColor !== 'rgb(42, 42, 114)' }, // Not default
        { name: 'Heading has custom font', condition: formStyles.headingFont && !formStyles.headingFont.includes('Arial') },
        { name: 'Button exists', condition: formStyles.buttonExists },
        { name: 'Button has custom background', condition: formStyles.buttonBackground && formStyles.buttonBackground !== 'rgb(42, 42, 114)' },
        { name: 'Button has custom font', condition: formStyles.buttonFont && !formStyles.buttonFont.includes('Arial') }
      ];
      
      const passedStyles = styleChecks.filter(check => check.condition);
      const failedStyles = styleChecks.filter(check => !check.condition);
      
      console.log(`✅ Form Style Application Results:`);
      console.log(`   - Form URL: ${formUrl}`);
      console.log(`   - Campaign Name: ${formStyles.campaignName || 'Not found'}`);
      console.log(`   - Heading Color: ${formStyles.headingColor || 'Not applied'}`);
      console.log(`   - Heading Font: ${formStyles.headingFont || 'Not applied'}`);
      console.log(`   - Button Background: ${formStyles.buttonBackground || 'Not applied'}`);
      console.log(`   - Style Validation: ${passedStyles.length}/${styleChecks.length} checks passed`);
      
      if (failedStyles.length > 0) {
        console.log(`⚠️  Failed style checks:`, failedStyles.map(c => c.name));
      }
      
      // Take screenshot for visual verification
      await this.page.screenshot({ 
        path: '/Users/Danallovertheplace/crypto-campaign-unified/tests/style-verification-screenshot.png',
        fullPage: true 
      });
      console.log('📸 Screenshot saved: tests/style-verification-screenshot.png');
      
      this.testResults.formApplication = {
        passed: passedStyles.length >= 5, // At least 5/7 checks must pass
        details: {
          formUrl,
          extractedStyles: formStyles,
          validationChecks: { passed: passedStyles.length, failed: failedStyles.length }
        },
        error: null
      };
      
      return formStyles;
      
    } catch (error) {
      console.error('❌ Form Application Test Failed:', error.message);
      this.testResults.formApplication = {
        passed: false,
        details: null,
        error: error.message
      };
      throw error;
    }
  }

  async ensureServerRunning() {
    try {
      // Check if server is running
      const response = await fetch('http://localhost:5173/');
      if (!response.ok) throw new Error('Server not responding');
      console.log('✅ Development server is running');
    } catch (error) {
      console.log('🚀 Starting development server...');
      // In a real scenario, you'd start the server here
      // For now, just log that it should be started manually
      console.log('⚠️  Please ensure development server is running on http://localhost:5173');
      throw new Error('Development server not running. Please start with: npm run dev');
    }
  }

  async cleanup(campaignId) {
    console.log('\n🧹 Cleaning up test data...');
    
    try {
      if (campaignId) {
        const { error } = await supabase
          .from('campaigns')
          .delete()
          .eq('id', campaignId);
          
        if (error) {
          console.warn('⚠️  Failed to cleanup test campaign:', error.message);
        } else {
          console.log('✅ Test campaign cleaned up');
        }
      }
      
      if (this.analyzer) {
        await this.analyzer.cleanup();
        console.log('✅ Website analyzer cleaned up');
      }
      
      if (this.browser) {
        await this.browser.close();
        console.log('✅ Puppeteer browser closed');
      }
      
    } catch (error) {
      console.warn('⚠️  Cleanup error:', error.message);
    }
  }

  generateReport() {
    console.log('\n📊 STYLE GUIDE SYSTEM VERIFICATION REPORT');
    console.log('=' * 50);
    
    const tests = [
      { name: 'Website Analysis', result: this.testResults.websiteAnalysis },
      { name: 'Database Storage', result: this.testResults.databaseStorage },
      { name: 'Form Application', result: this.testResults.formApplication }
    ];
    
    let overallPassed = 0;
    
    tests.forEach(test => {
      const status = test.result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`\n${test.name}: ${status}`);
      
      if (test.result.error) {
        console.log(`   Error: ${test.result.error}`);
      }
      
      if (test.result.details?.validationChecks) {
        const { passed, failed } = test.result.details.validationChecks;
        console.log(`   Validation: ${passed}/${passed + failed} checks passed`);
      }
      
      if (test.result.passed) overallPassed++;
    });
    
    // Overall assessment
    const overallSuccess = overallPassed === tests.length;
    this.testResults.endToEnd = {
      passed: overallSuccess,
      details: { testsPasssed: overallPassed, totalTests: tests.length },
      error: null
    };
    
    console.log('\n' + '=' * 50);
    console.log(`OVERALL RESULT: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    console.log(`Tests Passed: ${overallPassed}/${tests.length}`);
    
    if (overallSuccess) {
      console.log('\n🎉 Style Guide System is working correctly!');
      console.log('✅ Website analysis extracts styles properly');
      console.log('✅ Database stores style data correctly');
      console.log('✅ Forms apply website styles successfully');
    } else {
      console.log('\n⚠️  Style Guide System has issues that need attention.');
    }
    
    return this.testResults;
  }

  async run() {
    let campaignId = null;
    
    try {
      // Setup
      const setupSuccess = await this.setup();
      if (!setupSuccess) {
        throw new Error('Failed to setup test environment');
      }
      
      // Test 1: Website Analysis
      const analysisData = await this.testWebsiteAnalysis();
      
      // Test 2: Database Storage
      const { campaignId: testCampaignId, campaignData } = await this.testDatabaseStorage(analysisData);
      campaignId = testCampaignId;
      
      // Test 3: Form Application
      await this.testFormApplication({ campaignId, ...campaignData });
      
    } catch (error) {
      console.error('\n❌ Test execution failed:', error.message);
    } finally {
      // Cleanup and generate report
      await this.cleanup(campaignId);
      return this.generateReport();
    }
  }
}

// Export for use in other scripts
module.exports = StyleGuideVerificationTest;

// Run if called directly
if (require.main === module) {
  const test = new StyleGuideVerificationTest();
  test.run()
    .then(results => {
      process.exit(results.endToEnd.passed ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}