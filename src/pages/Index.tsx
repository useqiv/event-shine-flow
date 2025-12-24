import { Helmet } from "react-helmet-async";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import HeroCards from "@/components/dashboard/HeroCards";
import Categories from "@/components/dashboard/Categories";
import UpcomingEvents from "@/components/dashboard/UpcomingEvents";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>EventSphere - Event Management & E-Ticketing Platform</title>
        <meta 
          name="description" 
          content="Discover and book tickets for music, tech, fashion, and nightlife events. Plan events, manage vendors, and experience seamless e-voting and e-ticketing." 
        />
        <meta name="keywords" content="events, tickets, e-voting, event planning, concerts, tech events, nightlife" />
        <meta property="og:title" content="EventSphere - Event Management & E-Ticketing Platform" />
        <meta property="og:description" content="Discover and book tickets for music, tech, fashion, and nightlife events." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="EventSphere - Event Management & E-Ticketing Platform" />
        <meta name="twitter:description" content="Discover and book tickets for music, tech, fashion, and nightlife events." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-accent/5 via-background to-primary/5">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="ml-64 min-h-screen">
          <Header />
          
          <div className="px-6 pb-8">
            <HeroCards />
            <Categories />
            <UpcomingEvents />
          </div>
        </main>
      </div>
    </>
  );
};

export default Index;
