const Hero = () => {
  return (
    <section className="hero-section">
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
      
      <div className="container-responsive relative">
        <div className="max-w-5xl mx-auto text-center animate-fade-in">
          <div className="space-y-8">
            <h1 className="text-balance leading-tight">
              Raise More—Faster.
              <span className="block" style={{color: 'hsl(var(--crypto-gold))'}}>
                The Easiest Way
              </span>
              for Campaigns to Accept Secure and Compliant Cryptocurrency Donations
            </h1>
            
            <div className="space-y-6 max-w-2xl mx-auto">
              <p className="flex items-center justify-center gap-3 text-lg">
                <span className="w-3 h-3 rounded-full" style={{backgroundColor: 'hsl(var(--crypto-gold))'}} />
                Onboard in minutes. No setup fees, ever.
              </p>
              <p className="flex items-center justify-center gap-3 text-lg">
                <span className="w-3 h-3 rounded-full" style={{backgroundColor: 'hsl(var(--crypto-gold))'}} />
                Full compliance and reporting handled for you.
              </p>
            </div>

            <div className="flex justify-center pt-4">
              <button 
                className="btn-secondary text-xl font-bold px-12 py-4"
                onClick={() => {
                  window.location.href = '/setup';
                }}
              >
                Get Started—No Setup Fee
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;