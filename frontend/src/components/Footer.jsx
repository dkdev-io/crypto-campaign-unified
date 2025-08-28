const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container px-4 py-12 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="text-2xl font-bold">
              <span className="text-primary-foreground">NEXT</span>
              <span className="text-accent">RAISE</span>
            </div>
            <p className="text-sm leading-relaxed text-primary-foreground/80">
              The easiest way for campaigns to accept secure and compliant cryptocurrency donations.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold">
              Product
            </h3>
            <ul className="space-y-2 text-sm">
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
            <h3 className="text-lg font-bold">
              Resources
            </h3>
            <ul className="space-y-2 text-sm">
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
            <h3 className="text-lg font-bold">
              Support
            </h3>
            <ul className="space-y-2 text-sm">
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
          <p className="text-sm text-primary-foreground/60">
            © 2024 NEXTRAISE. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;