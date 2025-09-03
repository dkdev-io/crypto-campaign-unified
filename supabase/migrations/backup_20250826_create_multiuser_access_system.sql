-- Multi-User Access System for Campaign Dashboards
-- Created: 2025-08-26
-- Description: Secure multi-user access system with role-based permissions

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================================
-- USERS TABLE
-- Core user management with hierarchical account structure
-- =====================================================================================

CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer' 
        CHECK (role IN ('admin', 'viewer')),
    
    -- Hierarchical account structure
    account_owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Profile information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    
    -- Account status and tracking
    is_active BOOLEAN NOT NULL DEFAULT true,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    
    -- Security fields
    password_reset_token TEXT,
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    email_verification_token TEXT,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

-- Index for performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_account_owner ON public.users(account_owner_id);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_active ON public.users(is_active);

-- =====================================================================================
-- CAMPAIGNS TABLE (Updated)
-- Campaign management with ownership tracking
-- =====================================================================================

-- First, let's check if campaigns table exists and update it
-- If it doesn't exist, create it with the full structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'campaigns') THEN
        -- Create campaigns table if it doesn't exist
        CREATE TABLE public.campaigns (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            wallet_address VARCHAR(64) UNIQUE NOT NULL,
            
            -- Ownership and access control
            account_owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            created_by_user_id UUID NOT NULL REFERENCES public.users(id),
            
            -- Campaign status
            is_active BOOLEAN NOT NULL DEFAULT true,
            is_archived BOOLEAN NOT NULL DEFAULT false,
            
            -- Campaign metadata
            campaign_type VARCHAR(50) DEFAULT 'donation',
            target_amount DECIMAL(20,2),
            current_amount DECIMAL(20,2) DEFAULT 0,
            
            -- Audit fields
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            archived_at TIMESTAMP WITH TIME ZONE,
            archived_by UUID REFERENCES public.users(id)
        );
    ELSE
        -- Add new columns to existing campaigns table
        ALTER TABLE public.campaigns 
        ADD COLUMN IF NOT EXISTS account_owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES public.users(id),
        ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES public.users(id);
    END IF;
END
$$;

-- Indexes for campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_account_owner ON public.campaigns(account_owner_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON public.campaigns(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_active ON public.campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_campaigns_wallet ON public.campaigns(wallet_address);

-- =====================================================================================
-- USER_PERMISSIONS TABLE
-- Granular permission system for campaign access
-- =====================================================================================

CREATE TABLE public.user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Permission relationships
    granted_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    granted_to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    
    -- Permission details
    permission_level VARCHAR(20) NOT NULL DEFAULT 'read_only'
        CHECK (permission_level IN ('admin', 'read_only', 'analytics_only')),
    
    -- Permission metadata
    permission_note TEXT,
    
    -- Time-based permissions
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    last_accessed TIMESTAMP WITH TIME ZONE,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID REFERENCES public.users(id),
    revoked_reason TEXT,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique permissions per user-campaign pair
    UNIQUE(granted_to_user_id, campaign_id)
);

-- Indexes for user_permissions
CREATE INDEX idx_user_permissions_granted_by ON public.user_permissions(granted_by_user_id);
CREATE INDEX idx_user_permissions_granted_to ON public.user_permissions(granted_to_user_id);
CREATE INDEX idx_user_permissions_campaign ON public.user_permissions(campaign_id);
CREATE INDEX idx_user_permissions_active ON public.user_permissions(is_active);
CREATE INDEX idx_user_permissions_expires ON public.user_permissions(expires_at);

-- =====================================================================================
-- USER_SESSIONS TABLE
-- Secure session management
-- =====================================================================================

CREATE TABLE public.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Session security
    session_token TEXT UNIQUE NOT NULL,
    session_hash TEXT NOT NULL, -- Hash of the session token for security
    
    -- Session metadata
    ip_address INET,
    user_agent TEXT,
    device_fingerprint TEXT,
    
    -- Session timing
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Session status
    is_active BOOLEAN NOT NULL DEFAULT true,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_reason TEXT,
    
    -- Security flags
    is_suspicious BOOLEAN DEFAULT false,
    failed_attempts INTEGER DEFAULT 0
);

