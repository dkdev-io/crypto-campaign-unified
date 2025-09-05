import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Demo = () => {
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
              Request Demo
            </h1>
            
            <div className="crypto-card mx-auto" style={{ maxWidth: '600px' }}>
              <div className="space-y-6">
                <h2 
                  className="text-2xl font-semibold"
                  style={{ color: 'hsl(var(--crypto-gold))' }}
                >
                  See NEXTRAISE in Action
                </h2>
                
                <p 
                  className="text-lg leading-relaxed"
                  style={{ color: 'hsl(var(--crypto-white))' }}
                >
                  Schedule a personalized demo to see how NEXTRAISE can revolutionize 
                  your campaign's fundraising with cryptocurrency donations.
                </p>
                
                <div 
                  className="text-base"
                  style={{ color: 'hsl(var(--crypto-white) / 0.8)' }}
                >
                  Demo features:
                  <ul className="mt-4 space-y-2 text-left max-w-md mx-auto">
                    <li>• Live setup walkthrough</li>
                    <li>• Custom form creation</li>
                    <li>• Embed code generation</li>
                    <li>• Dashboard overview</li>
                    <li>• Q&A session</li>
                  </ul>
                </div>
                
                <div className="pt-6">
                  <p 
                    className="text-sm"
                    style={{ color: 'hsl(var(--crypto-white) / 0.7)' }}
                  >
                    Request your demo at{' '}
                    <a 
                      href="mailto:dan@dkdev.io?subject=NEXTRAISE Demo Request"
                      style={{ color: 'hsl(var(--crypto-gold))' }}
                    >
                      dan@dkdev.io
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

export default Demo;