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
          emailRedirectTo: `${window.location.origin}/donor/verify-email`
        }
      });

      if (error) throw error;

      // Create donor record
      if (data.user) {
        const { error: donorError } = await supabase
          .from('donors')
          .insert({
            id: data.user.id,
            email,
            full_name: fullName,
            phone,
            donor_type: donorType
          });

        if (donorError) throw donorError;

        // Create donor profile
        const { error: profileError } = await supabase
          .from('donor_profiles')
          .insert({
            donor_id: data.user.id
          });

        if (profileError) throw profileError;
      }

      return { data, error: null };
    } catch (error) {
      setError(error.message);
      return { data: null, error };
    }
  };

  const signIn = async ({ email, password }) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

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