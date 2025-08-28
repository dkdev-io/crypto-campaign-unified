import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuth } from '../contexts/AuthContext';

const CTA = () => {
  const navigate = useNavigate();
  const { user, loading, isEmailVerified } = useAuth();

  const handleGetStarted = () => {
    console.log('CTA Get Started clicked - Auth state:', { user: !!user, loading, verified: user ? isEmailVerified() : false });
    
    // Check if user is authenticated
    if (!loading && user) {
      // Check if email is verified
      if (isEmailVerified()) {
        // User is authenticated and verified, proceed to campaign setup
        console.log('Navigating to /setup (user verified)');
        navigate('/setup');
      } else {
        // User is authenticated but not verified, go to auth page for verification
        console.log('Navigating to /campaigns/auth (user not verified)');
        navigate('/campaigns/auth');
      }
    } else {
      // User is not authenticated, redirect to sign up/sign in
      console.log('Navigating to /campaigns/auth (user not authenticated)');
      navigate('/campaigns/auth');
    }
  };

  return (
    <section className="py-24 bg-gradient-to-b from-primary to-primary/90 text-primary-foreground">
      <div className="container px-4 md:px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            Ready to Transform Your
            <span className="block text-accent">
              Campaign Fundraising?
            </span>
          </h2>
          
          <p className="text-xl leading-relaxed text-primary-foreground/90">
            Reach the growing crypto currency donor community and fundraise with lower fees.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-12 py-6 h-auto"
              onClick={handleGetStarted}
            >
              Get Started—No Setup Fee
            </Button>
          </div>

          <p className="text-sm text-primary-foreground/70">
            No credit card required • Setup in under 10 minutes
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;