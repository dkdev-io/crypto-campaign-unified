import Header from "../components/Header";
import Hero from "../components/Hero";
import Features from "../components/Features";
import HowItWorks from "../components/HowItWorks";
import CTA from "../components/CTA";
import Footer from "../components/Footer";
import { AuthProvider } from '../contexts/AuthContext';

const Index = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen" style={{backgroundColor: 'hsl(var(--crypto-blue))', color: 'hsl(var(--crypto-white))'}}>
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
