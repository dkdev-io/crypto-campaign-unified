import React, { useState, useEffect } from 'react';

/**
 * DonationForm Component
 * 
 * Features:
 * - Referral detection from URL ?ref= parameter
 * - Form fields for donor info and donation amount
 * - Referral attribution display
 * - Transaction simulation with fake hash
 * - Auto-confirmation after 3 seconds
 * - Form validation and error handling
 * - Integration with existing APIs
 */

const DonationForm = ({ 
  campaignId, 
  campaignName = "Political Campaign",
  onSuccess,
  className = ""
}) => {
  // Form state
  const [formData, setFormData] = useState({
    donorName: '',
    email: '',
    walletAddress: '',
    amount: '',
    currency: 'ETH'
  });

  // UI state
  const [referralInfo, setReferralInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submissionState, setSubmissionState] = useState('form'); // 'form', 'processing', 'success', 'error'
  const [transactionData, setTransactionData] = useState(null);
  const [candidates, setCandidates] = useState([]);

  // Available currencies
  const currencies = [
    { code: 'ETH', name: 'Ethereum', min: 0.01 },
    { code: 'BTC', name: 'Bitcoin', min: 0.001 },
    { code: 'USDC', name: 'USD Coin', min: 10 }
  ];

  // Suggested amounts based on currency
  const getSuggestedAmounts = (currency) => {
    switch (currency) {
      case 'ETH':
        return [0.1, 0.25, 0.5, 1.0];
      case 'BTC':
        return [0.01, 0.02, 0.05, 0.1];
      case 'USDC':
        return [25, 50, 100, 250];
      default:
        return [0.1, 0.25, 0.5, 1.0];
    }
  };

  // Parse URL parameters and load candidates on mount
  useEffect(() => {
    const loadInitialData = async () => {
      // Check for referral code in URL
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref');
      
      if (refCode) {
        await validateReferralCode(refCode);
      }

      // Load available candidates/campaigns
      await loadCandidates();
    };

    loadInitialData();
  }, []);

  /**
   * Validate referral code and set referral info
   */
  const validateReferralCode = async (code) => {
    try {
      const response = await fetch(`/api/referrals/validate?code=${encodeURIComponent(code)}`);
      const result = await response.json();

      if (result.success && result.isValid) {
        setReferralInfo({
          code: code,
          referrerName: result.donor.name,
          referrerId: result.donor.id
        });
      } else {
        console.warn('Invalid referral code:', code);
      }
    } catch (error) {
      console.error('Error validating referral code:', error);
    }
  };

  /**
   * Load available candidates/campaigns
   */
  const loadCandidates = async () => {
    try {
      const response = await fetch('/api/referrals/candidates');
      const result = await response.json();

      if (result.success) {
        setCandidates(result.candidates);
      }
    } catch (error) {
      console.error('Error loading candidates:', error);
    }
  };

  /**
   * Handle form field changes
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field-specific errors when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  /**
   * Handle suggested amount selection
   */
  const handleAmountSelect = (amount) => {
    setFormData(prev => ({
      ...prev,
      amount: amount.toString()
    }));

    if (errors.amount) {
      setErrors(prev => ({
        ...prev,
        amount: null
      }));
    }
  };

  /**
   * Validate form data
   */
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.donorName.trim()) {
      newErrors.donorName = 'Donor name is required';
    } else if (formData.donorName.trim().length < 2) {
      newErrors.donorName = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.amount) {
      newErrors.amount = 'Donation amount is required';
    } else {
      const amount = parseFloat(formData.amount);
      const selectedCurrency = currencies.find(c => c.code === formData.currency);
      
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Amount must be greater than 0';
      } else if (selectedCurrency && amount < selectedCurrency.min) {
        newErrors.amount = `Minimum amount is ${selectedCurrency.min} ${formData.currency}`;
      } else if (amount > 10000) { // Reasonable upper limit for demo
        newErrors.amount = 'Amount exceeds maximum limit';
      }
    }

    // Optional wallet validation
    if (formData.walletAddress && formData.walletAddress.trim()) {
      const wallet = formData.walletAddress.trim();
      if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
        newErrors.walletAddress = 'Please enter a valid Ethereum wallet address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Generate fake transaction hash for demo
   */
  const generateFakeTransactionHash = () => {
    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 64; i++) {
      hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return hash;
  };

  /**
   * Simulate blockchain confirmation delay
   */
  const simulateBlockchainConfirmation = async (donationId, transactionHash) => {
    // Wait 3 seconds to simulate blockchain confirmation
    setTimeout(async () => {
      try {
        const response = await fetch(`/api/donations/${donationId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'completed',
            blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
            gasUsed: 21000,
            gasPrice: '20000000000' // 20 gwei
          })
        });

        if (response.ok) {
          const result = await response.json();
          setTransactionData(prev => ({
            ...prev,
            status: 'completed',
            confirmedAt: new Date().toISOString(),
            blockNumber: result.donation.blockNumber
          }));
        }
      } catch (error) {
        console.error('Error updating donation status:', error);
      }
    }, 3000);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setSubmissionState('processing');

    try {
      // Generate fake transaction hash
      const fakeTransactionHash = generateFakeTransactionHash();

      // Determine campaign ID (use provided or first available)
      const targetCampaignId = campaignId || (candidates.length > 0 ? candidates[0].id : null);

      if (!targetCampaignId) {
        throw new Error('No campaign available to donate to');
      }

      // Record donation
      const donationPayload = {
        donorData: {
          email: formData.email.toLowerCase().trim(),
          name: formData.donorName.trim(),
          walletAddress: formData.walletAddress.trim() || null,
          phone: null
        },
        candidateId: targetCampaignId,
        amount: formData.amount,
        transactionHash: fakeTransactionHash,
        referralCode: referralInfo?.code || null,
        network: 'ethereum',
        currency: formData.currency
      };

      const response = await fetch('/api/donations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(donationPayload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to record donation');
      }

      // Set transaction data
      const transactionInfo = {
        id: result.donation.id,
        amount: result.donation.amount,
        currency: formData.currency,
        transactionHash: fakeTransactionHash,
        status: 'pending',
        donorName: formData.donorName,
        campaignName: campaignName,
        referralInfo: referralInfo,
        createdAt: new Date().toISOString()
      };

      setTransactionData(transactionInfo);
      setSubmissionState('success');

      // Simulate blockchain confirmation
      simulateBlockchainConfirmation(result.donation.id, fakeTransactionHash);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(transactionInfo);
      }

    } catch (error) {
      console.error('Error submitting donation:', error);
      setErrors({ submit: error.message });
      setSubmissionState('error');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reset form to try again
   */
  const handleRetry = () => {
    setSubmissionState('form');
    setErrors({});
    setTransactionData(null);
  };

  /**
   * Render form fields
   */
  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Referral Attribution Display */}
      {referralInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Referred by {referralInfo.referrerName}
              </h3>
              <div className="mt-1 text-sm text-blue-600">
                Referral code: <span className="font-mono font-semibold">{referralInfo.code}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Donating to: {campaignName}
        </h3>
        <p className="text-sm text-gray-600">
          Your contribution helps support this political campaign. All donations are recorded on the blockchain for transparency.
        </p>
      </div>

      {/* Donor Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="donorName" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            id="donorName"
            name="donorName"
            value={formData.donorName}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.donorName ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your full name"
          />
          {errors.donorName && (
            <p className="mt-1 text-sm text-red-600">{errors.donorName}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your email address"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>
      </div>

      {/* Wallet Address (Optional) */}
      <div>
        <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700 mb-1">
          Wallet Address (Optional)
        </label>
        <input
          type="text"
          id="walletAddress"
          name="walletAddress"
          value={formData.walletAddress}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
            errors.walletAddress ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
          }`}
          placeholder="0x... (optional, for attribution)"
        />
        {errors.walletAddress && (
          <p className="mt-1 text-sm text-red-600">{errors.walletAddress}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Optional: Provide your wallet address for better donation tracking
        </p>
      </div>

      {/* Currency Selection */}
      <div>
        <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
          Currency *
        </label>
        <select
          id="currency"
          name="currency"
          value={formData.currency}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {currencies.map(currency => (
            <option key={currency.code} value={currency.code}>
              {currency.name} ({currency.code})
            </option>
          ))}
        </select>
      </div>

      {/* Suggested Amounts */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Suggested Amounts
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          {getSuggestedAmounts(formData.currency).map(amount => (
            <button
              key={amount}
              type="button"
              onClick={() => handleAmountSelect(amount)}
              className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                parseFloat(formData.amount) === amount
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {amount} {formData.currency}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Amount */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
          Donation Amount *
        </label>
        <div className="relative">
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            step="0.0001"
            min="0"
            className={`w-full px-3 py-2 pr-16 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.amount ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter amount"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 text-sm">{formData.currency}</span>
          </div>
        </div>
        {errors.amount && (
          <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
        )}
      </div>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin -ml-1 mr-3 h-5 w-5 text-white">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              Processing...
            </div>
          ) : (
            `Donate ${formData.amount} ${formData.currency}`
          )}
        </button>
      </div>

      {/* Error Display */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{errors.submit}</div>
            </div>
          </div>
        </div>
      )}
    </form>
  );

  /**
   * Render success state
   */
  const renderSuccess = () => (
    <div className="text-center">
      {/* Success Icon */}
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Donation Successful!
      </h2>

      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <div className="space-y-3 text-left">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Amount:</span>
            <span className="text-sm font-semibold text-gray-900">
              {transactionData?.amount} {transactionData?.currency}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Campaign:</span>
            <span className="text-sm font-semibold text-gray-900">{transactionData?.campaignName}</span>
          </div>

          {transactionData?.referralInfo && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Referred by:</span>
              <span className="text-sm font-semibold text-gray-900">
                {transactionData.referralInfo.referrerName}
              </span>
            </div>
          )}

          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Transaction Status:</span>
              <span className={`text-sm font-semibold ${
                transactionData?.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {transactionData?.status === 'completed' ? 'Confirmed' : 'Pending...'}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-gray-600">Transaction Hash:</span>
            <span className="text-xs font-mono text-gray-500 break-all ml-2">
              {transactionData?.transactionHash}
            </span>
          </div>

          {transactionData?.blockNumber && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Block Number:</span>
              <span className="text-sm font-semibold text-gray-900">
                {transactionData.blockNumber.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Status */}
      <div className="mb-6">
        {transactionData?.status === 'completed' ? (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Transaction Confirmed</h3>
                <div className="mt-2 text-sm text-green-700">
                  Your donation has been confirmed on the blockchain. Thank you for your contribution!
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="animate-spin h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Confirming Transaction</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  Your transaction is being processed on the blockchain. This usually takes a few seconds.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={() => {
          setSubmissionState('form');
          setFormData({
            donorName: '',
            email: '',
            walletAddress: '',
            amount: '',
            currency: 'ETH'
          });
          setTransactionData(null);
          setErrors({});
        }}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
      >
        Make Another Donation
      </button>
    </div>
  );

  /**
   * Render error state
   */
  const renderError = () => (
    <div className="text-center">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
        <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Donation Failed
      </h2>

      <p className="text-gray-600 mb-6">
        There was an error processing your donation. Please try again.
      </p>

      <button
        onClick={handleRetry}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
      >
        Try Again
      </button>
    </div>
  );

  // Main render
  return (
    <div className={`max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 ${className}`}>
      {submissionState === 'form' && renderForm()}
      {submissionState === 'processing' && (
        <div className="text-center py-12">
          <div className="animate-spin mx-auto h-12 w-12 text-blue-600 mb-4">
            <svg className="animate-spin h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Donation</h2>
          <p className="text-gray-600">Please wait while we process your transaction...</p>
        </div>
      )}
      {submissionState === 'success' && renderSuccess()}
      {submissionState === 'error' && renderError()}
    </div>
  );
};

export default DonationForm;