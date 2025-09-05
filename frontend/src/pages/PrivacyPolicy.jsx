import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import DonorAuthNav from '../components/donor/DonorAuthNav';
import CampaignAuthNav from '../components/campaigns/CampaignAuthNav';

const PrivacyPolicy = () => {
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
            <h1 className="text-3xl md:text-4xl font-bold text-navy-900 mb-2">Privacy Policy</h1>
            <p className="text-gray-600 mb-8">Effective Date: September 5, 2025</p>

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy-900 mb-4">
                  Data Collection
                </h2>
                <p className="text-gray-700 mb-4">
                  Basic usage data (site analytics) may be collected automatically. No personally identifiable information is knowingly collected unless provided through a contact form.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy-900 mb-4">Data Usage</h2>
                <p className="text-gray-700 mb-4">
                  Any information shared with the website (for example, via contact forms) will only be used to respond to inquiries or improve the site. Data will not be shared or sold to third parties.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy-900 mb-4">Cookies</h2>
                <p className="text-gray-700 mb-4">
                  The website may use cookies for analytics and performance; users can disable cookies in their browser settings.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy-900 mb-4">Data Security</h2>
                <p className="text-gray-700 mb-4">
                  Reasonable measures will be taken to protect user data, but absolute security cannot be guaranteed.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy-900 mb-4">Updates</h2>
                <p className="text-gray-700 mb-4">
                  This policy may be updated periodically. Users are encouraged to check back for changes.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy-900 mb-4">Contact</h2>
                <p className="text-gray-700 mb-4">
                  Privacy concerns may be directed to the email or contact form provided on the website.
                </p>
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

export default PrivacyPolicy;
