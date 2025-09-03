import puppeteer from 'puppeteer';

async function debugTestyLookup() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    console.log('BROWSER:', msg.text());
  });
  
  try {
    console.log('🔍 Debugging Testy campaign lookup...');
    
    // Go to local version first to see console logs
    await page.goto('http://localhost:5174/testy', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check what's in the browser console
    const logs = await page.evaluate(() => {
      return {
        url: window.location.href,
        hasSupabase: typeof window.supabase !== 'undefined',
        errors: window.console.errors || []
      };
    });
    
    console.log('Browser state:', logs);
    
    // Test the database query directly in browser
    const queryResult = await page.evaluate(async () => {
      try {
        // Import supabase client
        const { supabase } = await import('/src/lib/supabase.js');
        
        console.log('Testing direct query for Testy...');
        
        // Test exact query that's failing
        const result1 = await supabase
          .from('campaigns')
          .select('*')
          .ilike('campaign_name', 'testy')
          .single();
          
        const result2 = await supabase
          .from('campaigns')
          .select('*')
          .eq('campaign_name', 'Testy')
          .single();
          
        const result3 = await supabase
          .from('campaigns')
          .select('id, campaign_name, status, theme_color')
          .ilike('campaign_name', '%testy%');
          
        return {
          ilike_testy: { data: result1.data, error: result1.error?.message },
          exact_Testy: { data: result2.data, error: result2.error?.message },
          wildcard: { data: result3.data, error: result3.error?.message, count: result3.data?.length }
        };
      } catch (e) {
        return { error: e.message };
      }
    });
    
    console.log('\n🔍 DATABASE QUERY RESULTS:');
    console.log('ILIKE testy:', queryResult.ilike_testy);
    console.log('EXACT Testy:', queryResult.exact_Testy); 
    console.log('WILDCARD %testy%:', queryResult.wildcard);
    
    if (queryResult.exact_Testy.data) {
      console.log('\n✅ Campaign found with exact match!');
      console.log('Campaign:', queryResult.exact_Testy.data.campaign_name);
      console.log('ID:', queryResult.exact_Testy.data.id);
      console.log('Theme:', queryResult.exact_Testy.data.theme_color);
    } else {
      console.log('\n❌ No campaign found - this is the problem!');
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  } finally {
    console.log('\n⏸️ Browser open for inspection...');
    // Keep open
  }
}

debugTestyLookup();