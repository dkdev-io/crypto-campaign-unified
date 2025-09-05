import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const { user, loading, isEmailVerified } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    console.log('Get Started clicked - Auth state:', {
      user: !!user,
      loading,
      verified: user ? isEmailVerified() : false,
    });

    // Always navigate to campaigns/auth regardless of loading state
    // This prevents the button from being stuck on "LOADING..."
    navigate('/campaigns/auth');
  };

  return (
    <section className="hero-section">
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />

      <div className="container-responsive relative">
        <div className="max-w-5xl mx-auto text-center animate-fade-in">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl text-balance leading-relaxed font-bold">
              <span className="block" style={{ color: 'hsl(var(--crypto-gold))' }}>
                Reach Crypto Donors
              </span>
              <span className="block">or Become One</span>
            </h1>

            <div className="space-y-4 max-w-3xl mx-auto">
              <p className="text-xl md:text-2xl text-white font-semibold leading-relaxed">
                Set Up in Minutes With the Tools You Need to Raise or Give. Do more with lower processing fees than credit card donations.
              </p>
            </div>

            <div className="flex justify-center pt-4">
              <button
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-xl px-12 py-4 rounded transition-colors shadow-lg"
                onClick={handleGetStarted}
              >
                GET STARTED—NO SETUP FEE
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
