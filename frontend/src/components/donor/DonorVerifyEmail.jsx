import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import DonorBreadcrumb from './DonorBreadcrumb';

const DonorVerifyEmail = () => {
  const location = useLocation();
  const email = location.state?.email;
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    // Check for email confirmation token in URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    if (accessToken && type === 'signup') {
      handleEmailVerification();
    }
  }, []);

  const handleEmailVerification = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email_confirmed_at) {
        setVerificationStatus('verified');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('error');
    }
  };

  const resendVerificationEmail = async () => {
    if (!email) return;
    
    setResendLoading(true);
    setResendMessage('');
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/donors/dashboard`
        }
      });

      if (error) throw error;
      
      setResendMessage('Verification email sent! Please check your inbox.');
    } catch (error) {
      console.error('Resend error:', error);
      setResendMessage('Failed to resend email. Please try again later.');
    } finally {
      setResendLoading(false);
    }
  };

  if (verificationStatus === 'verified') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-blue-900">
        <DonorBreadcrumb />
        <div className="flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-navy-900 mb-2">
              Email Verified!
            </h2>
            <p className="text-gray-600 mb-6">
              Your email has been successfully verified. You can now access your donor account.
            </p>
            <Link
              to="/donors/dashboard"
              className="inline-block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-blue-900">
        <DonorBreadcrumb />
        <div className="flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-navy-900 mb-2">
              Verification Failed
            </h2>
            <p className="text-gray-600 mb-6">
              We couldn't verify your email. The link may have expired or is invalid.
            </p>
            <div className="space-y-3">
              <button
                onClick={resendVerificationEmail}
                disabled={resendLoading || !email}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendLoading ? 'Sending...' : 'Resend Verification Email'}
              </button>
              <Link
                to="/donors/auth"
                className="block text-blue-600 hover:underline"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-blue-900">
      <DonorBreadcrumb />
      <div className="flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-navy-900 mb-2">
            Check Your Email
          </h2>
          <p className="text-gray-600 mb-2">
            We've sent a verification email to:
          </p>
          <p className="font-medium text-gray-900 mb-6">
            {email || 'your registered email'}
          </p>
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              Please click the verification link in the email to activate your donor account.
              The link will expire in 24 hours.
            </p>
          </div>

          {resendMessage && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              resendMessage.includes('sent') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {resendMessage}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={resendVerificationEmail}
              disabled={resendLoading || !email}
              className="w-full bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendLoading ? 'Sending...' : "Didn't receive the email? Resend"}
            </button>
            
            <div className="text-sm text-gray-600">
              <p>Already verified?</p>
              <Link to="/donors/auth" className="text-blue-600 hover:underline font-medium">
                Sign in to your account
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              If you're having trouble, please check your spam folder or contact support at{' '}
              <a href="mailto:support@nextraise.com" className="text-blue-600 hover:underline">
                support@nextraise.com
              </a>
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default DonorVerifyEmail;