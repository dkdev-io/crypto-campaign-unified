import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Support = () => {
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
              Support Center
            </h1>
            
            <div className="crypto-card mx-auto" style={{ maxWidth: '600px' }}>
              <div className="space-y-6">
                <h2 
                  className="text-2xl font-semibold"
                  style={{ color: 'hsl(var(--crypto-gold))' }}
                >
                  Coming Soon
                </h2>
                
                <p 
                  className="text-lg leading-relaxed"
                  style={{ color: 'hsl(var(--crypto-white))' }}
                >
                  We're building a comprehensive support center to help you get the most out of NEXTRAISE.
                </p>
                
                <div 
                  className="text-base"
                  style={{ color: 'hsl(var(--crypto-white) / 0.8)' }}
                >
                  Coming features:
                  <ul className="mt-4 space-y-2 text-left max-w-md mx-auto">
                    <li>• Knowledge base and FAQs</li>
                    <li>• Step-by-step tutorials</li>
                    <li>• Video guides</li>
                    <li>• Live chat support</li>
                    <li>• Technical documentation</li>
                  </ul>
                </div>
                
                <div className="pt-6">
                  <a
                    href="mailto:dan@dkdev.io?subject=Support Request"
                    style={{
                      background: 'hsl(var(--crypto-gold))',
                      color: 'hsl(var(--crypto-navy))',
                      padding: '0.75rem 2rem',
                      borderRadius: 'var(--radius)',
                      textDecoration: 'none',
                      fontSize: '1rem',
                      fontWeight: '600',
                      fontFamily: 'Inter, sans-serif',
                      textTransform: 'uppercase',
                      letterSpacing: '0.025em',
                      display: 'inline-block',
                    }}
                  >
                    Contact Support
                  </a>
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

export default Support;