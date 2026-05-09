function readBool(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (raw == null || raw.trim() === "") return defaultValue;
  return raw.trim().toLowerCase() === "true";
}

export type PublicIntelSourceKey =
  | "trustpilot"
  | "reddit"
  | "scamadviser"
  | "dns"
  | "ssl"
  | "rdap"
  | "googleIndexedReviews";

export const publicIntelConfig = {
  enrichmentEnabled: readBool("ENABLE_PUBLIC_INTEL_ENRICHMENT", true),
  publicSources: {
    trustpilot: readBool("ENABLE_PUBLIC_INTEL_TRUSTPILOT", true),
    reddit: readBool("ENABLE_PUBLIC_INTEL_REDDIT", true),
    scamadviser: readBool("ENABLE_PUBLIC_INTEL_SCAMADVISER", true),
    dns: readBool("ENABLE_PUBLIC_INTEL_DNS", true),
    ssl: readBool("ENABLE_PUBLIC_INTEL_SSL", true),
    rdap: readBool("ENABLE_PUBLIC_INTEL_RDAP", true),
    // Internal baseline source, same safe default as other public collectors.
    googleIndexedReviews: readBool("ENABLE_PUBLIC_INTEL_GOOGLE_INDEXED_REVIEWS", true)
  },
  paidSources: {
    outscraper: readBool("ENABLE_OUTSCRAPER_ENRICHMENT", false),
    googlePlacesReviews: readBool("ENABLE_GOOGLE_PLACES_REVIEWS", false),
    trustpilotPrivateApi: readBool("ENABLE_TRUSTPILOT_PRIVATE_API", false)
  }
} as const;
