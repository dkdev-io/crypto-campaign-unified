import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, User, Building2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Spinner } from '../ui/spinner';
import RealWorkingInvites from '../team/RealWorkingInvites';
import CampaignBreadcrumb from '../campaigns/CampaignBreadcrumb';

// Auth Navigation Component matching home page
const CampaignAuthNav = () => {
  const navigate = useNavigate();

  return (
    <div>
      <header className="sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:backdrop-blur-sm relative" style={{backgroundColor: 'hsl(var(--crypto-navy))'}}>
        {/* Corner Brackets */}
        <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-black"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-black"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-black"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-black"></div>
        
        <div className="container flex h-16 items-center px-4 md:px-6">
          <div className="flex flex-1 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/">
                <span className="text-2xl font-bold">
                  <span className="text-white">NEXT</span>
                  <span className="text-accent">RAISE</span>
                </span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <a 
                href="#features" 
                className="text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                FEATURES
              </a>
              <a 
                href="#how-it-works" 
                className="text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                HOW IT WORKS
              </a>
              <a 
                href="#pricing" 
                className="text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                PRICING
              </a>
              <a 
                href="#contact" 
                className="text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                CONTACT
              </a>
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button 
                size="sm"
                className="bg-accent text-accent-foreground hover:bg-accent/90"
                style={{backgroundColor: 'hsl(var(--crypto-gold))', color: 'hsl(var(--crypto-navy))'}}
                onClick={() => navigate('/campaigns/auth')}
              >
                Campaigns
              </Button>
              <Button 
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                style={{backgroundColor: 'hsl(var(--crypto-navy))', color: 'white'}}
                onClick={() => navigate('/donors/auth')}
              >
                Donors
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 hover:bg-accent/10 rounded-md">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      <CampaignBreadcrumb />
    </div>
  );
};

