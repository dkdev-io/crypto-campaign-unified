-- RLS Policies Implementation for Campaign Dashboard
-- Created: 2025-08-26
-- Description: Comprehensive RLS policies for all tables with audit logging

-- =====================================================================================
-- ENHANCED CAMPAIGNS TABLE POLICIES
-- Advanced campaign access with permission validation and logging
-- =====================================================================================

-- Drop existing policies to replace with enhanced versions
DROP POLICY IF EXISTS "campaigns_read_policy" ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_update_policy" ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_insert_policy" ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_delete_policy" ON public.campaigns;

-- Enhanced campaign read policy with audit logging
CREATE POLICY "campaigns_read_secure" ON public.campaigns
    FOR SELECT
    USING (
        -- Log the access attempt
        (SELECT detect_suspicious_access(auth.uid()::UUID, 'campaigns', 5)) IS NOT NULL
        AND
        -- Validate access using the enhanced function
        validate_campaign_access(auth.uid()::UUID, id, 'read_only', true)
    );

-- Campaign update policy with strict validation
CREATE POLICY "campaigns_update_secure" ON public.campaigns
    FOR UPDATE
    USING (
        -- Only account owners or users with admin permissions can update
        validate_campaign_access(auth.uid()::UUID, id, 'admin', true)
        AND
        -- Additional check: user must be active
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id::text = auth.uid()::text
            AND u.is_active = true
        )
    );

-- Campaign insert policy with ownership validation
CREATE POLICY "campaigns_insert_secure" ON public.campaigns
    FOR INSERT
    WITH CHECK (
        -- Must be an admin user
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id::text = auth.uid()::text
            AND u.role = 'admin'
            AND u.is_active = true
        )
        AND
        -- Must set themselves as account owner or creator
        (
            account_owner_id::text = auth.uid()::text
            OR created_by_user_id::text = auth.uid()::text
        )
        AND
        -- Log the creation attempt
        (SELECT 1 FROM (
            INSERT INTO public.access_audit_log (
                user_id, table_name, action_type, access_granted,
                campaign_id, additional_context
            ) VALUES (
                auth.uid()::UUID, 'campaigns', 'INSERT', true,
                id, jsonb_build_object('action', 'campaign_creation')
            )
        ) AS log_insert) = 1
    );

-- Campaign delete policy with strict ownership check
CREATE POLICY "campaigns_delete_secure" ON public.campaigns
    FOR DELETE
    USING (
        account_owner_id::text = auth.uid()::text
        AND
        -- Additional safety check: ensure user is admin
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id::text = auth.uid()::text
            AND u.role = 'admin'
            AND u.is_active = true
        )
    );

-- =====================================================================================
-- ANALYTICS DATA POLICIES
-- Comprehensive policies for all analytics tables
-- =====================================================================================

-- PAGE VIEWS POLICIES
CREATE POLICY "page_views_read_policy" ON public.page_views
    FOR SELECT
    USING (
        validate_campaign_access(auth.uid()::UUID, campaign_id, 'analytics_only', true)
    );

CREATE POLICY "page_views_insert_policy" ON public.page_views
    FOR INSERT
    WITH CHECK (
        validate_campaign_access(auth.uid()::UUID, campaign_id, 'read_only', false)
    );

CREATE POLICY "page_views_update_policy" ON public.page_views
    FOR UPDATE
    USING (
        validate_campaign_access(auth.uid()::UUID, campaign_id, 'admin', true)
    );

-- TRAFFIC SOURCES POLICIES
CREATE POLICY "traffic_sources_read_policy" ON public.traffic_sources
    FOR SELECT
    USING (
        validate_campaign_access(auth.uid()::UUID, campaign_id, 'analytics_only', true)
    );

CREATE POLICY "traffic_sources_insert_policy" ON public.traffic_sources
    FOR INSERT
    WITH CHECK (
        validate_campaign_access(auth.uid()::UUID, campaign_id, 'admin', true)
    );

CREATE POLICY "traffic_sources_update_policy" ON public.traffic_sources
    FOR UPDATE
    USING (
        validate_campaign_access(auth.uid()::UUID, campaign_id, 'admin', true)
    );

