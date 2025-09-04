const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Launch React Demo with Integrated Analytics
 * Uses the actual React components with proper analytics integration
 */

async function setupReactDemo() {
  console.log('🚀 Setting up integrated React demo with analytics...');

  // Check if we're in the frontend directory
  const frontendPath = path.join(process.cwd(), 'frontend');
  const packageJsonPath = path.join(frontendPath, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ Frontend package.json not found. Please run this from the project root.');
    return false;
  }

  // Install additional dependencies if needed

  try {
    // Check if @supabase/supabase-js is installed
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (!deps['@supabase/supabase-js']) {
      await runCommand('npm install @supabase/supabase-js', frontendPath);
    }

    if (!deps['react-router-dom']) {
      await runCommand('npm install react-router-dom', frontendPath);
    }
  } catch (error) {
    console.error('❌ Error checking dependencies:', error.message);
    return false;
  }

  return true;
}

async function createEnvFile() {
  const envPath = path.join(process.cwd(), 'frontend', '.env.local');

  if (!fs.existsSync(envPath)) {
    const envContent = `# Demo Environment Variables
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_DEMO_MODE=true
`;

    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env.local file - please update with your Supabase credentials');
  }
}

async function updateAppForDemo() {
  const appPath = path.join(process.cwd(), 'frontend', 'src', 'App.js');

  if (!fs.existsSync(appPath)) {
    console.log('⚠️ App.js not found, using existing version');
    return;
  }

  // The App.js we created earlier should work, but let's ensure it has demo data
  const demoAppContent = `
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnalyticsProvider } from './components/analytics/AnalyticsProvider';
import PrivacyBanner from './components/analytics/PrivacyBanner';
import ContributionFormWithAnalytics from './components/analytics/ContributionFormWithAnalytics';
import './App.css';

function App() {
  const [contributions, setContributions] = useState([]);

  const handleContribution = (contributionData) => {
    console.log('✅ Contribution received:', contributionData);
    setContributions(prev => [...prev, contributionData]);
    
    // Show success message
    alert(\`🎉 Contribution Successful!\\n\\nAmount: \${contributionData.amount} ETH\\nTransaction: \${contributionData.transactionHash}\\n\\nThank you for your support!\`);
  };

  return (
    <AnalyticsProvider
      config={{
        debug: true, // Enable debug mode for demo
        cookieConsent: 'optional',
        respectDNT: true,
        enableGeolocation: true,
        enableScrollTracking: true,
        enableClickTracking: true,
        sessionTimeout: 30,
        batchSize: 5 // Smaller batches for demo
      }}
    >
      <Router>
        <div className="App">
          <header className="app-header">
            <nav style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: 'white',
              padding: '1rem 2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h1 style={{ margin: 0, fontSize: '1.5rem' }}>🚀 Crypto Campaign Platform</h1>
              <div style={{ display: 'flex', gap: '2rem' }}>
                <a href="/" style={{ color: 'white', textDecoration: 'none' }}>Home</a>
                <a href="/campaigns" style={{ color: 'white', textDecoration: 'none' }}>Campaigns</a>
                <a href="/about" style={{ color: 'white', textDecoration: 'none' }}>About</a>
              </div>
            </nav>
          </header>

          <main style={{ 
            minHeight: '80vh', 
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            padding: '2rem 0'
          }}>
            <Routes>
              <Route 
                path="/" 
                element={
                  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
                    <div style={{ 
                      textAlign: 'center', 
                      marginBottom: '3rem',
                      background: 'white',
                      padding: '2rem',
                      borderRadius: '1rem',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                    }}>
                      <h2 style={{ color: '#1e293b', marginBottom: '1rem' }}>
                        Welcome to Crypto Campaign Platform
                      </h2>
                      <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '1rem' }}>
                        Support innovative blockchain projects with cryptocurrency contributions.
                      </p>
                      <div style={{
                        background: '#f0f9ff',
                        border: '1px solid #bae6fd',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        marginTop: '1rem'
                      }}>
                        <h4 style={{ color: '#0369a1', margin: '0 0 0.5rem 0' }}>
                          🔍 Analytics Demo Active
                        </h4>
                        <p style={{ color: '#0369a1', margin: 0, fontSize: '0.9rem' }}>
                          This form demonstrates privacy-compliant analytics tracking. 
                          Open browser dev tools (F12) to see real-time event logging.
                        </p>
                      </div>
                    </div>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 400px',
                      gap: '2rem',
                      alignItems: 'start'
                    }}>
                      {/* Main contribution form */}
                      <div>
                        <ContributionFormWithAnalytics
                          campaignId="demo-campaign-2025"
                          onContribution={handleContribution}
                        />
                      </div>
                      
                      {/* Analytics info panel */}
                      <div style={{
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '1rem',
                        padding: '1.5rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                      }}>
                        <h3 style={{ color: '#1e293b', marginBottom: '1rem', fontSize: '1.1rem' }}>
                          📊 Analytics Features
                        </h3>
                        <div style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: '1.6' }}>
                          <div style={{ marginBottom: '0.5rem' }}>
                            ✅ Anonymous visitor tracking
                          </div>
                          <div style={{ marginBottom: '0.5rem' }}>
                            ✅ Session monitoring & timing
                          </div>
                          <div style={{ marginBottom: '0.5rem' }}>
                            ✅ Form interaction analytics
                          </div>
                          <div style={{ marginBottom: '0.5rem' }}>
                            ✅ Conversion funnel tracking
                          </div>
                          <div style={{ marginBottom: '0.5rem' }}>
                            ✅ Privacy-compliant data collection
                          </div>
                          <div style={{ marginBottom: '1rem' }}>
                            ✅ GDPR/CCPA compliance
                          </div>
                          
                          <div style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.5rem',
                            padding: '0.75rem',
                            marginTop: '1rem'
                          }}>
                            <strong>Test Commands:</strong><br/>
                            <code style={{ fontSize: '0.8rem', display: 'block', marginTop: '0.25rem' }}>
                              window.getAnalyticsStatus()
                            </code>
                            <code style={{ fontSize: '0.8rem', display: 'block' }}>
                              window.trackEvent('test', {'{test: true}'})
                            </code>
                          </div>
                        </div>
                      </div>
                    </div>

                    {contributions.length > 0 && (
                      <div style={{
                        background: 'white',
                        borderRadius: '1rem',
                        padding: '1.5rem',
                        marginTop: '2rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                      }}>
                        <h3>🎉 Recent Contributions</h3>
                        {contributions.map((contribution, index) => (
                          <div key={index} style={{
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: '0.5rem',
                            padding: '1rem',
                            marginTop: '0.5rem'
                          }}>
                            <strong>{contribution.amount} ETH</strong> • {contribution.transactionHash}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                } 
              />
              
              <Route 
                path="/campaigns" 
                element={
                  <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 2rem' }}>
                    <h2>All Campaigns</h2>
                    <p>Browse and support various cryptocurrency campaigns.</p>
                  </div>
                } 
              />
              
              <Route 
                path="/about" 
                element={
                  <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 2rem' }}>
                    <h2>About Our Analytics</h2>
                    <p>Learn about our privacy-first approach to campaign analytics.</p>
                  </div>
                } 
              />
            </Routes>
          </main>

          <footer style={{
            background: '#1e293b',
            color: 'white',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <p>&copy; 2025 Crypto Campaign Platform. All rights reserved.</p>
            <div style={{ marginTop: '1rem' }}>
              <button 
                onClick={() => window.setAnalyticsConsent?.(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid #64748b',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  marginRight: '1rem'
                }}
              >
                Disable Analytics
              </button>
              <button 
                style={{
                  background: 'transparent',
                  border: '1px solid #64748b',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                View Analytics Status
              </button>
            </div>
          </footer>

          {/* Privacy Banner */}
          <PrivacyBanner
            position="bottom"
            theme="dark"
            showLearnMore={true}
            onConsentChange={(granted) => {
            }}
          />
        </div>
      </Router>
    </AnalyticsProvider>
  );
}

export default App;
`.trim();

  fs.writeFileSync(appPath, demoAppContent);
  console.log('✅ Updated App.js for analytics demo');
}

