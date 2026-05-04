export type ReviewSignals = {
  trustpilotFound: boolean;
  trustpilotScore?: number;
  reviewCount?: number;
  recentReviewSummary?: string[];
  suspiciousReviewSignals: string[];
};

/**
 * Safe MVP review intelligence layer.
 * This currently returns fallback/no-data signals and does not scrape websites.
 *
 * TODO: Replace with official Trustpilot API integration in production.
 */
export async function getReviewSignals(_domain: string): Promise<ReviewSignals> {
  return {
    trustpilotFound: false,
    suspiciousReviewSignals: ["No public review signals found"]
  };
}
