import pg from 'pg'
import fs from 'fs'

const { Client } = pg

// Direct PostgreSQL connection to Supabase
const client = new Client({
  host: 'db.kmepcdsklnnxokoimvzo.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'SenecaCrypto2024!',
  ssl: {
    rejectUnauthorized: false
  }
})

async function createUsersTable() {
  console.log('🚀 Creating users table in Supabase via direct PostgreSQL connection...')
  
  try {
    // Connect to PostgreSQL
    await client.connect()
    console.log('✅ Connected to Supabase PostgreSQL database')
    
    // Read migration file
    const migrationSQL = fs.readFileSync('supabase/migrations/20250903023905_create_users_table.sql', 'utf8')
    console.log('📄 Loaded migration SQL from file')
    
    // Execute the migration
    console.log('🔄 Executing migration...')
    const result = await client.query(migrationSQL)
    console.log('✅ Migration executed successfully!')
    
    // Test if table exists and has data
    console.log('\n🔍 Testing table access...')
    const testResult = await client.query('SELECT * FROM public.users LIMIT 5')
    console.log('✅ Users table is now accessible!')
    console.log(`📊 Found ${testResult.rows.length} users`)
    if (testResult.rows.length > 0) {
      console.log('👤 Admin user:', testResult.rows[0])
    }
    
    // Test API access
    console.log('\n🌐 Testing REST API access...')
    const response = await fetch('https://kmepcdsklnnxokoimvzo.supabase.co/rest/v1/users?select=*', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI'
      }
    })
    
    if (response.ok) {
      const apiData = await response.json()
      console.log('✅ REST API access working!')
      console.log(`📊 API returned ${apiData.length} users`)
    } else {
      console.log('⚠️ REST API access may be restricted, but table exists in database')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    throw error
  } finally {
    await client.end()
    console.log('🔌 Disconnected from database')
  }
}

// Run the script
createUsersTable().then(() => {
  console.log('🎉 Script completed')
  process.exit(0)
}).catch(error => {
  console.error('💥 Script failed:', error)
  process.exit(1)
})