const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container-responsive py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-2xl font-bold" style={{color: 'hsl(var(--crypto-navy))'}}>
              NEXTRAISE
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-700 hover:text-primary transition-colors font-medium uppercase text-sm">
              FEATURES
            </a>
            <a href="#how-it-works" className="text-gray-700 hover:text-primary transition-colors font-medium uppercase text-sm">
              HOW IT WORKS
            </a>
            <a href="#pricing" className="text-gray-700 hover:text-primary transition-colors font-medium uppercase text-sm">
              PRICING
            </a>
            <a href="#contact" className="text-gray-700 hover:text-primary transition-colors font-medium uppercase text-sm">
              CONTACT
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            <button 
              className="text-gray-700 hover:text-primary transition-colors font-medium uppercase text-sm"
              onClick={() => {
                window.location.href = '/auth';
              }}
            >
              SIGN IN
            </button>
            <button 
              className="bg-gold hover:bg-gold/90 text-navy font-bold px-8 py-3 rounded-md transition-colors uppercase text-sm"
              style={{
                backgroundColor: 'hsl(var(--crypto-gold))',
                color: 'hsl(var(--crypto-navy))'
              }}
              onClick={() => {
                window.location.href = '/setup';
              }}
            >
              GET STARTED
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;