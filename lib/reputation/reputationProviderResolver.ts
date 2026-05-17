import type { ReputationEnrichment } from "@/lib/outscraper/reputation";
import type { GoogleLookupMeta, TrustpilotLookupMeta } from "@/lib/outscraper/api";
import type { GoogleMatchConfidence } from "@/lib/reputation/googleMatch";
import type { ReviewSignals } from "@/lib/reviewSignals";
import { publicIntelConfig } from "@/lib/public-intel/config";
import {
  resolveGoogleReviewMatch,
  resolveTrustpilotReviewMatch,
  type ReviewMatchConfidence
} from "@/lib/reputation/reviewMatchConfidence";
import {
  resolveGoogleReviewChannel,
  resolveTrustpilotReviewChannel,
  type ReviewChannelPresentation
} from "@/lib/reputation/reviewChannelPresentation";
import { sanitizeReviewFields } from "@/lib/reputation/reviewRatingNormalize";
import type { NormalizedReviewChannel } from "@/lib/trust/types";
import type { ReviewChannelSource } from "@/lib/reputation/reviewChannelPresentation";
import type { TrustpilotMatchConfidence } from "@/lib/reputation/trustpilotMatch";
import {
  GOOGLE_POSSIBLE_MATCH_UI_NOTE,
  GOOGLE_UNVERIFIED_UI_NOTE,
  MIN_REVIEWS_FOR_TRUST_SCORE,
  TRUSTPILOT_MEDIUM_CONFIDENCE_UI_NOTE
} from "@/lib/reputation/reviewConfig";

export type ReputationProviderId =
  | "google_outscraper"
  | "google_indexed"
  | "trustpilot_outscraper"
  | "trustpilot_public_page"
  | "reputation_cache";

export type ReputationConfidenceBand = "verified" | "limited" | "stale" | "unavailable" | "conflicting";

export type ReputationProviderSlice = {
  id: ReputationProviderId;
  status: "success" | "failed" | "skipped" | "stale";
  rating: number | null;
  reviewCount: number | null;
  band: ReputationConfidenceBand;
  usedInScore: boolean;
  displayInUi: boolean;
  reason: string;
  fetchedAt?: string | null;
};

export type ResolvedReputationProviders = {
  domain: string;
  providers: ReputationProviderSlice[];
  /** Scan-ready review signals after match resolution. */
  mergedReviewSignals: ReviewSignals;
  google: {
    display: NormalizedReviewChannel;
    scoringRating: number | null;
    scoringCount: number | null;
    match: ReturnType<typeof resolveGoogleReviewMatch>;
  };
  trustpilot: {
    display: NormalizedReviewChannel;
    scoringRating: number | null;
    scoringCount: number | null;
    match: ReturnType<typeof resolveTrustpilotReviewMatch>;
  };
  hasConflictingProviders: boolean;
  displaySource: { google: ReputationProviderId | null; trustpilot: ReputationProviderId | null };
  scoringSource: { google: ReputationProviderId | null; trustpilot: ReputationProviderId | null };
  hiddenReasons: string[];
};

const BAND_LABEL: Record<ReputationConfidenceBand, string> = {
  verified: "Verified",
  limited: "Limited",
  stale: "Stale",
  unavailable: "Unavailable",
  conflicting: "Conflicting signals"
};

export function reputationSourceConfidenceLabel(
  source: ReviewChannelSource,
  channel: Pick<NormalizedReviewChannel, "displayState" | "usedInTrustScore" | "found" | "showMetrics">
): string {
  const band = channelBandFromNormalized(channel);
  return `${source} · ${BAND_LABEL[band]}`;
}

function channelBandFromNormalized(
  channel: Pick<NormalizedReviewChannel, "displayState" | "usedInTrustScore" | "found" | "showMetrics">
): ReputationConfidenceBand {
  if (channel.displayState === "none") return "unavailable";
  if (channel.displayState === "low_confidence") return "conflicting";
  if (channel.displayState === "limited") return "limited";
  if (channel.usedInTrustScore && channel.showMetrics) return "verified";
  if (channel.found && channel.showMetrics) return "verified";
  if (channel.found) return "limited";
  return "unavailable";
}

function formatGoogleDisplay(rating: number | null, count: number | null, show: boolean): string | null {
  if (!show || rating == null || count == null) return null;
  return `Google: ${rating}/5 · Based on ${count.toLocaleString("en-US")} reviews`;
}

function formatTrustpilotDisplay(rating: number | null, count: number | null, show: boolean): string | null {
  if (!show || rating == null) return null;
  if (count != null) {
    return `Trustpilot: ${rating}/5 · Based on ${count.toLocaleString("en-US")} reviews`;
  }
  return `Trustpilot: ${rating}/5`;
}

function presentationToNormalized(
  presentation: ReviewChannelPresentation,
  matchConfidence: ReviewMatchConfidence
): NormalizedReviewChannel {
  return {
    rating: presentation.rating,
    reviewCount: presentation.reviewCount,
    confidence: matchConfidence,
    display: null,
    found: presentation.found,
    usedInTrustScore: presentation.usedInTrustScore,
    displayState: presentation.displayState,
    reputationLabel: presentation.reputationLabel,
    scoreImpactLabel: presentation.scoreImpactLabel,
    showMetrics: presentation.showMetrics,
    confidenceScore: presentation.confidenceScore,
    bodyMessage: presentation.bodyMessage
  };
}

function googleSliceFromEnrichment(enrichment: ReputationEnrichment): ReputationProviderSlice | null {
  const rating = enrichment.googleRating ?? enrichment.google?.rating ?? null;
  const count = enrichment.googleReviewCount ?? enrichment.google?.reviewCount ?? null;
  const conf = enrichment.googleMatchConfidence ?? enrichment.googleLookup?.confidence ?? "none";
  const exact = enrichment.googleLookup?.exactDomainMatch === true;
  if (rating == null && count == null && conf === "none") return null;

  const validated = conf === "high" && exact && rating != null && count != null && count >= MIN_REVIEWS_FOR_TRUST_SCORE;
  let band: ReputationConfidenceBand = "unavailable";
  let usedInScore = false;
  let displayInUi = false;
  let reason = "No Outscraper Google match";

  if (validated) {
    band = "verified";
    usedInScore = true;
    displayInUi = true;
    reason = "Outscraper validated exact-domain Google Business match";
  } else if (rating != null && count != null && count >= MIN_REVIEWS_FOR_TRUST_SCORE) {
    band = conf === "medium" || conf === "low" ? "conflicting" : "limited";
    reason = "Google metrics present without full domain validation";
    displayInUi = conf !== "none";
  } else if (rating != null && count == null) {
    band = "limited";
    reason = "Google rating without review count";
  }

  return {
    id: "google_outscraper",
    status: enrichment.publicSignals?.sourceStatus?.outscraper?.ok ? "success" : "failed",
    rating,
    reviewCount: count,
    band,
    usedInScore,
    displayInUi,
    reason,
    fetchedAt: enrichment.lastUpdated
  };
}

function googleSliceFromIndexed(
  rating: number | null,
  count: number | null,
  ok: boolean
): ReputationProviderSlice | null {
  if (rating == null && count == null) return null;
  return {
    id: "google_indexed",
    status: ok ? "success" : "failed",
    rating,
    reviewCount: count,
    band: rating != null && count != null && count >= MIN_REVIEWS_FOR_TRUST_SCORE ? "limited" : "limited",
    usedInScore: false,
    displayInUi: rating != null || count != null,
    reason: ok
      ? "Google indexed snippet baseline (unvalidated)"
      : "Google indexed snippet lookup failed"
  };
}

