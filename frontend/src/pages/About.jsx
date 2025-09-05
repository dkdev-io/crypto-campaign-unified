import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const About = () => {
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
              About NEXTRAISE
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
                  We're building the future of political campaign fundraising with cryptocurrency. 
                  Learn more about our mission, team, and vision for democratizing political contributions.
                </p>
                
                <div 
                  className="text-base"
                  style={{ color: 'hsl(var(--crypto-white) / 0.8)' }}
                >
                  Stay tuned for:
                  <ul className="mt-4 space-y-2 text-left max-w-md mx-auto">
                    <li>• Our founding story and mission</li>
                    <li>• Team member profiles</li>
                    <li>• Company values and vision</li>
                    <li>• Partnership opportunities</li>
                  </ul>
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

export default About;