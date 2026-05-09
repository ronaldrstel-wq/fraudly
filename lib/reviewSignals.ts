import "server-only";
import { normalizeDomain } from "@/lib/cache";
import { EN_MESSAGES } from "@/lib/messages.en";
import { publicIntelConfig } from "@/lib/public-intel/config";
import { collectIndexedReviewSnippets } from "@/lib/public-intel/reviews";
import { collectTrustpilot } from "@/lib/public-intel/trustpilot";

export type ReviewSignals = {
  googleFound: boolean;
  googleRating?: number;
  googleReviewCount?: number;
  trustpilotFound: boolean;
  trustpilotRating?: number;
  trustpilotReviewCount?: number;
  recentReviewSummary?: string[];
  suspiciousReviewSignals: string[];
  sources: string[];
  warnings: string[];
};

export function adjustScoreWithReviewSignals(baseScore: number, reviewSignals: ReviewSignals): number {
  let score = baseScore;
  const ratings: Array<{ rating: number; count: number }> = [];
  if (reviewSignals.googleFound && reviewSignals.googleRating != null) {
    ratings.push({ rating: reviewSignals.googleRating, count: reviewSignals.googleReviewCount ?? 0 });
  }
  if (reviewSignals.trustpilotFound && reviewSignals.trustpilotRating != null) {
    ratings.push({ rating: reviewSignals.trustpilotRating, count: reviewSignals.trustpilotReviewCount ?? 0 });
  }
  for (const item of ratings) {
    if (item.rating >= 4.3 && item.count >= 100) score -= 15;
    else if (item.rating <= 2.5 && item.count >= 10) score += 20;
    else if (item.rating <= 3.2 && item.count >= 25) score += 10;
  }
  return Math.max(0, Math.min(100, score));
}

export async function getReviewSignals(domain: string): Promise<ReviewSignals> {
  const normalizedDomain = normalizeDomain(domain);
  type TrustpilotResult = Awaited<ReturnType<typeof collectTrustpilot>>;
  type SnippetResult = Awaited<ReturnType<typeof collectIndexedReviewSnippets>>;
  const tasks: Array<Promise<TrustpilotResult | SnippetResult>> = [];
  const keys: Array<"trustpilot" | "snippets"> = [];
  if (publicIntelConfig.publicSources.trustpilot) {
    tasks.push(collectTrustpilot(normalizedDomain));
    keys.push("trustpilot");
  }
  if (publicIntelConfig.publicSources.googleIndexedReviews) {
    tasks.push(collectIndexedReviewSnippets(normalizedDomain));
    keys.push("snippets");
  }
  const settled = await Promise.allSettled(tasks);
  const trustpilotRes = settled[keys.indexOf("trustpilot")] ?? null;
  const snippetsRes = settled[keys.indexOf("snippets")] ?? null;

  const trustpilot = trustpilotRes && trustpilotRes.status === "fulfilled" ? (trustpilotRes.value as TrustpilotResult) : null;
  const snippets = snippetsRes && snippetsRes.status === "fulfilled" ? (snippetsRes.value as SnippetResult) : null;
  const warnings: string[] = [];
  const sources: string[] = [];

  if (trustpilot?.source) sources.push(trustpilot.source);
  if (snippets?.source) sources.push(snippets.source);
  if (trustpilotRes && trustpilotRes.status === "rejected") warnings.push("Trustpilot collector failed.");
  if (snippetsRes && snippetsRes.status === "rejected") warnings.push("Indexed review snippet collector failed.");
  if (trustpilot && !trustpilot.ok && trustpilot.warning) warnings.push(trustpilot.warning);
  if (snippets && !snippets.ok && snippets.warning) warnings.push(snippets.warning);

  const trustpilotRating = trustpilot?.data?.rating ?? undefined;
  const trustpilotReviewCount = trustpilot?.data?.reviewCount ?? undefined;
  const snippetRating = snippets?.data?.possibleRating ?? undefined;
  const snippetCount = snippets?.data?.possibleReviewCount ?? undefined;
  const suspiciousReviewSignals: string[] = [];

  const combinedRating = trustpilotRating ?? snippetRating;
  const combinedCount = trustpilotReviewCount ?? snippetCount;
  if (combinedRating != null && combinedCount != null) {
    if (combinedRating <= 2.8 && combinedCount >= 10) suspiciousReviewSignals.push("Public reviews indicate a low trust profile.");
    if (combinedRating >= 4.3 && combinedCount >= 100) suspiciousReviewSignals.push("Public reviews suggest a generally established profile.");
  } else {
    suspiciousReviewSignals.push(EN_MESSAGES.reviewEvidence.noPublicReviewProfile);
  }

  return {
    googleFound: snippetRating != null || snippetCount != null,
    googleRating: snippetRating,
    googleReviewCount: snippetCount,
    trustpilotFound: trustpilotRating != null || trustpilotReviewCount != null,
    trustpilotRating,
    trustpilotReviewCount,
    recentReviewSummary: undefined,
    suspiciousReviewSignals,
    sources,
    warnings
  };
}