function trustpilotSliceFromEnrichment(enrichment: ReputationEnrichment): ReputationProviderSlice | null {
  const rating = enrichment.trustpilotRating ?? enrichment.trustpilot?.rating ?? null;
  const count = enrichment.trustpilotReviewCount ?? enrichment.trustpilot?.reviewCount ?? null;
  const conf: TrustpilotMatchConfidence | "none" =
    enrichment.trustpilotMatchConfidence ?? enrichment.trustpilotLookup?.confidence ?? "none";
  if (rating == null && count == null && conf === "none") return null;

  const high = conf === "high";
  const medium = conf === "medium";
  let band: ReputationConfidenceBand = "unavailable";
  let usedInScore = false;
  let displayInUi = false;
  let reason = "No Trustpilot match";

  if (high && rating != null && count != null && count >= MIN_REVIEWS_FOR_TRUST_SCORE) {
    band = "verified";
    usedInScore = true;
    displayInUi = true;
    reason = "Outscraper Trustpilot match (high confidence)";
  } else if (medium) {
    band = "limited";
    displayInUi = rating != null || count != null;
    reason = "Trustpilot possible match (medium confidence, not used in score)";
  } else if (conf !== "low" && (rating != null || count != null)) {
    band = "limited";
    displayInUi = true;
    reason = "Trustpilot data without score-grade confidence";
  } else if (conf === "low") {
    band = "unavailable";
    displayInUi = false;
    reason = "Trustpilot low-confidence match hidden";
  }

  return {
    id: "trustpilot_outscraper",
    status: enrichment.publicSignals?.sourceStatus?.outscraper?.ok ? "success" : "failed",
    rating,
    reviewCount: count,
    band,
    usedInScore,
    displayInUi,
    reason,
    fetchedAt: enrichment.lastUpdated
  };
}

function trustpilotSliceFromPublicPage(
  rating: number | null,
  count: number | null,
  ok: boolean
): ReputationProviderSlice | null {
  if (rating == null && count == null) return null;
  return {
    id: "trustpilot_public_page",
    status: ok ? "success" : "failed",
    rating,
    reviewCount: count,
    band: ok && (rating != null || count != null) ? "limited" : "unavailable",
    usedInScore: false,
    displayInUi: ok,
    reason: ok ? "Trustpilot public page scrape (unvalidated for scoring)" : "Trustpilot public page fetch failed"
  };
}

function pickBestGoogleSlice(slices: ReputationProviderSlice[]): ReputationProviderSlice | null {
  const order: ReputationConfidenceBand[] = ["verified", "limited", "stale", "conflicting", "unavailable"];
  const ranked = slices
    .filter((s) => s.displayInUi && (s.rating != null || s.reviewCount != null))
    .sort((a, b) => order.indexOf(a.band) - order.indexOf(b.band));
  return ranked[0] ?? null;
}

function pickBestTrustpilotSlice(slices: ReputationProviderSlice[]): ReputationProviderSlice | null {
  const order: ReputationConfidenceBand[] = ["verified", "limited", "stale", "unavailable", "conflicting"];
  const ranked = slices
    .filter((s) => s.displayInUi && (s.rating != null || s.reviewCount != null))
    .sort((a, b) => order.indexOf(a.band) - order.indexOf(b.band));
  return ranked[0] ?? null;
}

function sliceToReviewSignals(
  google: ReputationProviderSlice | null,
  trustpilot: ReputationProviderSlice | null
): Partial<ReviewSignals> {
  const googleRating = google?.displayInUi ? google.rating ?? undefined : undefined;
  const googleReviewCount = google?.displayInUi ? google.reviewCount ?? undefined : undefined;
  const tpRating = trustpilot?.displayInUi ? trustpilot.rating ?? undefined : undefined;
  const tpCount = trustpilot?.displayInUi ? trustpilot.reviewCount ?? undefined : undefined;

  const googleFromOutscraper = google?.id === "google_outscraper";
  const tpFromOutscraper = trustpilot?.id === "trustpilot_outscraper";

  return {
    googleFound: Boolean(google?.displayInUi && (googleRating != null || googleReviewCount != null)),
    googleRating,
    googleReviewCount,
    googleMatchConfidence: googleFromOutscraper
      ? google.band === "verified"
        ? "high"
        : google.band === "conflicting" || google.band === "limited"
          ? "low"
          : "none"
      : "none",
    googleExactDomainMatch: googleFromOutscraper && google.band === "verified",
    trustpilotFound: Boolean(trustpilot?.displayInUi && (tpRating != null || tpCount != null)),
    trustpilotRating: tpRating,
    trustpilotReviewCount: tpCount,
    trustpilotMatchConfidence: tpFromOutscraper
      ? trustpilot.band === "verified"
        ? "high"
        : trustpilot.band === "limited"
          ? "medium"
          : "none"
      : trustpilot?.band === "limited"
        ? "medium"
        : "none"
  };
}

