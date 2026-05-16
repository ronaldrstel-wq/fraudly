import type { Metadata } from "next";
import { SEO_DESCRIPTION } from "@/lib/seo-description";

export const SITE_URL = "https://fraudly.app" as const;

export { isProductionPublicSiteHost } from "@/lib/seo-host";

export const publicRobots: NonNullable<Metadata["robots"]> = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true
  }
};

export const privateRobots: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false
  }
};

/** User-specific or thin URLs: discourage indexing but allow following links. */
export const unindexedFollowRobots: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: true,
  googleBot: {
    index: false,
    follow: true
  }
};

export const defaultKeywords = [
  "scam checker",
  "phishing detection",
  "fake webshop",
  "website trust check",
  "safe link checker",
  "online fraud protection",
  "scam website checker",
  "fake webshop checker",
  "website trust checker",
  "suspicious website detection",
  "online scam protection",
  "check if website is legit",
  "website safety checker",
  "phishing link checker",
  "phishing website detector",
  "fake webshop check",
  "online store scam check",
  "is this website legit",
  "check if website is safe",
  "fake website checker",
  "phishing checker",
  "email scam checker",
  "fraud detection"
] as const;

export const defaultTitle = "Check if a Website or Webshop Is Safe | Fraudly";

export const defaultDescription = SEO_DESCRIPTION.home;

export const defaultOgDescription = SEO_DESCRIPTION.home;
