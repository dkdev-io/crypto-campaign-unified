// Verify committee form with authentication on port 5173
import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyWithAuth() {
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 200
  });

  try {
    const page = await browser.newPage();
    
    console.log('🌐 Navigating to http://localhost:5173/campaigns/auth/setup');
    await page.goto('http://localhost:5173/campaigns/auth/setup');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if we're on login page
    const hasSignInButton = await page.$('button:has-text("Sign In")');
    if (hasSignInButton) {
      console.log('🔐 Login required - using DEV BYPASS');
      
      // Click DEV BYPASS button
      await page.click('button:has-text("DEV BYPASS → Setup")');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Now we should be on the committee page
    const currentUrl = await page.url();
    console.log('📍 Current URL:', currentUrl);
    
    await page.screenshot({ path: 'after-auth-5173.png', fullPage: true });
    console.log('📸 Screenshot after auth saved');
    
    // Look for committee form
    const hasManualForm = await page.$('input[placeholder="Enter your committee name"]');
    console.log('📋 Manual committee form found:', !!hasManualForm);
    
    if (hasManualForm) {
      console.log('📝 Filling out committee form...');
      
      await page.type('input[placeholder="Enter your committee name"]', 'UI Test Committee 5173');
      await page.type('input[placeholder="Committee address"]', '456 Auth Street');  
      await page.type('input[placeholder="City"]', 'AuthCity');
      await page.type('input[placeholder="State"]', 'TX');
      await page.type('input[placeholder="ZIP"]', '12345');
      
      console.log('🖱️ Clicking submit button...');
      const submitButton = await page.$('button[style*="Save Committee Info & Continue"], button:has-text("Save Committee Info & Continue")');
      if (submitButton) {
        await submitButton.click();
        console.log('✅ Submit clicked');
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check results
        const finalUrl = await page.url();
        const pageContent = await page.evaluate(() => document.body.innerText);
        
        console.log('📍 Final URL:', finalUrl);
        
        if (pageContent.includes('Committee Information Saved') || finalUrl.includes('/BankConnection')) {
          console.log('🎉 SUCCESS: Form submitted successfully!');
          
          // Verify in database
          const { data } = await supabase
            .from('campaigns')
            .select('committee_name, committee_address')
            .eq('committee_name', 'UI Test Committee 5173');
            
          if (data && data.length > 0) {
            console.log('💾 Data saved to database:', data[0]);
          }
        } else if (pageContent.includes('Campaign ID not found')) {
          console.log('❌ STILL BROKEN: Campaign ID error persists');
        } else {
          console.log('❓ Unknown result - check manually');
        }
      } else {
        console.log('❌ Submit button not found');
      }
    } else {
      // Check what's actually on the page
      const pageText = await page.evaluate(() => document.body.innerText);
      console.log('❌ Committee form not found. Page content:', pageText.substring(0, 300));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('🔍 Browser left open for inspection');
}

verifyWithAuth();