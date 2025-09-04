import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const DonorBreadcrumb = () => {
  const location = useLocation();
  const pathname = location.pathname;

  // Define breadcrumb structure for donor pages
  const getBreadcrumbs = () => {
    const breadcrumbs = [{ label: 'Home', path: '/', icon: Home }];

    // Add donor section
    if (pathname.includes('/donors')) {
      breadcrumbs.push({ label: 'Donors', path: '/donors/auth' });
    }

    // Add specific page breadcrumbs
    if (pathname === '/donors/auth/register') {
      breadcrumbs.push({ label: 'Sign Up', path: '/donors/auth/register', current: true });
    } else if (pathname === '/donors/auth/login') {
      breadcrumbs.push({ label: 'Sign In', path: '/donors/auth/login', current: true });
    } else if (pathname === '/donors/auth') {
      breadcrumbs.push({ label: 'Sign In', path: '/donors/auth', current: true });
    } else if (pathname === '/donors/auth/terms') {
      breadcrumbs.push({ label: 'Terms of Service', path: '/donors/auth/terms', current: true });
    } else if (pathname === '/donors/auth/privacy') {
      breadcrumbs.push({ label: 'Privacy Policy', path: '/donors/auth/privacy', current: true });
    } else if (pathname === '/donors/auth/verify-email') {
      breadcrumbs.push({ label: 'Verify Email', path: '/donors/auth/verify-email', current: true });
    } else if (pathname === '/donors/auth/forgot-password') {
      breadcrumbs.push({
        label: 'Reset Password',
        path: '/donors/auth/forgot-password',
        current: true,
      });
    } else if (pathname === '/donors/dashboard') {
      breadcrumbs.push({ label: 'Dashboard', path: '/donors/dashboard', current: true });
    } else if (pathname === '/donors/profile') {
      breadcrumbs.push({ label: 'Dashboard', path: '/donors/dashboard' });
      breadcrumbs.push({ label: 'Profile', path: '/donors/profile', current: true });
    } else if (pathname === '/donors/donations') {
      breadcrumbs.push({ label: 'Dashboard', path: '/donors/dashboard' });
      breadcrumbs.push({ label: 'My Donations', path: '/donors/donations', current: true });
    } else if (pathname === '/donors/campaigns') {
      breadcrumbs.push({ label: 'Dashboard', path: '/donors/dashboard' });
      breadcrumbs.push({ label: 'Campaigns', path: '/donors/campaigns', current: true });
    } else if (pathname.includes('/donors/donate/')) {
      breadcrumbs.push({ label: 'Campaigns', path: '/donors/campaigns' });
      breadcrumbs.push({ label: 'Donate', path: pathname, current: true });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex py-3" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            {breadcrumbs.map((breadcrumb, index) => (
              <li key={breadcrumb.path} className="flex items-center">
                {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />}

                {breadcrumb.current ? (
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    {breadcrumb.icon && <breadcrumb.icon className="w-4 h-4" />}
                    {breadcrumb.label}
                  </span>
                ) : (
                  <Link
                    to={breadcrumb.path}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
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

export default DonorBreadcrumb;
