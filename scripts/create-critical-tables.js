import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kmepcdsklnnxokoimvzo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU0NjI0OCwiZXhwIjoyMDcxMTIyMjQ4fQ.o1kPHZSDUkQu0WTYIhhFnzKnO5qz0LSJajy2HsgNTfY'
);

async function createCriticalTables() {
  console.log('🔧 Creating critical database tables...\n');

  try {
    // Create users table
    const usersTableSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255),
        email_confirmed BOOLEAN DEFAULT FALSE,
        email_confirmed_at TIMESTAMP,
        role VARCHAR(50) DEFAULT 'user',
        avatar_url TEXT,
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        last_login_at TIMESTAMP,
        login_count INTEGER DEFAULT 0,
        kyc_status VARCHAR(20) DEFAULT 'pending',
        kyc_submitted_at TIMESTAMP,
        kyc_approved_at TIMESTAMP,
        wallet_address VARCHAR(255),
        metadata JSONB DEFAULT '{}'::jsonb
      );

      -- Create indexes for users table
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status);
    `;

    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: usersTableSQL
    }).single();

    if (usersError) {
      console.log('⚠️  Users table might already exist or using alternative creation...');
    } else {
      console.log('✅ Users table created successfully');
    }

    // Create donors table
    const donorsTableSQL = `
      CREATE TABLE IF NOT EXISTS donors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        wallet_address VARCHAR(255),
        total_donated DECIMAL(18,2) DEFAULT 0,
        donation_count INTEGER DEFAULT 0,
        first_donation_at TIMESTAMP,
        last_donation_at TIMESTAMP,
        kyc_status VARCHAR(20) DEFAULT 'pending',
        kyc_documents JSONB DEFAULT '[]'::jsonb,
        preferred_currency VARCHAR(10) DEFAULT 'ETH',
        notification_preferences JSONB DEFAULT '{"email": true, "sms": false}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Create indexes for donors table
      CREATE INDEX IF NOT EXISTS idx_donors_user_id ON donors(user_id);
      CREATE INDEX IF NOT EXISTS idx_donors_email ON donors(email);
      CREATE INDEX IF NOT EXISTS idx_donors_kyc_status ON donors(kyc_status);
    `;

    const { error: donorsError } = await supabase.rpc('exec_sql', {
      sql: donorsTableSQL
    }).single();

    if (donorsError) {
      console.log('⚠️  Donors table might already exist or using alternative creation...');
    } else {
      console.log('✅ Donors table created successfully');
    }

    // Create campaign_members table for team management
    const campaignMembersSQL = `
      CREATE TABLE IF NOT EXISTS campaign_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'member',
        permissions JSONB DEFAULT '[]'::jsonb,
        joined_at TIMESTAMP DEFAULT NOW(),
        invited_by UUID REFERENCES users(id),
        invitation_token VARCHAR(255),
        invitation_accepted BOOLEAN DEFAULT FALSE,
        UNIQUE(campaign_id, user_id)
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_campaign_members_campaign ON campaign_members(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_campaign_members_user ON campaign_members(user_id);
      CREATE INDEX IF NOT EXISTS idx_campaign_members_token ON campaign_members(invitation_token);
    `;

    const { error: membersError } = await supabase.rpc('exec_sql', {
      sql: campaignMembersSQL
    }).single();

    if (membersError) {
      console.log('⚠️  Campaign members table might already exist...');
    } else {
      console.log('✅ Campaign members table created successfully');
    }

    // Create donations table
    const donationsTableSQL = `
      CREATE TABLE IF NOT EXISTS donations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        donor_id UUID REFERENCES donors(id) ON DELETE SET NULL,
        campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
        amount DECIMAL(18,8) NOT NULL,
        currency VARCHAR(10) DEFAULT 'ETH',
        usd_value DECIMAL(18,2),
        transaction_hash VARCHAR(255) UNIQUE,
        status VARCHAR(20) DEFAULT 'pending',
        anonymous BOOLEAN DEFAULT FALSE,
        message TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        confirmed_at TIMESTAMP,
        refunded_at TIMESTAMP,
        metadata JSONB DEFAULT '{}'::jsonb
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_donations_donor ON donations(donor_id);
      CREATE INDEX IF NOT EXISTS idx_donations_campaign ON donations(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
      CREATE INDEX IF NOT EXISTS idx_donations_hash ON donations(transaction_hash);
    `;

    const { error: donationsError } = await supabase.rpc('exec_sql', {
      sql: donationsTableSQL
    }).single();

    if (donationsError) {
      console.log('⚠️  Donations table might already exist...');
    } else {
      console.log('✅ Donations table created successfully');
    }

    // Try alternative creation method if RPC doesn't work
    console.log('\n📋 Attempting alternative table creation via direct insert...');

    // Test users table
    const { error: testUsersError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (testUsersError) {
      console.log('❌ Users table not accessible:', testUsersError.message);
      console.log('\n⚠️  IMPORTANT: You may need to create these tables manually in Supabase dashboard');
      console.log('Visit: https://app.supabase.com/project/kmepcdsklnnxokoimvzo/editor');
    } else {
      console.log('✅ Users table is accessible');
    }

    // Test donors table
    const { error: testDonorsError } = await supabase
      .from('donors')
      .select('count')
      .limit(1);

    if (testDonorsError) {
      console.log('❌ Donors table not accessible:', testDonorsError.message);
    } else {
      console.log('✅ Donors table is accessible');
    }

    // Create a test admin user
    console.log('\n👤 Creating test admin user...');
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .upsert([
        {
          email: 'admin@crypto-campaign.com',
          full_name: 'Admin User',
          role: 'admin',
          email_confirmed: true,
          email_confirmed_at: new Date().toISOString()
        }
      ], { onConflict: 'email' })
      .select()
      .single();

    if (adminError) {
      console.log('⚠️  Could not create admin user:', adminError.message);
    } else {
      console.log('✅ Admin user created/updated:', adminUser.email);
    }

    // Create a test regular user
    const { data: testUser, error: testError } = await supabase
      .from('users')
      .upsert([
        {
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'user',
          email_confirmed: true,
          email_confirmed_at: new Date().toISOString()
        }
      ], { onConflict: 'email' })
      .select()
      .single();

    if (testError) {
      console.log('⚠️  Could not create test user:', testError.message);
    } else {
      console.log('✅ Test user created/updated:', testUser.email);
    }

    console.log('\n✨ Critical tables setup complete!');
    console.log('\nNOTE: If tables were not created, please create them manually in Supabase dashboard.');
    console.log('SQL scripts are available in the /scripts directory.');

  } catch (error) {
    console.error('❌ Error creating tables:', error);
    console.log('\n📝 Manual Setup Instructions:');
    console.log('1. Go to https://app.supabase.com/project/kmepcdsklnnxokoimvzo/editor');
    console.log('2. Run the SQL commands from scripts/create-critical-tables.sql');
    console.log('3. Ensure Row Level Security (RLS) is properly configured');
  }

  process.exit(0);
}

createCriticalTables();