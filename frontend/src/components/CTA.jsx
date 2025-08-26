const CTA = () => {
  return (
    <section className="hero-section">
      <div className="container-responsive text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-5xl lg:text-6xl font-bold leading-tight">
            Ready to Transform Your
            <span className="block" style={{color: 'hsl(var(--crypto-gold))'}}>
              Campaign Fundraising?
            </span>
          </h2>
          
          <p className="text-xl leading-relaxed opacity-90">
            Reach the growing crypto currency donor community and fundraise with lower fees.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
            <button 
              className="btn-secondary text-lg px-12 py-4 font-bold"
              onClick={() => {
                window.location.href = '/setup';
              }}
            >
              Get Started—No Setup Fee
            </button>
          </div>

          <p className="text-sm opacity-70">
            No credit card required • Setup in under 10 minutes • Full compliance included
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;