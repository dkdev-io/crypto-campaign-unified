import { Card, CardContent } from './ui/card';
import { Clock, Code, Users, DollarSign, Shield, Palette, Eye } from 'lucide-react';

const features = [
  {
    icon: Clock,
    title: 'Instant Onboarding',
    description:
      'Start collecting donations the same day you sign up. Add your logo, colors, and donation asks in minutes',
  },
  {
    icon: Code,
    title: 'Easy Integration',
    description: 'Embed a branded contribution form on your website with one line of code',
  },
  {
    icon: Users,
    title: 'Reach Crypto Donors',
    description: 'Accept contributions from a growing community - in the way that these donors want to give.',
  },
  {
    icon: DollarSign,
    title: 'Lower Fees',
    description: 'Spend less on processing fees, and watch donations make more of an impact.',
  },
  {
    icon: Shield,
    title: 'Compliance and Safety',
    description: 'Safe and secure donations that are transparent and have strong KYC (Know Your Customer) standards.',
  },
  {
    icon: Eye,
    title: 'Transparent Pricing',
    description: 'More services for less fees. No set-up and lower processing fees than credit card donations.',
  },
];

const Features = () => {
  return (
    <section id="features" className="content-section">
      <div className="container-responsive">
        <div className="text-center mb-8">
          <h2
            className="text-3xl md:text-5xl mb-6 font-bold leading-tight"
            style={{ color: 'hsl(var(--crypto-white))' }}
          >
            Features
          </h2>
          <p
            className="text-xl md:text-2xl max-w-3xl mx-auto font-semibold leading-relaxed"
            style={{ color: 'hsl(var(--crypto-white) / 0.9)' }}
          >
            Everything you need to accept cryptocurrency donations with confidence
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="crypto-card text-center">
              <h3
                className="text-lg md:text-xl font-bold mb-4 leading-relaxed"
                style={{ color: 'hsl(var(--crypto-white))' }}
              >
                {feature.title}
              </h3>
              <div
                className="w-14 h-14 rounded-lg flex items-center justify-center mb-6 mx-auto"
                style={{ backgroundColor: 'hsl(var(--crypto-gold) / 0.1)' }}
              >
                <feature.icon className="w-7 h-7" style={{ color: 'hsl(var(--crypto-gold))' }} />
              </div>
              <p
                className="text-base md:text-lg leading-relaxed"
                style={{ color: 'hsl(var(--crypto-white) / 0.9)' }}
              >
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
