import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ChevronRight, Building2, Settings } from 'lucide-react';

const CampaignBreadcrumb = () => {
  const location = useLocation();
  const pathname = location.pathname;

  const getBreadcrumbs = () => {
    const breadcrumbs = [
      { label: 'Home', path: '/', icon: Home }
    ];

    // Add Campaign-specific breadcrumbs
    if (pathname.startsWith('/setup') || pathname.startsWith('/campaigns') || pathname === '/auth') {
      breadcrumbs.push({ label: 'Campaigns', path: '/' });
    }

    if (pathname === '/auth') {
      breadcrumbs.push({ label: 'Sign In / Sign Up', path: '/auth', current: true });
    } else if (pathname === '/setup') {
      breadcrumbs.push({ label: 'Setup Wizard', path: '/setup', current: true });
    } else if (pathname === '/campaigns/auth/register') {
      breadcrumbs.push({ label: 'Sign Up', path: '/campaigns/auth/register', current: true });
    } else if (pathname === '/campaigns/auth/login') {
      breadcrumbs.push({ label: 'Sign In', path: '/campaigns/auth/login', current: true });
    } else if (pathname === '/campaigns/auth') {
      breadcrumbs.push({ label: 'Sign In / Sign Up', path: '/campaigns/auth', current: true });
    } else if (pathname === '/campaigns/dashboard') {
      breadcrumbs.push({ label: 'Dashboard', path: '/campaigns/dashboard', current: true });
    } else if (pathname === '/campaigns/profile') {
      breadcrumbs.push({ label: 'Profile', path: '/campaigns/profile', current: true });
    } else if (pathname === '/campaigns/settings') {
      breadcrumbs.push({ label: 'Settings', path: '/campaigns/settings', current: true });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center space-x-2 py-3 text-sm" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            {breadcrumbs.map((breadcrumb, index) => (
              <li key={breadcrumb.path} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
                )}
                
                {breadcrumb.current ? (
                  <span className="flex items-center gap-2 text-primary font-medium">
                    {breadcrumb.icon && <breadcrumb.icon className="w-4 h-4" />}
                    {breadcrumb.label}
                  </span>
                ) : (
                  <Link
                    to={breadcrumb.path}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {breadcrumb.icon && <breadcrumb.icon className="w-4 h-4" />}
                    {breadcrumb.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </div>
  );
};

export default CampaignBreadcrumb;