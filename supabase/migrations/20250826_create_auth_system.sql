-- ============================================================================
-- AUTH SYSTEM SETUP FOR CAMPAIGN PLATFORM
-- Creates comprehensive user authentication with role-based permissions
-- ============================================================================

-- ============================================================================
-- 1. CREATE USERS TABLE WITH ROLES AND PERMISSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Basic Info
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    
    -- Contact Information (completed after signup)
    phone TEXT,
    company TEXT,
    job_title TEXT,
    
    -- Auth Info (Supabase handles password)
    email_confirmed BOOLEAN DEFAULT false,
    email_confirmed_at TIMESTAMPTZ,
    
    -- Role & Permissions
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
    permissions TEXT[] DEFAULT ARRAY['view'],
    
    -- Campaign Association
    primary_campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    
    -- Invitation System
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    invitation_token TEXT,
    invitation_expires_at TIMESTAMPTZ,
    invitation_accepted_at TIMESTAMPTZ,
    
    -- Profile Settings
    timezone TEXT DEFAULT 'America/New_York',
    notification_preferences JSONB DEFAULT '{"email": true, "sms": false}',
    
    -- Security
    last_login_at TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. CREATE CAMPAIGN MEMBERS TABLE (Many-to-Many Relationship)
-- ============================================================================

CREATE TABLE IF NOT EXISTS campaign_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Relationships
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Permissions for this specific campaign
    permissions TEXT[] NOT NULL DEFAULT ARRAY['view'] 
        CHECK (permissions <@ ARRAY['admin', 'export', 'view']),
    
    -- Role within this campaign
    campaign_role TEXT DEFAULT 'member' CHECK (campaign_role IN ('owner', 'admin', 'member', 'viewer')),
    
    -- Invitation details
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ,
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint - one membership per user per campaign
    UNIQUE(campaign_id, user_id)
);

-- ============================================================================
-- 3. CREATE INVITATIONS TABLE FOR PENDING INVITES
-- ============================================================================

CREATE TABLE IF NOT EXISTS invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Invitation Details
    email TEXT NOT NULL,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Permissions being granted
    permissions TEXT[] NOT NULL DEFAULT ARRAY['view'] 
        CHECK (permissions <@ ARRAY['admin', 'export', 'view']),
    campaign_role TEXT DEFAULT 'member' CHECK (campaign_role IN ('admin', 'member', 'viewer')),
    
    -- Invitation Token & Expiry
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    accepted_at TIMESTAMPTZ,
    
    -- Message
    personal_message TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_primary_campaign ON users(primary_campaign_id);
CREATE INDEX idx_users_invitation_token ON users(invitation_token);

CREATE INDEX idx_campaign_members_campaign ON campaign_members(campaign_id);
CREATE INDEX idx_campaign_members_user ON campaign_members(user_id);
CREATE INDEX idx_campaign_members_status ON campaign_members(status);

CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_campaign ON invitations(campaign_id);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_invitations_expires_at ON invitations(expires_at);

-- ============================================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. CREATE RLS POLICIES FOR USERS TABLE
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Users can insert their own profile (signup)
CREATE POLICY "Users can create own profile" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Campaign admins can view users in their campaigns
CREATE POLICY "Campaign admins can view campaign users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM campaign_members cm1
            JOIN campaign_members cm2 ON cm1.campaign_id = cm2.campaign_id
            WHERE cm1.user_id::text = auth.uid()::text
            AND cm2.user_id = users.id
            AND 'admin' = ANY(cm1.permissions)
        )
    );

-- ============================================================================
-- 7. CREATE RLS POLICIES FOR CAMPAIGN_MEMBERS TABLE
-- ============================================================================

-- Users can view campaign memberships they're part of
CREATE POLICY "Users can view own campaign memberships" ON campaign_members
    FOR SELECT USING (
        user_id::text = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM campaign_members cm
            WHERE cm.campaign_id = campaign_members.campaign_id
            AND cm.user_id::text = auth.uid()::text
            AND ('admin' = ANY(cm.permissions) OR 'view' = ANY(cm.permissions))
        )
    );

