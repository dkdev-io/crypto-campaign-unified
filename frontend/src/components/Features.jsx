import { Card, CardContent } from "./ui/card";
import { Clock, Code, Users, DollarSign, Shield, Palette, Eye } from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "Instant Onboarding",
    description: "Start collecting donations the same day you sign up. Add your logo, colors, and donation asks in minutes"
  },
  {
    icon: Code,
    title: "Easy Integration", 
    description: "Embed a branded contribution form on your website with one line of code"
  },
  {
    icon: Users,
    title: "Reach Crypto Donors",
    description: "Accept contributions from a growing community"
  },
  {
    icon: DollarSign,
    title: "Lower Fees",
    description: "Spend less on processing and more on your campaign's goals"
  },
  {
    icon: Shield,
    title: "Fully Compliant",
    description: "Strong KYC and other safeguards"
  },
  {
    icon: Eye,
    title: "Transparent Pricing",
    description: "No setup fee, no hidden costs—just a clear per-donation fee"
  }
];

const Features = () => {
  return (
    <section id="features" className="content-section">
      <div className="container-responsive">
        <div className="text-center mb-16">
          <h2 className="mb-6 font-bold" style={{color: 'hsl(var(--crypto-navy))'}}>
            Features
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to accept cryptocurrency donations with confidence
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div style={{background: 'red', color: 'white', padding: '2rem', margin: '1rem', textAlign: 'center'}}>
            🔥 TESTING: If you can see this red box, changes ARE working! 🔥
          </div>
          {features.map((feature, index) => (
            <div key={index} className="crypto-card">
              <div className="w-14 h-14 rounded-lg flex items-center justify-center mb-6" 
                   style={{backgroundColor: 'hsl(var(--crypto-gold) / 0.1)'}}>
                <feature.icon className="w-7 h-7" style={{color: 'hsl(var(--crypto-gold))'}} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-center" style={{color: 'hsl(var(--crypto-navy))'}}>
                {feature.title}
              </h3>
              <p className="leading-relaxed" style={{color: 'hsl(var(--crypto-navy))'}}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;