-- Indexes for user_sessions
CREATE INDEX idx_user_sessions_user ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON public.user_sessions(expires_at);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(is_active);
CREATE INDEX idx_user_sessions_last_activity ON public.user_sessions(last_activity);

-- =====================================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Comprehensive security policies for all tables
-- =====================================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- =====================================================================================
-- USERS TABLE POLICIES
-- =====================================================================================

-- Users can read their own profile and profiles of users in their account hierarchy
CREATE POLICY "users_read_policy" ON public.users
    FOR SELECT
    USING (
        -- User can read their own profile
        auth.uid()::text = id::text
        OR
        -- Account owners can read their sub-users
        (
            auth.uid()::text = account_owner_id::text
            AND EXISTS (
                SELECT 1 FROM public.users owner 
                WHERE owner.id::text = auth.uid()::text 
                AND owner.role = 'admin'
            )
        )
        OR
        -- Sub-users can read their account owner's profile
        (
            EXISTS (
                SELECT 1 FROM public.users current_user
                WHERE current_user.id::text = auth.uid()::text
                AND current_user.account_owner_id::text = users.id::text
            )
        )
    );

-- Users can update their own profile, account owners can update sub-users
CREATE POLICY "users_update_policy" ON public.users
    FOR UPDATE
    USING (
        auth.uid()::text = id::text
        OR
        (
            auth.uid()::text = account_owner_id::text
            AND EXISTS (
                SELECT 1 FROM public.users owner 
                WHERE owner.id::text = auth.uid()::text 
                AND owner.role = 'admin'
            )
        )
    );

-- Only admins can create new users (sub-accounts)
CREATE POLICY "users_insert_policy" ON public.users
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users admin_user
            WHERE admin_user.id::text = auth.uid()::text
            AND admin_user.role = 'admin'
            AND admin_user.is_active = true
        )
        AND account_owner_id::text = auth.uid()::text
    );

-- Account owners can delete their sub-users
CREATE POLICY "users_delete_policy" ON public.users
    FOR DELETE
    USING (
        auth.uid()::text = account_owner_id::text
        AND EXISTS (
            SELECT 1 FROM public.users owner 
            WHERE owner.id::text = auth.uid()::text 
            AND owner.role = 'admin'
        )
    );

-- =====================================================================================
-- CAMPAIGNS TABLE POLICIES
-- =====================================================================================

-- Users can read campaigns they own or have been granted access to
CREATE POLICY "campaigns_read_policy" ON public.campaigns
    FOR SELECT
    USING (
        -- Account owners can see all campaigns they own
        account_owner_id::text = auth.uid()::text
        OR
        -- Users can see campaigns they created
        created_by_user_id::text = auth.uid()::text
        OR
        -- Users can see campaigns they have explicit permissions for
        EXISTS (
            SELECT 1 FROM public.user_permissions up
            WHERE up.campaign_id = campaigns.id
            AND up.granted_to_user_id::text = auth.uid()::text
            AND up.is_active = true
            AND (up.expires_at IS NULL OR up.expires_at > NOW())
        )
        OR
        -- Sub-users can see campaigns owned by their account owner
        EXISTS (
            SELECT 1 FROM public.users current_user
            WHERE current_user.id::text = auth.uid()::text
            AND current_user.account_owner_id = campaigns.account_owner_id
        )
    );

-- Campaign modifications based on ownership and permissions
CREATE POLICY "campaigns_update_policy" ON public.campaigns
    FOR UPDATE
    USING (
        -- Account owners can update their campaigns
        account_owner_id::text = auth.uid()::text
        OR
        -- Users with admin permissions can update campaigns
        EXISTS (
            SELECT 1 FROM public.user_permissions up
            WHERE up.campaign_id = campaigns.id
            AND up.granted_to_user_id::text = auth.uid()::text
            AND up.permission_level = 'admin'
            AND up.is_active = true
            AND (up.expires_at IS NULL OR up.expires_at > NOW())
        )
    );

