import Header from "../components/Header";
import Hero from "../components/Hero";
import Features from "../components/Features";
import HowItWorks from "../components/HowItWorks";
import CTA from "../components/CTA";
import Footer from "../components/Footer";
import { AuthProvider } from '../contexts/AuthContext';

const Index = () => {
  // Development Auth Bypass Panel - only show if VITE_SKIP_AUTH is true
  const showAuthBypass = import.meta.env.VITE_SKIP_AUTH === 'true';

  return (
    <AuthProvider>
      <div className="min-h-screen" style={{backgroundColor: '#2D1B69', color: 'hsl(var(--crypto-white))'}}>
        
        {/* Development Auth Bypass Panel */}
        {showAuthBypass && (
          <div style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: '#ff4444',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            zIndex: 9999,
            border: '2px solid #ff6666',
            boxShadow: '0 4px 12px rgba(255,68,68,0.3)'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '14px' }}>
              AUTH BYPASS ACTIVE
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a 
                href="/donors/dashboard" 
                style={{
                  background: '#007bff',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  fontSize: '12px',
                  textAlign: 'center'
                }}
              >
                → Donor Dashboard (Bypass)
              </a>
              <a 
                href="/campaigns/auth/setup" 
                style={{
                  background: '#28a745',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  fontSize: '12px',
                  textAlign: 'center'
                }}
              >
                → Campaign Setup (Bypass)
              </a>
              <a 
                href="/debug" 
                style={{
                  background: '#6f42c1',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  fontSize: '12px',
                  textAlign: 'center'
                }}
              >
                → Debug Dashboard
              </a>
              <a 
                href="/testing" 
                style={{
                  background: '#fd7e14',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  fontSize: '12px',
                  textAlign: 'center'
                }}
              >
                → Testing Dashboard
              </a>
            </div>
          </div>
        )}

        <Header />
        <Hero />
        <Features />
        <HowItWorks />
        <CTA />
        <Footer />
      </div>
    </AuthProvider>
  );
};

export default Index;
