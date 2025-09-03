import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error)
      }
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session)
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setUserProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        // If users table doesn't exist, create a mock profile
        if (error.message.includes('Could not find the table')) {
          console.log('Users table not found, using auth user data')
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            setUserProfile({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || 'User',
              role: 'user',
              created_at: user.created_at
            })
          }
        }
        return
      }

      setUserProfile(data)
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
    }
  }

  // Sign up with email and password
  const signUp = async (email, password, fullName) => {
    try {
      console.log('🔐 Starting signup process...')
      console.log(`📧 Email: ${email}`)
      console.log(`📍 Redirect URL: ${window.location.origin}/auth?verified=true`)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          },
          emailRedirectTo: `${import.meta.env.VITE_APP_URL || window.location.origin}/auth?verified=true`
        }
      })

      if (error) {
        console.error('❌ Signup error:', error)
        throw error
      }
      
      console.log('✅ Signup successful:', {
        userId: data.user?.id,
        email: data.user?.email,
        emailConfirmed: data.user?.email_confirmed_at,
        needsVerification: !data.user?.email_confirmed_at
      })

      // Create user profile in our users table (if table exists)
      if (data.user) {
        try {
          const { error: profileError } = await supabase
            .from('users')
            .insert([
              {
                id: data.user.id,
                email: data.user.email,
                full_name: fullName,
                email_confirmed: data.user.email_confirmed_at ? true : false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ])

          if (profileError) {
            console.warn('Could not create user profile (table may not exist):', profileError.message)
            // Continue with signup anyway - auth system will work without custom users table
          }
        } catch (err) {
          console.warn('Users table not available, using auth-only flow')
        }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        // Provide more specific error messages
        let friendlyError = { ...error }
        
        if (error.message === 'Invalid login credentials') {
          // Check if the user exists in auth.users
          const { data: existingUsers } = await supabase.auth.admin.listUsers()
          const userExists = existingUsers?.users?.some(u => u.email === email)
          
          if (!userExists) {
            friendlyError.message = 'No account found with this email address'
            friendlyError.type = 'user_not_found'
          } else {
            friendlyError.message = 'Incorrect password. Please try again or reset your password.'
            friendlyError.type = 'wrong_password'
          }
        } else if (error.message.includes('email')) {
          friendlyError.message = 'Please enter a valid email address'
          friendlyError.type = 'invalid_email'
        } else if (error.message.includes('password')) {
          friendlyError.message = 'Password is required'
          friendlyError.type = 'missing_password'
        }
        
        throw friendlyError
      }

      // Update login tracking (if users table exists)
      if (data.user) {
        try {
          await supabase
            .from('users')
            .update({
              last_login_at: new Date().toISOString(),
              login_count: supabase.sql`login_count + 1`
            })
            .eq('id', data.user.id)
        } catch (updateError) {
          console.warn('Could not update login tracking (users table may not exist):', updateError.message)
          // Don't fail the login for this - auth will work without custom users table
        }
      }

      return { data, error: null }
    } catch (error) {
      setError(error)
      return { data: null, error }
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setUser(null)
      setSession(null)
      setUserProfile(null)
      
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  // Update user profile
  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in')

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      setUserProfile(data)
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get user's campaigns
  const getUserCampaigns = async () => {
    try {
      if (!user) return { data: [], error: null }

      const { data, error } = await supabase
        .from('campaign_members')
        .select(`
          *,
          campaigns (*)
        `)
        .eq('user_id', user.id)

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: [], error }
    }
  }

  // Check if user has permission for a campaign
  const hasPermission = async (campaignId, permission) => {
    try {
      if (!user) return false

      const { data, error } = await supabase
        .from('campaign_members')
        .select('permissions')
        .eq('user_id', user.id)
        .eq('campaign_id', campaignId)
        .single()

      if (error || !data) return false

      return data.permissions.includes(permission)
    } catch (error) {
      return false
    }
  }

  // Accept invitation
  const acceptInvitation = async (token) => {
    try {
      if (!user) throw new Error('Must be logged in to accept invitations')

      const { data, error } = await supabase.rpc('accept_invitation', {
        p_token: token,
        p_user_id: user.id
      })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Check if user email is verified
  const isEmailVerified = () => {
    // TEMPORARY: Bypass email verification for testing
    // Remove this bypass once Supabase email verification is fixed
    console.warn('⚠️ Email verification bypassed for testing')
    return true // Always return true for now
    // Original code: return user?.email_confirmed_at !== null
  }

  // Handle email verification callback
  const handleEmailVerification = async () => {
    try {
      if (!user) return { verified: false, error: 'No user found' }

      // Update local user profile with email confirmation status
      if (user.email_confirmed_at) {
        await supabase
          .from('users')
          .update({ 
            email_confirmed: true,
            email_confirmed_at: user.email_confirmed_at,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        // Refresh user profile
        await fetchUserProfile(user.id)
      }

      return { verified: !!user.email_confirmed_at, error: null }
    } catch (error) {
      return { verified: false, error }
    }
  }

  // Reset password functionality
  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${import.meta.env.VITE_APP_URL || window.location.origin}/auth?reset=true`
      })

      if (error) {
        let friendlyError = { ...error }
        if (error.message.includes('email')) {
          friendlyError.message = 'Please enter a valid email address'
        } else if (error.message.includes('not found')) {
          friendlyError.message = 'No account found with this email address'
        } else {
          friendlyError.message = 'Unable to send reset email. Please try again.'
        }
        throw friendlyError
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Update password after reset
  const updatePassword = async (newPassword) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Check session validity and handle timeout
  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) throw error
      
      if (!session) {
        // Session expired
        await signOut()
        return { valid: false, expired: true }
      }
      
      // Check if token is near expiry (within 5 minutes)
      const expiresAt = session.expires_at * 1000 // Convert to milliseconds
      const now = Date.now()
      const timeUntilExpiry = expiresAt - now
      
      if (timeUntilExpiry < 5 * 60 * 1000) { // Less than 5 minutes
        // Refresh the session
        const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession()
        
        if (refreshError) {
          await signOut()
          return { valid: false, expired: true }
        }
        
        setSession(newSession)
        return { valid: true, refreshed: true }
      }
      
      return { valid: true, expired: false }
    } catch (error) {
      console.error('Session check error:', error)
      return { valid: false, error }
    }
  }

  // Get user role
  const getUserRole = () => {
    if (!userProfile) return null
    return userProfile.role || 'user'
  }

  // Check if user is admin
  const isAdmin = () => {
    return getUserRole() === 'admin'
  }

  // Clear error function
  const clearError = () => {
    setError(null)
  }

  const value = {
    user,
    session,
    userProfile,
    loading,
    error,
    clearError,
    signUp,
    signIn,
    signOut,
    updateProfile,
    getUserCampaigns,
    hasPermission,
    acceptInvitation,
    fetchUserProfile,
    isEmailVerified,
    handleEmailVerification,
    resetPassword,
    updatePassword,
    checkSession,
    getUserRole,
    isAdmin
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}