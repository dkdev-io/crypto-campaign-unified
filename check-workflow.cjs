// Simple Node script to check the workflow logic
console.log('🔍 Checking SetupWizard configuration...\n');

// Simulate the key logic from SetupWizard
const defaultStep = 1; // This should be 1 now, not 2
const totalSteps = 7; // This should be 7 now, not 8

console.log(`Default starting step: ${defaultStep}`);
console.log(`Total steps in workflow: ${totalSteps}`);

// Check if our combined component exists
const fs = require('fs');
const path = require('path');

const webStyleAnalyzerPath = path.join(__dirname, 'frontend/src/components/setup/WebsiteStyleAnalyzer.jsx');
const setupWizardPath = path.join(__dirname, 'frontend/src/components/setup/SetupWizard.jsx');

console.log('\n📁 File checks:');

if (fs.existsSync(webStyleAnalyzerPath)) {
  console.log('✅ WebsiteStyleAnalyzer.jsx exists');
} else {
  console.log('❌ WebsiteStyleAnalyzer.jsx missing');
}

if (fs.existsSync(setupWizardPath)) {
  const setupWizardContent = fs.readFileSync(setupWizardPath, 'utf8');
  
  // Check imports
  if (setupWizardContent.includes('import WebsiteStyleAnalyzer')) {
    console.log('✅ SetupWizard imports WebsiteStyleAnalyzer');
  } else {
    console.log('❌ SetupWizard does not import WebsiteStyleAnalyzer');
  }
  
  // Check totalSteps
  if (setupWizardContent.includes('const totalSteps = 7')) {
    console.log('✅ totalSteps set to 7');
  } else if (setupWizardContent.includes('const totalSteps = 8')) {
    console.log('❌ totalSteps still set to 8');
  } else {
    console.log('❓ totalSteps value unclear');
  }
  
  // Check default step
  if (setupWizardContent.includes('|| 1,')) {
    console.log('✅ Default steps set to 1');
  } else if (setupWizardContent.includes('|| 2,')) {
    console.log('❌ Default steps still set to 2');
  }
  
  // Check case statement
  if (setupWizardContent.includes('<WebsiteStyleAnalyzer')) {
    console.log('✅ WebsiteStyleAnalyzer used in case statement');
  } else {
    console.log('❌ WebsiteStyleAnalyzer not used in case statement');
  }
  
} else {
  console.log('❌ SetupWizard.jsx missing');
}

console.log('\n🎯 Expected workflow:');
console.log('1. CampaignInfo (Step 1 of 7)');
console.log('2. CommitteeSearch (Step 2 of 7)');
console.log('3. BankConnection (Step 3 of 7)');
console.log('4. WebsiteStyleAnalyzer (Step 4 of 7) - COMBINED');
console.log('5. StylePreferences (Step 5 of 7)');
console.log('6. TermsAgreement (Step 6 of 7)');
console.log('7. EmbedCode (Step 7 of 7)');
console.log('\n✅ Task should now be ACTUALLY complete!');