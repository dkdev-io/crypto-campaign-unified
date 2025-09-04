import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Spinner } from '../ui/spinner';

const AuthLogin = ({ onSuccess, onSwitchToSignUp }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const from = location.state?.from?.pathname || '/setup';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [verificationChecked, setVerificationChecked] = useState(false);

  const { signIn, handleEmailVerification } = useAuth();

  // Check for email verification on mount
  useEffect(() => {
    const checkVerification = async () => {
      if (searchParams.get('verified') === 'true' && !verificationChecked) {
        setVerificationChecked(true);
        const { verified } = await handleEmailVerification();
        if (verified) {
          setSuccess('Email verified successfully! You can now log in.');
        }
      }
    };
    checkVerification();
  }, [searchParams, verificationChecked, handleEmailVerification]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrors({});
    setSuccess('');

    try {
      const { data, error } = await signIn(formData.email, formData.password);

      if (error) {
        // Handle specific error messages with user-friendly responses
        if (
          error.message.includes('Invalid login credentials') ||
          error.message.includes('Invalid password') ||
          error.message.includes('User not found') ||
          error.type === 'user_not_found'
        ) {
          setErrors({
            submit: 'No account found with this email address',
            type: 'user_not_found',
            email: formData.email,
          });
        } else if (error.type === 'wrong_password') {
          setErrors({ submit: 'Incorrect password. Please try again or reset your password.' });
        } else if (error.message.includes('Email not confirmed')) {
          setErrors({
            submit: 'Please check your email and click the verification link before logging in.',
          });
        } else if (
          error.message.includes('Network request failed') ||
          error.message.includes('Failed to fetch')
        ) {
          setErrors({
            submit: 'Connection failed. Please check your internet connection and try again.',
          });
        } else if (error.message.includes('Too many requests')) {
          setErrors({ submit: 'Too many login attempts. Please wait a moment and try again.' });
        } else {
          setErrors({ submit: 'An unexpected error occurred. Please try again.' });
        }
        return;
      }

      // Check if user is verified
      if (data.user && !data.user.email_confirmed_at) {
        setErrors({
          submit:
            'Please verify your email before logging in. Check your inbox for the verification link.',
        });
        return;
      }

      // Success - the AuthContext will handle the state update
      if (onSuccess) {
        onSuccess(data);
      } else {
        // Navigate to the protected page they were trying to access
        navigate(from, { replace: true });
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Welcome Back</h2>
          <p className="mt-2 text-base text-muted-foreground">
            Sign in to your campaign management account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-base font-medium mb-2">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={errors.email ? 'border-destructive' : ''}
                placeholder="Enter your email address"
                required
                autoComplete="email"
              />
              {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-base font-medium mb-2">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={errors.password ? 'border-destructive' : ''}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-destructive">{errors.password}</p>
              )}
            </div>
          </div>

          {errors.submit && (
            <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
              {errors.submit}
              {errors.type === 'user_not_found' && (
                <div className="mt-3 p-2 bg-background rounded border">
                  <p className="text-base text-muted-foreground mb-2">
                    Would you like to create an account with <strong>{errors.email}</strong>?
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSwitchToSignUp(errors.email)}
                    className="w-full"
                  >
                    Create New Account
                  </Button>
                </div>
              )}
            </div>
          )}

          {success && (
            <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md">
              {success}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className="text-center text-base">
          <p className="text-muted-foreground">
            Don't have an account?{' '}
            <button className="font-medium text-primary hover:underline" onClick={onSwitchToSignUp}>
              Sign Up
            </button>
          </p>
        </div>

        <div className="text-center">
          <button
            className="text-sm font-medium text-primary hover:underline"
            onClick={() => {
              if (window.onShowPasswordReset) {
                window.onShowPasswordReset();
              } else {
                // Fallback navigation
                window.location.href = '/auth?mode=reset';
              }
            }}
          >
            Forgot your password?
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthLogin;
