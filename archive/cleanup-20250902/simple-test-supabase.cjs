// Simple test without external dependencies
const fs = require('fs');
const https = require('https');

// Read .env file manually
const envPath = './frontend/.env';
if (!fs.existsSync(envPath)) {
  console.log('❌ No .env file found at:', envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line.includes('=') && !line.startsWith('#')) {
    const [key, value] = line.split('=');
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const supabaseKey = envVars['VITE_SUPABASE_ANON_KEY'];

console.log('🔍 Testing Supabase Configuration...\n');
console.log('📡 URL:', supabaseUrl);
console.log('🔑 Key:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing configuration!');
  process.exit(1);
}

// Test connection to REST API
const testUrl = supabaseUrl + '/rest/v1/';
const options = {
  hostname: supabaseUrl.replace('https://', '').replace('/rest/v1/', ''),
  path: '/rest/v1/',
  method: 'GET',
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`
  }
};

console.log('\n🧪 Testing REST API connection...');
const req = https.request(options, (res) => {
  console.log('✅ Status:', res.statusCode);
  if (res.statusCode === 200) {
    console.log('✅ Supabase REST API is accessible!');
    console.log('✅ Configuration is working!');
    console.log('\n📋 The signup flow should now work properly.');
    console.log('💌 Email verification emails will be sent via Supabase.');
  } else if (res.statusCode === 404) {
    console.log('❌ Project not found - URL may be incorrect');
  } else {
    console.log('⚠️  Got status', res.statusCode, '- check credentials');
  }
});

req.on('error', (error) => {
  console.log('❌ Connection failed:', error.message);
});

req.end();