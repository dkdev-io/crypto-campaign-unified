import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Pricing = () => {
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
              Pricing
            </h1>
            
            <div className="crypto-card mx-auto" style={{ maxWidth: '600px' }}>
              <div className="space-y-6">
                <h2 
                  className="text-2xl font-semibold"
                  style={{ color: 'hsl(var(--crypto-gold))' }}
                >
                  Simple, Transparent Pricing
                </h2>
                
                <p 
                  className="text-lg leading-relaxed"
                  style={{ color: 'hsl(var(--crypto-white))' }}
                >
                  More services for less fees. No set-up and lower processing fees 
                  than credit card donations.
                </p>
                
                <div 
                  className="text-base"
                  style={{ color: 'hsl(var(--crypto-white) / 0.8)' }}
                >
                  <div className="space-y-4">
                    <div 
                      className="text-3xl font-bold"
                      style={{ color: 'hsl(var(--crypto-gold))' }}
                    >
                      $0
                    </div>
                    <p>Setup Fee</p>
                    
                    <hr style={{ borderColor: 'hsl(var(--crypto-white) / 0.2)' }} />
                    
                    <div>
                      <p className="font-semibold">Detailed pricing coming soon:</p>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li>• Per-transaction fees</li>
                        <li>• Volume discounts</li>
                        <li>• Enterprise pricing</li>
                        <li>• Comparison with credit cards</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6">
                  <a
                    href="mailto:dan@dkdev.io?subject=Pricing Question"
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
                    Contact Us
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

export default Pricing;