-- Password Reset and User Invitation System
-- Created: 2025-08-26
-- Description: Secure password reset and user invitation system with email verification

-- =====================================================================================
-- PASSWORD RESET FUNCTIONS
-- Secure password reset with email verification and rate limiting
-- =====================================================================================

-- Generate password reset token
CREATE OR REPLACE FUNCTION create_password_reset_token(
    email_param VARCHAR(255),
    ip_address_param INET,
    user_agent_param TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    user_record RECORD;
    reset_token TEXT;
    token_hash TEXT;
    existing_token_count INTEGER;
    rate_limit_check JSONB;
BEGIN
    -- Check rate limiting first
    rate_limit_check := check_rate_limiting(email_param, ip_address_param, 'password_reset');
    IF NOT (rate_limit_check->>'allowed')::BOOLEAN THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'rate_limited',
            'message', 'Too many password reset attempts. Please try again later.',
            'retry_after', rate_limit_check->>'retry_after'
        );
    END IF;
    
    -- Find user by email
    SELECT * INTO user_record FROM public.users WHERE email = email_param AND is_active = true;
    
    IF user_record.id IS NULL THEN
        -- Log attempt even for non-existent users (but don't reveal this)
        PERFORM log_login_attempt(email_param, NULL, ip_address_param, user_agent_param, false, 'password_reset', 'user_not_found');
        
        -- Return success to prevent email enumeration
        RETURN jsonb_build_object(
            'success', true,
            'message', 'If an account with that email exists, a password reset link has been sent.'
        );
    END IF;
    
    -- Check for existing active reset tokens (limit 1 per user)
    SELECT COUNT(*) INTO existing_token_count
    FROM public.password_reset_tokens
    WHERE user_id = user_record.id
    AND expires_at > NOW()
    AND used_at IS NULL;
    
    IF existing_token_count > 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'existing_token',
            'message', 'A password reset email has already been sent. Please check your email or wait before requesting another.'
        );
    END IF;
    
    -- Generate secure reset token
    reset_token := encode(gen_random_bytes(32), 'base64url');
    token_hash := encode(digest(reset_token, 'sha256'), 'hex');
    
    -- Store reset token (expires in 1 hour)
    INSERT INTO public.password_reset_tokens (
        user_id, token_hash, email, ip_address, user_agent, expires_at
    ) VALUES (
        user_record.id, token_hash, email_param, ip_address_param, user_agent_param, NOW() + INTERVAL '1 hour'
    );
    
    -- Log successful reset request
    PERFORM log_login_attempt(email_param, user_record.id, ip_address_param, user_agent_param, true, 'password_reset', NULL);
    
    -- In production, send email here with reset_token
    -- For now, return success (email would be sent by external service)
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Password reset email sent successfully.',
        'reset_token', reset_token, -- Remove this in production
        'expires_at', NOW() + INTERVAL '1 hour'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Validate and use password reset token
CREATE OR REPLACE FUNCTION reset_password_with_token(
    reset_token_param TEXT,
    new_password_hash TEXT,
    ip_address_param INET,
    user_agent_param TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    token_hash TEXT;
    reset_record RECORD;
    user_record RECORD;
BEGIN
    token_hash := encode(digest(reset_token_param, 'sha256'), 'hex');
    
    -- Find and validate reset token
    SELECT prt.*, u.email, u.id as user_id
    INTO reset_record
    FROM public.password_reset_tokens prt
    JOIN public.users u ON prt.user_id = u.id
    WHERE prt.token_hash = token_hash
    AND prt.expires_at > NOW()
    AND prt.used_at IS NULL
    AND u.is_active = true;
    
    IF reset_record.id IS NULL THEN
        -- Log failed attempt
        PERFORM log_login_attempt(NULL, NULL, ip_address_param, user_agent_param, false, 'password_reset', 'invalid_token');
        
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invalid_token',
            'message', 'Invalid or expired reset token.'
        );
    END IF;
    
    -- Check attempt count
    IF reset_record.attempts >= reset_record.max_attempts THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'too_many_attempts',
            'message', 'Too many attempts with this reset token.'
        );
    END IF;
    
    -- Update attempt count
    UPDATE public.password_reset_tokens
    SET attempts = attempts + 1
    WHERE id = reset_record.id;
    
    -- Update user password
    UPDATE public.users
    SET 
        password_hash = new_password_hash,
        updated_at = NOW(),
        -- Clear any existing password reset fields
        password_reset_token = NULL,
        password_reset_expires = NULL
    WHERE id = reset_record.user_id;
    
    -- Mark reset token as used
    UPDATE public.password_reset_tokens
    SET used_at = NOW()
    WHERE id = reset_record.id;
    
    -- Invalidate all existing sessions for security
    UPDATE public.user_sessions
    SET is_active = false, revoked_at = NOW(), revoked_reason = 'Password reset'
    WHERE user_id = reset_record.user_id AND is_active = true;
    
    -- Log successful password reset
    PERFORM log_login_attempt(reset_record.email, reset_record.user_id, ip_address_param, user_agent_param, true, 'password_reset', NULL);
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Password reset successful. Please log in with your new password.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- USER INVITATION SYSTEM
-- Complete user invitation system with temporary tokens
-- =====================================================================================