-- ANALYTICS USER SESSIONS POLICIES
CREATE POLICY "analytics_sessions_read_policy" ON public.analytics_user_sessions
    FOR SELECT
    USING (
        validate_campaign_access(auth.uid()::UUID, campaign_id, 'analytics_only', true)
    );

CREATE POLICY "analytics_sessions_insert_policy" ON public.analytics_user_sessions
    FOR INSERT
    WITH CHECK (
        validate_campaign_access(auth.uid()::UUID, campaign_id, 'read_only', false)
    );

CREATE POLICY "analytics_sessions_update_policy" ON public.analytics_user_sessions
    FOR UPDATE
    USING (
        validate_campaign_access(auth.uid()::UUID, campaign_id, 'admin', true)
    );

-- CONTRIBUTIONS POLICIES
CREATE POLICY "contributions_read_policy" ON public.contributions
    FOR SELECT
    USING (
        -- Users can only see contributions for campaigns they have access to
        validate_campaign_access(auth.uid()::UUID, campaign_id, 'read_only', true)
    );

CREATE POLICY "contributions_insert_policy" ON public.contributions
    FOR INSERT
    WITH CHECK (
        -- Contributions can be inserted for any campaign (public contributions)
        -- But we log the access
        (SELECT 1 FROM (
            INSERT INTO public.access_audit_log (
                user_id, table_name, record_id, action_type, access_granted,
                campaign_id, additional_context
            ) VALUES (
                auth.uid()::UUID, 'contributions', id, 'INSERT', true,
                campaign_id, jsonb_build_object('amount', amount, 'wallet', wallet_address)
            )
        ) AS log_insert) = 1
    );

CREATE POLICY "contributions_update_policy" ON public.contributions
    FOR UPDATE
    USING (
        -- Only campaign admins can update contributions
        validate_campaign_access(auth.uid()::UUID, campaign_id, 'admin', true)
    );

CREATE POLICY "contributions_delete_policy" ON public.contributions
    FOR DELETE
    USING (
        -- Only campaign owners can delete contributions
        EXISTS (
            SELECT 1 FROM public.campaigns c
            WHERE c.id = campaign_id
            AND c.account_owner_id::text = auth.uid()::text
        )
    );

-- =====================================================================================
-- PERMISSION MANAGEMENT POLICIES
-- Advanced permission management with escalation prevention
-- =====================================================================================

-- Drop existing permission policies to replace with enhanced versions
DROP POLICY IF EXISTS "user_permissions_read_policy" ON public.user_permissions;
DROP POLICY IF EXISTS "user_permissions_insert_policy" ON public.user_permissions;
DROP POLICY IF EXISTS "user_permissions_update_policy" ON public.user_permissions;
DROP POLICY IF EXISTS "user_permissions_delete_policy" ON public.user_permissions;

-- Enhanced permission read policy
CREATE POLICY "user_permissions_read_secure" ON public.user_permissions
    FOR SELECT
    USING (
        -- Users can read permissions granted to them
        granted_to_user_id::text = auth.uid()::text
        OR 
        -- Users can read permissions they granted
        granted_by_user_id::text = auth.uid()::text
        OR
        -- Account owners can see all permissions for their campaigns
        EXISTS (
            SELECT 1 FROM public.campaigns c
            WHERE c.id = campaign_id
            AND c.account_owner_id::text = auth.uid()::text
        )
    );

