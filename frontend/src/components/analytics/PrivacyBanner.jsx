import React, { useState, useEffect } from 'react';
import { useAnalytics } from './AnalyticsProvider';

const PrivacyBanner = ({ 
  position = 'bottom',
  theme = 'dark',
  showLearnMore = true,
  autoHide = true,
  customMessage,
  onConsentChange
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { setConsentStatus, getStatus } = useAnalytics();

  useEffect(() => {
    checkBannerVisibility();
  }, []);

  const checkBannerVisibility = () => {
    const status = getStatus();
    const consent = localStorage.getItem('analytics_consent');
    const consentTime = localStorage.getItem('analytics_consent_time');
    
    // Show banner if no consent decision has been made
    if (!consent) {
      setIsVisible(true);
      return;
    }

    // Show banner if consent is older than 1 year (re-consent)
    if (consentTime) {
      const consentAge = Date.now() - parseInt(consentTime);
      if (consentAge > 365 * 24 * 60 * 60 * 1000) {
        setIsVisible(true);
        return;
      }
    }

    // Hide banner if consent is already given and valid
    setIsVisible(false);
  };

  const handleAccept = () => {
    setConsentStatus(true);
    setIsVisible(false);
    onConsentChange?.(true);
  };

  const handleDecline = () => {
    setConsentStatus(false);
    setIsVisible(false);
    onConsentChange?.(false);
  };

  const handleLearnMore = () => {
    setShowDetails(!showDetails);
  };

  const themeClasses = {
    dark: 'bg-gray-800 text-white',
    light: 'bg-[#1e40af] text-white border border-[#3b82f6]/30',
    blue: 'bg-blue-900 text-white',
    transparent: 'bg-black bg-opacity-80 text-white backdrop-blur-sm'
  };

  const positionClasses = {
    top: 'top-4',
    bottom: 'bottom-4',
    'bottom-left': 'bottom-4 left-4 right-auto max-w-md',
    'bottom-right': 'bottom-4 right-4 left-auto max-w-md'
  };

  if (!isVisible) return null;

  return (
    <>
      <div 
        className={`
          fixed z-50 px-4 sm:px-6 lg:px-8 
          ${positionClasses[position] || 'bottom-4'} 
          ${position.includes('left') || position.includes('right') ? '' : 'left-4 right-4'}
        `}
        role="dialog"
        aria-labelledby="privacy-banner-title"
        aria-describedby="privacy-banner-description"
      >
        <div className={`
          ${themeClasses[theme]} 
          rounded-lg shadow-xl p-4 sm:p-6 max-w-4xl mx-auto
          animate-slide-up
        `}>
          
          {/* Main Banner Content */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 mb-4 sm:mb-0 sm:mr-6">
              <h3 id="privacy-banner-title" className="text-lg font-semibold mb-2">
                🍪 Help Us Improve Your Experience
              </h3>
              <p id="privacy-banner-description" className="text-sm opacity-90 leading-relaxed">
                {customMessage || (
                  <>
                    We use privacy-friendly analytics to understand how our contribution 
                    forms are used and improve your experience. We never collect personal 
                    information or track you across other websites.
                  </>
                )}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={handleAccept}
                className="
                  bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md
                  font-medium text-sm transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                "
                aria-label="Accept analytics cookies"
              >
                Accept
              </button>
              
              <button
                onClick={handleDecline}
                className="
                  bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md
                  font-medium text-sm transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                "
                aria-label="Decline analytics cookies"
              >
                Decline
              </button>
              
              {showLearnMore && (
                <button
                  onClick={handleLearnMore}
                  className="
                    border border-gray-400 hover:border-gray-300 px-4 py-2 rounded-md
                    font-medium text-sm transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                  "
                  aria-label="Learn more about our analytics"
                >
                  Learn More
                </button>
              )}
            </div>
          </div>

          {/* Detailed Information */}
          {showDetails && (
            <div className="mt-6 pt-4 border-t border-gray-600 animate-fade-in">
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-semibold mb-3 text-green-400">
                    ✅ What We Collect
                  </h4>
                  <ul className="space-y-1 opacity-90">
                    <li>• Anonymous visitor ID (no personal info)</li>
                    <li>• Page views and time spent</li>
                    <li>• General location (country/city)</li>
                    <li>• Traffic source (how you found us)</li>
                    <li>• Form interactions (success/failure only)</li>
                    <li>• Device type and browser (for optimization)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 text-red-400">
                    ❌ What We Don't Collect
                  </h4>
                  <ul className="space-y-1 opacity-90">
                    <li>• Names, emails, or personal information</li>
                    <li>• Contribution amounts or wallet addresses</li>
                    <li>• Cross-site tracking or fingerprinting</li>
                    <li>• Keystroke logging or form content</li>
                    <li>• Browsing history from other websites</li>
                    <li>• Any identifiable behavioral patterns</li>
                  </ul>
                </div>

                <div className="md:col-span-2">
                  <h4 className="font-semibold mb-3 text-blue-400">
                    🛡️ Your Privacy Rights
                  </h4>
                  <div className="grid sm:grid-cols-3 gap-4 opacity-90">
                    <div>
                      <strong>Opt-out anytime:</strong> Change your mind by clicking "Decline"
                    </div>
                    <div>
                      <strong>Data expiration:</strong> All data automatically deleted after 365 days
                    </div>
                    <div>
                      <strong>No tracking:</strong> Respects Do Not Track browser settings
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-600">
                <div className="flex flex-wrap items-center justify-between text-xs opacity-75">
                  <span>
                    GDPR & CCPA Compliant • No Cross-Site Tracking • Privacy by Design
                  </span>
                  <button 
                    onClick={() => setShowDetails(false)}
                    className="underline hover:no-underline mt-2 sm:mt-0"
                    aria-label="Hide privacy details"
                  >
                    Hide Details
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 500px;
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

// Privacy Settings Modal Component
export const PrivacySettings = ({ isOpen, onClose }) => {
  const [currentConsent, setCurrentConsent] = useState(null);
  const { setConsentStatus, getStatus, clearData } = useAnalytics();

  useEffect(() => {
    if (isOpen) {
      const status = getStatus();
      setCurrentConsent(status?.enabled || false);
    }
  }, [isOpen, getStatus]);

  const handleSave = () => {
    setConsentStatus(currentConsent);
    onClose();
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
      clearData();
      alert('All analytics data has been cleared.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[#1e40af] rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Privacy Settings</h2>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white"
              aria-label="Close privacy settings"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Analytics Tracking</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="consent"
                    checked={currentConsent === true}
                    onChange={() => setCurrentConsent(true)}
                    className="mr-3"
                  />
                  <span>
                    <strong>Enable Analytics</strong> - Help us improve by sharing anonymous usage data
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="consent"
                    checked={currentConsent === false}
                    onChange={() => setCurrentConsent(false)}
                    className="mr-3"
                  />
                  <span>
                    <strong>Disable Analytics</strong> - No tracking or data collection
                  </span>
                </label>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-3">Data Management</h3>
              <p className="text-gray-600 mb-4">
                You have the right to request deletion of your analytics data at any time.
              </p>
              <button
                onClick={handleClearData}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium"
              >
                Clear All My Data
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyBanner;