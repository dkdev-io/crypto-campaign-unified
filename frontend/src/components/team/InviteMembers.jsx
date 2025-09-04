import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

const InviteMembers = ({ campaignId, onInviteSent }) => {
  const [formData, setFormData] = useState({
    email: '',
    permissions: ['view'],
    campaignRole: 'member',
    personalMessage: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const { user } = useAuth()

  const permissionOptions = [
    { value: 'view', label: 'View', description: 'Can view campaign data and reports' },
    { value: 'export', label: 'Export', description: 'Can export data and generate reports' },
    { value: 'admin', label: 'Admin', description: 'Full access including team management' }
  ]

  const roleOptions = [
    { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
    { value: 'member', label: 'Team Member', description: 'Standard team member' },
    { value: 'admin', label: 'Administrator', description: 'Can manage team and settings' }
  ]

  const validateForm = () => {
    const newErrors = {}

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (formData.permissions.length === 0) {
      newErrors.permissions = 'Please select at least one permission'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const generateInvitationToken = () => {
    return Array.from({ length: 32 }, () => 
      Math.random().toString(36).charAt(2)
    ).join('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setErrors({})
    setSuccess('')

    try {
      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('campaign_members')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('user_id', (await supabase
          .from('users')
          .select('id')
          .eq('email', formData.email)
          .single()
        ).data?.id)
        .single()

      if (existingMember) {
        setErrors({ email: 'This user is already a member of this campaign' })
        return
      }

      // Check if invitation already exists
      const { data: existingInvitation } = await supabase
        .from('invitations')
        .select('id')
        .eq('email', formData.email)
        .eq('campaign_id', campaignId)
        .eq('status', 'pending')
        .single()

      if (existingInvitation) {
        setErrors({ email: 'An invitation has already been sent to this email' })
        return
      }

      // Create invitation
      const token = generateInvitationToken()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

      const { data, error } = await supabase
        .from('invitations')
        .insert([{
          email: formData.email,
          campaign_id: campaignId,
          invited_by: user.id,
          permissions: formData.permissions,
          campaign_role: formData.campaignRole,
          token: token,
          expires_at: expiresAt.toISOString(),
          personal_message: formData.personalMessage || null,
          status: 'pending'
        }])
        .select()
        .single()

      if (error) {
        setErrors({ submit: error.message })
        return
      }

      // Email service integration will be implemented later
      const invitationUrl = `${window.location.origin}/accept-invitation/${token}`
      
      setSuccess(`Invitation sent successfully! Share this link: ${invitationUrl}`)
      
      // Reset form
      setFormData({
        email: '',
        permissions: ['view'],
        campaignRole: 'member',
        personalMessage: ''
      })

      if (onInviteSent) {
        onInviteSent(data)
      }

    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionChange = (permission, checked) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        permissions: [...prev.permissions, permission]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => p !== permission)
      }))
    }
  }

  return (
    <div className="invite-members-container">
      <div className="invite-card">
        <div className="invite-header">
          <h3>👥 Invite Team Member</h3>
          <p>Invite someone to join your campaign team</p>
        </div>

        <form onSubmit={handleSubmit} className="invite-form">
          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="colleague@example.com"
              required
            />
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label>Permissions *</label>
            <div className="permissions-grid">
              {permissionOptions.map(option => (
                <div key={option.value} className="permission-option">
                  <label className="permission-label">
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(option.value)}
                      onChange={(e) => handlePermissionChange(option.value, e.target.checked)}
                    />
                    <div className="permission-info">
                      <strong>{option.label}</strong>
                      <small>{option.description}</small>
                    </div>
                  </label>
                </div>
              ))}
            </div>
            {errors.permissions && (
              <span className="error-message">{errors.permissions}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="campaignRole">Role</label>
            <select
              id="campaignRole"
              value={formData.campaignRole}
              onChange={(e) => setFormData(prev => ({ ...prev, campaignRole: e.target.value }))}
              className="form-input"
            >
              {roleOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="personalMessage">Personal Message (Optional)</label>
            <textarea
              id="personalMessage"
              value={formData.personalMessage}
              onChange={(e) => setFormData(prev => ({ ...prev, personalMessage: e.target.value }))}
              className="form-input"
              placeholder="Hi! I'd like to invite you to join our campaign team..."
              rows={3}
            />
            <small className="field-help">
              Add a personal note to the invitation email
            </small>
          </div>

          {errors.submit && (
            <div className="error-banner">
              {errors.submit}
            </div>
          )}

          {success && (
            <div className="success-banner">
              {success}
            </div>
          )}

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Sending Invitation...' : 'Send Invitation'}
            </button>
          </div>
        </form>

        <div className="permissions-info">
          <h4>Permission Levels Explained:</h4>
          <ul>
            <li><strong>View:</strong> Can see campaign data, donations, and reports</li>
            <li><strong>Export:</strong> Can download data and generate reports</li>
            <li><strong>Admin:</strong> Can manage team members, settings, and all campaign aspects</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default InviteMembers