-- Create user invitation
CREATE OR REPLACE FUNCTION create_user_invitation(
    inviter_user_id UUID,
    email_param VARCHAR(255),
    role_param VARCHAR(20) DEFAULT 'viewer',
    campaign_permissions_param JSONB DEFAULT NULL,
    invitation_message_param TEXT DEFAULT NULL,
    expires_hours INTEGER DEFAULT 168 -- 7 days default
)
RETURNS JSONB AS $$
DECLARE
    inviter_record RECORD;
    existing_user RECORD;
    existing_invitation RECORD;
    invitation_token TEXT;
    token_hash TEXT;
    invitation_id UUID;
BEGIN
    -- Validate inviter
    SELECT * INTO inviter_record FROM public.users 
    WHERE id = inviter_user_id AND is_active = true AND role = 'admin';
    
    IF inviter_record.id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'unauthorized',
            'message', 'Only active admin users can send invitations.'
        );
    END IF;
    
    -- Check if email already has an active user account
    SELECT * INTO existing_user FROM public.users WHERE email = email_param AND is_active = true;
    
    IF existing_user.id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'user_exists',
            'message', 'A user with this email already exists.'
        );
    END IF;
    
    -- Check for existing pending invitation
    SELECT * INTO existing_invitation FROM public.user_invitations 
    WHERE email = email_param AND status = 'pending' AND expires_at > NOW();
    
    IF existing_invitation.id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invitation_exists',
            'message', 'A pending invitation for this email already exists.',
            'existing_invitation_id', existing_invitation.id
        );
    END IF;
    
    -- Validate role
    IF role_param NOT IN ('admin', 'viewer') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invalid_role',
            'message', 'Role must be either admin or viewer.'
        );
    END IF;
    
    -- Generate secure invitation token
    invitation_token := encode(gen_random_bytes(32), 'base64url');
    token_hash := encode(digest(invitation_token, 'sha256'), 'hex');
    
    -- Create invitation
    INSERT INTO public.user_invitations (
        email, invited_by_user_id, token_hash, role, account_owner_id,
        campaign_permissions, invitation_message, expires_at
    ) VALUES (
        email_param, inviter_user_id, token_hash, role_param, inviter_record.id,
        campaign_permissions_param, invitation_message_param, 
        NOW() + (expires_hours || ' hours')::INTERVAL
    )
    RETURNING id INTO invitation_id;
    
    -- Log invitation creation
    INSERT INTO public.access_audit_log (
        user_id, table_name, record_id, action_type, access_granted,
        additional_context
    ) VALUES (
        inviter_user_id, 'user_invitations', invitation_id, 'INSERT', true,
        jsonb_build_object(
            'invited_email', email_param,
            'role', role_param,
            'expires_at', NOW() + (expires_hours || ' hours')::INTERVAL
        )
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'invitation_id', invitation_id,
        'invitation_token', invitation_token, -- Remove in production
        'message', 'Invitation created successfully.',
        'expires_at', NOW() + (expires_hours || ' hours')::INTERVAL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accept user invitation
CREATE OR REPLACE FUNCTION accept_user_invitation(
    invitation_token_param TEXT,
    password_hash_param TEXT,
    first_name_param VARCHAR(100),
    last_name_param VARCHAR(100),
    ip_address_param INET,
    user_agent_param TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    token_hash TEXT;
    invitation_record RECORD;
    new_user_id UUID;
    permission_record JSONB;
BEGIN
    token_hash := encode(digest(invitation_token_param, 'sha256'), 'hex');
    
    -- Find and validate invitation
    SELECT ui.*, u.email as inviter_email
    INTO invitation_record
    FROM public.user_invitations ui
    JOIN public.users u ON ui.invited_by_user_id = u.id
    WHERE ui.token_hash = token_hash
    AND ui.status = 'pending'
    AND ui.expires_at > NOW()
    AND u.is_active = true;
    
    IF invitation_record.id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invalid_invitation',
            'message', 'Invalid or expired invitation token.'
        );
    END IF;
    
    -- Check acceptance attempts
    IF invitation_record.acceptance_attempts >= invitation_record.max_attempts THEN
        -- Mark invitation as expired due to too many attempts
        UPDATE public.user_invitations
        SET status = 'expired', updated_at = NOW()
        WHERE id = invitation_record.id;
        
        RETURN jsonb_build_object(
            'success', false,
            'error', 'too_many_attempts',
            'message', 'Too many acceptance attempts. Invitation has been disabled.'
        );
    END IF;
    
    -- Increment acceptance attempts
    UPDATE public.user_invitations
    SET acceptance_attempts = acceptance_attempts + 1
    WHERE id = invitation_record.id;
    
    -- Create new user
    INSERT INTO public.users (
        email, password_hash, role, account_owner_id, 
        first_name, last_name, is_active, email_verified
    ) VALUES (
        invitation_record.email, password_hash_param, invitation_record.role, 
        invitation_record.account_owner_id, first_name_param, last_name_param, 
        true, true -- Email is verified through invitation process
    )
    RETURNING id INTO new_user_id;
    
    -- Create campaign permissions if specified
    IF invitation_record.campaign_permissions IS NOT NULL THEN
        FOR permission_record IN 
            SELECT * FROM jsonb_array_elements(invitation_record.campaign_permissions)
        LOOP
            INSERT INTO public.user_permissions (
                granted_by_user_id, granted_to_user_id, campaign_id, permission_level,
                permission_note
            ) VALUES (
                invitation_record.invited_by_user_id, new_user_id,
                (permission_record->>'campaign_id')::UUID,
                permission_record->>'permission_level',
                'Assigned through invitation acceptance'
            );
        END LOOP;
    END IF;
    
    -- Mark invitation as accepted
    UPDATE public.user_invitations
    SET 
        status = 'accepted',
        accepted_at = NOW(),
        accepted_by_user_id = new_user_id,
        acceptance_ip = ip_address_param,
        updated_at = NOW()
    WHERE id = invitation_record.id;
    
    -- Log successful acceptance
    INSERT INTO public.access_audit_log (
        user_id, table_name, record_id, action_type, access_granted,
        ip_address, additional_context
    ) VALUES (
        new_user_id, 'user_invitations', invitation_record.id, 'ACCEPT', true,
        ip_address_param, jsonb_build_object(
            'invitation_id', invitation_record.id,
            'invited_by', invitation_record.invited_by_user_id,
            'role', invitation_record.role
        )
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'user_id', new_user_id,
        'message', 'Invitation accepted successfully. You can now log in.',
        'role', invitation_record.role,
        'account_owner_id', invitation_record.account_owner_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get invitation details (for display before acceptance)
CREATE OR REPLACE FUNCTION get_invitation_details(invitation_token_param TEXT)
RETURNS JSONB AS $$
DECLARE
    token_hash TEXT;
    invitation_record RECORD;
    campaign_count INTEGER := 0;
BEGIN
    token_hash := encode(digest(invitation_token_param, 'sha256'), 'hex');
    
    SELECT 
        ui.email, ui.role, ui.invitation_message, ui.expires_at,
        ui.status, ui.campaign_permissions,
        u.first_name as inviter_first_name, u.last_name as inviter_last_name,
        u.email as inviter_email
    INTO invitation_record
    FROM public.user_invitations ui
    JOIN public.users u ON ui.invited_by_user_id = u.id
    WHERE ui.token_hash = token_hash;
    
    IF invitation_record.email IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'not_found',
            'message', 'Invitation not found.'
        );
    END IF;
    
    IF invitation_record.status != 'pending' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invitation_' || invitation_record.status,
            'message', 'This invitation is ' || invitation_record.status || '.'
        );
    END IF;
    
    IF invitation_record.expires_at < NOW() THEN
        -- Mark as expired
        UPDATE public.user_invitations
        SET status = 'expired', updated_at = NOW()
        WHERE token_hash = token_hash;
        
        RETURN jsonb_build_object(
            'success', false,
            'error', 'expired',
            'message', 'This invitation has expired.'
        );
    END IF;
    
    -- Count campaign permissions
    IF invitation_record.campaign_permissions IS NOT NULL THEN
        SELECT jsonb_array_length(invitation_record.campaign_permissions) INTO campaign_count;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'email', invitation_record.email,
        'role', invitation_record.role,
        'invitation_message', invitation_record.invitation_message,
        'expires_at', invitation_record.expires_at,
        'inviter_name', invitation_record.inviter_first_name || ' ' || invitation_record.inviter_last_name,
        'inviter_email', invitation_record.inviter_email,
        'campaign_permissions_count', campaign_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revoke user invitation