-- Only account owners and admins can create campaigns
CREATE POLICY "campaigns_insert_policy" ON public.campaigns
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id::text = auth.uid()::text
            AND u.role = 'admin'
            AND u.is_active = true
        )
        AND (
            account_owner_id::text = auth.uid()::text
            OR created_by_user_id::text = auth.uid()::text
        )
    );

-- Only account owners can delete campaigns
CREATE POLICY "campaigns_delete_policy" ON public.campaigns
    FOR DELETE
    USING (account_owner_id::text = auth.uid()::text);

-- =====================================================================================
-- USER_PERMISSIONS TABLE POLICIES
-- =====================================================================================

-- Users can read permissions granted to them or by them
CREATE POLICY "user_permissions_read_policy" ON public.user_permissions
    FOR SELECT
    USING (
        granted_to_user_id::text = auth.uid()::text
        OR granted_by_user_id::text = auth.uid()::text
        OR
        -- Account owners can see all permissions for their campaigns
        EXISTS (
            SELECT 1 FROM public.campaigns c
            WHERE c.id = user_permissions.campaign_id
            AND c.account_owner_id::text = auth.uid()::text
        )
    );

-- Only account owners and campaign admins can grant permissions
CREATE POLICY "user_permissions_insert_policy" ON public.user_permissions
    FOR INSERT
    WITH CHECK (
        granted_by_user_id::text = auth.uid()::text
        AND
        (
            -- Must be account owner of the campaign
            EXISTS (
                SELECT 1 FROM public.campaigns c
                WHERE c.id = campaign_id
                AND c.account_owner_id::text = auth.uid()::text
            )
            OR
            -- Or have admin permissions on the campaign
            EXISTS (
                SELECT 1 FROM public.user_permissions up
                WHERE up.campaign_id = user_permissions.campaign_id
                AND up.granted_to_user_id::text = auth.uid()::text
                AND up.permission_level = 'admin'
                AND up.is_active = true
                AND (up.expires_at IS NULL OR up.expires_at > NOW())
            )
        )
    );

-- Only grantors can update/revoke permissions they granted
CREATE POLICY "user_permissions_update_policy" ON public.user_permissions
    FOR UPDATE
    USING (granted_by_user_id::text = auth.uid()::text);

-- Only grantors can delete permissions they granted
CREATE POLICY "user_permissions_delete_policy" ON public.user_permissions
    FOR DELETE
    USING (granted_by_user_id::text = auth.uid()::text);

-- =====================================================================================
-- USER_SESSIONS TABLE POLICIES
-- =====================================================================================

-- Users can only read their own sessions
CREATE POLICY "user_sessions_read_policy" ON public.user_sessions
    FOR SELECT
    USING (user_id::text = auth.uid()::text);

-- Users can only create sessions for themselves
CREATE POLICY "user_sessions_insert_policy" ON public.user_sessions
    FOR INSERT
    WITH CHECK (user_id::text = auth.uid()::text);

-- Users can only update their own sessions
CREATE POLICY "user_sessions_update_policy" ON public.user_sessions
    FOR UPDATE
    USING (user_id::text = auth.uid()::text);

-- Users can only delete their own sessions
CREATE POLICY "user_sessions_delete_policy" ON public.user_sessions
    FOR DELETE
    USING (user_id::text = auth.uid()::text);

-- =====================================================================================
-- UTILITY FUNCTIONS AND TRIGGERS
-- =====================================================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_permissions_updated_at BEFORE UPDATE ON public.user_permissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    UPDATE public.user_sessions
    SET is_active = false, revoked_at = NOW(), revoked_reason = 'Expired'
    WHERE expires_at < NOW() AND is_active = true;
