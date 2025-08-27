const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * Demo Analytics Form with Puppeteer
 * Opens a browser with the contribution form to showcase the analytics system
 */

async function createDemoHTML() {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Campaign Analytics Demo - Crypto Contribution Form</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
        }

        .header p {
            opacity: 0.9;
            font-size: 16px;
        }

        .form-container {
            padding: 40px 30px;
        }

        .status-indicator {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 30px;
        }

        .status-indicator h3 {
            color: #0369a1;
            margin-bottom: 8px;
            font-size: 16px;
        }

        .status-list {
            font-size: 14px;
            color: #0369a1;
        }

        .status-list li {
            margin: 4px 0;
            padding-left: 16px;
        }

        .wallet-section {
            margin-bottom: 30px;
        }

        .wallet-connect-btn {
            width: 100%;
            background: #4f46e5;
            color: white;
            border: none;
            padding: 16px 24px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .wallet-connect-btn:hover {
            background: #4338ca;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        }

        .wallet-connected {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 12px;
            padding: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .wallet-connected .status {
            color: #15803d;
            font-weight: 600;
        }

        .wallet-connected .address {
            font-family: 'Monaco', 'Menlo', monospace;
            color: #374151;
            font-size: 14px;
        }

        .amount-section {
            margin-bottom: 30px;
        }

        .amount-label {
            display: block;
            margin-bottom: 16px;
            color: #374151;
            font-weight: 600;
            font-size: 16px;
        }

        .preset-amounts {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-bottom: 20px;
        }

        .preset-btn {
            background: #f9fafb;
            border: 1px solid #d1d5db;
            color: #374151;
            padding: 12px 8px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s;
            text-align: center;
        }

        .preset-btn:hover {
            background: #f3f4f6;
            border-color: #9ca3af;
        }

        .preset-btn.active {
            background: #4f46e5;
            color: white;
            border-color: #4f46e5;
        }

        .amount-input {
            width: 100%;
            padding: 20px;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            font-size: 20px;
            font-weight: 600;
            text-align: center;
            transition: all 0.2s;
        }

        .amount-input:focus {
            outline: none;
            border-color: #4f46e5;
            box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
        }

        .amount-details {
            margin-top: 12px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }

        .contribute-btn {
            width: 100%;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            border: none;
            padding: 20px 24px;
            border-radius: 12px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            margin-top: 20px;
        }

        .contribute-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
        }

        .contribute-btn:disabled {
            background: #9ca3af;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        .privacy-banner {
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            max-width: 600px;
            margin: 0 auto;
            background: #1f2937;
            color: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            z-index: 1000;
        }

        .privacy-banner h3 {
            margin-bottom: 12px;
            font-size: 18px;
        }

        .privacy-banner p {
            margin-bottom: 16px;
            opacity: 0.9;
            line-height: 1.5;
        }

        .privacy-buttons {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        }

        .privacy-btn {
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
        }

        .privacy-btn.accept {
            background: #10b981;
            color: white;
        }

        .privacy-btn.decline {
            background: #6b7280;
            color: white;
        }

        .privacy-btn.learn-more {
            background: transparent;
            color: white;
            border: 1px solid #6b7280;
        }

        .analytics-status {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px;
            font-size: 12px;
            font-family: 'Monaco', 'Menlo', monospace;
            max-width: 300px;
            z-index: 1001;
        }

        .analytics-status h4 {
            color: #1e293b;
            margin-bottom: 8px;
            font-size: 14px;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .analytics-status .status-item {
            margin: 4px 0;
            color: #475569;
        }

        .status-item .label {
            font-weight: 600;
        }

        .progress-bar {
            width: 100%;
            height: 4px;
            background: #e5e7eb;
            border-radius: 2px;
            margin: 16px 0;
            overflow: hidden;
        }

        .progress-fill {
            width: 0%;
            height: 100%;
            background: #4f46e5;
            border-radius: 2px;
            transition: width 0.3s ease;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .loading {
            animation: pulse 2s infinite;
        }

        .hidden {
            display: none;
        }
    </style>
</head>
<body>
    <div class="analytics-status" id="analyticsStatus">
        <h4>📊 Analytics Status</h4>
        <div class="status-item">
            <span class="label">Visitor ID:</span> 
            <span id="visitorId">Generating...</span>
        </div>
        <div class="status-item">
            <span class="label">Session:</span> 
            <span id="sessionId">Starting...</span>
        </div>
        <div class="status-item">
            <span class="label">Tracking:</span> 
            <span id="trackingStatus">Initializing...</span>
        </div>
        <div class="status-item">
            <span class="label">Events:</span> 
            <span id="eventCount">0</span>
        </div>
    </div>

    <div class="container">
        <div class="header">
            <h1>🚀 Crypto Campaign</h1>
            <p>Support innovative blockchain projects with your contribution</p>
        </div>

        <div class="form-container">
            <div class="status-indicator">
                <h3>🔍 Analytics Demo Active</h3>
                <ul class="status-list">
                    <li>✅ Anonymous visitor tracking enabled</li>
                    <li>✅ Session monitoring active</li>
                    <li>✅ Form interaction tracking ready</li>
                    <li>✅ Privacy-compliant data collection</li>
                </ul>
            </div>

            <form id="contributionForm">
                <!-- Wallet Connection -->
                <div class="wallet-section">
                    <button type="button" id="walletBtn" class="wallet-connect-btn">
                        🦊 Connect MetaMask Wallet
                    </button>
                    <div id="walletConnected" class="wallet-connected hidden">
                        <span class="status">✅ Wallet Connected</span>
                        <span class="address" id="walletAddress">0x1234...5678</span>
                    </div>
                </div>

                <!-- Amount Selection -->
                <div class="amount-section">
                    <label for="amount" class="amount-label">
                        💰 Contribution Amount (ETH)
                    </label>
                    
                    <div class="preset-amounts">
                        <button type="button" class="preset-btn" data-amount="0.1">0.1 ETH</button>
                        <button type="button" class="preset-btn" data-amount="0.5">0.5 ETH</button>
                        <button type="button" class="preset-btn" data-amount="1">1 ETH</button>
                        <button type="button" class="preset-btn" data-amount="5">5 ETH</button>
                    </div>

                    <input 
                        type="number" 
                        id="amount" 
                        class="amount-input" 
                        placeholder="Enter amount..."
                        min="0.001" 
                        step="0.001"
                    />
                    
                    <div class="amount-details" id="amountDetails">
                        Enter an amount to see USD equivalent
                    </div>
                </div>

                <div class="progress-bar hidden" id="progressBar">
                    <div class="progress-fill" id="progressFill"></div>
                </div>

                <button type="submit" id="contributeBtn" class="contribute-btn" disabled>
                    🎯 Contribute Now
                </button>
            </form>
        </div>
    </div>

    <!-- Privacy Banner -->
    <div class="privacy-banner" id="privacyBanner">
        <h3>🍪 Help Us Improve Your Experience</h3>
        <p>We use privacy-friendly analytics to understand how our contribution forms are used. No personal information is collected.</p>
        <div class="privacy-buttons">
            <button class="privacy-btn accept" onclick="handleConsent(true)">Accept</button>
            <button class="privacy-btn decline" onclick="handleConsent(false)">Decline</button>
            <button class="privacy-btn learn-more" onclick="showPrivacyDetails()">Learn More</button>
        </div>
    </div>

    <script>
        // Simple Analytics Implementation for Demo
        class DemoAnalytics {
            constructor() {
                this.visitorId = this.generateId('visitor');
                this.sessionId = this.generateId('session');
                this.sessionStart = Date.now();
                this.events = [];
                this.trackingEnabled = null;
                this.formStarted = false;
                this.maxScrollDepth = 0;
                this.clickCount = 0;
                
                this.init();
            }

            generateId(prefix) {
                const timestamp = Date.now().toString(36);
                const random = Math.random().toString(36).substr(2, 9);
                return \`\${prefix}_\${timestamp}_\${random}\`;
            }

            init() {
                this.updateStatus();
                this.setupEventListeners();
                this.trackEvent('page_view', {
                    url: window.location.href,
                    referrer: document.referrer,
                    title: document.title
                });
            }

            setupEventListeners() {
                // Scroll tracking
                let scrollTimeout;
                window.addEventListener('scroll', () => {
                    clearTimeout(scrollTimeout);
                    scrollTimeout = setTimeout(() => {
                        const scrollTop = window.pageYOffset;
                        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                        const scrollPercent = Math.round((scrollTop / docHeight) * 100);
                        
                        if (scrollPercent > this.maxScrollDepth) {
                            this.maxScrollDepth = scrollPercent;
                            if (scrollPercent >= 25 && scrollPercent < 50) {
                                this.trackEvent('scroll_25');
                            } else if (scrollPercent >= 50 && scrollPercent < 75) {
                                this.trackEvent('scroll_50');
                            } else if (scrollPercent >= 75) {
                                this.trackEvent('scroll_75');
                            }
                        }
                    }, 250);
                });

                // Click tracking
                document.addEventListener('click', (e) => {
                    this.clickCount++;
                    const element = e.target;
                    
                    if (element.tagName === 'BUTTON') {
                        this.trackEvent('button_click', {
                            buttonId: element.id,
                            buttonText: element.textContent.trim(),
                            buttonClass: element.className
                        });
                    }
                });

                // Form tracking
                document.addEventListener('focus', (e) => {
                    if (e.target.tagName === 'INPUT') {
                        if (!this.formStarted) {
                            this.formStarted = true;
                            this.trackEvent('form_start', { formId: 'contributionForm' });
                        }
                        
                        this.trackEvent('form_field_focus', {
                            fieldId: e.target.id,
                            fieldType: e.target.type
                        });
                    }
                }, true);

                // Form submission
                document.getElementById('contributionForm').addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleFormSubmission();
                });
            }

            trackEvent(eventType, eventData = {}) {
                if (this.trackingEnabled === false) return;

                const event = {
                    id: this.generateId('event'),
                    visitor_id: this.visitorId,
                    session_id: this.sessionId,
                    event_type: eventType,
                    event_data: eventData,
                    timestamp: new Date().toISOString(),
                    url: window.location.href
                };

                this.events.push(event);
                
                console.log('📊 Analytics Event:', eventType, eventData);
                this.updateStatus();

                // Simulate API call
                if (this.events.length >= 5) {
                    this.flushEvents();
                }
            }

            trackConversion(conversionData) {
                this.trackEvent('conversion', {
                    ...conversionData,
                    session_duration: Date.now() - this.sessionStart,
                    max_scroll_depth: this.maxScrollDepth,
                    click_count: this.clickCount
                });
                this.flushEvents();
            }

            flushEvents() {
                if (this.events.length === 0) return;
                
                console.log('🚀 Sending', this.events.length, 'events to analytics backend');
                console.table(this.events.map(e => ({
                    Type: e.event_type,
                    Data: JSON.stringify(e.event_data),
                    Time: new Date(e.timestamp).toLocaleTimeString()
                })));
                
                this.events = [];
                this.updateStatus();
            }

            setConsent(granted) {
                this.trackingEnabled = granted;
                localStorage.setItem('demo_analytics_consent', granted.toString());
                
                if (granted) {
                    this.trackEvent('consent_granted');
                } else {
                    this.events = [];
                    this.trackEvent('consent_denied');
                }
                
                this.updateStatus();
                document.getElementById('privacyBanner').style.display = 'none';
            }

            updateStatus() {
                document.getElementById('visitorId').textContent = this.visitorId;
                document.getElementById('sessionId').textContent = this.sessionId;
                document.getElementById('trackingStatus').textContent = 
                    this.trackingEnabled === null ? 'Pending Consent' :
                    this.trackingEnabled ? 'Enabled' : 'Disabled';
                document.getElementById('eventCount').textContent = this.events.length;
            }

            handleFormSubmission() {
                const amount = document.getElementById('amount').value;
                
                if (!amount || parseFloat(amount) <= 0) {
                    this.trackEvent('form_validation_error', { field: 'amount', error: 'invalid_amount' });
                    alert('Please enter a valid amount');
                    return;
                }

                // Show progress
                const progressBar = document.getElementById('progressBar');
                const progressFill = document.getElementById('progressFill');
                progressBar.classList.remove('hidden');
                
                let progress = 0;
                const interval = setInterval(() => {
                    progress += Math.random() * 30;
                    if (progress >= 100) {
                        progress = 100;
                        clearInterval(interval);
                        setTimeout(() => {
                            this.completeContribution(parseFloat(amount));
                        }, 500);
                    }
                    progressFill.style.width = progress + '%';
                }, 200);

                this.trackEvent('contribution_attempt', { amount: parseFloat(amount) });
            }

            completeContribution(amount) {
                // Simulate 90% success rate
                const success = Math.random() > 0.1;
                
                if (success) {
                    const mockHash = '0x' + Math.random().toString(16).substr(2, 64);
                    
                    this.trackConversion({
                        amount: amount,
                        transaction_hash: mockHash,
                        currency: 'ETH',
                        success: true
                    });
                    
                    alert(\`🎉 Contribution successful!\\n\\nAmount: \${amount} ETH\\nTransaction: \${mockHash}\\n\\nThank you for your support!\`);
                } else {
                    this.trackEvent('contribution_failure', {
                        amount: amount,
                        error: 'Transaction failed: Insufficient gas fee'
                    });
                    
                    alert('❌ Transaction failed: Insufficient gas fee. Please try again.');
                }
                
                // Hide progress bar
                document.getElementById('progressBar').classList.add('hidden');
                document.getElementById('progressFill').style.width = '0%';
            }
        }

        // Initialize analytics
        const analytics = new DemoAnalytics();

        // Form interactions
        document.getElementById('walletBtn').addEventListener('click', () => {
            // Simulate wallet connection
            setTimeout(() => {
                document.getElementById('walletBtn').classList.add('hidden');
                document.getElementById('walletConnected').classList.remove('hidden');
                document.getElementById('contributeBtn').disabled = false;
                
                analytics.trackEvent('wallet_connected', { 
                    walletType: 'metamask',
                    address: '0x1234...5678'
                });
            }, 1500);
        });

        // Preset amount buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const amount = btn.dataset.amount;
                document.getElementById('amount').value = amount;
                
                // Update UI
                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update USD display
                const usdAmount = (parseFloat(amount) * 2000).toFixed(2);
                document.getElementById('amountDetails').textContent = \`≈ $\${usdAmount} USD at current rates\`;
                
                analytics.trackEvent('preset_amount_selected', { amount: parseFloat(amount) });
            });
        });

        // Amount input changes
        document.getElementById('amount').addEventListener('input', (e) => {
            const amount = parseFloat(e.target.value);
            if (amount && amount > 0) {
                const usdAmount = (amount * 2000).toFixed(2);
                document.getElementById('amountDetails').textContent = \`≈ $\${usdAmount} USD at current rates\`;
                
                // Track amount milestones
                if (amount >= 0.1) {
                    analytics.trackEvent('amount_milestone_01', { amount });
                }
                if (amount >= 1) {
                    analytics.trackEvent('amount_milestone_1', { amount });
                }
            } else {
                document.getElementById('amountDetails').textContent = 'Enter an amount to see USD equivalent';
            }
        });

        // Privacy functions
        function handleConsent(granted) {
            analytics.setConsent(granted);
        }

        function showPrivacyDetails() {
            alert(\`🔒 Privacy-First Analytics\\n\\n✅ What we collect:\\n• Anonymous visitor IDs\\n• Page views and interactions\\n• Form completion rates\\n• General location (country/city)\\n\\n❌ What we DON'T collect:\\n• Personal information\\n• Contribution amounts\\n• Wallet addresses\\n• Cross-site tracking\\n\\nYou can opt-out anytime!\`);
        }

        // Global functions for console testing
        window.demoAnalytics = analytics;
        window.trackEvent = (type, data) => analytics.trackEvent(type, data);
        window.getAnalyticsStatus = () => ({
            visitorId: analytics.visitorId,
            sessionId: analytics.sessionId,
            events: analytics.events.length,
            trackingEnabled: analytics.trackingEnabled
        });

        console.log('🚀 Demo Analytics System Ready!');
    </script>
</body>
</html>
  `;

  const demoPath = path.join(__dirname, 'demo-analytics-form.html');
  fs.writeFileSync(demoPath, htmlContent);
  return demoPath;
}

async function launchDemoForm() {
  console.log('🚀 Creating demo analytics form...');
  
  // Create the demo HTML file
  const demoPath = await createDemoHTML();
  console.log('✅ Demo form created at:', demoPath);

  // Launch Puppeteer
  
  const browser = await puppeteer.launch({
    headless: false, // Show the browser
    defaultViewport: null, // Use full viewport
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--allow-running-insecure-content'
    ]
  });

  const page = await browser.newPage();
  
  // Set up console logging
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'log' || type === 'info') {
    } else if (type === 'error') {
      console.error('❌ Browser Error:', msg.text());
    }
  });

  // Navigate to the demo form
  const fileUrl = 'file://' + demoPath;
  
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  // Set up some UTM parameters to test traffic source detection
  await page.evaluate(() => {
    // Simulate coming from Google Ads
    history.replaceState({}, '', '?utm_source=google&utm_medium=cpc&utm_campaign=crypto_campaign_2025');
    
    // Update referrer for testing
    Object.defineProperty(document, 'referrer', {
      value: 'https://google.com/search?q=crypto+campaigns',
      configurable: true
    });
  });

  console.log('✅ Demo form is now open in your browser!');
  console.log('📊 Analytics features demonstrated:');

  // Add some automated interactions for demo purposes
  setTimeout(async () => {
    
    // Scroll down automatically
    await page.evaluate(() => {
      window.scrollTo({ top: 200, behavior: 'smooth' });
    });
    
    setTimeout(async () => {
      await page.evaluate(() => {
        window.scrollTo({ top: 400, behavior: 'smooth' });
      });
    }, 2000);
    
    setTimeout(async () => {
      await page.evaluate(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }, 4000);
    
    console.log('✅ Automated scroll interactions completed');
    
  }, 3000);

  // Keep the browser open
  
  // Handle cleanup on exit
  process.on('SIGINT', async () => {
    await browser.close();
    
    // Clean up demo file
    if (fs.existsSync(demoPath)) {
      fs.unlinkSync(demoPath);
    }
    
    process.exit(0);
  });
}

// Run the demo
if (require.main === module) {
  launchDemoForm().catch(error => {
    console.error('❌ Error launching demo:', error);
    process.exit(1);
  });
}

module.exports = { launchDemoForm, createDemoHTML };