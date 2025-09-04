import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import DonorAuthNav from '../components/donor/DonorAuthNav';
import CampaignAuthNav from '../components/campaigns/CampaignAuthNav';

const TermsOfService = () => {
  const location = useLocation();
  const isCampaignContext = location.pathname.startsWith('/campaigns/');

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-blue-900">
      {isCampaignContext ? <CampaignAuthNav /> : <DonorAuthNav />}
      <div className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
            {/* Back Link */}
            <Link
              to={isCampaignContext ? '/campaigns/auth' : '/donors/auth/register'}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              {isCampaignContext ? 'Back to Campaign Auth' : 'Back to Registration'}
            </Link>

            {/* Header */}
            <h1 className="text-3xl md:text-4xl font-bold text-navy-900 mb-2">Terms of Service</h1>
            <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy-900 mb-4">
                  1. Acceptance of Terms
                </h2>
                <p className="text-gray-700 mb-4">
                  By accessing or using our donation platform, you agree to be bound by these Terms
                  of Service and all applicable laws and regulations. If you do not agree with any
                  of these terms, you are prohibited from using or accessing this site.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy-900 mb-4">2. Use of Service</h2>
                <p className="text-gray-700 mb-4">
                  Our platform facilitates donations to political campaigns and causes. You must be
                  at least 18 years old and legally eligible to make political contributions in your
                  jurisdiction to use our service.
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>
                    You must provide accurate and complete information when creating an account
                  </li>
                  <li>
                    You are responsible for maintaining the confidentiality of your account
                    credentials
                  </li>
                  <li>
                    You agree to notify us immediately of any unauthorized use of your account
                  </li>
                  <li>You may not use the service for any illegal or unauthorized purpose</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy-900 mb-4">3. Donation Terms</h2>
                <p className="text-gray-700 mb-4">
                  All donations made through our platform are subject to the following terms:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Donations are processed securely through our payment partners</li>
                  <li>You acknowledge that donations may be subject to contribution limits</li>
                  <li>You certify that all donations are made with your own funds</li>
                  <li>Refunds are handled according to our refund policy and applicable laws</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy-900 mb-4">
                  4. Privacy and Data Protection
                </h2>
                <p className="text-gray-700 mb-4">
                  Your use of our service is also governed by our Privacy Policy. We are committed
                  to protecting your personal information and handling it in accordance with
                  applicable data protection laws.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy-900 mb-4">
                  5. Intellectual Property
                </h2>
                <p className="text-gray-700 mb-4">
                  The service and its original content, features, and functionality are owned by us
                  and are protected by international copyright, trademark, patent, trade secret, and
                  other intellectual property laws.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy-900 mb-4">
                  6. Limitation of Liability
                </h2>
                <p className="text-gray-700 mb-4">
                  To the maximum extent permitted by law, we shall not be liable for any indirect,
                  incidental, special, consequential, or punitive damages resulting from your use of
                  or inability to use the service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy-900 mb-4">7. Indemnification</h2>
                <p className="text-gray-700 mb-4">
                  You agree to indemnify, defend, and hold harmless our platform, its officers,
                  directors, employees, and agents from any claims, liabilities, damages, losses,
                  and expenses arising from your use of the service or violation of these terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy-900 mb-4">
                  8. Modifications to Terms
                </h2>
                <p className="text-gray-700 mb-4">
                  We reserve the right to modify or replace these terms at any time. If a revision
                  is material, we will provide notice prior to any new terms taking effect.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy-900 mb-4">9. Governing Law</h2>
                <p className="text-gray-700 mb-4">
                  These terms shall be governed by and construed in accordance with the laws of the
                  United States, without regard to its conflict of law provisions.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy-900 mb-4">
                  10. Contact Information
                </h2>
                <p className="text-gray-700 mb-4">
                  If you have any questions about these Terms of Service, please contact us at:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">
                    Email: legal@example.com
                    <br />
                    Address: 123 Main Street, Suite 100
                    <br />
                    City, State 12345
                    <br />
                    Phone: (555) 123-4567
                  </p>
                </div>
              </section>
            </div>

            {/* Footer Actions */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <Link
                to={isCampaignContext ? '/campaigns/auth' : '/donors/auth/register'}
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
              >
                {isCampaignContext ? 'Return to Campaign Auth' : 'Return to Registration'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
