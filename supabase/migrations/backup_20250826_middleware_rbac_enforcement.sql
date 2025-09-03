-- Permission Verification Middleware and Role-Based Access Control
-- Created: 2025-08-26
-- Description: Complete middleware functions for API permission verification and RBAC enforcement

-- =====================================================================================
-- PERMISSION VERIFICATION MIDDLEWARE FUNCTIONS
-- Functions to verify user permissions on every API request
-- =====================================================================================

-- Main permission verification middleware function
CREATE OR REPLACE FUNCTION verify_api_permission(
    session_token_param TEXT,
    requested_resource TEXT,
    requested_action TEXT,
    resource_id UUID DEFAULT NULL,
    require_mfa BOOLEAN DEFAULT false
)
RETURNS JSONB AS $$
DECLARE
    session_validation RECORD;
    user_record RECORD;
    permission_result JSONB;
    resource_access BOOLEAN := false;
    permission_level TEXT;
    audit_context JSONB;
    start_time TIMESTAMP := clock_timestamp();
BEGIN
    -- Step 1: Validate session token
    SELECT * INTO session_validation FROM validate_session(session_token_param, require_mfa);
    
    IF NOT session_validation.valid THEN
        -- Log failed authentication attempt
        INSERT INTO public.access_audit_log (
            table_name, action_type, access_granted, failure_reason,
            additional_context, processing_time_ms
        ) VALUES (
            requested_resource, requested_action, false, 'Invalid session',
            jsonb_build_object('session_token_provided', session_token_param IS NOT NULL),
            EXTRACT(milliseconds FROM clock_timestamp() - start_time)
        );
        
        RETURN jsonb_build_object(
            'authorized', false,
            'error', 'invalid_session',
            'message', 'Invalid or expired session',
            'requires_login', true,
            'requires_refresh', COALESCE(session_validation.requires_refresh, false)
        );
    END IF;
    
    -- Step 2: Get user details and check if active
    SELECT * INTO user_record FROM public.users WHERE id = session_validation.user_id;
    
    IF user_record.id IS NULL OR NOT user_record.is_active THEN
        RETURN jsonb_build_object(
            'authorized', false,
            'error', 'user_inactive',
            'message', 'User account is inactive'
        );
    END IF;
    
    -- Step 3: Check MFA requirement for sensitive operations
    IF require_mfa AND NOT session_validation.mfa_verified THEN
        RETURN jsonb_build_object(
            'authorized', false,
            'error', 'mfa_required',
            'message', 'Multi-factor authentication required for this operation',
            'requires_mfa', true
        );
    END IF;
    
    -- Step 4: Resource-specific permission checking
    CASE requested_resource
        WHEN 'campaigns' THEN
            -- Campaign access verification
            IF resource_id IS NOT NULL THEN
                resource_access := validate_campaign_access(
                    session_validation.user_id, 
                    resource_id, 
                    CASE 
                        WHEN requested_action IN ('CREATE', 'UPDATE', 'DELETE') THEN 'admin'
                        WHEN requested_action = 'READ_ANALYTICS' THEN 'analytics_only'
                        ELSE 'read_only'
                    END,
                    true -- Log access
                );
            ELSE
                -- List campaigns - always allowed (RLS will filter)
                resource_access := true;
            END IF;
            
        WHEN 'users' THEN
            -- User management verification
            CASE requested_action
                WHEN 'CREATE', 'INVITE' THEN
                    resource_access := user_record.role = 'admin';
                WHEN 'UPDATE', 'DELETE' THEN
                    -- Can modify users in their hierarchy
                    resource_access := user_record.role = 'admin' AND (
                        resource_id = session_validation.user_id OR -- Self
                        EXISTS (
                            SELECT 1 FROM public.users target
                            WHERE target.id = resource_id
                            AND target.account_owner_id = session_validation.user_id
                        )
                    );
                WHEN 'READ' THEN
                    -- Can read users in their hierarchy
                    resource_access := (
                        resource_id = session_validation.user_id OR -- Self
                        (user_record.role = 'admin' AND EXISTS (
                            SELECT 1 FROM public.users target
                            WHERE target.id = resource_id
                            AND target.account_owner_id = session_validation.user_id
                        ))
                    );
                ELSE
                    resource_access := false;
            END CASE;
            
        WHEN 'permissions' THEN
            -- Permission management verification
            CASE requested_action
                WHEN 'GRANT', 'REVOKE' THEN
                    -- Must be campaign owner or have admin permission
                    resource_access := EXISTS (
                        SELECT 1 FROM public.campaigns c
                        WHERE c.id = (
                            SELECT campaign_id FROM public.user_permissions 
                            WHERE id = resource_id
                        )
                        AND c.account_owner_id = session_validation.user_id
                    ) OR EXISTS (
                        SELECT 1 FROM public.user_permissions up
                        JOIN public.campaigns c ON up.campaign_id = c.id
                        WHERE up.granted_to_user_id = session_validation.user_id
                        AND up.permission_level = 'admin'
                        AND up.is_active = true
                        AND c.id = (
                            SELECT campaign_id FROM public.user_permissions 
                            WHERE id = resource_id
                        )
                    );
                WHEN 'READ' THEN
                    -- Can read permissions they granted or received
                    resource_access := true; -- RLS will filter
                ELSE
                    resource_access := false;
            END CASE;
            
        WHEN 'analytics' THEN
            -- Analytics data verification
            IF resource_id IS NOT NULL THEN -- resource_id is campaign_id for analytics
                resource_access := validate_campaign_access(
                    session_validation.user_id, 
                    resource_id, 
                    'analytics_only',
                    true
                );
            ELSE
                resource_access := true; -- List analytics - RLS will filter
            END IF;
            
        WHEN 'contributions' THEN
            -- Contributions verification
            IF resource_id IS NOT NULL THEN -- resource_id is campaign_id
                resource_access := validate_campaign_access(
                    session_validation.user_id, 
                    resource_id, 
                    CASE 
                        WHEN requested_action IN ('UPDATE', 'DELETE') THEN 'admin'
                        ELSE 'read_only'
                    END,
                    true
                );
            ELSE
                resource_access := true; -- List contributions - RLS will filter
            END IF;
            
        WHEN 'sessions' THEN
            -- Session management
            CASE requested_action
                WHEN 'READ' THEN
                    resource_access := (resource_id = session_validation.session_id OR user_record.role = 'admin');
                WHEN 'DELETE', 'REVOKE' THEN
                    resource_access := (resource_id = session_validation.session_id OR user_record.role = 'admin');
                ELSE
                    resource_access := false;
            END CASE;
            
        ELSE
            -- Unknown resource - deny by default
            resource_access := false;
    END CASE;
    
    -- Prepare audit context
    audit_context := jsonb_build_object(
        'user_id', session_validation.user_id,
        'user_email', user_record.email,
        'user_role', user_record.role,
        'session_id', session_validation.session_id,
        'resource', requested_resource,
        'action', requested_action,
        'resource_id', resource_id,
        'mfa_verified', session_validation.mfa_verified,
        'session_expires_at', session_validation.expires_at,
        'processing_time_ms', EXTRACT(milliseconds FROM clock_timestamp() - start_time)
    );
    
    -- Log the access attempt
    INSERT INTO public.access_audit_log (
        user_id, user_email, session_id, table_name, record_id,
        action_type, access_granted, policy_name, 
        additional_context, processing_time_ms, access_time
    ) VALUES (
        session_validation.user_id, user_record.email, session_validation.session_id,
        requested_resource, resource_id, requested_action, resource_access,
        'api_permission_middleware', audit_context,
        EXTRACT(milliseconds FROM clock_timestamp() - start_time), NOW()
    );
    
    -- Return authorization result
    RETURN jsonb_build_object(
        'authorized', resource_access,
        'user_id', session_validation.user_id,
        'user_email', user_record.email,
        'user_role', user_record.role,
        'session_id', session_validation.session_id,
        'session_expires_at', session_validation.expires_at,
        'mfa_verified', session_validation.mfa_verified,
        'requires_refresh', session_validation.requires_refresh,
        'permission_level', permission_level,
        'processing_time_ms', EXTRACT(milliseconds FROM clock_timestamp() - start_time)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simplified permission check for specific campaign access
CREATE OR REPLACE FUNCTION check_campaign_permission(
    session_token_param TEXT,
    campaign_id_param UUID,
    required_permission TEXT DEFAULT 'read_only'
)
RETURNS JSONB AS $$
BEGIN
    RETURN verify_api_permission(
        session_token_param,
        'campaigns',
        CASE required_permission
            WHEN 'admin' THEN 'UPDATE'
            WHEN 'analytics_only' THEN 'READ_ANALYTICS'
            ELSE 'READ'
        END,
        campaign_id_param,
        required_permission = 'admin' -- Require MFA for admin actions
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- ROLE-BASED ACCESS CONTROL ENFORCEMENT
-- Functions to enforce role-based permissions across the system
-- =====================================================================================

-- Get user's effective permissions for a campaign
CREATE OR REPLACE FUNCTION get_user_effective_permissions(
    user_id_param UUID,
    campaign_id_param UUID
)
RETURNS JSONB AS $$
DECLARE
    user_record RECORD;
    campaign_record RECORD;
    explicit_permission RECORD;
    effective_permissions JSONB;
BEGIN
    -- Get user details
    SELECT * INTO user_record FROM public.users WHERE id = user_id_param AND is_active = true;
    
    IF user_record.id IS NULL THEN
        RETURN jsonb_build_object('error', 'user_not_found');
    END IF;
    
    -- Get campaign details
    SELECT * INTO campaign_record FROM public.campaigns WHERE id = campaign_id_param AND is_active = true;
    
    IF campaign_record.id IS NULL THEN
        RETURN jsonb_build_object('error', 'campaign_not_found');
    END IF;
    
    -- Check if user is campaign owner
    IF campaign_record.account_owner_id = user_id_param THEN
        RETURN jsonb_build_object(
            'access_type', 'owner',
            'permission_level', 'admin',
            'can_read', true,
            'can_update', true,
            'can_delete', true,
            'can_manage_permissions', true,
            'can_view_analytics', true,
            'can_view_contributions', true,
            'expires_at', null
        );
    END IF;
    
    -- Check if user created the campaign
    IF campaign_record.created_by_user_id = user_id_param THEN
        RETURN jsonb_build_object(
            'access_type', 'creator',
            'permission_level', 'admin',
            'can_read', true,
            'can_update', true,
            'can_delete', false, -- Only owners can delete
            'can_manage_permissions', false, -- Only owners can manage permissions
            'can_view_analytics', true,
            'can_view_contributions', true,
            'expires_at', null
        );
    END IF;
    
    -- Check explicit permissions
    SELECT * INTO explicit_permission
    FROM public.user_permissions
    WHERE granted_to_user_id = user_id_param
    AND campaign_id = campaign_id_param
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW());
    
    IF explicit_permission.id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'access_type', 'granted',
            'permission_level', explicit_permission.permission_level,
            'can_read', true,
            'can_update', explicit_permission.permission_level = 'admin',
            'can_delete', false,
            'can_manage_permissions', false,
            'can_view_analytics', explicit_permission.permission_level IN ('analytics_only', 'admin'),
            'can_view_contributions', explicit_permission.permission_level = 'admin',
            'expires_at', explicit_permission.expires_at,
            'granted_by', explicit_permission.granted_by_user_id,
            'granted_at', explicit_permission.granted_at
        );
    END IF;
    
    -- Check if user is in same account hierarchy (sub-user of campaign owner)
    IF EXISTS (
        SELECT 1 FROM public.users
        WHERE id = user_id_param
        AND account_owner_id = campaign_record.account_owner_id
    ) THEN
        RETURN jsonb_build_object(
            'access_type', 'hierarchy',
            'permission_level', 'read_only',
            'can_read', true,
            'can_update', false,
            'can_delete', false,
            'can_manage_permissions', false,
            'can_view_analytics', false,
            'can_view_contributions', false,
            'expires_at', null
        );
    END IF;
    
    -- No access
    RETURN jsonb_build_object(
        'access_type', 'none',
        'permission_level', null,
        'can_read', false,
        'can_update', false,
        'can_delete', false,
        'can_manage_permissions', false,
        'can_view_analytics', false,
        'can_view_contributions', false,
        'expires_at', null
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enforce role-based access control for user operations
CREATE OR REPLACE FUNCTION enforce_user_rbac(
    acting_user_id UUID,
    target_user_id UUID,
    operation VARCHAR(20)
)
RETURNS JSONB AS $$
DECLARE
    acting_user RECORD;
    target_user RECORD;
    can_perform_operation BOOLEAN := false;
BEGIN
    -- Get acting user details
    SELECT * INTO acting_user FROM public.users WHERE id = acting_user_id AND is_active = true;
    
    IF acting_user.id IS NULL THEN
        RETURN jsonb_build_object('authorized', false, 'error', 'acting_user_not_found');
    END IF;
    
    -- Get target user details
    SELECT * INTO target_user FROM public.users WHERE id = target_user_id;
    
    IF target_user.id IS NULL THEN
        RETURN jsonb_build_object('authorized', false, 'error', 'target_user_not_found');
    END IF;
    
    -- Self operations (always allowed for READ, UPDATE profile)
    IF acting_user_id = target_user_id THEN
        can_perform_operation := operation IN ('READ', 'UPDATE');
    
    -- Admin operations on their sub-users
    ELSIF acting_user.role = 'admin' AND target_user.account_owner_id = acting_user_id THEN
        can_perform_operation := operation IN ('READ', 'UPDATE', 'DELETE', 'MANAGE_PERMISSIONS');
    
    -- Super admin operations (account owner is null - root admin)
    ELSIF acting_user.role = 'admin' AND acting_user.account_owner_id IS NULL THEN
        can_perform_operation := true; -- Root admins can do anything
    
    ELSE
        can_perform_operation := false;
    END IF;
    
    -- Log the RBAC check
    INSERT INTO public.access_audit_log (
        user_id, table_name, record_id, action_type, access_granted,
        additional_context
    ) VALUES (
        acting_user_id, 'users', target_user_id, operation, can_perform_operation,
        jsonb_build_object(
            'acting_user_role', acting_user.role,
            'target_user_role', target_user.role,
            'relationship', CASE 
                WHEN acting_user_id = target_user_id THEN 'self'
                WHEN target_user.account_owner_id = acting_user_id THEN 'subordinate'
                WHEN acting_user.account_owner_id IS NULL THEN 'root_admin'
                ELSE 'none'
            END
        )
    );
    
    RETURN jsonb_build_object(
        'authorized', can_perform_operation,
        'acting_user_role', acting_user.role,
        'target_user_role', target_user.role,
        'operation', operation
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- API REQUEST LOGGING AND MONITORING
-- Advanced logging for all API requests with security monitoring
-- =====================================================================================

-- Log API request with detailed context
CREATE OR REPLACE FUNCTION log_api_request(
    user_id_param UUID,
    session_id_param UUID,
    endpoint VARCHAR(255),
    method VARCHAR(10),
    ip_address_param INET,
    user_agent_param TEXT,
    request_body_hash TEXT DEFAULT NULL,
    response_status INTEGER DEFAULT NULL,
    processing_time_ms INTEGER DEFAULT NULL,
    error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
    is_suspicious BOOLEAN := false;
    risk_score INTEGER := 0;
BEGIN
    -- Calculate risk score
    risk_score := 0;
    
    -- High request rate increases risk
    IF EXISTS (
        SELECT 1 FROM public.access_audit_log 
        WHERE user_id = user_id_param 
        AND access_time > NOW() - INTERVAL '1 minute'
        GROUP BY user_id
        HAVING COUNT(*) > 30
    ) THEN
        risk_score := risk_score + 25;
    END IF;
    
    -- Failed requests increase risk
    IF response_status >= 400 THEN
        risk_score := risk_score + 10;
    END IF;
    
    -- Unusual endpoints increase risk
    IF endpoint ~ '/(admin|manage|delete|revoke)' THEN
        risk_score := risk_score + 15;
    END IF;
    
    -- Mark as suspicious if risk score is high
    is_suspicious := risk_score >= 30;
    
    -- Insert detailed log
    INSERT INTO public.access_audit_log (
        user_id, session_id, table_name, action_type, access_granted,
        ip_address, user_agent, processing_time_ms,
        additional_context
    ) VALUES (
        user_id_param, session_id_param, 'api_requests', method, 
        response_status < 400,
        ip_address_param, user_agent_param, processing_time_ms,
        jsonb_build_object(
            'endpoint', endpoint,
            'method', method,
            'response_status', response_status,
            'request_body_hash', request_body_hash,
            'error_message', error_message,
            'risk_score', risk_score,
            'is_suspicious', is_suspicious
        )
    )
    RETURNING id INTO log_id;
    
    -- Create security alert if suspicious
    IF is_suspicious THEN
        INSERT INTO public.security_alerts (
            alert_type, severity, title, description, user_id,
            metadata
        ) VALUES (
            'suspicious_api_activity',
            CASE WHEN risk_score >= 50 THEN 'high' ELSE 'medium' END,
            'Suspicious API Activity Detected',
            format('User %s showing suspicious API activity. Risk score: %s', user_id_param, risk_score),
            user_id_param,
            jsonb_build_object(
                'risk_score', risk_score,
                'endpoint', endpoint,
                'method', method,
                'response_status', response_status
            )
        );
    END IF;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- PERMISSION REFRESH AND VALIDATION
-- Functions to handle permission expiration and refresh
-- =====================================================================================

-- Check and refresh user permissions
CREATE OR REPLACE FUNCTION refresh_user_permissions(user_id_param UUID)
RETURNS JSONB AS $$
DECLARE
    expired_permissions INTEGER := 0;
    active_permissions INTEGER := 0;
    refreshed_sessions INTEGER := 0;
BEGIN
    -- Count and expire old permissions
    UPDATE public.user_permissions
    SET is_active = false, revoked_at = NOW(), revoked_reason = 'Expired'
    WHERE granted_to_user_id = user_id_param
    AND expires_at < NOW()
    AND is_active = true;
    GET DIAGNOSTICS expired_permissions = ROW_COUNT;
    
    -- Count remaining active permissions
    SELECT COUNT(*) INTO active_permissions
    FROM public.user_permissions
    WHERE granted_to_user_id = user_id_param
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW());
    
    -- Refresh sessions that are close to expiring (within 1 hour)
    UPDATE public.user_sessions
    SET expires_at = expires_at + INTERVAL '24 hours',
        extended_until = NOW() + INTERVAL '24 hours'
    WHERE user_id = user_id_param
    AND is_active = true
    AND expires_at BETWEEN NOW() AND NOW() + INTERVAL '1 hour';
    GET DIAGNOSTICS refreshed_sessions = ROW_COUNT;
    
    -- Log the refresh operation
    INSERT INTO public.access_audit_log (
        user_id, table_name, action_type, access_granted,
        additional_context
    ) VALUES (
        user_id_param, 'user_permissions', 'REFRESH', true,
        jsonb_build_object(
            'expired_permissions', expired_permissions,
            'active_permissions', active_permissions,
            'refreshed_sessions', refreshed_sessions
        )
    );
    
    RETURN jsonb_build_object(
        'expired_permissions', expired_permissions,
        'active_permissions', active_permissions,
        'refreshed_sessions', refreshed_sessions,
        'timestamp', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- SECURITY POLICY ENFORCEMENT
-- Final layer of security policy enforcement
-- =====================================================================================

-- Master security policy enforcer
CREATE OR REPLACE FUNCTION enforce_security_policies()
RETURNS TEXT AS $$
DECLARE
    cleanup_result TEXT;
    maintenance_result TEXT;
    security_scan_result TEXT;
BEGIN
    -- Run maintenance tasks
    SELECT run_security_maintenance() INTO maintenance_result;
    
    -- Clean up expired tokens
    SELECT cleanup_expired_auth_tokens() INTO cleanup_result;
    
    -- Run security testing
    SELECT run_complete_security_testing() INTO security_scan_result;
    
    RETURN format(
        'Security policies enforced: %s | %s | %s',
        maintenance_result, cleanup_result, security_scan_result
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;