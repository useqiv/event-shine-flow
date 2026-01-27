import { Helmet } from "react-helmet-async";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Categories from "@/components/landing/Categories";
import EventsShowcase from "@/components/landing/EventsShowcase";
import Showcase from "@/components/landing/Showcase";
import Features from "@/components/landing/Features";
import Stats from "@/components/landing/Stats";
import HowItWorks from "@/components/landing/HowItWorks";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Useqiv - Modern Contest Voting & Event Ticketing Platform</title>
        <meta 
          name="description" 
          content="Secure, scalable platform for contest voting, event ticketing, and payout automation. Power pageants, music competitions, awards shows, and fashion events with anti-fraud voting and QR tickets." 
        />
        <meta name="keywords" content="contest voting, event ticketing, pageant voting, competition platform, QR tickets, voting platform, awards voting, music competition" />
        <link rel="canonical" href="https://useqiv.com" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Useqiv - Modern Contest Voting & Event Ticketing Platform" />
        <meta property="og:description" content="Secure, scalable platform for contest voting and event ticketing. Power pageants, competitions, and award shows." />
        <meta property="og:type" content="website" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Useqiv - Contest Voting & Event Ticketing" />
        <meta name="twitter:description" content="The all-in-one platform for secure contest voting and event ticketing." />
      </Helmet>

      <div className="min-h-screen bg-muted">
        <Navbar />
        <main>
          <Hero />
          <Categories />
          <EventsShowcase />
          <Showcase />
          <Features />
          <Stats />
          <HowItWorks />
          <CTA />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
