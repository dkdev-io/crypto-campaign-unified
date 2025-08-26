import { Button } from "./ui/button";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-hero py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent" />
      
      <div className="container relative mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="space-y-8">
            <h1 className="font-bebas text-5xl lg:text-7xl leading-tight text-primary-foreground">
              Raise More—Faster.
              <span className="block text-accent">
                The Easiest Way
              </span>
              for Campaigns to Accept Secure and Compliant Cryptocurrency Donations
            </h1>
            
            <div className="space-y-4 text-lg text-primary-foreground/90 font-georgia">
              <p className="flex items-center justify-center">
                <span className="w-2 h-2 bg-accent rounded-full mr-3" />
                Onboard in minutes. No setup fees, ever.
              </p>
              <p className="flex items-center justify-center">
                <span className="w-2 h-2 bg-accent rounded-full mr-3" />
                Full compliance and reporting handled for you.
              </p>
            </div>

            <div className="flex justify-center">
              <Button 
                size="lg" 
                className="font-bebas text-lg bg-accent hover:bg-accent/90 text-accent-foreground shadow-button px-8 py-6"
                onClick={() => {
                  window.location.href = 'http://localhost:5173';
                }}
              >
                Get Started—No Setup Fee
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;