import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

const CampaignBreadcrumb = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Map paths to user-friendly names
  const pathMap = {
    '/': 'Home',
    '/auth': 'Sign In / Sign Up',
    '/setup': 'Campaign Setup',
    '/setup/1': 'Basic Information',
    '/setup/2': 'Committee Details',
    '/setup/3': 'Bank Connection',
    '/setup/4': 'Website Styling',
    '/setup/5': 'Style Preview',
    '/setup/6': 'Terms & Agreement',
    '/setup/7': 'Embed Code',
    '/campaigns': 'Campaigns',
    '/campaigns/auth': 'Campaign Auth'
  };

  // Generate breadcrumb items based on current path
  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [
      {
        name: 'Home',
        path: '/',
        current: location.pathname === '/'
      }
    ];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      breadcrumbs.push({
        name: pathMap[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1),
        path: currentPath,
        current: isLast
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  const handleNavigation = (path) => {
    if (path !== location.pathname) {
      navigate(path);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3" aria-label="Breadcrumb">
      <div className="max-w-7xl mx-auto">
        <ol className="flex items-center space-x-2">
          {breadcrumbs.map((breadcrumb, index) => (
            <li key={breadcrumb.path} className="flex items-center">
              {index === 0 && (
                <HomeIcon className="h-4 w-4 text-gray-400 mr-2" aria-hidden="true" />
              )}
              
              {index > 0 && (
                <ChevronRightIcon 
                  className="h-4 w-4 text-gray-400 mx-2" 
                  aria-hidden="true" 
                />
              )}
              
              <button
                onClick={() => handleNavigation(breadcrumb.path)}
                className={`text-sm font-medium transition-colors duration-200 ${
                  breadcrumb.current
                    ? 'text-white cursor-default'
                    : 'text-white/60 hover:text-[#3b82f6] cursor-pointer'
                }`}
                aria-current={breadcrumb.current ? 'page' : undefined}
                disabled={breadcrumb.current}
              >
                {breadcrumb.name}
              </button>
            </li>
          ))}
        </ol>
        
        {/* Optional: Show current page description */}
        {location.pathname.includes('/setup') && (
          <p className="text-xs text-white/60 mt-1">
            Complete your campaign setup to start accepting cryptocurrency donations
          </p>
        )}
      </div>
    </nav>
  );
};

export default CampaignBreadcrumb;