END;
$$ LANGUAGE 'plpgsql';

-- Function to validate user permissions
CREATE OR REPLACE FUNCTION check_user_campaign_access(
    user_id_param UUID,
    campaign_id_param UUID,
    required_permission TEXT DEFAULT 'read_only'
)
RETURNS BOOLEAN AS $$
DECLARE
    has_access BOOLEAN := false;
BEGIN
    -- Check if user is account owner
    SELECT EXISTS (
        SELECT 1 FROM public.campaigns c
        WHERE c.id = campaign_id_param
        AND c.account_owner_id = user_id_param
    ) INTO has_access;
    
    IF has_access THEN
        RETURN true;
    END IF;
    
    -- Check if user created the campaign
    SELECT EXISTS (
        SELECT 1 FROM public.campaigns c
        WHERE c.id = campaign_id_param
        AND c.created_by_user_id = user_id_param
    ) INTO has_access;
    
    IF has_access THEN
        RETURN true;
    END IF;
    
    -- Check explicit permissions
    SELECT EXISTS (
        SELECT 1 FROM public.user_permissions up
        WHERE up.campaign_id = campaign_id_param
        AND up.granted_to_user_id = user_id_param
        AND up.is_active = true
        AND (up.expires_at IS NULL OR up.expires_at > NOW())
        AND (
            required_permission = 'read_only' OR
            (required_permission = 'analytics_only' AND up.permission_level IN ('analytics_only', 'admin')) OR
            (required_permission = 'admin' AND up.permission_level = 'admin')
        )
    ) INTO has_access;
    
    RETURN has_access;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

-- Function to get user's accessible campaigns
CREATE OR REPLACE FUNCTION get_user_accessible_campaigns(user_id_param UUID)
RETURNS TABLE (
    campaign_id UUID,
    campaign_name VARCHAR(255),
    permission_level TEXT,
    access_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as campaign_id,
        c.name as campaign_name,
        'admin'::TEXT as permission_level,
        'owner'::TEXT as access_type
    FROM public.campaigns c
    WHERE c.account_owner_id = user_id_param
    
    UNION
    
    SELECT 
        c.id as campaign_id,
        c.name as campaign_name,
        'admin'::TEXT as permission_level,
        'creator'::TEXT as access_type
    FROM public.campaigns c
    WHERE c.created_by_user_id = user_id_param
    AND c.account_owner_id != user_id_param
    
    UNION
    
    SELECT 
        c.id as campaign_id,
        c.name as campaign_name,
        up.permission_level::TEXT as permission_level,
        'granted'::TEXT as access_type
    FROM public.campaigns c
    JOIN public.user_permissions up ON c.id = up.campaign_id
    WHERE up.granted_to_user_id = user_id_param
    AND up.is_active = true
    AND (up.expires_at IS NULL OR up.expires_at > NOW())
    AND c.account_owner_id != user_id_param
    AND c.created_by_user_id != user_id_param;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

-- =====================================================================================
-- SECURITY CONSTRAINTS AND CHECKS
-- =====================================================================================

-- Constraint to ensure account owners are admins
ALTER TABLE public.users 
ADD CONSTRAINT check_account_owner_is_admin 
CHECK (
    account_owner_id IS NULL OR 
    role = 'admin' OR
    id != account_owner_id
);

-- Constraint to prevent self-referencing account ownership except for root admins
ALTER TABLE public.users
ADD CONSTRAINT check_no_self_account_ownership
CHECK (account_owner_id IS NULL OR account_owner_id != id);

-- Constraint to ensure permissions are not granted to campaign owners (redundant)
ALTER TABLE public.user_permissions
ADD CONSTRAINT check_no_redundant_owner_permissions
CHECK (
    NOT EXISTS (
        SELECT 1 FROM public.campaigns c
        WHERE c.id = campaign_id
        AND c.account_owner_id = granted_to_user_id
    )
);