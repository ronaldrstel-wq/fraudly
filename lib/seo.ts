import type { Metadata } from "next";

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
  "scam website checker",
  "phishing detection",
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
  "scam checker",
  "phishing checker",
  "email scam checker",
  "fraud detection"
] as const;

export const defaultTitle = "Fraudly — AI-Assisted Scam Website Checker";

export const defaultDescription =
  "Check if a website looks trustworthy using scam intelligence, reputation cues, phishing detection, SSL signals, AI-assisted summaries, and public latest checks—all in calm, consumer-first language.";

export const defaultOgDescription =
  "Free website safety checker for scam signals, phishing links, and shady online stores. Clear trust indicators—not hype.";
