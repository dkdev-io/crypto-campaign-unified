import React, { useState } from 'react';
import DonationForm from '../../../components/DonationForm.js';

/**
 * Demo page for testing the DonationForm component
 * Shows how to integrate with referral system
 */
const DonationDemo = () => {
  const [lastDonation, setLastDonation] = useState(null);
  
  const handleDonationSuccess = (transactionData) => {
    console.log('Donation successful:', transactionData);
    setLastDonation(transactionData);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Donation Form Demo
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Test the crypto political donation system with referral tracking
          </p>
          
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-left max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">How to test:</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-700">
              <li>Fill out the donation form with your information</li>
              <li>Select a donation amount and currency</li>
              <li>Submit to see the transaction simulation</li>
              <li>Watch as the status updates to "confirmed" after 3 seconds</li>
              <li>
                To test referrals, add <code className="bg-blue-100 px-1 rounded">?ref=TESTREF</code> to the URL
                (You'll need to create a donor with referral code "TESTREF" first)
              </li>
            </ol>
          </div>

          {/* Test Referral Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
            <div className="text-center">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Test Without Referral</h4>
              <a
                href={`${window.location.pathname}`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Normal Donation
              </a>
            </div>
            
            <div className="text-center">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Test With Referral</h4>
              <a
                href={`${window.location.pathname}?ref=ALI1A2B`}
                className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                With Referral Code
              </a>
            </div>

            <div className="text-center">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Invalid Referral</h4>
              <a
                href={`${window.location.pathname}?ref=INVALID`}
                className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Invalid Code
              </a>
            </div>
          </div>
        </div>

        {/* Main Donation Form */}
        <div className="mb-8">
          <DonationForm
            campaignName="Demo Political Campaign"
            onSuccess={handleDonationSuccess}
            className="mx-auto"
          />
        </div>

        {/* Last Donation Summary */}
        {lastDonation && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-green-800 mb-4">
              Last Donation Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-green-700">Donor:</span>
                <span className="ml-2 text-green-600">{lastDonation.donorName}</span>
              </div>
              <div>
                <span className="font-medium text-green-700">Amount:</span>
                <span className="ml-2 text-green-600">{lastDonation.amount} {lastDonation.currency}</span>
              </div>
              <div>
                <span className="font-medium text-green-700">Campaign:</span>
                <span className="ml-2 text-green-600">{lastDonation.campaignName}</span>
              </div>
              <div>
                <span className="font-medium text-green-700">Status:</span>
                <span className={`ml-2 font-semibold ${
                  lastDonation.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {lastDonation.status === 'completed' ? 'Confirmed' : 'Pending'}
                </span>
              </div>
              {lastDonation.referralInfo && (
                <div className="md:col-span-2">
                  <span className="font-medium text-green-700">Referral:</span>
                  <span className="ml-2 text-green-600">
                    {lastDonation.referralInfo.referrerName} ({lastDonation.referralInfo.code})
                  </span>
                </div>
              )}
              <div className="md:col-span-2">
                <span className="font-medium text-green-700">Transaction:</span>
                <span className="ml-2 text-green-600 font-mono text-xs break-all">
                  {lastDonation.transactionHash}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* API Integration Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-4xl mx-auto mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            API Integration Points
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Endpoints Used:</h4>
              <ul className="space-y-1 text-gray-600">
                <li><code className="bg-gray-200 px-1 rounded">GET /api/referrals/validate</code> - Validate referral codes</li>
                <li><code className="bg-gray-200 px-1 rounded">GET /api/referrals/candidates</code> - Load campaigns</li>
                <li><code className="bg-gray-200 px-1 rounded">POST /api/donations/create</code> - Record donations</li>
                <li><code className="bg-gray-200 px-1 rounded">PUT /api/donations/[id]/status</code> - Update status</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Features Demonstrated:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>✅ URL referral code detection</li>
                <li>✅ Form validation with real-time feedback</li>
                <li>✅ Multi-currency support (ETH, BTC, USDC)</li>
                <li>✅ Transaction hash generation</li>
                <li>✅ Blockchain confirmation simulation</li>
                <li>✅ Referral attribution display</li>
                <li>✅ Success/error state management</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationDemo;