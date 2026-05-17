import "server-only";
import { normalizeDomain } from "@/lib/cache";
import { publicIntelConfig } from "@/lib/public-intel/config";
import { collectIndexedReviewSnippets } from "@/lib/public-intel/reviews";
import { collectTrustpilot } from "@/lib/public-intel/trustpilot";
import {
  appendNeutralAvailabilityOnce,
  classifyThirdPartyCollectorWarning,
  type ReviewFetchDebugBucket,
  type ReviewFetchDebugEntry,
  type ReviewFetchDebugSource
} from "@/lib/reviewSourceNormalization";
import {
  PUBLIC_REVIEW_NOT_MATCHED_COPY,
  resolveGoogleReviewMatch,
  resolveTrustpilotReviewMatch,
  reviewRatingsForScoringFromSignals
} from "@/lib/reputation/reviewMatchConfidence";
import { sanitizeReviewFields } from "@/lib/reputation/reviewRatingNormalize";

export type ReviewSignals = {
  googleFound: boolean;
  googleRating?: number;
  googleReviewCount?: number;
  trustpilotFound: boolean;
  trustpilotRating?: number;
  trustpilotReviewCount?: number;
  recentReviewSummary?: string[];
  suspiciousReviewSignals: string[];
  /** Legacy technical labels (e.g. “Trustpilot (public page)”). Omit from prominent UI. */
  sources: string[];
  /**
   * Legacy field: must not carry third‑party crawler/HTTP diagnostics (Trustpilot blocking Fraudly, etc.).
   * Prefer {@link publicReviewAvailabilityNotes}.
   */
  warnings: string[];
  /** Neutral, consumer-safe lines about whether review aggregates were obtainable. */
  publicReviewAvailabilityNotes: string[];
  /** Structured attribution for developer/debug UI buckets (never raw HTTP traces). */
  reviewFetchDebug: ReviewFetchDebugEntry[];
  /** Outscraper-validated Trustpilot match strength (display + scoring gate). */
  trustpilotMatchConfidence?: "high" | "medium" | "low" | "none";
  /** Optional UI note when Trustpilot match is medium confidence. */
  trustpilotMatchNote?: string;
};

export function adjustScoreWithReviewSignals(baseScore: number, reviewSignals: ReviewSignals): number {
  let score = baseScore;
  const ratings = reviewRatingsForScoringFromSignals(reviewSignals);
  for (const item of ratings) {
    if (item.rating >= 4.3 && item.count >= 100) score -= 15;
    else if (item.rating <= 2.5 && item.count >= 10) score += 20;
    else if (item.rating <= 3.2 && item.count >= 25) score += 10;
  }
  return Math.max(0, Math.min(100, score));
}

