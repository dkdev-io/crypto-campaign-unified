import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const AcceptInvitation = ({ token, onAccepted, onError }) => {
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');
  const [campaign, setCampaign] = useState(null);
  const [inviter, setInviter] = useState(null);

  const { user, acceptInvitation } = useAuth();

  useEffect(() => {
    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      setLoading(true);
      setError('');

      // Get invitation details
      const { data: invitationData, error: invitationError } = await supabase
        .from('invitations')
        .select(
          `
          *,
          campaigns (
            id,
            campaign_name,
            candidate_name
          ),
          users!invitations_invited_by_fkey (
            full_name,
            email
          )
        `
        )
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (invitationError) {
        if (invitationError.code === 'PGRST116') {
          setError('Invitation not found or has expired');
        } else {
          setError('Error loading invitation: ' + invitationError.message);
        }
        return;
      }

      // Check if invitation is expired
      const now = new Date();
      const expiresAt = new Date(invitationData.expires_at);

      if (now > expiresAt) {
        setError('This invitation has expired');
        return;
      }

      setInvitation(invitationData);
      setCampaign(invitationData.campaigns);
      setInviter(invitationData.users);
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user) {
      setError('You must be logged in to accept invitations');
      return;
    }

    setAccepting(true);
    setError('');

    try {
      const { data, error } = await acceptInvitation(token);

      if (error) {
        setError(error.message);
        return;
      }

      // Success
      if (onAccepted) {
        onAccepted({
          invitation,
          campaign,
          membershipData: data,
        });
      }
    } catch (error) {
      setError('An unexpected error occurred while accepting the invitation');
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    try {
      // Update invitation status to declined
      const { error } = await supabase
        .from('invitations')
        .update({
          status: 'revoked',
          updated_at: new Date().toISOString(),
        })
        .eq('token', token);

      if (error) {
        setError('Error declining invitation: ' + error.message);
        return;
      }

      if (onError) {
        onError('Invitation declined');
      }
    } catch (error) {
      setError('Error declining invitation');
    }
  };

  if (loading) {
    return (
      <div className="invitation-container">
        <div className="invitation-card">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading invitation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="invitation-container">
        <div className="invitation-card error">
          <div className="error-header">
            <h2>❌ Unable to Load Invitation</h2>
            <p>{error}</p>
          </div>

          <div className="error-actions">
            <button className="btn btn-outline" onClick={() => (window.location.href = '/')}>
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!invitation || !campaign) {
    return (
      <div className="invitation-container">
        <div className="invitation-card error">
          <div className="error-header">
            <h2>❌ Invitation Not Found</h2>
            <p>This invitation may have expired or been revoked.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="invitation-container">
      <div className="invitation-card">
        <div className="invitation-header">
          <h2>🎉 You're Invited!</h2>
          <p>You've been invited to join a campaign team</p>
        </div>

        <div className="invitation-details">
          <div className="campaign-info">
            <h3>Campaign: {campaign.campaign_name}</h3>
            {campaign.candidate_name && (
              <p className="candidate-name">Candidate: {campaign.candidate_name}</p>
            )}
          </div>

          <div className="inviter-info">
            <p>
              <strong>Invited by:</strong> {inviter?.full_name} ({inviter?.email})
            </p>
          </div>

          <div className="role-info">
            <h4>Your Role & Permissions:</h4>
            <div className="role-details">
              <div className="role-badge">
                {invitation.campaign_role.charAt(0).toUpperCase() +
                  invitation.campaign_role.slice(1)}
              </div>
              <div className="permissions-list">
                <strong>Permissions:</strong>
                <ul>
                  {invitation.permissions.map((permission) => (
                    <li key={permission}>
                      {permission === 'view' && '👁️ View campaign data and reports'}
                      {permission === 'export' && '📊 Export data and generate reports'}
                      {permission === 'admin' && '⚙️ Full administrative access'}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {invitation.personal_message && (
            <div className="personal-message">
              <h4>Personal Message:</h4>
              <div className="message-content">"{invitation.personal_message}"</div>
            </div>
          )}

          <div className="invitation-expires">
            <small>
              This invitation expires on {new Date(invitation.expires_at).toLocaleDateString()}
            </small>
          </div>
        </div>

        {!user ? (
          <div className="auth-required">
            <p>You need to be logged in to accept this invitation.</p>
            <div className="auth-actions">
              <button
                className="btn btn-primary"
                onClick={() =>
                  (window.location.href = `/login?redirect=/accept-invitation/${token}`)
                }
              >
                Sign In
              </button>
              <button
                className="btn btn-outline"
                onClick={() =>
                  (window.location.href = `/signup?redirect=/accept-invitation/${token}`)
                }
              >
                Create Account
              </button>
            </div>
          </div>
        ) : (
          <div className="invitation-actions">
            <button className="btn btn-primary" onClick={handleAccept} disabled={accepting}>
              {accepting ? 'Accepting...' : 'Accept Invitation'}
            </button>
            <button
              className="btn btn-outline btn-danger"
              onClick={handleDecline}
              disabled={accepting}
            >
              Decline
            </button>
          </div>
        )}

        {error && <div className="error-banner">{error}</div>}

        <div className="invitation-info">
          <h4>What happens when you accept?</h4>
          <ul>
            <li>✅ You'll gain access to the campaign dashboard</li>
            <li>📧 You'll receive notifications about campaign activity</li>
            <li>👥 You'll be added to the campaign team</li>
            <li>🔒 Your permissions will be set according to your role</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitation;
