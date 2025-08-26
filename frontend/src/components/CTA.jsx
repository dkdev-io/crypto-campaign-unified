import { Button } from "./ui/button";

const CTA = () => {
  return (
    <section className="py-24 bg-gradient-hero">
      <div className="container mx-auto px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="font-bebas text-4xl lg:text-6xl text-primary-foreground">
            Ready to Transform Your
            <span className="block text-accent">Campaign Fundraising?</span>
          </h2>
          
          <p className="font-georgia text-xl text-primary-foreground/90 leading-relaxed">
            Reach the growing crypto currency donor community and fundraise with lower fees.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button 
              size="lg" 
              className="font-bebas text-lg bg-accent hover:bg-accent/90 text-accent-foreground shadow-button px-12 py-6"
              onClick={() => {
                window.location.href = 'http://localhost:5173';
              }}
            >
              Get Started—No Setup Fee
            </Button>
          </div>

          <p className="font-georgia text-sm text-primary-foreground/70">
            No credit card required • Setup in under 10 minutes • Full compliance included
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;