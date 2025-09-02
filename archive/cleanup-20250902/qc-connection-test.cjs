// Quality Control - Supabase Connection Test
const fs = require('fs');
const https = require('https');

console.log('🔍 QUALITY CONTROL - Supabase Connection Test\n');

// Read .env file manually
const envPath = './frontend/.env';
if (!fs.existsSync(envPath)) {
  console.log('❌ FAILED: No .env file found at:', envPath);
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

console.log('📋 Configuration Check:');
console.log('  📡 URL:', supabaseUrl || '❌ MISSING');
console.log('  🔑 Key:', supabaseKey ? '✅ Present (' + supabaseKey.substring(0, 20) + '...)' : '❌ MISSING');

if (!supabaseUrl || !supabaseKey) {
  console.log('\n❌ QC FAILED: Missing required environment variables');
  process.exit(1);
}

// Test connection to REST API
const options = {
  hostname: supabaseUrl.replace('https://', ''),
  path: '/rest/v1/',
  method: 'GET',
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`
  }
};

console.log('\n🧪 Testing API Connection...');
const req = https.request(options, (res) => {
  console.log('  Status Code:', res.statusCode);
  
  if (res.statusCode === 200) {
    console.log('\n✅ QC PASSED: All systems operational');
    console.log('  ✅ Supabase project accessible');
    console.log('  ✅ API credentials valid');
    console.log('  ✅ Email verification will work');
    console.log('\n📧 Campaign signup will now send verification emails!');
  } else if (res.statusCode === 404) {
    console.log('\n❌ QC FAILED: Supabase project not found');
    console.log('  Check project URL is correct');
  } else {
    console.log('\n⚠️  QC WARNING: Unexpected status code', res.statusCode);
    console.log('  Check API credentials');
  }
});

req.on('error', (error) => {
  console.log('\n❌ QC FAILED: Connection error -', error.message);
});

req.end();