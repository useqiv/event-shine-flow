import { useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { 
  Search, Vote, Ticket, Heart, FileText, CreditCard, Shield, 
  Users, HelpCircle, ChevronRight, MessageSquare, Book, Video
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { icon: Vote, title: "Voting", description: "Learn how to vote and track your votes", href: "#voting" },
    { icon: Ticket, title: "Tickets", description: "Buying, using, and transferring tickets", href: "#tickets" },
    { icon: Heart, title: "Campaigns", description: "Donating and supporting campaigns", href: "#campaigns" },
    { icon: CreditCard, title: "Payments", description: "Payment methods and transactions", href: "#payments" },
    { icon: Users, title: "Account", description: "Managing your account settings", href: "#account" },
    { icon: Shield, title: "Security", description: "Keeping your account safe", href: "#security" },
  ];

  const faqs = [
    {
      question: "How do I vote in a contest?",
      answer: "To vote in a contest, navigate to the contest page, select your favorite contestant, choose the number of votes you want to purchase, and complete the payment. Your votes will be added instantly to the contestant's total."
    },
    {
      question: "How do I buy tickets for an event?",
      answer: "Go to the event page, select the ticket type you want, enter the quantity, and proceed to checkout. After payment, you'll receive a digital ticket with a QR code that will be scanned at the event entrance."
    },
    {
      question: "What payment methods are accepted?",
      answer: "We accept multiple payment methods including bank cards (Visa, Mastercard), bank transfers, mobile money (MTN, Airtel, etc.), and cryptocurrency (USDT). Payment options may vary by region."
    },
    {
      question: "How do I get a refund?",
      answer: "Refund policies are set by individual organizers. To request a refund, go to your ticket or vote purchase in your dashboard and click 'Request Refund'. The organizer will review and process your request."
    },
    {
      question: "Can I transfer my ticket to someone else?",
      answer: "Yes, most tickets can be transferred. Go to 'My Tickets' in your dashboard, select the ticket you want to transfer, and enter the recipient's email address. They'll receive an email to accept the transfer."
    },
    {
      question: "How do I become an organizer?",
      answer: "When you sign up, you can select 'Organizer' as your account type. This gives you access to create contests, events, and campaigns. You can also upgrade to an organizer account from your profile settings."
    },
    {
      question: "Are my payments secure?",
      answer: "Yes, all payments are processed through secure, encrypted channels. We use industry-standard security measures and never store your full card details on our servers."
    },
    {
      question: "How do influencer commissions work?",
      answer: "As an influencer, you get unique referral links for events and contests. When someone makes a purchase through your link, you earn a commission. Commissions are tracked in real-time and can be withdrawn to your bank or crypto wallet."
    },
  ];

  const resources = [
    { icon: Book, title: "User Guide", description: "Complete guide to using USEQIV", href: "#" },
    { icon: Video, title: "Video Tutorials", description: "Watch step-by-step tutorials", href: "#" },
    { icon: MessageSquare, title: "Contact Support", description: "Get help from our team", href: "/contact" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              How can we <span className="text-primary">help</span>?
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Search our knowledge base or browse categories below.
            </p>
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-6 text-lg rounded-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Browse by Category</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <a
                key={index}
                href={category.href}
                className="flex items-center gap-4 p-6 bg-card border border-border rounded-2xl hover:shadow-lg transition-all group"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <category.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{category.title}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 lg:py-24 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Frequently Asked Questions</h2>
              <p className="text-muted-foreground">
                Quick answers to the most common questions.
              </p>
            </div>
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  className="bg-card border border-border rounded-2xl px-6"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium text-foreground">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">More Resources</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {resources.map((resource, index) => (
              <Link
                key={index}
                to={resource.href}
                className="flex flex-col items-center text-center p-6 bg-card border border-border rounded-2xl hover:shadow-lg transition-shadow"
              >
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <resource.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{resource.title}</h3>
                <p className="text-sm text-muted-foreground">{resource.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <HelpCircle className="h-12 w-12 text-primary-foreground mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Still need help?
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Our support team is here to assist you. Get in touch and we'll respond as soon as possible.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/contact">Contact Support</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HelpCenter;