-- Enhanced permission insert policy with escalation prevention
CREATE POLICY "user_permissions_insert_secure" ON public.user_permissions
    FOR INSERT
    WITH CHECK (
        -- User must be granting the permission (granted_by_user_id)
        granted_by_user_id::text = auth.uid()::text
        AND
        -- User cannot grant permissions to themselves
        granted_to_user_id::text != auth.uid()::text
        AND
        -- Must have authority to grant permissions (campaign owner or admin permission)
        (
            -- Campaign owner can grant any permission
            EXISTS (
                SELECT 1 FROM public.campaigns c
                WHERE c.id = campaign_id
                AND c.account_owner_id::text = auth.uid()::text
            )
            OR
            -- User with admin permission can grant lower or equal permissions
            (
                EXISTS (
                    SELECT 1 FROM public.user_permissions up
                    WHERE up.campaign_id = user_permissions.campaign_id
                    AND up.granted_to_user_id::text = auth.uid()::text
                    AND up.permission_level = 'admin'
                    AND up.is_active = true
                    AND (up.expires_at IS NULL OR up.expires_at > NOW())
                )
                AND
                -- Cannot grant admin permissions unless you're the campaign owner
                (
                    permission_level != 'admin' 
                    OR 
                    EXISTS (
                        SELECT 1 FROM public.campaigns c
                        WHERE c.id = campaign_id
                        AND c.account_owner_id::text = auth.uid()::text
                    )
                )
            )
        )
        AND
        -- Target user must exist and be in valid hierarchy
        EXISTS (
            SELECT 1 FROM public.users target_user
            JOIN public.users granting_user ON granting_user.id::text = auth.uid()::text
            WHERE target_user.id = granted_to_user_id
            AND target_user.is_active = true
            AND (
                -- Same account hierarchy
                target_user.account_owner_id = granting_user.id
                OR target_user.account_owner_id = granting_user.account_owner_id
                OR target_user.id = granting_user.account_owner_id
            )
        )
        AND
        -- Log the permission grant
        (SELECT 1 FROM (
            INSERT INTO public.permission_audit_log (
                campaign_id, target_user_id, action_type, new_permission_level,
                changed_by_user_id, reason, changed_at
            ) VALUES (
                campaign_id, granted_to_user_id, 'GRANTED', permission_level,
                auth.uid()::UUID, permission_note, NOW()
            )
        ) AS log_grant) = 1
    );

-- Enhanced permission update policy
CREATE POLICY "user_permissions_update_secure" ON public.user_permissions
    FOR UPDATE
    USING (
        -- Only the grantor can update permissions they granted
        granted_by_user_id::text = auth.uid()::text
        AND
        -- Cannot escalate permissions beyond grantor's level
        (
            -- If grantor is campaign owner, can set any permission
            EXISTS (
                SELECT 1 FROM public.campaigns c
                WHERE c.id = campaign_id
                AND c.account_owner_id::text = auth.uid()::text
            )
            OR
            -- If grantor has admin permission, cannot grant admin (unless campaign owner)
            (
                EXISTS (
                    SELECT 1 FROM public.user_permissions up
                    WHERE up.campaign_id = user_permissions.campaign_id
                    AND up.granted_to_user_id::text = auth.uid()::text
                    AND up.permission_level = 'admin'
                    AND up.is_active = true
                )
                AND permission_level != 'admin'
            )
        )
    );

-- Enhanced permission delete policy
CREATE POLICY "user_permissions_delete_secure" ON public.user_permissions
    FOR DELETE
    USING (
        -- Only grantor can delete permissions they granted
        granted_by_user_id::text = auth.uid()::text
        OR
        -- Campaign owners can delete any permissions for their campaigns
        EXISTS (
            SELECT 1 FROM public.campaigns c
            WHERE c.id = campaign_id
            AND c.account_owner_id::text = auth.uid()::text
        )
        OR
        -- Users can revoke permissions granted to themselves
        granted_to_user_id::text = auth.uid()::text
    );

-- =====================================================================================
-- AUDIT TRAIL POLICIES
-- Secure access to audit logs based on user roles and campaign access
-- =====================================================================================

-- Access audit log policies
CREATE POLICY "access_audit_read_policy" ON public.access_audit_log
    FOR SELECT
    USING (
        -- Users can see their own audit logs
        user_id::text = auth.uid()::text
        OR
        -- Campaign owners can see audit logs for their campaigns
        EXISTS (
            SELECT 1 FROM public.campaigns c
            WHERE c.id = campaign_id
            AND c.account_owner_id::text = auth.uid()::text
        )
        OR
        -- Admins can see audit logs for users in their account hierarchy
        EXISTS (
            SELECT 1 FROM public.users admin_user
            JOIN public.users target_user ON target_user.id = access_audit_log.user_id
            WHERE admin_user.id::text = auth.uid()::text
            AND admin_user.role = 'admin'
            AND target_user.account_owner_id = admin_user.id
        )
    );

