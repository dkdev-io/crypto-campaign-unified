const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container px-6 py-16 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Company Column */}
          <div className="space-y-6">
            <div>
              <div className="text-3xl font-bold mb-4">
                <span className="text-primary-foreground">NEXT</span>
                <span className="text-accent">RAISE</span>
              </div>
              <p className="text-sm leading-relaxed text-primary-foreground/70 max-w-xs">
                The easiest way for campaigns to accept secure and compliant cryptocurrency
                donations.
              </p>
            </div>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="/about"
                  className="text-primary-foreground/70 hover:text-accent transition-colors duration-200"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  className="text-primary-foreground/70 hover:text-accent transition-colors duration-200"
                >
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Product Column */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-primary-foreground">Product</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="#features"
                  className="text-primary-foreground/70 hover:text-accent transition-colors duration-200"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="text-primary-foreground/70 hover:text-accent transition-colors duration-200"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="#demo"
                  className="text-primary-foreground/70 hover:text-accent transition-colors duration-200"
                >
                  Request Demo
                </a>
              </li>
              <li>
                <a
                  href="/integrations"
                  className="text-primary-foreground/70 hover:text-accent transition-colors duration-200"
                >
                  Integrations
                </a>
              </li>
              <li>
                <a
                  href="/api"
                  className="text-primary-foreground/70 hover:text-accent transition-colors duration-200"
                >
                  API Documentation
                </a>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-primary-foreground">Resources</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="/blog"
                  className="text-primary-foreground/70 hover:text-accent transition-colors duration-200"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="/help"
                  className="text-primary-foreground/70 hover:text-accent transition-colors duration-200"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="/security"
                  className="text-primary-foreground/70 hover:text-accent transition-colors duration-200"
                >
                  Security
                </a>
              </li>
              <li>
                <a
                  href="/documentation"
                  className="text-primary-foreground/70 hover:text-accent transition-colors duration-200"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="/whitepaper"
                  className="text-primary-foreground/70 hover:text-accent transition-colors duration-200"
                >
                  White Paper
                </a>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-primary-foreground">Support</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="#contact"
                  className="text-primary-foreground/70 hover:text-accent transition-colors duration-200"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="/support"
                  className="text-primary-foreground/70 hover:text-accent transition-colors duration-200"
                >
                  Support Center
                </a>
              </li>
              <li>
                <a
                  href="/legal"
                  className="text-primary-foreground/70 hover:text-accent transition-colors duration-200"
                >
                  Legal
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  className="text-primary-foreground/70 hover:text-accent transition-colors duration-200"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-primary-foreground/10 mt-16 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-primary-foreground/60 text-center sm:text-left">
              © 2025 NEXTRAISE. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a
                href="/terms"
                className="text-sm text-primary-foreground/60 hover:text-accent transition-colors duration-200"
              >
                Terms
              </a>
              <a
                href="/privacy"
                className="text-sm text-primary-foreground/60 hover:text-accent transition-colors duration-200"
              >
                Privacy
              </a>
              <a
                href="/cookies"
                className="text-sm text-primary-foreground/60 hover:text-accent transition-colors duration-200"
              >
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
