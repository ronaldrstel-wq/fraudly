/** Public URL base for scam intelligence articles (canonical routes). */
export const INTELLIGENCE_BASE_PATH = "/intelligence" as const;

export const INTELLIGENCE_BRAND = {
  name: "Fraudly Intelligence",
  shortName: "Intelligence",
  tagline: "Scam intelligence & consumer safety guides",
  indexEyebrow: "Fraudly Intelligence",
  articleEyebrow: "Scam Intelligence",
  latestHeading: "Latest scam intelligence",
  featuredLabel: "Featured intelligence",
  relatedHeading: "Related intelligence",
  backToIndex: "← Back to Fraudly Intelligence"
} as const;

export function intelligenceArticlePath(slug: string): string {
  return `${INTELLIGENCE_BASE_PATH}/${slug}`;
}