function pushDebug(
  rows: ReviewFetchDebugEntry[],
  source: ReviewFetchDebugSource,
  bucket: ReviewFetchDebugBucket,
  rawDetail: string | undefined,
  lines: string[]
): void {
  rows.push({ source, bucket });
  appendNeutralAvailabilityOnce(bucket, lines);
  if ((bucket === "provider_error" || bucket === "source_unavailable") && rawDetail) {
    console.warn("[reviewSignals] provider crawl", { source, bucket, detail: rawDetail.slice(0, 200) });
  }
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

  const publicReviewAvailabilityNotes: string[] = [];
  const reviewFetchDebug: ReviewFetchDebugEntry[] = [];
  const warnings: string[] = [];
  const sources: string[] = [];

  const tpSource: ReviewFetchDebugSource = "trustpilot_public";
  const gSource: ReviewFetchDebugSource = "google_indexed_snippets";

  if (trustpilot?.source) sources.push(trustpilot.source);
  if (snippets?.source) sources.push(snippets.source);

  if (trustpilotRes && trustpilotRes.status === "rejected") {
    const msg = trustpilotRes.reason instanceof Error ? trustpilotRes.reason.message : String(trustpilotRes.reason);
    pushDebug(reviewFetchDebug, tpSource, classifyThirdPartyCollectorWarning(msg), msg, publicReviewAvailabilityNotes);
  }

  if (snippetsRes && snippetsRes.status === "rejected") {
    const msg = snippetsRes.reason instanceof Error ? snippetsRes.reason.message : String(snippetsRes.reason);
    pushDebug(reviewFetchDebug, gSource, classifyThirdPartyCollectorWarning(msg), msg, publicReviewAvailabilityNotes);
  }

  if (trustpilot && !trustpilot.ok && trustpilot.warning) {
    const bucket = classifyThirdPartyCollectorWarning(trustpilot.warning);
    pushDebug(reviewFetchDebug, tpSource, bucket, trustpilot.warning, publicReviewAvailabilityNotes);
  }

  if (snippets && !snippets.ok && snippets.warning) {
    const bucket = classifyThirdPartyCollectorWarning(snippets.warning);
    pushDebug(reviewFetchDebug, gSource, bucket, snippets.warning, publicReviewAvailabilityNotes);
  }

  const trustpilotSanitized = sanitizeReviewFields(
    trustpilot?.data?.rating ?? null,
    trustpilot?.data?.reviewCount ?? null
  );
  const googleSanitized = sanitizeReviewFields(
    snippets?.data?.possibleRating ?? null,
    snippets?.data?.possibleReviewCount ?? null
  );
  const trustpilotRating = trustpilotSanitized.rating ?? undefined;
  const trustpilotReviewCount = trustpilotSanitized.reviewCount ?? undefined;
  const snippetRating = googleSanitized.rating ?? undefined;
  const snippetCount = googleSanitized.reviewCount ?? undefined;
  const suspiciousReviewSignals: string[] = [];

  const googleMatch = resolveGoogleReviewMatch({
    googleFound: false,
    googleRating: snippetRating,
    googleReviewCount: snippetCount,
    trustpilotFound: false,
    suspiciousReviewSignals: [],
    sources,
    warnings,
    publicReviewAvailabilityNotes,
    reviewFetchDebug
  });
  const trustpilotMatch = resolveTrustpilotReviewMatch({
    googleFound: false,
    trustpilotFound: false,
    trustpilotRating,
    trustpilotReviewCount,
    suspiciousReviewSignals: [],
    sources,
    warnings,
    publicReviewAvailabilityNotes,
    reviewFetchDebug
  });

  if (googleMatch.displayable && googleMatch.rating != null && googleMatch.reviewCount != null) {
    reviewFetchDebug.push({ source: gSource, bucket: "review_signal" });
    if (googleMatch.rating <= 2.8 && googleMatch.reviewCount >= 10) {
      suspiciousReviewSignals.push("Public reviews indicate a low trust profile.");
    }
    if (googleMatch.rating >= 4.3 && googleMatch.reviewCount >= 100) {
      suspiciousReviewSignals.push("Public reviews suggest a generally established profile.");
    }
  }
  if (trustpilotMatch.displayable && trustpilotMatch.rating != null && trustpilotMatch.reviewCount != null) {
    reviewFetchDebug.push({ source: tpSource, bucket: "review_signal" });
    if (trustpilotMatch.rating <= 2.8 && trustpilotMatch.reviewCount >= 10) {
      suspiciousReviewSignals.push("Public reviews indicate a low trust profile.");
    }
    if (trustpilotMatch.rating >= 4.3 && trustpilotMatch.reviewCount >= 100) {
      suspiciousReviewSignals.push("Public reviews suggest a generally established profile.");
    }
  }
  if (!googleMatch.displayable && !trustpilotMatch.displayable) {
    suspiciousReviewSignals.push(PUBLIC_REVIEW_NOT_MATCHED_COPY);
  }

  return {
    googleFound: googleMatch.displayable,
    googleRating: googleMatch.displayable ? googleMatch.rating ?? undefined : undefined,
    googleReviewCount: googleMatch.displayable ? googleMatch.reviewCount ?? undefined : undefined,
    trustpilotFound: trustpilotMatch.displayable,
    trustpilotRating: trustpilotMatch.displayable ? trustpilotMatch.rating ?? undefined : undefined,
    trustpilotReviewCount: trustpilotMatch.displayable ? trustpilotMatch.reviewCount ?? undefined : undefined,
    recentReviewSummary: undefined,
    suspiciousReviewSignals,
    sources,
    warnings,
    publicReviewAvailabilityNotes,
    reviewFetchDebug
  };
}
