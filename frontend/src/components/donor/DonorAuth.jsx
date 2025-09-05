import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDonorAuth } from '../../contexts/DonorAuthContext';
import { Mail, Lock, User, Phone, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Spinner } from '../ui/spinner';
import DonorAuthNav from './DonorAuthNav';
import { extractCampaignStyles, generateCSSProperties, getCampaignButtonStyles } from '../../utils/styleGuide';

const DonorAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, error, donor, loading } = useDonorAuth();
  const [campaignStyles, setCampaignStyles] = useState(null);
  const [cssProperties, setCssProperties] = useState({});

  // Only redirect if user is genuinely authenticated (not just bypass enabled)
  React.useEffect(() => {
    // Check if bypass is enabled
    const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === 'true';
    const IS_DEVELOPMENT = import.meta.env.DEV || import.meta.env.NODE_ENV === 'development';
    const bypassEnabled = SKIP_AUTH && IS_DEVELOPMENT;
    
    // Only redirect if we're actually on the auth page and user is authenticated
    // BUT NOT if we're just here because bypass is enabled - let them see the auth page
    if (!loading && donor && (location.pathname === '/donors/auth' || location.pathname === '/donors/auth/login' || location.pathname === '/donors/auth/register')) {
      
      // Don't auto-redirect if bypass is enabled - let user choose to use bypass button
      if (bypassEnabled) {
        console.log('🚨 DONOR AUTH - Bypass enabled, showing auth page with bypass option');
        return;
      }
      
      // For real authentication, do redirect
      const searchParams = new URLSearchParams(location.search);
      const bypassParam = searchParams.get('bypass');
      
      let redirectTo = location.state?.from?.pathname || '/donors/dashboard';
      
      // Add bypass parameter if it exists
      if (bypassParam === 'true') {
        redirectTo += '?bypass=true';
      }
      
      console.log('🚨 DONOR AUTH - Redirecting authenticated user to:', redirectTo);
      navigate(redirectTo, { replace: true });
    }
  }, [donor, loading, navigate, location.state?.from?.pathname, location.search, location.pathname]);

  // Set initial tab based on route - MUST be called before any early returns
  const getInitialTab = () => {
    if (location.pathname.includes('/register')) return 'signup';
    if (location.pathname.includes('/login')) return 'signin';
    return 'signin'; // default
  };

  // ALL useState hooks MUST be called before any early returns
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Sign In Form Data
  const [signInData, setSignInData] = useState({
    email: '',
    password: '',
  });

  // Sign Up Form Data
  const [signUpData, setSignUpData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  const [validationErrors, setValidationErrors] = useState({});

  // Load campaign styles
  useEffect(() => {
    const loadCampaignStyles = async () => {
      try {
        // Check if there's a campaign ID in the URL or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const campaignId = urlParams.get('campaignId') || localStorage.getItem('currentCampaignId');
        
        if (campaignId) {
          // Fetch campaign data from Supabase
          const response = await fetch(`/api/campaigns/${campaignId}`);
          if (response.ok) {
            const campaignData = await response.json();
            const styles = extractCampaignStyles(campaignData);
            const cssProps = generateCSSProperties(campaignData);
            
            setCampaignStyles(styles);
            setCssProperties(cssProps);
            
            console.log('🎨 Applied campaign styles to DonorAuth:', {
              campaignId,
              primaryColor: styles.colors.primary,
              headingFont: styles.fonts.heading.family
            });
          }
        }
      } catch (error) {
        console.warn('Could not load campaign styles, using defaults:', error);
      }
    };

    loadCampaignStyles();
  }, []);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'hsl(var(--crypto-navy))' }}
      >
        <div className="text-center text-white">
          <Spinner size="lg" className="mb-4" />
          <p>Loading donor authentication...</p>
        </div>
      </div>
    );
  }

  const from = location.state?.from?.pathname || '/donors/dashboard';

  const handleSignInChange = (e) => {
    const { name, value } = e.target;
    setSignInData((prev) => ({
      ...prev,
      [name]: value,
    }));
    clearError(name);
  };

  const handleSignUpChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSignUpData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    clearError(name);
  };

  const clearError = (fieldName) => {
    if (validationErrors[fieldName]) {
      setValidationErrors((prev) => ({
        ...prev,
        [fieldName]: '',
      }));
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

    setSubmitting(true);
    try {
      const { error } = await signIn({
        email: signInData.email,
        password: signInData.password,
      });

      if (error) {
        throw error;
      }

      navigate(from, { replace: true });
    } catch (error) {
      // Login error occurred
      setValidationErrors({
        submit: error.message || 'Login failed. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    const errors = validateSignUp();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await signUp({
        email: signUpData.email,
        password: signUpData.password,
        fullName: signUpData.fullName,
        phone: signUpData.phone,
        donorType: 'individual',
      });

      if (error) {
        throw error;
      }

      navigate('/donors/auth/verify-email', {
        state: { email: signUpData.email },
      });
    } catch (error) {
      // Registration error occurred
      setValidationErrors({
        submit: error.message || 'Registration failed. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Generate dynamic styles based on campaign theme
  const containerStyle = {
    background: campaignStyles ? 
      `linear-gradient(135deg, ${campaignStyles.colors.primary} 0%, ${campaignStyles.colors.secondary} 100%)` : 
      'var(--gradient-hero)',
    ...cssProperties
  };

  const cardStyle = {
    backgroundColor: campaignStyles?.colors.background || 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    color: campaignStyles?.colors.text || 'inherit',
    fontFamily: campaignStyles?.fonts.body.family || 'Inter, system-ui, sans-serif'
  };

  const headingStyle = {
    color: campaignStyles?.colors.primary || 'var(--foreground)',
    fontFamily: campaignStyles?.fonts.heading.family || 'Inter, system-ui, sans-serif',
    fontSize: campaignStyles?.fonts.heading.size || 'var(--text-heading-xl)',
    fontWeight: campaignStyles?.fonts.heading.weight || '700'
  };

  const buttonPrimaryStyle = campaignStyles ? 
    getCampaignButtonStyles(campaignStyles, 'primary') : 
    {};

  return (
    <div className="donor-auth min-h-screen" style={containerStyle}>
      <DonorAuthNav />
      <div className="flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div
            className="rounded-2xl shadow-2xl p-8"
            style={{
              ...cardStyle,
              borderRadius: campaignStyles?.layout.borderRadius || '1rem'
            }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h1
                className="font-bold mb-2"
                style={headingStyle}
              >
                Donor Portal
              </h1>
              <p style={{
                color: campaignStyles?.colors.secondary || 'var(--muted-foreground)',
                fontFamily: campaignStyles?.fonts.body.family || 'Inter, system-ui, sans-serif'
              }}>Sign in to your account or create a new one</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex mb-8">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signin');
                  setValidationErrors({});
                }}
                className="flex-1 py-3 px-4 text-base font-medium rounded-l-lg transition-colors"
                style={{
                  backgroundColor: activeTab === 'signin' ? 
                    (campaignStyles?.colors.primary || 'var(--primary)') : 
                    (campaignStyles?.colors.background || 'var(--muted)'),
                  color: activeTab === 'signin' ? 
                    (campaignStyles?.colors.background || 'var(--primary-foreground)') : 
                    (campaignStyles?.colors.secondary || 'var(--muted-foreground)'),
                  fontFamily: campaignStyles?.fonts.button.family || 'Inter, system-ui, sans-serif',
                  borderRadius: `${campaignStyles?.layout.borderRadius || '0.5rem'} 0 0 ${campaignStyles?.layout.borderRadius || '0.5rem'}`
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signup');
                  setValidationErrors({});
                }}
                className="flex-1 py-3 px-4 text-base font-medium rounded-r-lg transition-colors"
                style={{
                  backgroundColor: activeTab === 'signup' ? 
                    (campaignStyles?.colors.primary || 'var(--primary)') : 
                    (campaignStyles?.colors.background || 'var(--muted)'),
                  color: activeTab === 'signup' ? 
                    (campaignStyles?.colors.background || 'var(--primary-foreground)') : 
                    (campaignStyles?.colors.secondary || 'var(--muted-foreground)'),
                  fontFamily: campaignStyles?.fonts.button.family || 'Inter, system-ui, sans-serif',
                  borderRadius: `0 ${campaignStyles?.layout.borderRadius || '0.5rem'} ${campaignStyles?.layout.borderRadius || '0.5rem'} 0`
                }}
              >
                Sign Up
              </button>
            </div>

            {/* Error Display */}
            {(error || validationErrors.submit) && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-base text-destructive">
                  {validationErrors.submit ||
                    error?.message ||
                    'An error occurred. Please try again.'}
                </span>
              </div>
            )}

            {/* Sign In Tab */}
            {activeTab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-6">
                <div>
                  <label
                    htmlFor="signin-email"
                    className="block text-base font-medium text-foreground mb-2"
                  >
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
                    <p className="mt-1 text-sm text-destructive">{validationErrors.email}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="signin-password"
                    className="block text-base font-medium text-foreground mb-2"
                  >
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
                    <p className="mt-1 text-sm text-destructive">{validationErrors.password}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  disabled={submitting} 
                  className="w-full"
                  style={{
                    ...buttonPrimaryStyle,
                    fontFamily: campaignStyles?.fonts.button.family || 'Inter, system-ui, sans-serif',
                    borderRadius: campaignStyles?.layout.borderRadius || '0.5rem'
                  }}
                >
                  {submitting ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>

                <div className="text-center">
                  <Link 
                    to="/forgot-password" 
                    className="text-base hover:underline"
                    style={{
                      color: campaignStyles?.colors.primary || 'var(--primary)',
                      fontFamily: campaignStyles?.fonts.body.family || 'Inter, system-ui, sans-serif'
                    }}
                  >
                    Forgot your password?
                  </Link>
                </div>
              </form>
            )}

            {/* Sign Up Tab */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-6">
                <div>
                  <label
                    htmlFor="signup-fullname"
                    className="block text-base font-medium text-foreground mb-2"
                  >
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
                    <p className="mt-1 text-sm text-destructive">{validationErrors.fullName}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="signup-email"
                    className="block text-base font-medium text-foreground mb-2"
                  >
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
                    <p className="mt-1 text-sm text-destructive">{validationErrors.email}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="signup-phone"
                    className="block text-base font-medium text-foreground mb-2"
                  >
                    Phone Number <span className="text-muted-foreground">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-phone"
                      name="phone"
                      type="tel"
                      value={signUpData.phone}
                      onChange={handleSignUpChange}
                      className="pl-10"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="signup-password"
                    className="block text-base font-medium text-foreground mb-2"
                  >
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
                    <p className="mt-1 text-sm text-destructive">{validationErrors.password}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="signup-confirmpassword"
                    className="block text-base font-medium text-foreground mb-2"
                  >
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
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {validationErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-destructive">
                      {validationErrors.confirmPassword}
                    </p>
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
                    <span 
                      className="text-base"
                      style={{
                        color: campaignStyles?.colors.secondary || 'var(--muted-foreground)',
                        fontFamily: campaignStyles?.fonts.body.family || 'Inter, system-ui, sans-serif'
                      }}
                    >
                      I agree to the{' '}
                      <Link 
                        to="/donors/auth/terms" 
                        className="hover:underline"
                        style={{
                          color: campaignStyles?.colors.primary || 'var(--primary)',
                          fontFamily: campaignStyles?.fonts.body.family || 'Inter, system-ui, sans-serif'
                        }}
                      >
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link 
                        to="/donors/auth/privacy" 
                        className="hover:underline"
                        style={{
                          color: campaignStyles?.colors.primary || 'var(--primary)',
                          fontFamily: campaignStyles?.fonts.body.family || 'Inter, system-ui, sans-serif'
                        }}
                      >
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                  {validationErrors.agreeToTerms && (
                    <p className="mt-1 text-sm text-destructive">{validationErrors.agreeToTerms}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  disabled={submitting} 
                  className="w-full"
                  style={{
                    ...buttonPrimaryStyle,
                    fontFamily: campaignStyles?.fonts.button.family || 'Inter, system-ui, sans-serif',
                    borderRadius: campaignStyles?.layout.borderRadius || '0.5rem'
                  }}
                >
                  {submitting ? (
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
            
            {/* Development Bypass Button - OUTSIDE forms */}
            {(import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname.includes('netlify.app')) && (
              <div className="mt-4">
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🚨 DEV BYPASS: Button clicked!');
                    console.log('Current location:', window.location.href);
                    console.log('About to navigate to: /donors/dashboard?bypass=true');
                    
                    // Use direct window navigation for reliability
                    window.location.href = '/donors/dashboard?bypass=true';
                  }}
                  className="w-full mt-2 bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  DEV BYPASS → Dashboard
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorAuth;
