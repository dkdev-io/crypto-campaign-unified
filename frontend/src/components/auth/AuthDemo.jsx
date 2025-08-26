import React, { useState } from 'react'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import AuthFlow from './AuthFlow'
import SimpleTeamInvites from '../team/SimpleTeamInvites'
import '../../styles/auth.css'

// Clean authenticated state - just contact form then team invites
const AuthenticatedApp = () => {
  const [showTeamManagement, setShowTeamManagement] = useState(false)
  const { user, userProfile } = useAuth()

  // If profile is complete, show team invites
  if (showTeamManagement || (userProfile?.full_name && userProfile?.phone)) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <SimpleTeamInvites campaignId="default-campaign" />
      </div>
    )
  }

  // Show contact form
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <ProfileForm onComplete={() => setShowTeamManagement(true)} />
    </div>
  )
}

// Simple contact information form
const ProfileForm = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    company: '',
    job_title: '',
    address: '',
    city: '',
    state: '',
    zip: ''
  })
  const [loading, setLoading] = useState(false)
  const { updateProfile } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await updateProfile(formData)
      if (error) {
        alert('Error: ' + error.message)
      } else {
        onComplete()
      }
    } catch (error) {
      alert('Error updating profile: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Full Name"
        value={formData.full_name}
        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
        required
      />
      <input
        type="tel"
        placeholder="Phone"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="Company"
        value={formData.company}
        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
      />
      <input
        type="text"
        placeholder="Job Title"
        value={formData.job_title}
        onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
      />
      <input
        type="text"
        placeholder="Address"
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
      />
      <input
        type="text"
        placeholder="City"
        value={formData.city}
        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
      />
      <input
        type="text"
        placeholder="State"
        value={formData.state}
        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
      />
      <input
        type="text"
        placeholder="ZIP"
        value={formData.zip}
        onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Submit'}
      </button>
    </form>
  )
}

// Main demo component
const AuthDemo = () => {
  const [showApp, setShowApp] = useState(false)

  return (
    <AuthProvider>
      <div className="auth-demo">
        <AuthDemoContent 
          showApp={showApp}
          setShowApp={setShowApp}
        />
      </div>
    </AuthProvider>
  )
}

const AuthDemoContent = ({ showApp, setShowApp }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <AuthFlow
        onAuthComplete={() => setShowApp(true)}
        initialMode="signup"
        requireProfileCompletion={false}
        requireDataSetup={false}
      />
    )
  }

  return <AuthenticatedApp />
}

export default AuthDemo