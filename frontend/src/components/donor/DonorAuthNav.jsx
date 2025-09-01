import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import DonorBreadcrumb from './DonorBreadcrumb';

const DonorAuthNav = () => {
  const navigate = useNavigate();

  return (
    <div>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4 md:px-6">
          <div className="flex flex-1 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/">
                <span className="text-2xl font-bold">
                  <span className="text-primary">NEXT</span>
                  <span className="text-accent">RAISE</span>
                </span>
              </Link>
            </div>
            
            {/* Desktop Navigation - removed auth links */}
            <nav className="hidden md:flex items-center gap-6">
              <a 
                href="#features" 
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                FEATURES
              </a>
              <a 
                href="#how-it-works" 
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                HOW IT WORKS
              </a>
              <a 
                href="#pricing" 
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                PRICING
              </a>
              <a 
                href="#contact" 
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                CONTACT
              </a>
            </nav>

            {/* Action Buttons - matching home page */}
            <div className="flex items-center gap-2">
              <Button 
                size="sm"
                className="bg-accent text-accent-foreground hover:bg-accent/90"
                style={{backgroundColor: 'hsl(var(--crypto-gold))', color: 'hsl(var(--crypto-navy))'}}
                onClick={() => navigate('/setup')}
              >
                Campaigns
              </Button>
              <Button 
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                style={{backgroundColor: 'hsl(var(--crypto-blue))', color: 'white'}}
                onClick={() => navigate('/donors/auth')}
              >
                Donors
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 hover:bg-accent/10 rounded-md">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      <DonorBreadcrumb />
    </div>
  );
};

export default DonorAuthNav;