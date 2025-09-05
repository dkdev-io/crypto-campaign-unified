import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Integrations = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1" style={{ background: 'var(--gradient-hero)' }}>
        <div className="container-responsive py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 
              className="text-4xl md:text-6xl font-bold mb-8"
              style={{ color: 'hsl(var(--crypto-white))' }}
            >
              Integrations
            </h1>
            
            <div className="crypto-card mx-auto" style={{ maxWidth: '600px' }}>
              <div className="space-y-6">
                <h2 
                  className="text-2xl font-semibold"
                  style={{ color: 'hsl(var(--crypto-gold))' }}
                >
                  Connect NEXTRAISE with Your Tools
                </h2>
                
                <p 
                  className="text-lg leading-relaxed"
                  style={{ color: 'hsl(var(--crypto-white))' }}
                >
                  Seamlessly integrate NEXTRAISE with your existing campaign infrastructure 
                  and favorite tools.
                </p>
                
                <div 
                  className="text-base"
                  style={{ color: 'hsl(var(--crypto-white) / 0.8)' }}
                >
                  Planned integrations:
                  <ul className="mt-4 space-y-2 text-left max-w-md mx-auto">
                    <li>• CRM platforms (Salesforce, HubSpot)</li>
                    <li>• Email marketing (Mailchimp, Constant Contact)</li>
                    <li>• Analytics tools (Google Analytics)</li>
                    <li>• Accounting software (QuickBooks)</li>
                    <li>• Website builders (WordPress, Squarespace)</li>
                    <li>• Social media platforms</li>
                  </ul>
                </div>
                
                <div className="pt-6">
                  <p 
                    className="text-sm"
                    style={{ color: 'hsl(var(--crypto-white) / 0.7)' }}
                  >
                    Need a specific integration?{' '}
                    <a 
                      href="mailto:dan@dkdev.io?subject=Integration Request"
                      style={{ color: 'hsl(var(--crypto-gold))' }}
                    >
                      Let us know
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Integrations;