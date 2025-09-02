import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:backdrop-blur-sm relative" style={{backgroundColor: 'hsl(var(--crypto-blue))'}}>
      {/* Corner Brackets */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-black"></div>
      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-black"></div>
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-black"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-black"></div>
      
      <div className="container flex h-16 items-center px-4 md:px-6">
        <div className="flex flex-1 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <span className="text-2xl font-bold">
              <span className="text-white">NEXT</span>
              <span className="text-accent">RAISE</span>
            </span>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <a 
              href="#features" 
              className="text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              FEATURES
            </a>
            <a 
              href="#how-it-works" 
              className="text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              HOW IT WORKS
            </a>
            <a 
              href="#pricing" 
              className="text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              PRICING
            </a>
            <a 
              href="#contact" 
              className="text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              CONTACT
            </a>
          </nav>

          {/* Action Buttons */}
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
          <button className="md:hidden p-2 hover:bg-white/10 rounded-md text-white">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;