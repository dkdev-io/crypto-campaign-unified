import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowLeft } from 'lucide-react';
import CampaignBreadcrumb from './CampaignBreadcrumb';

const CampaignAuthNav = () => {
  return (
    <div className="sticky top-0 z-50">
      <nav className="bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <Link to="/" className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg">
                <Building2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl text-foreground">CampaignFlow</span>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center space-x-6">
              <Link
                to="/campaigns/auth"
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/setup"
                className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
              >
                Start Setup
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <CampaignBreadcrumb />
    </div>
  );
};

export default CampaignAuthNav;