import { Helmet } from "react-helmet-async";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Categories from "@/components/landing/Categories";
import EventsShowcase from "@/components/landing/EventsShowcase";
import ContestsShowcase from "@/components/landing/ContestsShowcase";
import Showcase from "@/components/landing/Showcase";
import Features from "@/components/landing/Features";
import Stats from "@/components/landing/Stats";
import HowItWorks from "@/components/landing/HowItWorks";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import { combineSchemas, getOrganizationSchema, getWebSiteSchema, getSoftwareApplicationSchema, getWebPageSchema } from "@/lib/structuredData";

const Index = () => {
  const structuredData = combineSchemas(
    getOrganizationSchema(),
    getWebSiteSchema(),
    getSoftwareApplicationSchema(),
    getWebPageSchema({
      title: 'USEQIV - Modern Contest Voting & Event Ticketing Platform',
      description: 'Secure, scalable platform for contest voting, event ticketing, crowdfunding, and custom forms. Power pageants, music competitions, awards shows, and events.',
      url: 'https://www.useqiv.com',
      image: 'https://www.useqiv.com/og-image.png',
    })
  );

  return (
    <>
      <Helmet>
        <title>USEQIV - Modern Contest Voting & Event Ticketing Platform</title>
        <meta 
          name="description" 
          content="Secure, scalable platform for contest voting, event ticketing, crowdfunding, and custom forms. Power pageants, music competitions, awards shows, and fashion events with anti-fraud voting and QR tickets." 
        />
        <meta name="keywords" content="contest voting, event ticketing, pageant voting, competition platform, QR tickets, voting platform, awards voting, music competition, crowdfunding, fundraising, online forms, event management" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <link rel="canonical" href="https://www.useqiv.com" />
        
        {/* Open Graph */}
        <meta property="og:title" content="USEQIV - Modern Contest Voting & Event Ticketing Platform" />
        <meta property="og:description" content="Secure, scalable platform for contest voting, event ticketing, and crowdfunding. Power pageants, competitions, and award shows." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.useqiv.com" />
        <meta property="og:image" content="https://www.useqiv.com/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="USEQIV" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@useqiv" />
        <meta name="twitter:title" content="USEQIV - Contest Voting & Event Ticketing" />
        <meta name="twitter:description" content="The all-in-one platform for secure contest voting, event ticketing, and crowdfunding." />
        <meta name="twitter:image" content="https://www.useqiv.com/og-image.png" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-muted">
        <Navbar />
        <main>
          <Hero />
          <Categories />
          <EventsShowcase />
          <ContestsShowcase />
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