// Contact information form  
const ContactForm = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    company: '',
    job_title: '',
    address: '',
    city: '',
    state: '',
    zip: ''
  });
  const [loading, setLoading] = useState(false);
  const { updateProfile } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await updateProfile(formData);
      if (error) {
        alert('Error: ' + error.message);
      } else {
        onComplete();
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto">
      <div className="bg-card rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Complete Your Profile
          </h2>
          <p className="text-muted-foreground">
            Please provide additional information to continue
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
            <Input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Enter your full name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Enter your phone number"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Company</label>
            <Input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="Enter your company"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Job Title</label>
            <Input
              type="text"
              value={formData.job_title}
              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              placeholder="Enter your job title"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

// Main auth component with proper toggle
const AuthForm = ({ onSuccess }) => {
  const { signUp, signIn, resetPassword, error, clearError } = useAuth();
  const [activeTab, setActiveTab] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');

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
    confirmPassword: ''
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
    const { name, value } = e.target;
    setSignUpData(prev => ({
      ...prev,
      [name]: value
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
    try {
      const { error } = await signIn(signInData.email, signInData.password);

      if (error) {
        throw error;
      }

      // Successful login - redirect to campaign setup
      window.location.href = '/setup';
    } catch (error) {
      console.error('Login error:', error);
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
      const { error } = await signUp(signUpData.email, signUpData.password, signUpData.fullName);

      if (error) {
        throw error;
      }

      // Show success message instead of alert
      setValidationErrors({});
      setResetMessage('Account created! Check your email for verification link, then you can sign in.');
      
      // Switch to sign in tab after a moment
      setTimeout(() => {
        setActiveTab('signin');
        setSignInData({ email: signUpData.email, password: '' });
        setResetMessage('');
      }, 3000);
    } catch (error) {
      console.error('Registration error:', error);
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

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetMessage('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const { error } = await resetPassword(resetEmail);
      if (error) {
        setResetMessage(error.message);
      } else {
        setResetMessage('Password reset email sent! Check your inbox and follow the instructions.');
        setResetEmail('');
      }
    } catch (error) {
      setResetMessage('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto">
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
            <div className="flex-1">
              <span className="text-sm text-destructive">
                {error.message || 'An error occurred. Please try again.'}
              </span>
              {error.type === 'wrong_password' && (
                <button
                  type="button"
                  onClick={() => {
                    setShowResetForm(true);
                    setResetEmail(signInData.email);
                    clearError();
                  }}
                  className="block mt-2 text-xs text-primary hover:underline"
                >
                  Reset password
                </button>
              )}
              {error.type === 'user_not_found' && (
                <div className="mt-2">
                  <span className="block text-xs text-muted-foreground">
                    Don't have an account?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('signup');
                      setSignUpData({ ...signUpData, email: signInData.email });
                      clearError();
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    Create one here
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Password Reset Form */}
        {showResetForm && (
          <div className="mb-6 p-4 bg-muted/50 border border-muted/20 rounded-lg">
            <h3 className="text-sm font-medium text-foreground mb-3">Reset Password</h3>
            <form onSubmit={handlePasswordReset} className="space-y-3">
              <Input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Enter your email"
                className="text-sm"
              />
              {resetMessage && (
                <p className={`text-xs ${resetMessage.includes('sent') ? 'text-green-600' : 'text-destructive'}`}>
                  {resetMessage}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={loading}
                  size="sm"
                  className="flex-1"
                >
                  {loading ? 'Sending...' : 'Send Reset Email'}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowResetForm(false);
                    setResetMessage('');
                    setResetEmail('');
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </form>
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

            {/* Forgot Password Link */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setShowResetForm(true);
                  setResetEmail(signInData.email);
                }}
                className="text-sm text-primary hover:underline"
              >
                Forgot your password?
              </button>
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
  );
};

// Simple auth component - main content
const SimpleAuthContent = () => {
  const { user, userProfile, loading, isEmailVerified, handleEmailVerification } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [showInvites, setShowInvites] = useState(false);
  const [emailVerificationMessage, setEmailVerificationMessage] = useState('');

  // Check for email verification callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('verified') === 'true') {
      setEmailVerificationMessage('Email verified successfully! You can now proceed to campaign setup.');
      if (user) {
        handleEmailVerification();
        setTimeout(() => {
          window.location.href = '/setup';
        }, 2000);
      }
    }
  }, [user, handleEmailVerification]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen" style={{backgroundColor: 'hsl(var(--crypto-navy))'}}>
        <CampaignAuthNav />
        <div className="flex items-center justify-center px-4 py-12">
          <div className="text-center">
            <Spinner size="lg" />
            <p className="mt-4 text-primary-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show email verification message
  if (emailVerificationMessage) {
    return (
      <div className="min-h-screen" style={{backgroundColor: 'hsl(var(--crypto-navy))'}}>
        <CampaignAuthNav />
        <div className="flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full">
            <div className="bg-card rounded-2xl shadow-2xl p-8 text-center">
              <h2 className="text-3xl font-bold text-foreground mb-4">✅ Verification Complete</h2>
              <p className="text-muted-foreground mb-4">{emailVerificationMessage}</p>
              <p className="text-sm text-muted-foreground">Redirecting to campaign setup...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated
  if (user) {
    // Check if email is verified
    if (!isEmailVerified()) {
      return (
        <div className="min-h-screen" style={{backgroundColor: 'hsl(var(--crypto-navy))'}}>
          <CampaignAuthNav />
          <div className="flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full">
              <div className="bg-card rounded-2xl shadow-2xl p-8 text-center">
                <h2 className="text-3xl font-bold text-foreground mb-4">📧 Verify Your Email</h2>
                <p className="text-muted-foreground mb-4">
                  We sent a verification link to <strong>{user.email}</strong>
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Please check your email and click the verification link to continue with campaign setup.
                </p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  I've Verified My Email
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Email is verified, check if profile is complete
    if (showInvites || (userProfile?.full_name && userProfile?.phone)) {
      return (
        <div className="min-h-screen" style={{backgroundColor: 'hsl(var(--crypto-navy))'}}>
          <CampaignAuthNav />
          <div className="flex items-center justify-center px-4 py-12">
            <div className="max-w-4xl w-full">
              <RealWorkingInvites campaignId="default-campaign" />
            </div>
          </div>
        </div>
      );
    }

    // Show profile completion form
    return (
      <div className="min-h-screen" style={{backgroundColor: 'hsl(var(--crypto-navy))'}}>
        <CampaignAuthNav />
        <div className="flex items-center justify-center px-4 py-12">
          <ContactForm onComplete={() => setShowInvites(true)} />
        </div>
      </div>
    );
  }

  // User not authenticated - show login/signup
  return (
    <div className="min-h-screen" style={{backgroundColor: 'hsl(var(--crypto-navy))'}}>
      <CampaignAuthNav />
      <div className="flex items-center justify-center px-4 py-12">
        <AuthForm onSuccess={() => {}} />
      </div>
    </div>
  );
};

// Main component with auth provider
const SimpleAuth = () => {
  return (
    <AuthProvider>
      <SimpleAuthContent />
    </AuthProvider>
  );
};

export default SimpleAuth;