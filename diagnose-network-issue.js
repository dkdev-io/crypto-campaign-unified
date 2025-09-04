import puppeteer from 'puppeteer';

async function diagnoseNetworkIssue() {
  console.log('🔍 DIAGNOSING NETWORK ISSUES');
  console.log('=' * 40);

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1200, height: 800 },
  });

  try {
    const page = await browser.newPage();

    // Capture all network requests
    const requests = [];
    const responses = [];

    page.on('request', (request) => {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        timestamp: Date.now(),
      });
    });

    page.on('response', (response) => {
      responses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers(),
        timestamp: Date.now(),
      });
    });

    // Capture console messages
    page.on('console', (msg) => {
      console.log(`BROWSER: ${msg.text()}`);
    });

    console.log('\n1. Loading page and checking environment variables...');
    await page.goto('http://localhost:5174/donors/auth', { waitUntil: 'networkidle2' });

    // Check what Supabase URL/key the browser is actually using
    const envVars = await page.evaluate(() => {
      return {
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
        VITE_SKIP_AUTH: import.meta.env.VITE_SKIP_AUTH,
        NODE_ENV: import.meta.env.NODE_ENV,
        DEV: import.meta.env.DEV,
      };
    });

    console.log('\n2. Environment variables in browser:');
    console.log('   SUPABASE_URL:', envVars.VITE_SUPABASE_URL);
    console.log('   SUPABASE_KEY:', envVars.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
    console.log('   SKIP_AUTH:', envVars.VITE_SKIP_AUTH);
    console.log('   DEV MODE:', envVars.DEV);

    // Test direct Supabase connectivity from browser
    console.log('\n3. Testing direct Supabase connectivity from browser...');

    const supabaseTest = await page.evaluate(
      async (url, key) => {
        try {
          // Test 1: Basic fetch to Supabase
          const response1 = await fetch(`${url}/rest/v1/`, {
            headers: { apikey: key },
          });

          // Test 2: Auth health check
          const response2 = await fetch(`${url}/auth/v1/health`, {
            headers: { apikey: key },
          });

          return {
            restApi: { status: response1.status, ok: response1.ok },
            authApi: { status: response2.status, ok: response2.ok },
            error: null,
          };
        } catch (error) {
          return { error: error.message };
        }
      },
      envVars.VITE_SUPABASE_URL,
      envVars.VITE_SUPABASE_ANON_KEY
    );

    console.log('   REST API test:', supabaseTest.restApi);
    console.log('   Auth API test:', supabaseTest.authApi);
    if (supabaseTest.error) {
      console.log('   ERROR:', supabaseTest.error);
    }

    // Temporarily disable bypass to test actual auth
    console.log('\n4. Testing login with bypass disabled...');

    await page.evaluate(() => {
      // Override the environment variable for this test
      import.meta.env.VITE_SKIP_AUTH = 'false';
    });

    // Reload page to get non-bypass version
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Try login
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    const submitButton = await page.$('button[type="submit"]');

    if (emailInput && passwordInput && submitButton) {
      console.log('   Form elements found after reload');

      await page.type('input[type="email"]', 'test@dkdev.io');
      await page.type('input[type="password"]', 'TestDonor123!');
      await submitButton.click();

      // Wait for network activity
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Check what requests were made
      const supabaseRequests = requests.filter((req) => req.url.includes('supabase.co'));
      const supabaseResponses = responses.filter((res) => res.url.includes('supabase.co'));

      console.log('\n5. Network activity analysis:');
      console.log('   Supabase requests made:', supabaseRequests.length);
      console.log('   Supabase responses:', supabaseResponses.length);

      supabaseRequests.forEach((req, i) => {
        console.log(`   Request ${i + 1}: ${req.method} ${req.url}`);
      });

      supabaseResponses.forEach((res, i) => {
        console.log(`   Response ${i + 1}: ${res.status} ${res.statusText} - ${res.url}`);
      });

      // Check if there are failed requests
      const failedResponses = responses.filter((res) => res.status >= 400);
      if (failedResponses.length > 0) {
        console.log('\n   FAILED REQUESTS:');
        failedResponses.forEach((res) => {
          console.log(`   ❌ ${res.status} ${res.statusText} - ${res.url}`);
        });
      }

      return {
        success: supabaseResponses.some((res) => res.status === 200),
        supabaseRequestCount: supabaseRequests.length,
        failedRequestCount: failedResponses.length,
      };
    } else {
      console.log('   ❌ Form elements not found after reload');
      return { success: false, reason: 'Form not accessible' };
    }
  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
    return { success: false, reason: `Diagnosis error: ${error.message}` };
  } finally {
    console.log('\nClosing browser in 10 seconds...');
    setTimeout(() => browser.close(), 10000);
  }
}

diagnoseNetworkIssue()
  .then((result) => {
    console.log('\n' + '=' * 50);
    console.log('🔍 NETWORK DIAGNOSIS COMPLETE');
    console.log('=' * 50);
    console.log('Result:', JSON.stringify(result, null, 2));
  })
  .catch(console.error);
