const Footer = () => {
  return (
    <footer className="bg-primary py-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="font-bebas text-2xl">
              <span className="text-primary-foreground">Next</span>
              <span className="text-accent">Raise</span>
            </div>
            <p className="font-georgia text-primary-foreground/80 text-sm leading-relaxed">
              The easiest way for campaigns to accept secure and compliant cryptocurrency donations.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-bebas text-lg text-primary-foreground">
              Product
            </h3>
            <ul className="space-y-2 font-georgia text-sm">
              <li>
                <a href="#features" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#demo" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  Demo
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-bebas text-lg text-primary-foreground">
              Resources
            </h3>
            <ul className="space-y-2 font-georgia text-sm">
              <li>
                <a href="#" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  Developer Notes
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  White Paper
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-bebas text-lg text-primary-foreground">
              Support
            </h3>
            <ul className="space-y-2 font-georgia text-sm">
              <li>
                <a href="#contact" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  Status
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-12 pt-8 text-center">
          <p className="font-georgia text-primary-foreground/60 text-sm">
            © 2024 NextRaise. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;