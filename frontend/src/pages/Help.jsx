import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Help = () => {
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
              Help Center
            </h1>
            
            <div className="crypto-card mx-auto" style={{ maxWidth: '600px' }}>
              <div className="space-y-6">
                <h2 
                  className="text-2xl font-semibold"
                  style={{ color: 'hsl(var(--crypto-gold))' }}
                >
                  Get Help When You Need It
                </h2>
                
                <p 
                  className="text-lg leading-relaxed"
                  style={{ color: 'hsl(var(--crypto-white))' }}
                >
                  Comprehensive help resources to guide you through every aspect 
                  of cryptocurrency fundraising with NEXTRAISE.
                </p>
                
                <div 
                  className="text-base"
                  style={{ color: 'hsl(var(--crypto-white) / 0.8)' }}
                >
                  Help resources in development:
                  <ul className="mt-4 space-y-2 text-left max-w-md mx-auto">
                    <li>• Getting started guide</li>
                    <li>• Campaign setup tutorials</li>
                    <li>• Troubleshooting guides</li>
                    <li>• Best practices library</li>
                    <li>• Video walkthroughs</li>
                    <li>• Frequently asked questions</li>
                  </ul>
                </div>
                
                <div className="pt-6">
                  <p 
                    className="text-sm"
                    style={{ color: 'hsl(var(--crypto-white) / 0.7)' }}
                  >
                    Need immediate help?{' '}
                    <a 
                      href="mailto:dan@dkdev.io?subject=Help Request"
                      style={{ color: 'hsl(var(--crypto-gold))' }}
                    >
                      Contact support
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

export default Help;