export function resolveReputationProviders(input: {
  domain: string;
  enrichment: ReputationEnrichment | null | undefined;
  baseReviewSignals?: ReviewSignals;
  cacheRow?: { fetchedAt: string; expiresAt: string; payload: ReputationEnrichment } | null;
}): ResolvedReputationProviders {
  const enrichment = input.enrichment ?? null;
  const base = input.baseReviewSignals;
  const providers: ReputationProviderSlice[] = [];
  const hiddenReasons: string[] = [];

  if (enrichment) {
    const gOut = googleSliceFromEnrichment(enrichment);
    if (gOut) providers.push(gOut);
    else if (enrichment.publicSignals?.sourceStatus?.outscraper?.attempted) {
      providers.push({
        id: "google_outscraper",
        status: enrichment.publicSignals.sourceStatus.outscraper.ok ? "success" : "failed",
        rating: null,
        reviewCount: null,
        band: "unavailable",
        usedInScore: false,
        displayInUi: false,
        reason: enrichment.publicSignals.sourceStatus.outscraper.warning ?? "Outscraper Google lookup failed",
        fetchedAt: enrichment.lastUpdated
      });
    }

    const tpOut = trustpilotSliceFromEnrichment(enrichment);
    if (tpOut) providers.push(tpOut);

  }

  if (base?.googleRating != null || base?.googleReviewCount != null) {
    const indexed = googleSliceFromIndexed(
      base.googleRating ?? null,
      base.googleReviewCount ?? null,
      true
    );
    if (indexed) providers.push(indexed);
  }

  if (
    base?.trustpilotRating != null ||
    base?.trustpilotReviewCount != null ||
    base?.trustpilotFound
  ) {
    const tpPublic = trustpilotSliceFromPublicPage(
      base.trustpilotRating ?? null,
      base.trustpilotReviewCount ?? null,
      base.trustpilotFound
    );
    if (tpPublic && !providers.some((p) => p.id === "trustpilot_public_page")) {
      providers.push(tpPublic);
    }
  }

  if (input.cacheRow?.payload) {
    const cached = input.cacheRow.payload;
    const stale = new Date(input.cacheRow.expiresAt).getTime() <= Date.now();
    providers.push({
      id: "reputation_cache",
      status: stale ? "stale" : "success",
      rating: cached.googleRating,
      reviewCount: cached.googleReviewCount,
      band: stale ? "stale" : "limited",
      usedInScore: false,
      displayInUi: cached.googleRating != null || cached.googleReviewCount != null,
      reason: stale ? "Serving expired reputation cache" : "Fresh reputation cache available",
      fetchedAt: cached.lastUpdated
    });
  }

  const googleSlices = providers.filter((p) => p.id.startsWith("google"));
  const trustpilotSlices = providers.filter((p) => p.id.startsWith("trustpilot"));

  const googlePick = pickBestGoogleSlice(googleSlices);
  const trustpilotPick = pickBestTrustpilotSlice(trustpilotSlices);

  const signalsPartial = sliceToReviewSignals(googlePick, trustpilotPick);
  const mergedSignals: ReviewSignals = {
    googleFound: false,
    trustpilotFound: false,
    suspiciousReviewSignals: [],
    sources: [],
    warnings: [],
    publicReviewAvailabilityNotes: [],
    reviewFetchDebug: [],
    ...base,
    ...signalsPartial
  };

  const googlePresentation = resolveGoogleReviewChannel(mergedSignals);
  const trustpilotPresentation = resolveTrustpilotReviewChannel(mergedSignals);
  const googleMatch = resolveGoogleReviewMatch(mergedSignals);
  const trustpilotMatch = resolveTrustpilotReviewMatch(mergedSignals);

  const googleNormalized = presentationToNormalized(googlePresentation, googleMatch.confidence);
  googleNormalized.display = formatGoogleDisplay(
    googleNormalized.showMetrics ? googleNormalized.rating : null,
    googleNormalized.showMetrics ? googleNormalized.reviewCount : null,
    googleNormalized.showMetrics
  );

  const trustpilotNormalized = presentationToNormalized(trustpilotPresentation, trustpilotMatch.confidence);
  trustpilotNormalized.display = formatTrustpilotDisplay(
    trustpilotNormalized.showMetrics ? trustpilotNormalized.rating : null,
    trustpilotNormalized.showMetrics ? trustpilotNormalized.reviewCount : null,
    trustpilotNormalized.showMetrics
  );

  const scoredGoogle = googleSlices.filter(
    (s) => s.band === "verified" && s.rating != null && s.displayInUi
  );
  const hasConflictingProviders =
    scoredGoogle.length >= 2 &&
    Math.max(...scoredGoogle.map((s) => s.rating ?? 0)) -
      Math.min(...scoredGoogle.map((s) => s.rating ?? 0)) >=
      0.75;

  if (hasConflictingProviders) {
    hiddenReasons.push("Multiple verified Google sources disagree on rating");
    googleNormalized.displayState = "low_confidence";
    googleNormalized.showMetrics = false;
    googleNormalized.usedInTrustScore = false;
  }

  if (!googlePick?.displayInUi) {
    hiddenReasons.push(googlePick?.reason ?? "No displayable Google review data");
  }
  if (!trustpilotPick?.displayInUi) {
    hiddenReasons.push(trustpilotPick?.reason ?? "No displayable Trustpilot review data");
  }

  const googleMatchFinal = resolveGoogleReviewMatch(mergedSignals);
  const trustpilotMatchFinal = resolveTrustpilotReviewMatch(mergedSignals);
  const mergedReviewSignals: ReviewSignals = {
    ...mergedSignals,
    googleFound: googleMatchFinal.displayable,
    googleRating: googleMatchFinal.displayable ? googleMatchFinal.rating ?? undefined : undefined,
    googleReviewCount: googleMatchFinal.displayable ? googleMatchFinal.reviewCount ?? undefined : undefined,
    trustpilotFound: trustpilotMatchFinal.displayable,
    trustpilotRating: trustpilotMatchFinal.displayable ? trustpilotMatchFinal.rating ?? undefined : undefined,
    trustpilotReviewCount: trustpilotMatchFinal.displayable
      ? trustpilotMatchFinal.reviewCount ?? undefined
      : undefined
  };

  return {
    domain: input.domain,
    providers,
    mergedReviewSignals,
    google: {
      display: googleNormalized,
      scoringRating: googlePick?.usedInScore ? googlePick.rating : null,
      scoringCount: googlePick?.usedInScore ? googlePick.reviewCount : null,
      match: googleMatch
    },
    trustpilot: {
      display: trustpilotNormalized,
      scoringRating: trustpilotPick?.usedInScore ? trustpilotPick.rating : null,
      scoringCount: trustpilotPick?.usedInScore ? trustpilotPick.reviewCount : null,
      match: trustpilotMatch
    },
    hasConflictingProviders,
    displaySource: {
      google: googlePick?.id ?? null,
      trustpilot: trustpilotPick?.id ?? null
    },
    scoringSource: {
      google: googlePick?.usedInScore ? googlePick.id : null,
      trustpilot: trustpilotPick?.usedInScore ? trustpilotPick.id : null
    },
    hiddenReasons
  };
}

