import type { BlogArticleDefinition } from "@/lib/blog/types";
import {
  commonPaypalPhishingScams,
  howScammersFakeTrustpilotReviews,
  howToCheckIfAWebsiteIsSafe,
  howToDetectFakeWebshops,
  topWarningSignsOfAScamWebsite
} from "@/lib/blog/articles";

const ALL: BlogArticleDefinition[] = [
  howToDetectFakeWebshops,
  howToCheckIfAWebsiteIsSafe,
  commonPaypalPhishingScams,
  howScammersFakeTrustpilotReviews,
  topWarningSignsOfAScamWebsite
];

export function getAllBlogArticles(): BlogArticleDefinition[] {
  return [...ALL].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getBlogArticle(slug: string): BlogArticleDefinition | undefined {
  return ALL.find((a) => a.slug === slug);
}

export function getBlogArticlesBySlugs(slugs: string[]): BlogArticleDefinition[] {
  const set = new Set(slugs);
  return ALL.filter((a) => set.has(a.slug));
}

export function getAllBlogSlugs(): string[] {
  return ALL.map((a) => a.slug);
}

export function getAllBlogPaths(): string[] {
  return getAllIntelligencePaths();
}

export function getAllIntelligencePaths(): string[] {
  return ["/intelligence", ...ALL.map((a) => `/intelligence/${a.slug}`)];
}
