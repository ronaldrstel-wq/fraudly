export type BlogContentBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

export type BlogSection = {
  id: string;
  title: string;
  level?: 2 | 3;
  blocks: BlogContentBlock[];
};

export type BlogHeroImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type IntelligenceCategory =
  | "Scam Intelligence"
  | "Consumer Safety Guide"
  | "Fraud Prevention"
  | "Threat Awareness";

export type BlogArticleDefinition = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  targetKeyword: string;
  /** Small label on cards and hero (trust/security UX). */
  category: IntelligenceCategory;
  excerpt: string;
  publishedAt: string;
  hero: BlogHeroImage;
  intro: string;
  sections: BlogSection[];
  relatedSlugs: string[];
};
