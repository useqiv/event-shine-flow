import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  FileText, CreditCard, GitBranch, Upload, Star, BarChart3, 
  Layers, Code, Globe, CheckCircle, ArrowRight, Palette
} from "lucide-react";

const SmartForms = () => {
  const features = [
    { 
      icon: CreditCard, 
      title: "Payment Integration", 
      description: "Collect payments directly through your forms. Perfect for registrations, applications, and orders." 
    },
    { 
      icon: GitBranch, 
      title: "Conditional Logic", 
      description: "Show or hide fields based on previous answers. Create dynamic, personalized form experiences." 
    },
    { 
      icon: Layers, 
      title: "Multi-Page Forms", 
      description: "Break long forms into digestible pages with progress indicators and navigation." 
    },
    { 
      icon: Upload, 
      title: "File Uploads", 
      description: "Accept document uploads, images, and other files with validation and size limits." 
    },
    { 
      icon: Star, 
      title: "Rating Fields", 
      description: "Collect ratings and feedback with beautiful star rating and scale inputs." 
    },
    { 
      icon: BarChart3, 
      title: "Response Analytics", 
      description: "Analyze submissions with built-in charts, exports, and detailed response breakdowns." 
    },
  ];

  const howItWorks = [
    { step: "1", title: "Build Your Form", description: "Drag and drop fields to create your perfect form in minutes." },
    { step: "2", title: "Add Logic & Payments", description: "Set up conditional rules and payment collection if needed." },
    { step: "3", title: "Share & Embed", description: "Share your form link or embed it on your website." },
    { step: "4", title: "Collect & Export", description: "Receive responses and export data to Excel or CSV." },
  ];

  const useCases = [
    "Event Registrations",
    "Job Applications",
    "Surveys & Feedback",
    "Order Forms",
    "Contact Forms",
    "Membership Signups",
    "Contest Entries",
    "Course Enrollments",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Smart Forms</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Build Powerful <span className="text-primary">Custom Forms</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Create beautiful forms with payments, conditional logic, file uploads, and multi-page support. No coding required.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/auth">Build a Form</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/forms">View Templates</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Create and publish forms in just a few simple steps.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-card border border-border rounded-2xl p-6 h-full">
                  <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ArrowRight className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 lg:py-24 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Advanced Form Features
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to create professional forms that convert.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases & Benefits */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Forms for Every Purpose
              </h2>
              <p className="text-muted-foreground mb-8">
                Whether you're collecting registrations, orders, applications, or feedback, our form builder adapts to your needs.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {useCases.map((useCase, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm text-foreground">{useCase}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border rounded-3xl p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-muted rounded-2xl">
                  <Palette className="h-10 w-10 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">Custom Branding</div>
                    <div className="text-sm text-muted-foreground">Add your logo and brand colors</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-muted rounded-2xl">
                  <Code className="h-10 w-10 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">Embed Anywhere</div>
                    <div className="text-sm text-muted-foreground">Embed forms on any website</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-muted rounded-2xl">
                  <Globe className="h-10 w-10 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">Public Links</div>
                    <div className="text-sm text-muted-foreground">Share with anyone, anywhere</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-muted rounded-2xl">
                  <CreditCard className="h-10 w-10 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">Collect Payments</div>
                    <div className="text-sm text-muted-foreground">Accept payments with forms</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-muted">
        <div className="container mx-auto px-4">
          <div className="bg-primary rounded-3xl p-8 lg:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Build Your Form?
            </h2>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
              Create your first form in minutes with our intuitive drag-and-drop builder.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/auth">
                Start Building
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SmartForms;
