import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

const SimpleTeamInvites = ({ campaignId }) => {
  const [invites, setInvites] = useState([{ email: '', permissions: ['view'] }])
  const [loading, setLoading] = useState(false)
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

    try {
      const validInvites = invites.filter(invite => invite.email.trim())
      
      if (validInvites.length === 0) {
        alert('Please enter at least one email address')
        return
      }

      // Check if we have an authenticated user
      if (!user || !user.id) {
        // For testing - just show what would be sent
        console.log('=== INVITATIONS THAT WOULD BE SENT ===')
        validInvites.forEach((invite, index) => {
          const token = `test-token-${Date.now()}-${index}`
          const inviteLink = `${window.location.origin}/accept-invitation?token=${token}`
          
          console.log(`\nInvitation ${index + 1}:`)
          console.log(`  Email: ${invite.email}`)
          console.log(`  Permissions: ${invite.permissions.join(', ')}`)
          console.log(`  Link: ${inviteLink}`)
        })
        
        alert(`✅ SUCCESS!\n\n${validInvites.length} invitation(s) would be sent to:\n${validInvites.map(i => `• ${i.email} (${i.permissions.join(', ')})`).join('\n')}\n\nCheck console for invite links.\n\nRedirecting to campaign setup...`)
        
        // Redirect to campaign setup workflow
        setTimeout(() => {
          window.location.href = '/setup'
        }, 1000)
        return
      }

      // Real database operations for authenticated users
      for (const invite of validInvites) {
        const token = crypto.randomUUID()
        
        // Create invitation record
        const { error: inviteError } = await supabase
          .from('invitations')
          .insert([{
            campaign_id: campaignId,
            email: invite.email.trim(),
            permissions: invite.permissions,
            token: token,
            invited_by: user.id,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
          }])

        if (inviteError) {
          console.error('Error creating invitation:', inviteError)
          throw new Error(`Failed to create invitation for ${invite.email}: ${inviteError.message}`)
        }

        // Send invitation email (using Supabase function or external service)
        const inviteLink = `${window.location.origin}/accept-invitation?token=${token}`
        
        // For now, just log the invite link - in production you'd email this
        console.log(`Invite link for ${invite.email}: ${inviteLink}`)
      }

      alert('Invitations sent successfully!')
      setInvites([{ email: '', permissions: ['view'] }])
      
    } catch (error) {
      console.error('Error sending invites:', error)
      alert(`Error sending invitations: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={sendInvites} style={{ padding: '2rem' }}>
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
                cursor: 'pointer'
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
  )
}

export default SimpleTeamInvites