-- Campaign admins can manage memberships
CREATE POLICY "Campaign admins can manage memberships" ON campaign_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM campaign_members cm
            WHERE cm.campaign_id = campaign_members.campaign_id
            AND cm.user_id::text = auth.uid()::text
            AND 'admin' = ANY(cm.permissions)
        )
    );

-- Users can insert themselves into campaigns (when accepting invitations)
CREATE POLICY "Users can join campaigns via invitation" ON campaign_members
    FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

-- ============================================================================
-- 8. CREATE RLS POLICIES FOR INVITATIONS TABLE
-- ============================================================================

-- Campaign admins can view their campaign invitations
CREATE POLICY "Campaign admins can view invitations" ON invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM campaign_members cm
            WHERE cm.campaign_id = invitations.campaign_id
            AND cm.user_id::text = auth.uid()::text
            AND 'admin' = ANY(cm.permissions)
        )
    );

-- Campaign admins can create invitations
CREATE POLICY "Campaign admins can create invitations" ON invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM campaign_members cm
            WHERE cm.campaign_id = campaign_id
            AND cm.user_id::text = auth.uid()::text
            AND 'admin' = ANY(cm.permissions)
        )
    );

-- Campaign admins can update their invitations
CREATE POLICY "Campaign admins can update invitations" ON invitations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM campaign_members cm
            WHERE cm.campaign_id = invitations.campaign_id
            AND cm.user_id::text = auth.uid()::text
            AND 'admin' = ANY(cm.permissions)
        )
    );

-- Public can view invitations by token (for acceptance)
CREATE POLICY "Public can view invitations by token" ON invitations
    FOR SELECT USING (token IS NOT NULL);

-- ============================================================================
-- 9. CREATE FUNCTIONS FOR INVITATION TOKENS
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..32 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. CREATE FUNCTION TO ACCEPT INVITATIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION accept_invitation(
    p_token TEXT,
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_invitation invitations%ROWTYPE;
    v_result JSONB;
BEGIN
    -- Get invitation
    SELECT * INTO v_invitation
    FROM invitations
    WHERE token = p_token
    AND status = 'pending'
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invitation not found or expired'
        );
    END IF;
    
    -- Check if user is already a member
    IF EXISTS (
        SELECT 1 FROM campaign_members
        WHERE campaign_id = v_invitation.campaign_id
        AND user_id = p_user_id
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User is already a member of this campaign'
        );
    END IF;
    
    -- Create campaign membership
    INSERT INTO campaign_members (
        campaign_id,
        user_id,
        permissions,
        campaign_role,
        invited_by,
        invited_at,
        joined_at,
        status
    ) VALUES (
        v_invitation.campaign_id,
        p_user_id,
        v_invitation.permissions,
        v_invitation.campaign_role,
        v_invitation.invited_by,
        v_invitation.created_at,
        NOW(),
        'active'
    );
    
    -- Update invitation status
    UPDATE invitations
    SET status = 'accepted',
        accepted_at = NOW(),
        updated_at = NOW()
    WHERE id = v_invitation.id;
    
    RETURN jsonb_build_object(
        'success', true,
        'campaign_id', v_invitation.campaign_id,
        'permissions', v_invitation.permissions,
        'role', v_invitation.campaign_role
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 11. CREATE TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_members_updated_at BEFORE UPDATE ON campaign_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 12. UPDATE CAMPAIGNS TABLE TO LINK WITH USERS
-- ============================================================================

-- Add owner relationship to campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Update existing campaigns RLS policy
DROP POLICY IF EXISTS "Public can update campaigns" ON campaigns;

-- Campaign owners can update their own campaigns
CREATE POLICY "Campaign owners can update campaigns" ON campaigns
    FOR UPDATE USING (
        owner_id::text = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM campaign_members cm
            WHERE cm.campaign_id = campaigns.id
            AND cm.user_id::text = auth.uid()::text
            AND 'admin' = ANY(cm.permissions)
        )
    );

-- Campaign members can view their campaigns
CREATE POLICY "Campaign members can view campaigns" ON campaigns
    FOR SELECT USING (
        owner_id::text = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM campaign_members cm
            WHERE cm.campaign_id = campaigns.id
            AND cm.user_id::text = auth.uid()::text
        )
    );