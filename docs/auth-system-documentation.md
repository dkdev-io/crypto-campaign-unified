# Campaign Auth System Documentation

## 🚀 Overview

This document describes the complete user authentication and authorization system for the crypto campaign platform. The system provides secure user registration, email verification, role-based permissions, team management, and admin capabilities.

## 📋 Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Components](#components)
5. [Setup Instructions](#setup-instructions)
6. [Usage Guide](#usage-guide)
7. [Testing](#testing)
8. [Security](#security)
9. [API Reference](#api-reference)

## ✨ Features

### Core Authentication
- ✅ Email/password user registration with verification
- ✅ Secure login with Supabase Auth
- ✅ Profile completion flow with contact information
- ✅ Password reset functionality (built into Supabase)

### Team Management
- ✅ Campaign member invitation system
- ✅ Role-based permissions (admin, export, view)
- ✅ Email-based invitations with expiration
- ✅ Team member management interface

### Admin Features
- ✅ Admin-only user management dashboard
- ✅ Role assignment and permission control
- ✅ User activity monitoring
- ✅ Campaign oversight capabilities

### Security
- ✅ Row-level security (RLS) policies
- ✅ Proper data isolation between campaigns
- ✅ Secure invitation token system
- ✅ Protected admin areas

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React App     │    │   Supabase       │    │   Database      │
│                 │    │                  │    │                 │
│ AuthContext     │◄──►│ Authentication   │◄──►│ Users Table     │
│ Components      │    │ Row Level        │    │ Campaigns       │
│ Permissions     │    │ Security         │    │ Members         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Key Components

- **AuthContext**: Global authentication state management
- **Supabase Client**: Handles auth and database operations
- **RLS Policies**: Secure data access at the database level
- **React Components**: UI for auth flows

## 🗄️ Database Schema

### Users Table
```sql
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  job_title TEXT,
  email_confirmed BOOLEAN DEFAULT false,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  permissions TEXT[] DEFAULT ARRAY['view'],
  primary_campaign_id UUID,
  invited_by UUID,
  timezone TEXT DEFAULT 'America/New_York',
  notification_preferences JSONB,
  last_login_at TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

### Campaign Members Table
```sql
campaign_members (
  id UUID PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  user_id UUID NOT NULL REFERENCES users(id),
  permissions TEXT[] NOT NULL DEFAULT ARRAY['view'],
  campaign_role TEXT DEFAULT 'member',
  invited_by UUID REFERENCES users(id),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, user_id)
)
```

### Invitations Table
```sql
invitations (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  invited_by UUID NOT NULL REFERENCES users(id),
  permissions TEXT[] NOT NULL DEFAULT ARRAY['view'],
  campaign_role TEXT DEFAULT 'member',
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending',
  personal_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

## 🧩 Components

### Core Components

#### AuthContext
```jsx
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Provides authentication state globally
const { user, userProfile, signUp, signIn, signOut } = useAuth()
```

#### AuthFlow
```jsx
import AuthFlow from './components/auth/AuthFlow'

// Complete authentication flow with signup/login
<AuthFlow 
  onAuthComplete={(data) => handleAuthComplete(data)}
  initialMode="signup"
  requireProfileCompletion={true}
/>
```

#### Team Management
```jsx
import TeamManagement from './components/team/TeamManagement'

// Complete team management interface
<TeamManagement campaignId={campaignId} />
```

#### User Management (Admin Only)
```jsx
import UserManagement from './components/admin/UserManagement'

// Admin dashboard for managing all users
<UserManagement />
```

### Individual Components

- **AuthSignUp**: User registration form
- **AuthLogin**: User login form  
- **ProfileCompletion**: Contact information form
- **InviteMembers**: Send team invitations
- **AcceptInvitation**: Accept invitation interface

## 🛠️ Setup Instructions

### 1. Database Setup

Run the migration file in your Supabase SQL editor:

```bash
# File: supabase/migrations/20250826_create_auth_system.sql
# Run this in your Supabase dashboard SQL editor
```

### 2. Environment Variables

Ensure your Supabase configuration is set up in your React app:

```javascript
// frontend/src/lib/supabase.js
const supabaseUrl = 'your-supabase-url'
const supabaseAnonKey = 'your-supabase-anon-key'
```

### 3. Install Dependencies

```bash
# If not already installed
npm install @supabase/supabase-js
```

### 4. Import Styles

```jsx
// Import in your main component or App.jsx
import './styles/auth.css'
import './styles/admin.css'
```

### 5. Wrap Your App

```jsx
// App.jsx
import { AuthProvider } from './contexts/AuthContext'
import AuthFlow from './components/auth/AuthFlow'

function App() {
  return (
    <AuthProvider>
      <AuthFlow
        onAuthComplete={(data) => console.log('Auth complete:', data)}
        initialMode="login"
        requireProfileCompletion={true}
        requireDataSetup={false}
      />
    </AuthProvider>
  )
}
```

## 📚 Usage Guide

### Basic Authentication Flow

1. **User Registration**
   ```jsx
   const { signUp } = useAuth()
   const result = await signUp(email, password, fullName)
   ```

2. **Email Verification**
   - User receives email verification link
   - Must click link before logging in

3. **Login**
   ```jsx
   const { signIn } = useAuth()
   const result = await signIn(email, password)
   ```

4. **Profile Completion**
   - Automatic prompt for contact information
   - Optional phone, company, job title
   - Notification preferences

### Team Management

1. **Invite Team Members**
   ```jsx
   // Admin creates invitation
   const invitation = await supabase
     .from('invitations')
     .insert({
       email: 'teammate@example.com',
       campaign_id: campaignId,
       permissions: ['view', 'export'],
       campaign_role: 'member'
     })
   ```

2. **Accept Invitations**
   ```jsx
   const { acceptInvitation } = useAuth()
   const result = await acceptInvitation(token)
   ```

3. **Manage Permissions**
   - View: Can see campaign data
   - Export: Can download reports
   - Admin: Full campaign management

### Admin Features

1. **User Management**
   - View all platform users
   - Manage user roles
   - Monitor activity
   - Access contact information

2. **Role Assignment**
   ```jsx
   // Update user role
   await supabase
     .from('users')
     .update({ role: 'admin' })
     .eq('id', userId)
   ```

## 🧪 Testing

### Run Test Suite

```bash
# Test the complete auth system
node scripts/test-auth-system.js
```

### Manual Testing Steps

1. **Registration Flow**
   - Visit the app
   - Create new account
   - Check email for verification
   - Verify email address
   - Complete profile

2. **Invitation Flow**
   - Create a campaign
   - Invite team members
   - Test invitation acceptance
   - Verify permissions

3. **Admin Features**
   - Set user role to admin
   - Access user management
   - View team data

### Test Data Cleanup

```sql
-- Clean up test data
DELETE FROM invitations WHERE email LIKE '%test%';
DELETE FROM campaign_members WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE '%test%'
);
DELETE FROM campaigns WHERE email LIKE '%test%';
```

## 🔒 Security

### Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:

```sql
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Campaign members can view campaign data
CREATE POLICY "Campaign members can view campaigns" ON campaigns
  FOR SELECT USING (
    owner_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM campaign_members cm
      WHERE cm.campaign_id = campaigns.id
      AND cm.user_id::text = auth.uid()::text
    )
  );
```

### Best Practices

1. **Never expose sensitive data** in client-side code
2. **Use RLS policies** to enforce data access rules
3. **Validate permissions** on both client and server
4. **Rotate invitation tokens** regularly
5. **Monitor failed login attempts**

### Password Requirements

- Minimum 8 characters
- Must contain uppercase and lowercase letters
- Must contain numbers
- Special characters recommended

## 📖 API Reference

### AuthContext Methods

```javascript
const {
  // State
  user,                    // Current Supabase user
  session,                 // Current session
  userProfile,            // User profile from users table
  loading,                // Loading state

  // Methods
  signUp,                 // (email, password, fullName) => Promise
  signIn,                 // (email, password) => Promise
  signOut,                // () => Promise
  updateProfile,          // (updates) => Promise
  getUserCampaigns,       // () => Promise
  hasPermission,          // (campaignId, permission) => Promise<boolean>
  acceptInvitation,       // (token) => Promise
  fetchUserProfile        // (userId) => Promise
} = useAuth()
```

### Database Functions

```sql
-- Generate invitation tokens
SELECT generate_invitation_token();

-- Accept invitation
SELECT accept_invitation('token', 'user-id');

-- Calculate recurring projections (for future use)
SELECT * FROM calculate_recurring_projection(
  amount := 100.00,
  frequency := 'monthly',
  start_date := '2024-01-01'
);
```

### Component Props

```typescript
interface AuthFlowProps {
  onAuthComplete?: (data: AuthData) => void
  initialMode?: 'login' | 'signup'
  requireProfileCompletion?: boolean
}

interface TeamManagementProps {
  campaignId: string
}

interface InviteMembersProps {
  campaignId: string
  onInviteSent?: (invitation: Invitation) => void
}

interface AcceptInvitationProps {
  token: string
  onAccepted?: (data: AcceptanceData) => void
  onError?: (error: string) => void
}
```

## 🔧 Troubleshooting

### Common Issues

1. **Email Verification Not Working**
   - Check Supabase email settings
   - Verify email templates are configured
   - Check spam folder

2. **RLS Policies Blocking Access**
   - Verify user is authenticated
   - Check policy conditions
   - Test with admin bypass

3. **Invitation Links Not Working**
   - Check token expiration
   - Verify invitation status
   - Test with valid tokens

4. **Permission Errors**
   - Verify user has correct role
   - Check campaign membership
   - Validate RLS policies

### Debug Mode

Enable debug logging:

```javascript
// In your app initialization
if (process.env.NODE_ENV === 'development') {
  window.supabaseDebug = true
}
```

### Support Commands

```bash
# Check database schema
npm run db:check

# Reset test data  
npm run db:reset-test

# View current user permissions
npm run auth:check-perms
```

## 📈 Future Enhancements

### Planned Features

1. **OAuth Integration** (Google, GitHub)
2. **Two-Factor Authentication** (2FA)
3. **Advanced Audit Logging**
4. **API Rate Limiting**
5. **Bulk User Management**
6. **Advanced Permission Groups**

### Performance Optimizations

1. **Caching user permissions**
2. **Pagination for large teams**
3. **Lazy loading of user data**
4. **Optimized RLS queries**

## 📞 Support

For issues or questions about the auth system:

1. Check this documentation
2. Run the test suite
3. Review the troubleshooting section
4. Check Supabase dashboard logs
5. Submit an issue with reproduction steps

---

## 📄 License

This auth system is part of the campaign platform and follows the same license terms.

---

*Last updated: August 26, 2025*