async function runCommand(command, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command.split(' ')[0], command.split(' ').slice(1), {
      cwd,
      stdio: 'pipe',
    });

    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Command failed with code ${code}: ${output}`));
      }
    });
  });
}

async function startReactServer() {
  const frontendPath = path.join(process.cwd(), 'frontend');

  console.log('🚀 Starting React development server...');

  return new Promise((resolve) => {
    const child = spawn('npm', ['start'], {
      cwd: frontendPath,
      stdio: 'pipe',
    });

    child.stdout.on('data', (data) => {
      const output = data.toString();

      if (output.includes('Local:') || output.includes('localhost:3000')) {
        setTimeout(() => resolve('http://localhost:3000'), 2000);
      }
    });

    child.stderr.on('data', (data) => {
      const output = data.toString();
      if (!output.includes('webpack compiled')) {
      }
    });
  });
}

async function launchBrowserDemo() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
    ],
  });

  const page = await browser.newPage();

  // Console logging
  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'log') {
    } else if (type === 'error') {
      console.error('❌ Browser Error:', msg.text());
    }
  });

  // Navigate with UTM parameters for testing
  const url =
    'http://localhost:3000?utm_source=demo&utm_medium=puppeteer&utm_campaign=analytics_test';

  await page.goto(url, { waitUntil: 'networkidle0' });

  // Inject some demo interactions
  setTimeout(async () => {
    // Scroll to trigger scroll events
    await page.evaluate(() => {
      window.scrollTo({ top: 300, behavior: 'smooth' });
    });

    setTimeout(async () => {
      await page.evaluate(() => {
        window.scrollTo({ top: 600, behavior: 'smooth' });
      });
    }, 2000);
  }, 5000);

  console.log('✅ React demo is running!');

  return browser;
}

async function main() {
  try {
    // Setup
    const setupSuccess = await setupReactDemo();
    if (!setupSuccess) return;

    await createEnvFile();
    await updateAppForDemo();

    // Start React server
    const serverUrl = await startReactServer();
    console.log('✅ React server started at:', serverUrl);

    // Launch browser
    await launchBrowserDemo();

    // Keep running
    process.on('SIGINT', () => {
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
