const Header = () => {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container-responsive py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold">
              <span style={{color: 'hsl(var(--crypto-navy))'}}>Crypto</span>
              <span style={{color: 'hsl(var(--crypto-gold))'}}>Campaign</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-foreground hover:text-primary transition-colors font-medium">
              Features
            </a>
            <a href="#how-it-works" className="text-foreground hover:text-primary transition-colors font-medium">
              How It Works
            </a>
            <a href="#pricing" className="text-foreground hover:text-primary transition-colors font-medium">
              Pricing
            </a>
            <a href="#contact" className="text-foreground hover:text-primary transition-colors font-medium">
              Contact
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            <button 
              className="btn-primary text-sm px-6 py-2 bg-transparent text-primary border border-primary hover:bg-primary hover:text-primary-foreground"
              onClick={() => {
                window.location.href = '/auth';
              }}
            >
              Sign In
            </button>
            <button 
              className="btn-secondary px-6 py-2"
              onClick={() => {
                window.location.href = '/setup';
              }}
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;