CREATE OR REPLACE FUNCTION revoke_user_invitation(
    inviter_user_id UUID,
    invitation_id_param UUID,
    revoke_reason TEXT DEFAULT 'Revoked by admin'
)
RETURNS JSONB AS $$
DECLARE
    invitation_record RECORD;
BEGIN
    -- Find invitation and verify ownership
    SELECT * INTO invitation_record
    FROM public.user_invitations
    WHERE id = invitation_id_param
    AND invited_by_user_id = inviter_user_id
    AND status = 'pending';
    
    IF invitation_record.id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'not_found',
            'message', 'Invitation not found or cannot be revoked.'
        );
    END IF;
    
    -- Revoke invitation
    UPDATE public.user_invitations
    SET 
        status = 'revoked',
        updated_at = NOW()
    WHERE id = invitation_id_param;
    
    -- Log revocation
    INSERT INTO public.access_audit_log (
        user_id, table_name, record_id, action_type, access_granted,
        additional_context
    ) VALUES (
        inviter_user_id, 'user_invitations', invitation_id_param, 'REVOKE', true,
        jsonb_build_object(
            'reason', revoke_reason,
            'invited_email', invitation_record.email
        )
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Invitation revoked successfully.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- CLEANUP AND MAINTENANCE FUNCTIONS
-- Automated cleanup of expired tokens and invitations
-- =====================================================================================

-- Clean up expired tokens and invitations
CREATE OR REPLACE FUNCTION cleanup_expired_auth_tokens()
RETURNS TEXT AS $$
DECLARE
    expired_reset_tokens INTEGER;
    expired_invitations INTEGER;
    old_login_attempts INTEGER;
    expired_lockouts INTEGER;
BEGIN
    -- Clean up expired password reset tokens
    DELETE FROM public.password_reset_tokens
    WHERE expires_at < NOW() - INTERVAL '24 hours'; -- Keep for 24 hours after expiry for audit
    GET DIAGNOSTICS expired_reset_tokens = ROW_COUNT;
    
    -- Mark expired invitations
    UPDATE public.user_invitations
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'pending' AND expires_at < NOW();
    GET DIAGNOSTICS expired_invitations = ROW_COUNT;
    
    -- Clean up old login attempts (keep for 30 days)
    DELETE FROM public.login_attempts
    WHERE attempted_at < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS old_login_attempts = ROW_COUNT;
    
    -- Clean up expired lockouts
    UPDATE public.account_lockouts
    SET is_active = false
    WHERE locked_until < NOW() AND is_active = true AND auto_unlock = true;
    GET DIAGNOSTICS expired_lockouts = ROW_COUNT;
    
    RETURN format(
        'Cleanup completed: %s reset tokens, %s invitations, %s login attempts, %s lockouts',
        expired_reset_tokens, expired_invitations, old_login_attempts, expired_lockouts
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;