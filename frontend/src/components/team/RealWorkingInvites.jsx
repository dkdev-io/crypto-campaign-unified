import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const RealWorkingInvites = ({ campaignId }) => {
  const [invites, setInvites] = useState([{ email: '', permissions: ['view'] }]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
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

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Check for valid format
    if (!emailRegex.test(email)) {
      return { valid: false, reason: 'Invalid email format' };
    }

    // Reject obvious test emails that Supabase won't accept
    const blockedDomains = ['example.com', 'test.com', 'localhost'];
    const domain = email.split('@')[1]?.toLowerCase();

    if (blockedDomains.includes(domain)) {
      return {
        valid: false,
        reason: `${domain} emails are not allowed. Use a real email address.`,
      };
    }

    return { valid: true };
  };

  const sendInvites = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResults([]);

    try {
      const validInvites = invites.filter((invite) => invite.email.trim());

      if (validInvites.length === 0) {
        alert('Please enter at least one email address');
        setLoading(false);
        return;
      }

      // Validate all emails first
      const invalidEmails = [];
      for (const invite of validInvites) {
        const validation = validateEmail(invite.email);
        if (!validation.valid) {
          invalidEmails.push({ email: invite.email, reason: validation.reason });
        }
      }

      if (invalidEmails.length > 0) {
        const messages = invalidEmails.map((e) => `${e.email}: ${e.reason}`).join('\n');
        alert(`Invalid email addresses:\n\n${messages}\n\nPlease use real email addresses.`);
        setLoading(false);
        return;
      }

      const inviteResults = [];

      for (const invite of validInvites) {
        try {
          // Generate a secure random password for the invited user
          const tempPassword = 'Welcome' + Math.random().toString(36).substring(2, 15) + '!';
          const inviteToken = crypto.randomUUID
            ? crypto.randomUUID()
            : `invite-${Date.now()}-${Math.random()}`;

          // Create user account with temporary password
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: invite.email.trim(),
            password: tempPassword,
            options: {
              data: {
                invited_by: user?.email || 'admin',
                campaign_id: campaignId || 'default-campaign',
                permissions: invite.permissions,
                invitation_token: inviteToken,
                is_invited_user: true,
              },
              emailRedirectTo: `http://localhost:5175/accept-invitation?token=${inviteToken}`,
            },
          });

          if (signUpError) {
            // Check if user already exists
            if (signUpError.message.includes('already registered')) {
              // User exists, try to add them to the campaign instead
              inviteResults.push({
                email: invite.email,
                status: 'exists',
                message: 'User already has an account. They can log in directly.',
              });

              // Still save the invitation record
              if (user?.id) {
                await supabase.from('invitations').insert([
                  {
                    campaign_id: campaignId || 'default-campaign',
                    email: invite.email.trim(),
                    permissions: invite.permissions,
                    token: inviteToken,
                    invited_by: user.id,
                    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    accepted: false,
                  },
                ]);
              }
            } else {
              throw signUpError;
            }
          } else if (signUpData.user) {
            // Success! User created and verification email sent
            inviteResults.push({
              email: invite.email,
              status: 'sent',
              message: '✅ Account created! Verification email sent.',
              userId: signUpData.user.id,
            });

            // Save invitation record to database
            if (user?.id) {
              const { data: inviteRecord, error: dbError } = await supabase
                .from('invitations')
                .insert([
                  {
                    campaign_id: campaignId || 'default-campaign',
                    email: invite.email.trim(),
                    permissions: invite.permissions,
                    token: inviteToken,
                    invited_by: user.id,
                    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    accepted: false,
                    invited_user_id: signUpData.user.id,
                  },
                ])
                .select()
                .single();

              if (!dbError) {
                console.log('Invitation saved:', inviteRecord);
              }
            }

            // Send password reset email so they can set their own password
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(
              invite.email.trim(),
              {
                redirectTo: `http://localhost:5175/reset-password?invitation=${inviteToken}`,
              }
            );

            if (!resetError) {
              inviteResults[inviteResults.length - 1].message +=
                '\n📧 Password setup email also sent.';
            }
          }
        } catch (error) {
          console.error(`Failed for ${invite.email}:`, error);
          inviteResults.push({
            email: invite.email,
            status: 'error',
            message: error.message || 'Failed to send invitation',
          });
        }
      }

      setResults(inviteResults);

      // Show summary
      const sentCount = inviteResults.filter((r) => r.status === 'sent').length;
      const existsCount = inviteResults.filter((r) => r.status === 'exists').length;
      const errorCount = inviteResults.filter((r) => r.status === 'error').length;

      if (sentCount > 0 && errorCount === 0) {
        alert(
          `✅ Success! ${sentCount} invitation email(s) sent.${existsCount > 0 ? `\n${existsCount} user(s) already have accounts.` : ''}`
        );
      } else if (sentCount > 0 && errorCount > 0) {
        alert(`⚠️ Partial success: ${sentCount} email(s) sent, ${errorCount} failed.`);
      } else if (existsCount > 0 && errorCount === 0) {
        alert(`ℹ️ ${existsCount} user(s) already have accounts. They can log in directly.`);
      } else {
        alert(`❌ Failed to send invitations. Please check the errors below.`);
      }
    } catch (error) {
      console.error('Error processing invites:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Invite Team Members</h2>

      <div
        style={{
          padding: '1rem',
          background: '#e3f2fd',
          border: '1px solid #1976d2',
          borderRadius: '4px',
          marginBottom: '1.5rem',
        }}
      >
        <strong>📧 Email Invitations Now Working!</strong>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '14px' }}>
          Invited users will receive verification emails to set up their accounts. Please use real,
          accessible email addresses (not test@example.com).
        </p>
      </div>

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
              background: invite.email && !validateEmail(invite.email).valid ? '#ffebee' : 'white',
            }}
          >
            <div style={{ flex: 1 }}>
              <input
                type="email"
                placeholder="Enter email address (e.g., john@gmail.com)"
                value={invite.email}
                onChange={(e) => updateInvite(index, 'email', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  fontSize: '14px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                }}
                required
              />
              {invite.email && !validateEmail(invite.email).valid && (
                <small style={{ color: '#dc3545', display: 'block', marginTop: '0.25rem' }}>
                  {validateEmail(invite.email).reason}
                </small>
              )}
            </div>

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
            {loading ? 'Sending...' : 'Send Invitations'}
          </button>
        </div>
      </form>

      {/* Show results */}
      {results.length > 0 && (
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
            📧 Invitation Results
          </h3>

          {results.map((result, index) => (
            <div
              key={index}
              style={{
                marginBottom: '1rem',
                padding: '1rem',
                background: 'white',
                borderRadius: '4px',
                border: `2px solid ${
                  result.status === 'sent'
                    ? '#28a745'
                    : result.status === 'exists'
                      ? '#17a2b8'
                      : '#dc3545'
                }`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {result.status === 'sent' && '✅'}
                {result.status === 'exists' && 'ℹ️'}
                {result.status === 'error' && '❌'}
                <strong>{result.email}</strong>
              </div>
              <div
                style={{
                  marginTop: '0.5rem',
                  fontSize: '14px',
                  color: '#6c757d',
                  whiteSpace: 'pre-line',
                }}
              >
                {result.message}
              </div>
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

export default RealWorkingInvites;
