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
    <section id="how-it-works" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-bebas text-4xl lg:text-6xl text-primary mb-4">
            How It Works
          </h2>
          <p className="font-georgia text-xl text-muted-foreground max-w-3xl mx-auto">
            Get started in minutes with our simple 4-step process
          </p>
        </div>

        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-secondary via-accent/20 to-secondary transform -translate-y-1/2" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <Card className="border-2 border-secondary hover:border-accent/50 transition-all duration-300 bg-card shadow-card">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-accent rounded-full flex items-center justify-center mx-auto mb-6 relative">
                      <step.icon className="w-8 h-8 text-primary" />
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                        <span className="font-bebas text-sm text-accent-foreground">
                          {step.step}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-bebas text-xl text-primary mb-3">
                      {step.title}
                    </h3>
                    <p className="font-georgia text-muted-foreground text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;