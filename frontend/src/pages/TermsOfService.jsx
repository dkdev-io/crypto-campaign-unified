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
            <p className="text-gray-600 mb-8">Effective Date: September 5, 2025</p>

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy-900 mb-4">
                  Agreement to Terms
                </h2>
                <p className="text-gray-700 mb-4">
                  By accessing this website, users agree to follow these Terms of Service. If they do not agree, they should discontinue use immediately.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy-900 mb-4">General Use</h2>
                <p className="text-gray-700 mb-4">
                  Users may browse and use the website for personal, non-commercial purposes. Users must not engage in unlawful, abusive, or disruptive behavior while using the site.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy-900 mb-4">Intellectual Property</h2>
                <p className="text-gray-700 mb-4">
                  All content on this website is owned by the website operator, unless otherwise stated. Unauthorized copying or reuse is prohibited.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy-900 mb-4">
                  Limitation of Liability
                </h2>
                <p className="text-gray-700 mb-4">
                  The website is provided "as is" and without warranties. The operator is not liable for damages arising from use or inability to use the site.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy-900 mb-4">Links to Other Sites</h2>
                <p className="text-gray-700 mb-4">
                  External links may be present, but the operator does not endorse or control those sites.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy-900 mb-4">
                  Changes to Terms
                </h2>
                <p className="text-gray-700 mb-4">
                  These terms may be updated at any time. Continued use after changes means acceptance of those changes.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy-900 mb-4">
                  Contact
                </h2>
                <p className="text-gray-700 mb-4">
                  Questions about these terms can be sent to the contact form or email listed on the website.
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

export default TermsOfService;
