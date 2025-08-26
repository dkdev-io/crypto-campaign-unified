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
    <section id="features" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-bebas text-5xl lg:text-7xl text-primary mb-4">
            Key Features
          </h2>
          <p className="font-georgia text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to accept cryptocurrency donations with confidence
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-card bg-card hover:shadow-lg transition-all duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-bebas text-2xl text-primary mb-3">
                  {feature.title}
                </h3>
                <p className="font-georgia text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;