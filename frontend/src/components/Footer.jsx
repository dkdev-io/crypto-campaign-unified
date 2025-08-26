const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="container-responsive">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="text-2xl font-bold">
              <span style={{color: 'hsl(var(--crypto-white))'}}>Crypto</span>
              <span style={{color: 'hsl(var(--crypto-gold))'}}>Campaign</span>
            </div>
            <p className="text-sm leading-relaxed opacity-80">
              The easiest way for campaigns to accept secure and compliant cryptocurrency donations.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold" style={{color: 'hsl(var(--crypto-white))'}}>
              Product
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#features" className="opacity-80 transition-colors" style={{
                  color: 'hsl(var(--crypto-white))',
                  ':hover': { color: 'hsl(var(--crypto-gold))' }
                }}>
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="opacity-80 transition-colors" style={{
                  color: 'hsl(var(--crypto-white))',
                  ':hover': { color: 'hsl(var(--crypto-gold))' }
                }}>
                  Pricing
                </a>
              </li>
              <li>
                <a href="#demo" className="opacity-80 transition-colors" style={{
                  color: 'hsl(var(--crypto-white))',
                  ':hover': { color: 'hsl(var(--crypto-gold))' }
                }}>
                  Demo
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold" style={{color: 'hsl(var(--crypto-white))'}}>
              Resources
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="opacity-80 hover:opacity-100 transition-all duration-200" style={{
                  color: 'hsl(var(--crypto-white))'
                }}>
                  Developer Notes
                </a>
              </li>
              <li>
                <a href="#" className="opacity-80 hover:opacity-100 transition-all duration-200" style={{
                  color: 'hsl(var(--crypto-white))'
                }}>
                  White Paper
                </a>
              </li>
              <li>
                <a href="#" className="opacity-80 hover:opacity-100 transition-all duration-200" style={{
                  color: 'hsl(var(--crypto-white))'
                }}>
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold" style={{color: 'hsl(var(--crypto-white))'}}>
              Support
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#contact" className="opacity-80 hover:opacity-100 transition-all duration-200" style={{
                  color: 'hsl(var(--crypto-white))'
                }}>
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="opacity-80 hover:opacity-100 transition-all duration-200" style={{
                  color: 'hsl(var(--crypto-white))'
                }}>
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="opacity-80 hover:opacity-100 transition-all duration-200" style={{
                  color: 'hsl(var(--crypto-white))'
                }}>
                  Status
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-12 pt-8 text-center" style={{borderColor: 'hsl(var(--crypto-white) / 0.2)'}}>
          <p className="text-sm opacity-60" style={{color: 'hsl(var(--crypto-white))'}}>
            © 2024 CryptoCampaign. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;