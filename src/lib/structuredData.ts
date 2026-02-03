/**
 * Structured Data (JSON-LD) generators for SEO
 * Following Schema.org specifications
 */

const SITE_URL = "https://www.useqiv.com";
const SITE_NAME = "USEQIV";
const LOGO_URL = `${SITE_URL}/logo.png`;

/**
 * Organization schema - represents the USEQIV brand
 */
export const getOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: LOGO_URL,
    width: 512,
    height: 512,
  },
  image: LOGO_URL,
  description:
    "USEQIV is the ultimate platform for hosting voting contests, selling event tickets, crowdfunding campaigns, Influencer Marketing and custom forms.",
  foundingDate: "2024",
  sameAs: [
    "https://twitter.com/useqiv",
    "https://facebook.com/useqiv",
    "https://instagram.com/useqiv",
    "https://linkedin.com/company/useqiv",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    email: "support@useqiv.com",
    availableLanguage: ["English"],
  },
});

/**
 * WebSite schema with search action for sitelinks searchbox
 */
export const getWebSiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  description:
    "The Complete Platform for Contest Voting, Event Ticketing, Influencer Marketing, Forms & Crowdfunding Success",
  publisher: {
    "@id": `${SITE_URL}/#organization`,
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
  inLanguage: "en-US",
});

/**
 * WebPage schema for generic pages
 */
export const getWebPageSchema = (props: {
  title: string;
  description: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${props.url}/#webpage`,
  name: props.title,
  description: props.description,
  url: props.url,
  isPartOf: {
    "@id": `${SITE_URL}/#website`,
  },
  about: {
    "@id": `${SITE_URL}/#organization`,
  },
  ...(props.image && {
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: props.image,
    },
  }),
  ...(props.datePublished && { datePublished: props.datePublished }),
  ...(props.dateModified && { dateModified: props.dateModified }),
  inLanguage: "en-US",
});

/**
 * Event schema for event detail pages
 */
export const getEventSchema = (event: {
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: string;
  address?: string;
  image?: string;
  url: string;
  organizerName?: string;
  price?: number;
  currency?: string;
  availability?: "InStock" | "SoldOut" | "PreOrder";
}) => ({
  "@context": "https://schema.org",
  "@type": "Event",
  name: event.name,
  description: event.description,
  startDate: event.startDate,
  ...(event.endDate && { endDate: event.endDate }),
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  location: {
    "@type": "Place",
    name: event.location,
    ...(event.address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: event.address,
      },
    }),
  },
  ...(event.image && {
    image: [event.image],
  }),
  url: event.url,
  organizer: {
    "@type": "Organization",
    name: event.organizerName || SITE_NAME,
    url: SITE_URL,
  },
  ...(event.price !== undefined && {
    offers: {
      "@type": "Offer",
      price: event.price,
      priceCurrency: event.currency || "NGN",
      availability: `https://schema.org/${event.availability || "InStock"}`,
      url: event.url,
      validFrom: new Date().toISOString(),
    },
  }),
});

/**
 * Product schema for contests (treating them as digital products)
 */
export const getContestSchema = (contest: {
  name: string;
  description: string;
  image?: string;
  url: string;
  startDate: string;
  endDate: string;
  votePrice?: number;
  currency?: string;
  category?: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: contest.name,
  description: contest.description,
  ...(contest.image && { image: contest.image }),
  url: contest.url,
  brand: {
    "@type": "Brand",
    name: SITE_NAME,
  },
  ...(contest.category && { category: contest.category }),
  ...(contest.votePrice !== undefined && {
    offers: {
      "@type": "Offer",
      price: contest.votePrice,
      priceCurrency: contest.currency || "NGN",
      availability: "https://schema.org/InStock",
      priceValidUntil: contest.endDate,
      url: contest.url,
    },
  }),
});

/**
 * Campaign/Fundraising schema
 */
export const getCampaignSchema = (campaign: {
  name: string;
  description: string;
  image?: string;
  url: string;
  goalAmount: number;
  currentAmount: number;
  currency: string;
  endDate?: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "DonateAction",
  name: campaign.name,
  description: campaign.description,
  url: campaign.url,
  ...(campaign.image && { image: campaign.image }),
  recipient: {
    "@type": "Organization",
    name: SITE_NAME,
  },
  priceSpecification: {
    "@type": "PriceSpecification",
    price: campaign.goalAmount,
    priceCurrency: campaign.currency,
  },
});

/**
 * BreadcrumbList schema for navigation
 */
export const getBreadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

/**
 * FAQ schema for help/FAQ pages
 */
export const getFAQSchema = (faqs: Array<{ question: string; answer: string }>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
});

/**
 * SoftwareApplication schema for the platform
 */
export const getSoftwareApplicationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "1250",
    bestRating: "5",
    worstRating: "1",
  },
  description:
    "USEQIV is a comprehensive platform for contest voting, event ticketing, crowdfunding, and custom forms.",
  url: SITE_URL,
  image: LOGO_URL,
  author: {
    "@id": `${SITE_URL}/#organization`,
  },
});

/**
 * Combine multiple schemas into a graph
 */
export const combineSchemas = (...schemas: object[]) => ({
  "@context": "https://schema.org",
  "@graph": schemas.map((schema) => {
    // Remove @context from individual schemas when combining
    const { "@context": _, ...rest } = schema as { "@context"?: string; [key: string]: any };
    return rest;
  }),
});
