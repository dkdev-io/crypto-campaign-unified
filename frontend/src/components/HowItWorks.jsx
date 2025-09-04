import { Card, CardContent } from "./ui/card";
import { UserPlus, CreditCard, Brush, Share, BarChart } from "lucide-react";

const steps = [
  {
    icon: CreditCard,
    title: "Contribution Set-Up",
    description: "Credit/debit card processor and/or crypto wallet—guided setup",
    step: "01"
  },
  {
    icon: Brush,
    title: "Customize Your Form",
    description: "Brand it and preview instantly",
    step: "02"
  },
  {
    icon: Share,
    title: "Embed & Share",
    description: "Add your form to your website, email, or social channels",
    step: "03"
  },
  {
    icon: BarChart,
    title: "Track & Grow",
    description: "Monitor donations and campaign activity in your dashboard",
    step: "04"
  }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="content-section bg-background">
      <div className="container-responsive">
        <div className="text-center mb-16">
          <h2 className="mb-6" style={{color: 'hsl(var(--crypto-navy))'}}>
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get started in minutes with our simple 4-step process
          </p>
        </div>

        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1" 
               style={{background: `linear-gradient(to right, hsl(var(--crypto-light-gray)), hsl(var(--crypto-gold) / 0.3), hsl(var(--crypto-light-gray)))`}} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="crypto-card text-center" style={{backgroundColor: '#E3F2FD'}}>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 relative"
                       style={{background: 'var(--gradient-section)'}}>
                    <step.icon className="w-8 h-8" style={{color: 'hsl(var(--crypto-navy))'}} />
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
                         style={{backgroundColor: 'hsl(var(--crypto-gold))'}}>
                      <span className="text-sm font-bold" style={{color: 'hsl(var(--crypto-navy))'}}>
                        {step.step}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-4" style={{color: '#1976D2'}}>
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{color: '#1976D2'}}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;