/** Do not replace a successful cache with an empty/failed fetch. */
export function mergeEnrichmentForCache(
  incoming: ReputationEnrichment,
  existing: ReputationEnrichment | null
): ReputationEnrichment {
  if (!existing) return incoming;
  const existingHadData =
    existing.providerState === "found" &&
    (existing.googleRating != null ||
      existing.googleReviewCount != null ||
      existing.trustpilotRating != null ||
      existing.trustpilotReviewCount != null);
  const incomingEmpty =
    incoming.providerState === "failed" ||
    incoming.providerState === "no_match" ||
    (incoming.googleRating == null &&
      incoming.googleReviewCount == null &&
      incoming.trustpilotRating == null &&
      incoming.trustpilotReviewCount == null);

  if (!existingHadData || !incomingEmpty) {
    return incoming;
  }

  return {
    ...incoming,
    providerState: existing.providerState,
    reputationStatus: existing.reputationStatus ?? incoming.reputationStatus,
    googleRating: incoming.googleRating ?? existing.googleRating,
    googleReviewCount: incoming.googleReviewCount ?? existing.googleReviewCount,
    trustpilotRating: incoming.trustpilotRating ?? existing.trustpilotRating,
    trustpilotReviewCount: incoming.trustpilotReviewCount ?? existing.trustpilotReviewCount,
    google: incoming.google?.rating != null ? incoming.google : existing.google,
    trustpilot: incoming.trustpilot?.rating != null ? incoming.trustpilot : existing.trustpilot,
    googleLookup: incoming.googleLookup ?? existing.googleLookup,
    googleMatchConfidence: incoming.googleMatchConfidence ?? existing.googleMatchConfidence,
    trustpilotLookup: incoming.trustpilotLookup ?? existing.trustpilotLookup,
    trustpilotMatchConfidence: incoming.trustpilotMatchConfidence ?? existing.trustpilotMatchConfidence,
    providerReason: `Preserved prior cache after failed refresh: ${incoming.providerReason ?? incoming.message ?? "provider_error"}`
  };
}

