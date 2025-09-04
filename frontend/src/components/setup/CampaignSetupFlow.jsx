import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import StepIndicator from './StepIndicator'
import CampaignInfo from './CampaignInfo'
import InviteMembers from '../team/InviteMembers'
import WebsiteStyleMatcher from './WebsiteStyleMatcher'
import StyleConfirmation from './StyleConfirmation'
import EmbedCode from './EmbedCode'
// All styles now consolidated in index.css

const CampaignSetupFlow = () => {
  const navigate = useNavigate()
  const { user, userProfile } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Campaign info
    campaignName: '',
    website: '',
    description: '',
    
    // Team invites
    invitations: [],
    skipInvites: false,
    
    // Styling
    websiteUrl: '',
    extractedStyles: null,
    stylesApplied: false,
    skipStyling: false,
    
    // Final
    embedCode: '',
    campaignId: null
  })
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const totalSteps = 5 // Campaign Info, Invite Team, Style Sync, Approval, Embed

  // Initialize campaign on mount
  useEffect(() => {
    if (user) {
      initializeCampaign()
    }
  }, [user])

  const initializeCampaign = async () => {
    try {
      // Create campaign record in database
      const { data, error } = await supabase
        .from('campaigns')
        .insert([{
          user_id: user.id,
          campaign_name: 'New Campaign',
          status: 'draft',
          setup_step: 1,
          setup_completed: false,
          email: user.email
        }])
        .select()
        .single()

      if (error) throw error

      setFormData(prev => ({ ...prev, campaignId: data.id }))
    } catch (error) {
      console.error('Failed to initialize campaign:', error)
      setErrors({ init: 'Failed to initialize campaign. Please try again.' })
    }
  }

  const updateFormData = async (updates) => {
    const newData = { ...formData, ...updates }
    setFormData(newData)
    
    // Save to database
    if (formData.campaignId) {
      try {
        const dbUpdates = {
          setup_step: currentStep,
          ...mapFormDataToDb(updates)
        }
        
        const { error } = await supabase
          .from('campaigns')
          .update(dbUpdates)
          .eq('id', formData.campaignId)
        
        if (error) throw error
      } catch (error) {
        console.error('Failed to save campaign data:', error)
      }
    }
  }

  const mapFormDataToDb = (data) => {
    const dbData = {}
    
    if (data.campaignName) dbData.campaign_name = data.campaignName
    if (data.website) dbData.website = data.website
    if (data.description) dbData.description = data.description
    if (data.websiteUrl) dbData.website_analyzed = data.websiteUrl
    if (data.extractedStyles) dbData.style_analysis = data.extractedStyles
    if (data.stylesApplied !== undefined) dbData.styles_applied = data.stylesApplied
    if (data.embedCode) {
      dbData.embed_code = data.embedCode
      dbData.embed_generated_at = new Date().toISOString()
    }
    
    return dbData
  }

  const nextStep = async () => {
    setLoading(true)
    setErrors({})
    
    try {
      // Validate current step
      if (!validateStep()) {
        setLoading(false)
        return
      }
      
      // Handle skip scenarios
      if (currentStep === 2 && formData.skipInvites) {
        setCurrentStep(3)
      } else if (currentStep === 3 && formData.skipStyling) {
        // Go directly to embed code
        await generateEmbedCode()
        setCurrentStep(5)
      } else if (currentStep === 4) {
        // Generate embed code after approval
        await generateEmbedCode()
        setCurrentStep(5)
      } else if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1)
      } else {
        // Complete setup
        await completeSetup()
      }
    } finally {
      setLoading(false)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const validateStep = () => {
    const newErrors = {}
    
    switch (currentStep) {
      case 1: // Campaign Info
        if (!formData.campaignName?.trim()) {
          newErrors.campaignName = 'Campaign name is required'
        }
        if (!formData.website?.trim()) {
          newErrors.website = 'Website URL is required'
        }
        break
      case 2: // Team Invites - optional
        break
      case 3: // Style Sync - optional
        break
      case 4: // Style Approval
        if (!formData.stylesApplied && !formData.skipStyling) {
          newErrors.approval = 'Please approve or modify the styles'
        }
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const generateEmbedCode = async () => {
    try {
      const campaignUrl = `${window.location.origin}/campaign/${encodeURIComponent(formData.campaignName)}`
      const embedCode = `<!-- NEXTRAISE Campaign Donation Form -->
<iframe 
  src="${campaignUrl}"
  width="100%"
  height="800"
  frameborder="0"
  style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
  title="${formData.campaignName} - Donation Form">
</iframe>

<!-- Alternative: Direct embed (advanced users) -->
<!-- 
<div id="nextraise-campaign-${formData.campaignId}"></div>
<script>
  (function() {
    const script = document.createElement('script');
    script.src = '${window.location.origin}/embed.js';
    script.onload = function() {
      window.NEXTRAISE.renderCampaign({
        containerId: 'nextraise-campaign-${formData.campaignId}',
        campaignId: '${formData.campaignId}'
      });
    };
    document.head.appendChild(script);
  })();
</script>
-->`
      
      await updateFormData({ embedCode })
    } catch (error) {
      console.error('Failed to generate embed code:', error)
    }
  }

  const completeSetup = async () => {
    try {
      // Mark campaign as complete
      const { error } = await supabase
        .from('campaigns')
        .update({
          setup_completed: true,
          setup_completed_at: new Date().toISOString(),
          status: 'active'
        })
        .eq('id', formData.campaignId)
      
      if (error) throw error
      
      // Navigate to dashboard
      navigate('/minda/dashboard')
    } catch (error) {
      console.error('Failed to complete setup:', error)
      setErrors({ complete: 'Failed to complete setup. Please try again.' })
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h2>Campaign Information</h2>
            <p>Let's set up your campaign details</p>
            
            <div className="form-group">
              <label htmlFor="campaignName">Campaign Name *</label>
              <input
                id="campaignName"
                type="text"
                value={formData.campaignName}
                onChange={(e) => updateFormData({ campaignName: e.target.value })}
                className={`form-input ${errors.campaignName ? 'error' : ''}`}
                placeholder="e.g., Smith for Congress 2024"
              />
              {errors.campaignName && (
                <span className="error-message">{errors.campaignName}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="website">Campaign Website *</label>
              <input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => updateFormData({ website: e.target.value })}
                className={`form-input ${errors.website ? 'error' : ''}`}
                placeholder="https://www.yourcampaign.com"
              />
              {errors.website && (
                <span className="error-message">{errors.website}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="description">Campaign Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                className="form-input"
                placeholder="Brief description of your campaign..."
                rows={4}
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="step-content">
            <h2>Invite Team Members</h2>
            <p>Add team members to help manage your campaign</p>
            
            <InviteMembers 
              campaignId={formData.campaignId}
              onInviteSent={(invite) => {
                updateFormData({ 
                  invitations: [...formData.invitations, invite]
                })
              }}
            />
            
            <div className="skip-section">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.skipInvites}
                  onChange={(e) => updateFormData({ skipInvites: e.target.checked })}
                />
                <span>Skip this step - I'll add team members later</span>
              </label>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="step-content">
            <h2>Campaign Styling Sync</h2>
            <p>Match your donation form to your website's look and feel</p>
            
            <WebsiteStyleMatcher
              formData={formData}
              updateFormData={updateFormData}
              websiteUrl={formData.website}
            />
            
            <div className="skip-section">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.skipStyling}
                  onChange={(e) => updateFormData({ skipStyling: e.target.checked })}
                />
                <span>Skip this step - Use default styling</span>
              </label>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="step-content">
            <h2>Form Approval</h2>
            <p>Review and approve your donation form styling</p>
            
            <StyleConfirmation
              formData={formData}
              updateFormData={updateFormData}
              onApprove={() => updateFormData({ stylesApplied: true })}
            />
          </div>
        )

      case 5:
        return (
          <div className="step-content">
            <h2>Get Your Embed Code</h2>
            <p>Copy this code to add the donation form to your website</p>
            
            <EmbedCode 
              embedCode={formData.embedCode}
              campaignId={formData.campaignId}
            />
            
            <div className="success-message">
              <h3>🎉 Setup Complete!</h3>
              <p>Your campaign is ready to accept donations.</p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="setup-container">
      <div className="setup-card">
        <div className="setup-header">
          <h1>Campaign Setup</h1>
          <p>Welcome {userProfile?.full_name || user?.email}</p>
        </div>
        
        <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
        
        <div className="form-content">
          {renderStep()}
          
          {errors.init && (
            <div className="error-banner">{errors.init}</div>
          )}
          
          {errors.complete && (
            <div className="error-banner">{errors.complete}</div>
          )}
        </div>
        
        <div className="form-actions">
          {currentStep > 1 && (
            <button 
              className="btn btn-secondary" 
              onClick={prevStep}
              disabled={loading}
            >
              Back
            </button>
          )}
          
          <button 
            className="btn btn-primary" 
            onClick={nextStep}
            disabled={loading}
          >
            {loading ? 'Processing...' : (
              currentStep === totalSteps ? 'Go to Dashboard' : 'Next'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CampaignSetupFlow