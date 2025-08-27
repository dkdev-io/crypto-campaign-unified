const Hero = () => {
  return (
    <section className="hero-section">
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
      
      <div className="container-responsive relative">
        <div className="max-w-5xl mx-auto text-center animate-fade-in">
          <div className="space-y-8">
            <h1 className="text-balance leading-tight font-extrabold">
              Raise More—Faster.
              <span className="block" style={{color: 'hsl(var(--crypto-gold))'}}>
                The Easiest Way
              </span>
              <span className="block">
                for Campaigns to Accept Secure and
              </span>
              <span className="block">
                Compliant Cryptocurrency Donations
              </span>
            </h1>
            
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-3 text-lg text-white">
                <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
                <span>Onboard in minutes. No setup fees, ever.</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-lg text-white">
                <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
                <span>Full compliance and reporting handled for you.</span>
              </div>
            </div>

            <div className="flex justify-center pt-8">
              <button 
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-xl px-12 py-4 rounded transition-colors shadow-lg"
                onClick={() => {
                  window.location.href = '/setup';
                }}
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