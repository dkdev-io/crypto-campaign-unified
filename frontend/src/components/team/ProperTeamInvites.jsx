import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

const ProperTeamInvites = ({ campaignId }) => {
  const [invites, setInvites] = useState([{ email: '', permissions: ['view'] }])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const { user } = useAuth()

  const addInviteRow = () => {
    setInvites([...invites, { email: '', permissions: ['view'] }])
  }

  const updateInvite = (index, field, value) => {
    const updated = [...invites]
    updated[index][field] = value
    setInvites(updated)
  }

  const togglePermission = (index, permission) => {
    const updated = [...invites]
    const permissions = updated[index].permissions
    
    if (permissions.includes(permission)) {
      updated[index].permissions = permissions.filter(p => p !== permission)
    } else {
      updated[index].permissions = [...permissions, permission]
    }
    
    setInvites(updated)
  }

  const removeInvite = (index) => {
    setInvites(invites.filter((_, i) => i !== index))
  }

  const sendInvites = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResults([])

    try {
      const validInvites = invites.filter(invite => invite.email.trim())
      
      if (validInvites.length === 0) {
        alert('Please enter at least one email address')
        setLoading(false)
        return
      }

      const inviteResults = []

      for (const invite of validInvites) {
        try {
          const token = crypto.randomUUID ? crypto.randomUUID() : `invite-${Date.now()}-${Math.random()}`
          
          // First, save the invitation record to database
          if (user?.id) {
            const { data: inviteRecord, error: dbError } = await supabase
              .from('invitations')
              .insert([{
                campaign_id: campaignId || 'default-campaign',
                email: invite.email.trim(),
                permissions: invite.permissions,
                token: token,
                invited_by: user.id,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
              }])
              .select()
              .single()

            if (dbError) {
              console.log('Database save issue:', dbError)
            } else {
              console.log('Invitation saved:', inviteRecord)
            }
          }

          // Create the invitation link
          const inviteLink = `${window.location.origin}/accept-invitation?token=${token}`
          
          // Try to send actual email using Supabase Auth invite
          // Note: This requires the user to be an admin or have proper permissions
          const { data, error } = await supabase.auth.admin.inviteUserByEmail(invite.email.trim(), {
            data: {
              campaign_id: campaignId,
              permissions: invite.permissions,
              invited_by: user?.email || 'admin',
              invitation_token: token
            },
            redirectTo: inviteLink
          })

          if (!error) {
            inviteResults.push({
              email: invite.email,
              status: 'sent',
              message: 'Email sent successfully'
            })
            console.log(`✅ Email sent to ${invite.email}`)
          } else {
            throw error
          }

        } catch (emailError) {
          console.error(`Failed to send to ${invite.email}:`, emailError)
          
          // Fallback: Try using magic link as an alternative
          try {
            const { data: magicLinkData, error: magicLinkError } = await supabase.auth.signInWithOtp({
              email: invite.email.trim(),
              options: {
                shouldCreateUser: true,
                emailRedirectTo: `${window.location.origin}/accept-invitation`,
                data: {
                  campaign_id: campaignId,
                  permissions: invite.permissions,
                  invited_by: user?.email || 'admin'
                }
              }
            })

            if (!magicLinkError) {
              inviteResults.push({
                email: invite.email,
                status: 'magic-link',
                message: 'Magic link sent (user will need to sign up)'
              })
              console.log(`📧 Magic link sent to ${invite.email}`)
            } else {
              throw magicLinkError
            }
          } catch (fallbackError) {
            // If all else fails, provide manual link
            const token = crypto.randomUUID ? crypto.randomUUID() : `invite-${Date.now()}-${Math.random()}`
            const manualLink = `${window.location.origin}/accept-invitation?token=${token}&email=${encodeURIComponent(invite.email)}&permissions=${invite.permissions.join(',')}`
            
            inviteResults.push({
              email: invite.email,
              status: 'manual',
              message: fallbackError.message || 'Email service unavailable',
              link: manualLink
            })
          }
        }
      }

      setResults(inviteResults)
      
      // Show summary
      const sentCount = inviteResults.filter(r => r.status === 'sent' || r.status === 'magic-link').length
      const manualCount = inviteResults.filter(r => r.status === 'manual').length
      
      if (sentCount > 0 && manualCount === 0) {
        alert(`✅ Success! ${sentCount} invitation email(s) sent.`)
      } else if (sentCount > 0 && manualCount > 0) {
        alert(`⚠️ Partial success: ${sentCount} email(s) sent, ${manualCount} need manual sharing.`)
      } else {
        alert(`ℹ️ Email service issue. Manual invitation links provided below.`)
      }
      
    } catch (error) {
      console.error('Error processing invites:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const validateEmail = (email) => {
    // More lenient email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  return (
    <div style={{ padding: '2rem' }}>
      <form onSubmit={sendInvites}>
        {invites.map((invite, index) => (
          <div key={index} style={{ 
            display: 'flex', 
            gap: '1rem', 
            alignItems: 'center', 
            marginBottom: '1rem',
            padding: '1rem',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}>
            <input
              type="email"
              placeholder="Enter real email address"
              value={invite.email}
              onChange={(e) => updateInvite(index, 'email', e.target.value)}
              style={{ 
                flex: 1,
                padding: '0.5rem',
                fontSize: '14px',
                borderColor: invite.email && !validateEmail(invite.email) ? '#dc3545' : '#ced4da'
              }}
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
                  cursor: 'pointer'
                }}
              >
                Remove
              </button>
            )}
          </div>
        ))}
        
        <div style={{ 
          padding: '0.75rem', 
          background: '#fff3cd', 
          border: '1px solid #ffeaa7',
          borderRadius: '4px',
          marginBottom: '1rem',
          color: '#856404'
        }}>
          ⚠️ <strong>Important:</strong> Use real email addresses. Test emails like "test@example.com" will be rejected.
        </div>
        
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
              cursor: 'pointer'
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
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Sending...' : 'Send Invitations'}
          </button>
        </div>
      </form>

      {/* Show results */}
      {results.length > 0 && (
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#495057' }}>
            📧 Invitation Results
          </h3>
          
          {results.map((result, index) => (
            <div key={index} style={{
              marginBottom: '1rem',
              padding: '1rem',
              background: 'white',
              borderRadius: '4px',
              border: `1px solid ${result.status === 'sent' ? '#28a745' : result.status === 'magic-link' ? '#17a2b8' : '#ffc107'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {result.status === 'sent' && '✅'}
                {result.status === 'magic-link' && '📧'}
                {result.status === 'manual' && '⚠️'}
                <strong>{result.email}</strong>
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '14px', color: '#6c757d' }}>
                {result.message}
              </div>
              {result.link && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  background: '#e7f5ff',
                  borderRadius: '4px',
                  wordBreak: 'break-all',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: '#0c63e4',
                  cursor: 'pointer'
                }}
                  onClick={() => {
                    navigator.clipboard.writeText(result.link)
                    alert('Link copied to clipboard!')
                  }}
                  title="Click to copy"
                >
                  {result.link}
                </div>
              )}
            </div>
          ))}
          
          <button
            onClick={() => window.location.href = '/setup'}
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
              fontWeight: 'bold'
            }}
          >
            Continue to Campaign Setup →
          </button>
        </div>
      )}
    </div>
  )
}

export default ProperTeamInvites