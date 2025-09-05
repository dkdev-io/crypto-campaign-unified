import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ApiDocumentation = () => {
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
              API Documentation
            </h1>
            
            <div className="crypto-card mx-auto" style={{ maxWidth: '600px' }}>
              <div className="space-y-6">
                <h2 
                  className="text-2xl font-semibold"
                  style={{ color: 'hsl(var(--crypto-gold))' }}
                >
                  Developer Resources
                </h2>
                
                <p 
                  className="text-lg leading-relaxed"
                  style={{ color: 'hsl(var(--crypto-white))' }}
                >
                  Complete API documentation for developers building custom integrations 
                  with the NEXTRAISE platform.
                </p>
                
                <div 
                  className="text-base"
                  style={{ color: 'hsl(var(--crypto-white) / 0.8)' }}
                >
                  Documentation coming soon:
                  <ul className="mt-4 space-y-2 text-left max-w-md mx-auto">
                    <li>• REST API endpoints</li>
                    <li>• Webhook configurations</li>
                    <li>• Authentication methods</li>
                    <li>• Code examples</li>
                    <li>• SDKs for popular languages</li>
                    <li>• Testing and sandbox environment</li>
                  </ul>
                </div>
                
                <div className="pt-6">
                  <p 
                    className="text-sm"
                    style={{ color: 'hsl(var(--crypto-white) / 0.7)' }}
                  >
                    Developer questions?{' '}
                    <a 
                      href="mailto:dan@dkdev.io?subject=API Documentation Question"
                      style={{ color: 'hsl(var(--crypto-gold))' }}
                    >
                      Contact our dev team
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

export default ApiDocumentation;