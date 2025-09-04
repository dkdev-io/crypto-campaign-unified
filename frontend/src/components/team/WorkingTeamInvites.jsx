import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const WorkingTeamInvites = ({ campaignId }) => {
  const [invites, setInvites] = useState([{ email: '', permissions: ['view'] }]);
  const [loading, setLoading] = useState(false);
  const [sentLinks, setSentLinks] = useState([]);
  const { user } = useAuth();

  const addInviteRow = () => {
    setInvites([...invites, { email: '', permissions: ['view'] }]);
  };

  const updateInvite = (index, field, value) => {
    const updated = [...invites];
    updated[index][field] = value;
    setInvites(updated);
  };

  const togglePermission = (index, permission) => {
    const updated = [...invites];
    const permissions = updated[index].permissions;

    if (permissions.includes(permission)) {
      updated[index].permissions = permissions.filter((p) => p !== permission);
    } else {
      updated[index].permissions = [...permissions, permission];
    }

    setInvites(updated);
  };

  const removeInvite = (index) => {
    setInvites(invites.filter((_, i) => i !== index));
  };

  const sendInvites = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSentLinks([]);

    try {
      const validInvites = invites.filter((invite) => invite.email.trim());

      if (validInvites.length === 0) {
        alert('Please enter at least one email address');
        return;
      }

      const inviteLinks = [];

      // Generate invite links for each email
      for (const invite of validInvites) {
        const token = crypto.randomUUID
          ? crypto.randomUUID()
          : `invite-${Date.now()}-${Math.random()}`;
        const inviteLink = `${window.location.origin}/accept-invitation?token=${token}&permissions=${invite.permissions.join(',')}`;

        // Try to use Supabase auth to send actual email invitation
        try {
          // Attempt to use Supabase's magic link feature as a workaround
          const { data, error } = await supabase.auth.signInWithOtp({
            email: invite.email,
            options: {
              data: {
                invite_token: token,
                permissions: invite.permissions,
                invited_by: user?.email || 'admin',
                campaign_id: campaignId,
              },
              emailRedirectTo: inviteLink,
            },
          });

          if (error) {
            console.log('Supabase email failed, using fallback:', error.message);
            throw error;
          }

          console.log('Email sent via Supabase to:', invite.email);
          inviteLinks.push({
            email: invite.email,
            link: inviteLink,
            permissions: invite.permissions,
            sent: true,
          });
        } catch (emailError) {
          // Fallback: Show links directly since email sending isn't configured
          console.log('Email service not configured, providing direct link');
          inviteLinks.push({
            email: invite.email,
            link: inviteLink,
            permissions: invite.permissions,
            sent: false,
          });
        }

        // Also try to save to database if authenticated
        if (user?.id) {
          try {
            await supabase.from('invitations').insert([
              {
                campaign_id: campaignId,
                email: invite.email.trim(),
                permissions: invite.permissions,
                token: token,
                invited_by: user.id,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              },
            ]);
          } catch (dbError) {
            console.log('Database save skipped:', dbError.message);
          }
        }
      }

      // Show the invite links to the user
      setSentLinks(inviteLinks);

      // Display success with invite links
      const message = inviteLinks
        .map((inv) => {
          return `${inv.email}: ${inv.sent ? 'Email sent!' : 'Copy link below'}`;
        })
        .join('\n');

      alert(`✅ Invitations processed!\n\n${message}\n\nSee links below to share manually.`);

      // Don't redirect immediately - let user see and copy links
    } catch (error) {
      console.error('Error processing invites:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <form onSubmit={sendInvites}>
        {invites.map((invite, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              marginBottom: '1rem',
              padding: '1rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          >
            <input
              type="email"
              placeholder="Email address"
              value={invite.email}
              onChange={(e) => updateInvite(index, 'email', e.target.value)}
              style={{ flex: 1 }}
              required
            />

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <label>
                <input
                  type="checkbox"
                  checked={invite.permissions.includes('admin')}
                  onChange={() => togglePermission(index, 'admin')}
                />
                Admin
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={invite.permissions.includes('export')}
                  onChange={() => togglePermission(index, 'export')}
                />
                Export
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={invite.permissions.includes('view')}
                  onChange={() => togglePermission(index, 'view')}
                />
                View
              </label>
            </div>

            {invites.length > 1 && (
              <button
                type="button"
                onClick={() => removeInvite(index)}
                style={{
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Remove
              </button>
            )}
          </div>
        ))}

        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
          <button
            type="button"
            onClick={addInviteRow}
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Add Another
          </button>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Processing...' : 'Send Invitations'}
          </button>
        </div>
      </form>

      {/* Show invite links after sending */}
      {sentLinks.length > 0 && (
        <div
          style={{
            marginTop: '2rem',
            padding: '1.5rem',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#495057' }}>
            📧 Invitation Links
          </h3>
          <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
            {sentLinks.some((l) => !l.sent)
              ? 'Email service not fully configured. Share these links directly with invitees:'
              : 'Emails sent! Backup links below:'}
          </p>

          {sentLinks.map((link, index) => (
            <div
              key={index}
              style={{
                marginBottom: '1rem',
                padding: '1rem',
                background: 'white',
                borderRadius: '4px',
                border: '1px solid #e9ecef',
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#212529' }}>
                {link.email} ({link.permissions.join(', ')})
              </div>
              <div
                style={{
                  padding: '0.5rem',
                  background: '#e7f5ff',
                  borderRadius: '4px',
                  wordBreak: 'break-all',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: '#0c63e4',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  navigator.clipboard.writeText(link.link);
                  alert('Link copied to clipboard!');
                }}
                title="Click to copy"
              >
                {link.link}
              </div>
              <small style={{ color: '#6c757d' }}>
                {link.sent ? '✅ Email sent' : '⚠️ Copy and send manually'}
              </small>
            </div>
          ))}

          <button
            onClick={() => (window.location.href = '/setup')}
            style={{
              marginTop: '1rem',
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              width: '100%',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            Continue to Campaign Setup →
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkingTeamInvites;
