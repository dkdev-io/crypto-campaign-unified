import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AuthSignUp from './AuthSignUp';
import AuthLogin from './AuthLogin';
import ProfileCompletion from './ProfileCompletion';
import DonorDataSetup from '../data/DonorDataSetup';

const AuthFlow = ({
  onAuthComplete,
  initialMode = 'login',
  requireProfileCompletion = true,
  requireDataSetup = true,
}) => {
  const [mode, setMode] = useState(initialMode);
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [showDataSetup, setShowDataSetup] = useState(false);
  const [prefillEmail, setPrefillEmail] = useState('');

  const { user, userProfile, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      // User is authenticated, check what steps are needed
      if (requireProfileCompletion && needsProfileCompletion()) {
        setShowProfileCompletion(true);
        setShowDataSetup(false);
      } else if (requireDataSetup && needsDataSetup()) {
        setShowProfileCompletion(false);
        setShowDataSetup(true);
      } else {
        // Auth flow complete
        if (onAuthComplete) {
          onAuthComplete({ user, userProfile });
        }
      }
    }
  }, [user, userProfile, loading]);

  const needsProfileCompletion = () => {
    // Check if essential profile fields are missing
    if (!userProfile) return true;

    // You can customize this logic based on what you consider "complete"
    const hasBasicInfo = userProfile.full_name;
    const hasConfirmedEmail = userProfile.email_confirmed;

    return !hasBasicInfo || !hasConfirmedEmail;
  };

  const needsDataSetup = () => {
    // Check if user has completed data setup step
    if (!userProfile) return false;

    // Check if user has any data sources configured
    // This could be expanded to check for actual data uploads
    return !userProfile.data_setup_completed;
  };

  const handleAuthSuccess = (data) => {
    // Authentication successful, check what steps are needed
    if (requireProfileCompletion && needsProfileCompletion()) {
      setShowProfileCompletion(true);
    } else if (requireDataSetup && needsDataSetup()) {
      setShowDataSetup(true);
    } else if (onAuthComplete) {
      onAuthComplete(data);
    }
  };

  const handleProfileComplete = (profileData) => {
    setShowProfileCompletion(false);

    // Check if data setup is needed next
    if (requireDataSetup && needsDataSetup()) {
      setShowDataSetup(true);
    } else if (onAuthComplete) {
      onAuthComplete({ user, userProfile: profileData });
    }
  };

  const handleDataSetupComplete = (setupData) => {
    setShowDataSetup(false);

    // Mark data setup as completed in user profile
    // This would typically be done by updating the user profile
    if (onAuthComplete) {
      onAuthComplete({
        user,
        userProfile,
        dataSetup: setupData,
      });
    }
  };

  const handleDataSetupSkip = () => {
    setShowDataSetup(false);

    if (onAuthComplete) {
      onAuthComplete({
        user,
        userProfile,
        dataSetup: { skipped: true },
      });
    }
  };

  // Don't render anything while loading
  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated and profile completion is required
  if (user && showProfileCompletion) {
    return <ProfileCompletion onComplete={handleProfileComplete} />;
  }

  // If user is authenticated and data setup is required
  if (user && showDataSetup) {
    return <DonorDataSetup onComplete={handleDataSetupComplete} onSkip={handleDataSetupSkip} />;
  }

  // If user is already authenticated and no additional steps needed
  if (user && !showProfileCompletion && !showDataSetup) {
    return null; // Let the parent component handle the authenticated state
  }

  // Show authentication forms
  return (
    <div className="auth-flow">
      {mode === 'login' ? (
        <AuthLogin
          onSuccess={handleAuthSuccess}
          onSwitchToSignUp={(email) => {
            if (email) setPrefillEmail(email);
            setMode('signup');
          }}
        />
      ) : (
        <AuthSignUp
          onSuccess={handleAuthSuccess}
          onSwitchToLogin={() => {
            setPrefillEmail('');
            setMode('login');
          }}
          prefillEmail={prefillEmail}
        />
      )}
    </div>
  );
};

export default AuthFlow;
