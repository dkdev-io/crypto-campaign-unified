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
        <div className="bg-[#1e40af] rounded-2xl shadow-2xl p-8 md:p-12">
          {/* Back Link */}
          <Link 
            to={isCampaignContext ? "/campaigns/auth" : "/donors/auth/register"} 
            className="inline-flex items-center gap-2 text-[#3b82f6] hover:text-[#0ea5e9] mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {isCampaignContext ? "Back to Campaign Auth" : "Back to Registration"}
          </Link>

          {/* Header */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Privacy Policy
          </h1>
          <p className="text-white/80 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
                1. Information We Collect
              </h2>
              <p className="text-white/90 mb-4">
                We collect information you provide directly to us, such as when you create an account, 
                make a donation, or contact us for support.
              </p>
              <h3 className="text-xl font-medium text-white mb-3">Personal Information</h3>
              <ul className="list-disc list-inside text-white/90 space-y-2 ml-4">
                <li>Name and contact information (email address, phone number)</li>
                <li>Billing and payment information</li>
                <li>Donation history and preferences</li>
                <li>Account credentials</li>
                <li>Communications with us</li>
              </ul>
              
              <h3 className="text-xl font-medium text-white mt-4 mb-3">Automatically Collected Information</h3>
              <ul className="list-disc list-inside text-white/90 space-y-2 ml-4">
                <li>Device and browser information</li>
                <li>IP address and location data</li>
                <li>Usage data and analytics</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
                2. How We Use Your Information
              </h2>
              <p className="text-white/90 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-white/90 space-y-2 ml-4">
                <li>Process your donations and transactions</li>
                <li>Create and manage your account</li>
                <li>Communicate with you about your donations and account</li>
                <li>Send you updates about campaigns you've supported</li>
                <li>Comply with legal and regulatory requirements</li>
                <li>Improve our services and user experience</li>
                <li>Detect and prevent fraud or abuse</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
                3. Information Sharing and Disclosure
              </h2>
              <p className="text-white/90 mb-4">
                We may share your information in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-white/90 space-y-2 ml-4">
                <li><strong>With campaigns:</strong> We share donor information with the campaigns you support as required by law</li>
                <li><strong>Service providers:</strong> We work with third-party service providers who assist us in operating our platform</li>
                <li><strong>Legal requirements:</strong> We may disclose information to comply with legal obligations or protect our rights</li>
                <li><strong>Business transfers:</strong> In the event of a merger or acquisition, your information may be transferred</li>
                <li><strong>With your consent:</strong> We may share information with your explicit consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
                4. Data Security
              </h2>
              <p className="text-white/90 mb-4">
                We implement appropriate technical and organizational measures to protect your personal 
                information against unauthorized access, alteration, disclosure, or destruction. These measures include:
              </p>
              <ul className="list-disc list-inside text-white/90 space-y-2 ml-4">
                <li>Encryption of sensitive data in transit and at rest</li>
                <li>Regular security assessments and audits</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Employee training on data protection</li>
                <li>Incident response procedures</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
                5. Your Rights and Choices
              </h2>
              <p className="text-white/90 mb-4">
                You have certain rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside text-white/90 space-y-2 ml-4">
                <li><strong>Access:</strong> Request access to your personal information</li>
                <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your information, subject to legal requirements</li>
                <li><strong>Opt-out:</strong> Opt-out of certain communications</li>
                <li><strong>Data portability:</strong> Request a copy of your data in a portable format</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
                6. Cookies and Tracking Technologies
              </h2>
              <p className="text-white/90 mb-4">
                We use cookies and similar tracking technologies to collect information about your browsing 
                activities. You can control cookies through your browser settings, but disabling cookies 
                may limit your ability to use certain features of our service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
                7. Children's Privacy
              </h2>
              <p className="text-white/90 mb-4">
                Our service is not directed to individuals under the age of 18. We do not knowingly collect 
                personal information from children. If you believe we have collected information from a child, 
                please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
                8. International Data Transfers
              </h2>
              <p className="text-white/90 mb-4">
                Your information may be transferred to and processed in countries other than your country of 
                residence. We ensure appropriate safeguards are in place to protect your information in 
                accordance with applicable data protection laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
                9. Data Retention
              </h2>
              <p className="text-white/90 mb-4">
                We retain your personal information for as long as necessary to fulfill the purposes for which 
                it was collected, comply with legal obligations, resolve disputes, and enforce our agreements.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
                10. Changes to This Privacy Policy
              </h2>
              <p className="text-white/90 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by 
                posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
                11. Contact Us
              </h2>
              <p className="text-white/90 mb-4">
                If you have any questions or concerns about this Privacy Policy or our data practices, 
                please contact us at:
              </p>
              <div className="bg-[#1e3a8a] p-4 rounded-lg">
                <p className="text-white/90">
                  Email: privacy@example.com<br />
                  Address: 123 Main Street, Suite 100<br />
                  City, State 12345<br />
                  Phone: (555) 123-4567<br />
                  Data Protection Officer: dpo@example.com
                </p>
              </div>
            </section>
          </div>

          {/* Footer Actions */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link 
              to={isCampaignContext ? "/campaigns/auth" : "/donors/auth/register"} 
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
            >
              {isCampaignContext ? "Return to Campaign Auth" : "Return to Registration"}
            </Link>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;