-- Only system can insert audit logs (handled by functions)
CREATE POLICY "access_audit_insert_policy" ON public.access_audit_log
    FOR INSERT
    WITH CHECK (false); -- Block direct inserts, only functions can insert

-- Permission audit log policies  
CREATE POLICY "permission_audit_read_policy" ON public.permission_audit_log
    FOR SELECT
    USING (
        -- Users can see audit logs for permissions they granted
        changed_by_user_id::text = auth.uid()::text
        OR
        -- Users can see audit logs for permissions granted to them
        target_user_id::text = auth.uid()::text
        OR
        -- Campaign owners can see all permission audit logs for their campaigns
        EXISTS (
            SELECT 1 FROM public.campaigns c
            WHERE c.id = campaign_id
            AND c.account_owner_id::text = auth.uid()::text
        )
    );

-- System-only inserts for permission audit logs
CREATE POLICY "permission_audit_insert_policy" ON public.permission_audit_log
    FOR INSERT
    WITH CHECK (false); -- Block direct inserts, only functions/triggers can insert

-- Security alerts policies
CREATE POLICY "security_alerts_read_policy" ON public.security_alerts
    FOR SELECT
    USING (
        -- Users can see alerts about themselves
        user_id::text = auth.uid()::text
        OR
        -- Campaign owners can see alerts for their campaigns
        EXISTS (
            SELECT 1 FROM public.campaigns c
            WHERE c.id = campaign_id
            AND c.account_owner_id::text = auth.uid()::text
        )
        OR
        -- Account admins can see alerts for users in their hierarchy
        EXISTS (
            SELECT 1 FROM public.users admin_user
            JOIN public.users alert_user ON alert_user.id = security_alerts.user_id
            WHERE admin_user.id::text = auth.uid()::text
            AND admin_user.role = 'admin'
            AND alert_user.account_owner_id = admin_user.id
        )
    );

-- Security alerts update policy (for resolution)
CREATE POLICY "security_alerts_update_policy" ON public.security_alerts
    FOR UPDATE
    USING (
        -- Only admins can resolve alerts
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id::text = auth.uid()::text
            AND u.role = 'admin'
            AND u.is_active = true
        )
        AND
        (
            -- Campaign owners can resolve alerts for their campaigns
            EXISTS (
                SELECT 1 FROM public.campaigns c
                WHERE c.id = campaign_id
                AND c.account_owner_id::text = auth.uid()::text
            )
            OR
            -- Account admins can resolve alerts for their hierarchy
            EXISTS (
                SELECT 1 FROM public.users admin_user
                JOIN public.users alert_user ON alert_user.id = security_alerts.user_id
                WHERE admin_user.id::text = auth.uid()::text
                AND alert_user.account_owner_id = admin_user.id
            )
        )
    );

-- =====================================================================================
-- TRIGGERS FOR AUTOMATIC AUDIT LOGGING
-- Automatically log permission changes and security events
-- =====================================================================================

-- Trigger function for permission changes
CREATE OR REPLACE FUNCTION log_permission_changes()
RETURNS TRIGGER AS $$
DECLARE
    action_type_val TEXT;
    changed_by_user UUID;
