import { Helmet } from "react-helmet-async";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Stats from "@/components/landing/Stats";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>VotePass - Modern Contest Voting & Event Ticketing Platform</title>
        <meta 
          name="description" 
          content="Secure, scalable platform for contest voting, event ticketing, and payout automation. Power pageants, competitions, awards shows, and events with anti-fraud voting and QR tickets." 
        />
        <meta name="keywords" content="contest voting, event ticketing, pageant voting, competition platform, QR tickets, voting platform" />
        <link rel="canonical" href="https://votepass.com" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <Hero />
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
