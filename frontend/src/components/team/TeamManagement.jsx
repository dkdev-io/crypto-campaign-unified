import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import InviteMembers from './InviteMembers';

const TeamManagement = ({ campaignId }) => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [userPermissions, setUserPermissions] = useState([]);

  const { user } = useAuth();

  useEffect(() => {
    if (campaignId) {
      fetchTeamData();
      checkUserPermissions();
    }
  }, [campaignId]);

  const checkUserPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_members')
        .select('permissions')
        .eq('user_id', user.id)
        .eq('campaign_id', campaignId)
        .single();

      if (!error && data) {
        setUserPermissions(data.permissions);
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const fetchTeamData = async () => {
    try {
      setLoading(true);

      // Fetch team members
      const { data: members, error: membersError } = await supabase
        .from('campaign_members')
        .select(
          `
          *,
          users (
            id,
            full_name,
            email,
            phone,
            company,
            job_title,
            last_login_at
          )
        `
        )
        .eq('campaign_id', campaignId)
        .order('joined_at', { ascending: false });

      if (membersError) throw membersError;

      setTeamMembers(members || []);

      // Fetch pending invitations (only if user has admin permissions)
      if (userPermissions.includes('admin')) {
        const { data: invitations, error: invitationsError } = await supabase
          .from('invitations')
          .select(
            `
            *,
            users!invitations_invited_by_fkey (
              full_name,
              email
            )
          `
          )
          .eq('campaign_id', campaignId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (!invitationsError) {
          setPendingInvitations(invitations || []);
        }
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMemberPermissions = async (memberId, newPermissions) => {
    try {
      const { error } = await supabase
        .from('campaign_members')
        .update({
          permissions: newPermissions,
          updated_at: new Date().toISOString(),
        })
        .eq('id', memberId);

      if (error) throw error;

      // Refresh team data
      fetchTeamData();
    } catch (error) {
      alert('Error updating permissions: ' + error.message);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this team member?')) {
      return;
    }

    try {
      const { error } = await supabase.from('campaign_members').delete().eq('id', memberId);

      if (error) throw error;

      // Refresh team data
      fetchTeamData();
    } catch (error) {
      alert('Error removing member: ' + error.message);
    }
  };

  const handleRevokeInvitation = async (invitationId) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({
          status: 'revoked',
          updated_at: new Date().toISOString(),
        })
        .eq('id', invitationId);

      if (error) throw error;

      // Refresh team data
      fetchTeamData();
    } catch (error) {
      alert('Error revoking invitation: ' + error.message);
    }
  };

  const getPermissionBadgeColor = (permission) => {
    switch (permission) {
      case 'admin':
        return 'badge-admin';
      case 'export':
        return 'badge-export';
      case 'view':
        return 'badge-view';
      default:
        return 'badge-default';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'inactive':
        return 'badge-secondary';
      default:
        return 'badge-default';
    }
  };

  const isAdmin = userPermissions.includes('admin');

  if (loading) {
    return (
      <div className="team-management-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading team data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="team-management-container">
      <div className="team-header">
        <h2>👥 Team Management</h2>
        <p>Manage your campaign team members and permissions</p>

        {isAdmin && (
          <div className="team-actions">
            <button className="btn btn-primary" onClick={() => setShowInviteForm(!showInviteForm)}>
              {showInviteForm ? 'Hide Invite Form' : '+ Invite Member'}
            </button>
          </div>
        )}
      </div>

      {showInviteForm && isAdmin && (
        <div className="invite-section">
          <InviteMembers
            campaignId={campaignId}
            onInviteSent={() => {
              setShowInviteForm(false);
              fetchTeamData();
            }}
          />
        </div>
      )}

      <div className="team-stats">
        <div className="stat-card">
          <h3>{teamMembers.length}</h3>
          <p>Team Members</p>
        </div>
        <div className="stat-card">
          <h3>{pendingInvitations.length}</h3>
          <p>Pending Invitations</p>
        </div>
        <div className="stat-card">
          <h3>{teamMembers.filter((m) => m.permissions.includes('admin')).length}</h3>
          <p>Administrators</p>
        </div>
      </div>

      {/* Team Members */}
      <div className="team-section">
        <h3>Current Team Members</h3>

        {teamMembers.length === 0 ? (
          <div className="empty-state">
            <p>No team members yet. Invite someone to get started!</p>
          </div>
        ) : (
          <div className="members-list">
            {teamMembers.map((member) => (
              <div key={member.id} className="member-card">
                <div className="member-info">
                  <div className="member-identity">
                    <h4>{member.users.full_name}</h4>
                    <p className="member-email">{member.users.email}</p>
                    {member.users.job_title && (
                      <p className="member-title">{member.users.job_title}</p>
                    )}
                    {member.users.company && (
                      <p className="member-company">{member.users.company}</p>
                    )}
                  </div>

                  <div className="member-metadata">
                    <div className="member-status">
                      <span className={`badge ${getStatusBadgeColor(member.status)}`}>
                        {member.status}
                      </span>
                      <span className="role-badge">{member.campaign_role}</span>
                    </div>

                    <div className="member-permissions">
                      {member.permissions.map((permission) => (
                        <span
                          key={permission}
                          className={`badge ${getPermissionBadgeColor(permission)}`}
                        >
                          {permission}
                        </span>
                      ))}
                    </div>

                    <div className="member-dates">
                      <small>Joined: {new Date(member.joined_at).toLocaleDateString()}</small>
                      {member.users.last_login_at && (
                        <small>
                          Last login: {new Date(member.users.last_login_at).toLocaleDateString()}
                        </small>
                      )}
                    </div>
                  </div>
                </div>

                {isAdmin && member.user_id !== user.id && (
                  <div className="member-actions">
                    <div className="permission-controls">
                      <label>
                        <input
                          type="checkbox"
                          checked={member.permissions.includes('view')}
                          onChange={(e) => {
                            const newPermissions = e.target.checked
                              ? [...new Set([...member.permissions, 'view'])]
                              : member.permissions.filter((p) => p !== 'view');
                            handleUpdateMemberPermissions(member.id, newPermissions);
                          }}
                        />
                        View
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={member.permissions.includes('export')}
                          onChange={(e) => {
                            const newPermissions = e.target.checked
                              ? [...new Set([...member.permissions, 'export'])]
                              : member.permissions.filter((p) => p !== 'export');
                            handleUpdateMemberPermissions(member.id, newPermissions);
                          }}
                        />
                        Export
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={member.permissions.includes('admin')}
                          onChange={(e) => {
                            const newPermissions = e.target.checked
                              ? [...new Set([...member.permissions, 'admin'])]
                              : member.permissions.filter((p) => p !== 'admin');
                            handleUpdateMemberPermissions(member.id, newPermissions);
                          }}
                        />
                        Admin
                      </label>
                    </div>

                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      {isAdmin && pendingInvitations.length > 0 && (
        <div className="team-section">
          <h3>Pending Invitations</h3>

          <div className="invitations-list">
            {pendingInvitations.map((invitation) => (
              <div key={invitation.id} className="invitation-card">
                <div className="invitation-info">
                  <h4>{invitation.email}</h4>
                  <div className="invitation-details">
                    <div className="invitation-permissions">
                      {invitation.permissions.map((permission) => (
                        <span
                          key={permission}
                          className={`badge ${getPermissionBadgeColor(permission)}`}
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                    <p className="invitation-role">Role: {invitation.campaign_role}</p>
                    <p className="invitation-dates">
                      Invited: {new Date(invitation.created_at).toLocaleDateString()} by{' '}
                      {invitation.users?.full_name}
                    </p>
                    <p className="invitation-expires">
                      Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="invitation-actions">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      const invitationUrl = `${window.location.origin}/accept-invitation/${invitation.token}`;
                      navigator.clipboard.writeText(invitationUrl);
                      alert('Invitation link copied to clipboard!');
                    }}
                  >
                    Copy Link
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRevokeInvitation(invitation.id)}
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
