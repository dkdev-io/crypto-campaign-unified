import React from 'react';
import CampaignAuthNav from '../components/campaigns/CampaignAuthNav';
import { useAuth } from '../contexts/AuthContext';

const CampaignDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <CampaignAuthNav />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Campaign Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {user?.user_metadata?.full_name || user?.email}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Donations */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Total Donations
                </h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">$0.00</p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                  <span className="text-green-600">💰</span>
                </div>
              </div>
            </div>
          </div>

          {/* Number of Donors */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Total Donors
                </h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <span className="text-blue-600">👥</span>
                </div>
              </div>
            </div>
          </div>

          {/* Average Donation */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Average Donation
                </h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">$0.00</p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                  <span className="text-purple-600">📊</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-6">
              <div className="text-center py-12">
                <div className="text-gray-400 text-4xl mb-4">📋</div>
                <p className="text-gray-500">No activity yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Once you start receiving donations, they'll appear here
                </p>
              </div>
            </div>
          </div>

          {/* Campaign Tools */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Campaign Tools</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">🔗</span>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-base font-medium text-gray-900">Embed Code</h3>
                    <p className="text-base text-gray-500">Get embed code for your website</p>
                  </div>
                  <div className="flex-shrink-0">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Get Code
                    </button>
                  </div>
                </div>

                <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-base font-medium text-gray-900">Analytics</h3>
                    <p className="text-base text-gray-500">View detailed campaign analytics</p>
                  </div>
                  <div className="flex-shrink-0">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      View Analytics
                    </button>
                  </div>
                </div>

                <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">📄</span>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-base font-medium text-gray-900">FEC Reports</h3>
                    <p className="text-base text-gray-500">Generate FEC compliance reports</p>
                  </div>
                  <div className="flex-shrink-0">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Generate Reports
                    </button>
                  </div>
                </div>

                <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">⚙️</span>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-base font-medium text-gray-900">Campaign Settings</h3>
                    <p className="text-base text-gray-500">Update campaign information</p>
                  </div>
                  <div className="flex-shrink-0">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <span className="text-3xl mb-2">📧</span>
                <span className="text-base font-medium text-gray-900">Email Donors</span>
                <span className="text-xs text-gray-500 mt-1">Send updates to supporters</span>
              </button>

              <button className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
                <span className="text-3xl mb-2">📱</span>
                <span className="text-base font-medium text-gray-900">Share Campaign</span>
                <span className="text-xs text-gray-500 mt-1">Get shareable links</span>
              </button>

              <button className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
                <span className="text-3xl mb-2">🎨</span>
                <span className="text-base font-medium text-gray-900">Customize Form</span>
                <span className="text-xs text-gray-500 mt-1">Update donation form</span>
              </button>
            </div>
          </div>
        </div>

        {/* Getting Started Guide */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-2xl">🚀</span>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-blue-900 mb-2">Getting Started</h3>
                <p className="text-blue-700 mb-4">
                  Your campaign is set up and ready to receive donations! Here are your next steps:
                </p>
                <ul className="list-disc list-inside space-y-2 text-base text-blue-700">
                  <li>Share your donation page with supporters</li>
                  <li>Embed the donation form on your campaign website</li>
                  <li>Monitor donations and compliance in real-time</li>
                  <li>Generate FEC reports as needed</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDashboard;