BEGIN
    -- Determine action type
    IF TG_OP = 'INSERT' THEN
        action_type_val := 'GRANTED';
        NEW.created_at := NOW();
    ELSIF TG_OP = 'UPDATE' THEN
        action_type_val := 'MODIFIED';
        NEW.updated_at := NOW();
    ELSIF TG_OP = 'DELETE' THEN
        action_type_val := 'REVOKED';
    END IF;
    
    -- Get the user making the change
    changed_by_user := auth.uid()::UUID;
    
    -- Insert audit log
    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.permission_audit_log (
            permission_id, campaign_id, target_user_id, action_type,
            old_permission_level, changed_by_user_id, changed_at, reason
        ) VALUES (
            OLD.id, OLD.campaign_id, OLD.granted_to_user_id, action_type_val,
            OLD.permission_level, changed_by_user, NOW(), 'Permission revoked'
        );
        RETURN OLD;
    ELSE
        INSERT INTO public.permission_audit_log (
            permission_id, campaign_id, target_user_id, action_type,
            old_permission_level, new_permission_level,
            changed_by_user_id, changed_at, expires_at
        ) VALUES (
            COALESCE(NEW.id, OLD.id), COALESCE(NEW.campaign_id, OLD.campaign_id), 
            COALESCE(NEW.granted_to_user_id, OLD.granted_to_user_id), action_type_val,
            OLD.permission_level, NEW.permission_level,
            changed_by_user, NOW(), NEW.expires_at
        );
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for permission audit logging
DROP TRIGGER IF EXISTS permission_changes_audit ON public.user_permissions;
CREATE TRIGGER permission_changes_audit
    AFTER INSERT OR UPDATE OR DELETE ON public.user_permissions
    FOR EACH ROW EXECUTE FUNCTION log_permission_changes();

-- =====================================================================================
-- AUTOMATED SECURITY MAINTENANCE
-- Functions and procedures for automatic security maintenance
-- =====================================================================================

-- Procedure to run regular security maintenance
CREATE OR REPLACE FUNCTION run_security_maintenance()
RETURNS TEXT AS $$
DECLARE
    expired_sessions INTEGER;
    expired_permissions INTEGER;
    alerts_generated INTEGER;
    result_summary TEXT;
BEGIN
    -- Clean up expired sessions
    UPDATE public.user_sessions
    SET is_active = false, revoked_at = NOW(), revoked_reason = 'Expired'
    WHERE expires_at < NOW() AND is_active = true;
    GET DIAGNOSTICS expired_sessions = ROW_COUNT;
    
    -- Expire permissions
    SELECT expire_user_permissions() INTO expired_permissions;
    
    -- Generate alerts for suspicious patterns (last 24 hours)
    INSERT INTO public.security_alerts (
        alert_type, severity, title, description, user_id, 
        suspicious_activity_count, metadata
    )
    SELECT 
        'high_volume_access',
        'medium',
        'High Volume Data Access',
        'User accessed data ' || access_count || ' times in 24 hours',
        user_id,
        access_count,
        jsonb_build_object('period_hours', 24, 'access_count', access_count)
    FROM (
        SELECT user_id, COUNT(*) as access_count
        FROM public.access_audit_log
        WHERE access_time > NOW() - INTERVAL '24 hours'
        AND access_granted = true
        GROUP BY user_id
        HAVING COUNT(*) > 500
    ) high_volume
    WHERE NOT EXISTS (
        SELECT 1 FROM public.security_alerts sa
        WHERE sa.user_id = high_volume.user_id
        AND sa.alert_type = 'high_volume_access'
        AND sa.detected_at > NOW() - INTERVAL '24 hours'
        AND sa.status = 'open'
    );
    GET DIAGNOSTICS alerts_generated = ROW_COUNT;
    
    -- Generate summary
    result_summary := format(
        'Security maintenance completed: %s expired sessions, %s expired permissions, %s new alerts generated',
        expired_sessions, expired_permissions, alerts_generated
    );
    
    RETURN result_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to validate RLS policies are working
CREATE OR REPLACE FUNCTION test_rls_policies(test_user_id UUID, test_campaign_id UUID)
RETURNS TABLE (
    test_name TEXT,
    table_name TEXT,
    expected_access BOOLEAN,
    actual_access BOOLEAN,
    status TEXT
) AS $$
BEGIN
    -- This function would test various RLS scenarios
    -- Implementation would test each policy with different user contexts
    RETURN QUERY
    SELECT 
        'Basic campaign access test'::TEXT,
        'campaigns'::TEXT,
        true::BOOLEAN,
        validate_campaign_access(test_user_id, test_campaign_id, 'read_only', false)::BOOLEAN,
        CASE 
            WHEN validate_campaign_access(test_user_id, test_campaign_id, 'read_only', false) THEN 'PASS'
            ELSE 'FAIL'
        END::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;