import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const DonorAuthContext = createContext({});

export const useDonorAuth = () => {
  const context = useContext(DonorAuthContext);
  if (!context) {
    throw new Error('useDonorAuth must be used within DonorAuthProvider');
  }
  return context;
};

export const DonorAuthProvider = ({ children }) => {
  const [donor, setDonor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if donor is logged in
    checkDonor();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user?.user_metadata?.user_type === 'donor') {
          await checkDonor();
        } else if (event === 'SIGNED_OUT') {
          setDonor(null);
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const checkDonor = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && user.user_metadata?.user_type === 'donor') {
        // Get donor profile
        const { data: donorData, error: donorError } = await supabase
          .from('donors')
          .select(`
            *,
            donor_profiles (*)
          `)
          .eq('id', user.id)
          .single();

        if (donorError) throw donorError;
        
        setDonor({
          ...user,
          profile: donorData
        });
      } else {
        setDonor(null);
      }
    } catch (error) {
      console.error('Error checking donor:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async ({ email, password, fullName, phone, donorType = 'individual' }) => {
    try {
      setError(null);
      
      // First sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
            user_type: 'donor',
            donor_type: donorType
          },
          emailRedirectTo: `${window.location.origin}/donors/dashboard`
        }
      });

      if (error) throw error;

      // Note: The donor record will be created by the trigger when email is confirmed
      // For now, we just need to handle the successful signup
      
      return { data, error: null };
    } catch (error) {
      console.error('Signup error:', error);
      setError(error.message);
      return { data: null, error };
    }
  };

  const signIn = async ({ email, password }) => {
    try {
      setError(null);
      
      // First check if the email exists in the donors table
      const { data: existingDonor, error: lookupError } = await supabase
        .from('donors')
        .select('id, email')
        .eq('email', email)
        .single();

      if (lookupError && lookupError.code === 'PGRST116') {
        // No donor found with this email
        throw new Error('No user found with this email address. Please check your email or create a new account.');
      }

      if (lookupError) {
        throw new Error('Unable to verify account. Please try again.');
      }

      // Now attempt to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Incorrect password. Please check your password and try again.');
        }
        throw error;
      }

      // Verify this is a donor account
      if (data.user) {
        const { data: donorData, error: donorError } = await supabase
          .from('donors')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (donorError || !donorData) {
          await supabase.auth.signOut();
          throw new Error('This account is not registered as a donor');
        }
      }

      await checkDonor();
      return { data, error: null };
    } catch (error) {
      setError(error.message);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setDonor(null);
    } catch (error) {
      setError(error.message);
    }
  };

  const resetPassword = async (email) => {
    try {
      setError(null);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/donor/reset-password`
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      setError(error.message);
      return { error };
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      setError(null);
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      setError(error.message);
      return { error };
    }
  };

  const updateProfile = async (updates) => {
    try {
      setError(null);
      
      // Update donor record
      if (updates.full_name || updates.phone || updates.address) {
        const { error: donorError } = await supabase
          .from('donors')
          .update({
            full_name: updates.full_name,
            phone: updates.phone,
            address: updates.address,
            updated_at: new Date().toISOString()
          })
          .eq('id', donor.id);

        if (donorError) throw donorError;
      }

      // Update donor profile
      const profileUpdates = {};
      if (updates.bio !== undefined) profileUpdates.bio = updates.bio;
      if (updates.interests) profileUpdates.interests = updates.interests;
      if (updates.donation_preferences) profileUpdates.donation_preferences = updates.donation_preferences;
      if (updates.notification_preferences) profileUpdates.notification_preferences = updates.notification_preferences;

      if (Object.keys(profileUpdates).length > 0) {
        profileUpdates.updated_at = new Date().toISOString();
        
        const { error: profileError } = await supabase
          .from('donor_profiles')
          .update(profileUpdates)
          .eq('donor_id', donor.id);

        if (profileError) throw profileError;
      }

      await checkDonor();
      return { error: null };
    } catch (error) {
      setError(error.message);
      return { error };
    }
  };

  const value = {
    donor,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    checkDonor
  };

  return (
    <DonorAuthContext.Provider value={value}>
      {children}
    </DonorAuthContext.Provider>
  );
};