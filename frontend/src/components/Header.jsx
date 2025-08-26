import { Button } from "./ui/button";

const Header = () => {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="font-bebas text-2xl">
              <span className="text-primary">Next</span>
              <span className="text-accent">Raise</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="font-bebas text-foreground hover:text-primary transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="font-bebas text-foreground hover:text-primary transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="font-bebas text-foreground hover:text-primary transition-colors">
              Pricing
            </a>
            <a href="#contact" className="font-bebas text-foreground hover:text-primary transition-colors">
              Contact
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="font-bebas">
              Sign In
            </Button>
            <Button 
              className="font-bebas bg-accent hover:bg-accent/90 text-accent-foreground shadow-button"
              onClick={() => {
                window.location.href = 'http://localhost:5173';
              }}
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;