export function buildReviewSignalsFromEnrichment(
  base: ReviewSignals,
  enrichment: ReputationEnrichment | null | undefined
): ReviewSignals {
  if (!enrichment) return base;

  const resolved = resolveReputationProviders({
    domain: enrichment.normalizedDomain,
    enrichment,
    baseReviewSignals: base
  });

  const googleLookup = enrichment.googleLookup;
  const tpLookup = enrichment.trustpilotLookup;
  const googleConfidence = enrichment.googleMatchConfidence ?? googleLookup?.confidence ?? "none";
  const tpConfidence = enrichment.trustpilotMatchConfidence ?? tpLookup?.confidence ?? "none";

  let googleMatchNote = base.googleMatchNote;
  if (googleConfidence === "medium" || (googleConfidence === "low" && googleLookup?.matchedBusinessName)) {
    googleMatchNote = GOOGLE_POSSIBLE_MATCH_UI_NOTE;
  } else if (googleConfidence === "low" || googleConfidence === "none") {
    googleMatchNote = GOOGLE_UNVERIFIED_UI_NOTE;
  }

  const sources = [...base.sources];
  if (!sources.includes("Public reputation enrichment")) {
    sources.push("Public reputation enrichment");
  }

  return {
    ...resolved.mergedReviewSignals,
    sources,
    googleMatchScore: googleLookup?.confidenceScore ?? base.googleMatchScore,
    googleMatchedBusinessName: googleLookup?.matchedBusinessName ?? base.googleMatchedBusinessName,
    googleMatchedWebsite: googleLookup?.googleWebsite ?? base.googleMatchedWebsite,
    googleMatchConfidence: resolved.mergedReviewSignals.googleMatchConfidence,
    googleExactDomainMatch: resolved.mergedReviewSignals.googleExactDomainMatch,
    trustpilotMatchConfidence: resolved.mergedReviewSignals.trustpilotMatchConfidence,
    googleMatchNote,
    trustpilotMatchNote:
      tpConfidence === "medium" ? TRUSTPILOT_MEDIUM_CONFIDENCE_UI_NOTE : base.trustpilotMatchNote
  };
}

export function enrichmentProviderInventory(): {
  outscraper: boolean;
  outscraperApiKey: boolean;
  googleIndexed: boolean;
  trustpilotPublic: boolean;
  googlePlaces: boolean;
  trustpilotPrivateApi: boolean;
  enrichmentEnabled: boolean;
} {
  return {
    outscraper: publicIntelConfig.paidSources.outscraper,
    outscraperApiKey: Boolean(process.env.OUTSCRAPER_API_KEY?.trim()),
    googleIndexed: publicIntelConfig.publicSources.googleIndexedReviews,
    trustpilotPublic: publicIntelConfig.publicSources.trustpilot,
    googlePlaces: publicIntelConfig.paidSources.googlePlacesReviews,
    trustpilotPrivateApi: publicIntelConfig.paidSources.trustpilotPrivateApi,
    enrichmentEnabled: publicIntelConfig.enrichmentEnabled
  };
}
