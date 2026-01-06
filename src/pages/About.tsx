import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Users, Target, Award, Globe, Heart, Zap } from "lucide-react";

const About = () => {
  const values = [
    { icon: Heart, title: "Trust & Transparency", description: "We believe in building trust through transparent processes and secure systems." },
    { icon: Users, title: "Community First", description: "Our platform is designed to empower communities and bring people together." },
    { icon: Zap, title: "Innovation", description: "We continuously innovate to provide the best tools for event organizers." },
    { icon: Globe, title: "Accessibility", description: "Making event management accessible to organizers of all sizes across Africa." },
  ];


  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              About <span className="text-primary">USEQIV</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              We're on a mission to revolutionize how events are organized, managed, and experienced across Africa.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Our Mission</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Empowering Event Organizers Across Africa
            </h2>
            <div className="space-y-6 text-muted-foreground">
              <p>
                USEQIV was founded with a simple yet powerful vision: to provide African event organizers with world-class tools to create, manage, and grow their events. We understand the unique challenges faced by organizers in our region—from payment processing complexities to audience engagement—and we've built a platform that addresses each one.
              </p>
              <p>
                Our journey began when we noticed a gap in the market for a comprehensive, Africa-focused event management solution. Traditional platforms didn't cater to local payment methods, currencies, or the specific needs of African audiences. We set out to change that.
              </p>
              <p>
                From voting contests that power pageants and talent shows, to ticketed events for concerts and conferences, crowdfunding campaigns for creative projects, and form submissions for registrations and surveys—we provide an all-in-one platform that handles every aspect of event management with security, transparency, and ease of use at its core.
              </p>
              <p>
                What sets USEQIV apart is our commitment to the African market.
              </p>
              <p>
                We believe that every organizer, whether running a small community event or a large-scale national competition, deserves access to professional-grade tools. That's why we've made our platform accessible, affordable, and incredibly easy to use—no technical expertise required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 lg:py-24 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Our Values</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do at USEQIV.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div key={index} className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <value.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      <Footer />
    </div>
  );
};

export default About;