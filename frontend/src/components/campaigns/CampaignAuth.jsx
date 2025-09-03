import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, User, Building2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Spinner } from '../ui/spinner';
import CampaignAuthNav from './CampaignAuthNav';

const CampaignAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, error, clearError } = useAuth();
  const [activeTab, setActiveTab] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // If on setup flow, redirect back to setup after auth, otherwise go to homepage
  const from = location.state?.from?.pathname || 
               (location.pathname.includes('/campaigns/auth/setup') ? '/campaigns/auth/setup' : '/');

  // Sign In Form Data
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  // Sign Up Form Data
  const [signUpData, setSignUpData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });

  const [validationErrors, setValidationErrors] = useState({});

  const handleSignInChange = (e) => {
    const { name, value } = e.target;
    setSignInData(prev => ({
      ...prev,
      [name]: value
    }));
    clearFieldError(name);
  };

  const handleSignUpChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSignUpData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    clearFieldError(name);
  };

  const clearFieldError = (fieldName) => {
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
    // Also clear global auth error when user starts typing
    if (error) {
      clearError();
    }
  };

  const validateSignIn = () => {
    const errors = {};

    if (!signInData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(signInData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!signInData.password) {
      errors.password = 'Password is required';
    }

    return errors;
  };

  const validateSignUp = () => {
    const errors = {};

    if (!signUpData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }

    if (!signUpData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(signUpData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!signUpData.password) {
      errors.password = 'Password is required';
    } else if (signUpData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!signUpData.agreeToTerms) {
      errors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    return errors;
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    
    const errors = validateSignIn();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    setValidationErrors({});
    
    try {
      const { error } = await signIn(signInData.email, signInData.password);

      if (error) {
        throw error;
      }

      // Redirect to setup wizard after successful login
      navigate('/campaigns/auth/setup', { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      setValidationErrors({ 
        submit: error.message || 'Login failed. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    const errors = validateSignUp();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    try {
      // Clear any previous auth context errors before signup
      if (error) {
        clearError();
      }
      
      const { error: signupError } = await signUp(signUpData.email, signUpData.password, signUpData.fullName);

      if (signupError) {
        throw signupError;
      }

      // Clear all previous errors and show success message
      setValidationErrors({ 
        submit: 'Account created! Please check your email and click the verification link to continue.' 
      });
    } catch (error) {
      console.error('Registration error:', error);
      
      // Provide helpful message for existing account
      let errorMessage = error.message || 'An error occurred during registration. Please try again.';
      if (error.message && error.message.includes('already registered')) {
        errorMessage = 'This email already has an account. Please try signing in instead, or use the "Forgot Password" link if you need to reset your password.';
      }
      
      setValidationErrors({ 
        submit: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80">
      <CampaignAuthNav />
      <div className="flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-card rounded-2xl shadow-2xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Campaigns
              </h2>
              <p className="text-muted-foreground">
                Sign in to your account or create a new one
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex mb-8">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signin');
                  setValidationErrors({});
                  if (error) clearError();
                }}
                className={`flex-1 py-3 px-4 text-sm font-medium rounded-l-lg transition-colors ${
                  activeTab === 'signin'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signup');
                  setValidationErrors({});
                  if (error) clearError();
                }}
                className={`flex-1 py-3 px-4 text-sm font-medium rounded-r-lg transition-colors ${
                  activeTab === 'signup'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive">
                  {error.message || 'An error occurred. Please try again.'}
                </span>
              </div>
            )}

            {/* Success/Validation Messages */}
            {validationErrors.submit && (
              <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
                validationErrors.submit.includes('Account created') 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-destructive/10 border border-destructive/20'
              }`}>
                <AlertCircle className={`w-4 h-4 ${
                  validationErrors.submit.includes('Account created') 
                    ? 'text-green-600' 
                    : 'text-destructive'
                }`} />
                <span className={`text-sm ${
                  validationErrors.submit.includes('Account created') 
                    ? 'text-green-700' 
                    : 'text-destructive'
                }`}>
                  {validationErrors.submit}
                </span>
              </div>
            )}

            {/* Sign In Tab */}
            {activeTab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-6">
                <div>
                  <label htmlFor="signin-email" className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      value={signInData.email}
                      onChange={handleSignInChange}
                      className={`pl-10 ${validationErrors.email ? 'border-destructive' : ''}`}
                      placeholder="Enter your email"
                    />
                  </div>
                  {validationErrors.email && (
                    <p className="mt-1 text-xs text-destructive">{validationErrors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="signin-password" className="block text-sm font-medium text-foreground mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signin-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={signInData.password}
                      onChange={handleSignInChange}
                      className={`pl-10 pr-10 ${validationErrors.password ? 'border-destructive' : ''}`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <p className="mt-1 text-xs text-destructive">{validationErrors.password}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>

                <div className="text-center">
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot your password?
                  </Link>
                </div>
              </form>
            )}

            {/* Sign Up Tab */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-6">
                <div>
                  <label htmlFor="signup-fullname" className="block text-sm font-medium text-foreground mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-fullname"
                      name="fullName"
                      type="text"
                      value={signUpData.fullName}
                      onChange={handleSignUpChange}
                      className={`pl-10 ${validationErrors.fullName ? 'border-destructive' : ''}`}
                      placeholder="Enter your full name"
                    />
                  </div>
                  {validationErrors.fullName && (
                    <p className="mt-1 text-xs text-destructive">{validationErrors.fullName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="signup-email" className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      value={signUpData.email}
                      onChange={handleSignUpChange}
                      className={`pl-10 ${validationErrors.email ? 'border-destructive' : ''}`}
                      placeholder="Enter your email"
                    />
                  </div>
                  {validationErrors.email && (
                    <p className="mt-1 text-xs text-destructive">{validationErrors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="signup-password" className="block text-sm font-medium text-foreground mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={signUpData.password}
                      onChange={handleSignUpChange}
                      className={`pl-10 pr-10 ${validationErrors.password ? 'border-destructive' : ''}`}
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <p className="mt-1 text-xs text-destructive">{validationErrors.password}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="signup-confirmpassword" className="block text-sm font-medium text-foreground mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-confirmpassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={signUpData.confirmPassword}
                      onChange={handleSignUpChange}
                      className={`pl-10 pr-10 ${validationErrors.confirmPassword ? 'border-destructive' : ''}`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {validationErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-destructive">{validationErrors.confirmPassword}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={signUpData.agreeToTerms}
                      onChange={handleSignUpChange}
                      className="mt-1 w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                    />
                    <span className="text-sm text-muted-foreground">
                      I agree to the{' '}
                      <Link to="/campaigns/auth/terms" className="text-primary hover:underline">
                        Terms of Service
                      </Link>
                      {' '}and{' '}
                      <Link to="/campaigns/auth/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                  {validationErrors.agreeToTerms && (
                    <p className="mt-1 text-xs text-destructive">{validationErrors.agreeToTerms}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignAuth;