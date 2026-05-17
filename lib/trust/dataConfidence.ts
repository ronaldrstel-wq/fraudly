import type { NormalizedReviewChannel, NormalizedTrustResult } from "@/lib/trust/types";

/** Small UX badge states for reputation / enrichment transparency (Phase 3). */
export type DataConfidenceIndicator =
  | "verified"
  | "limited"
  | "stale"
  | "unavailable"
  | "conflicting";

export type DataConfidenceBadgeModel = {
  indicator: DataConfidenceIndicator;
  label: string;
  title: string;
};

const INDICATOR_COPY: Record<DataConfidenceIndicator, { label: string; title: string }> = {
  verified: {
    label: "Verified",
    title: "Data matched this domain with high confidence."
  },
  limited: {
    label: "Limited data",
    title: "Some signals were checked but not enough to score confidently."
  },
  stale: {
    label: "Stale",
    title: "Cached data may be older than the latest scan."
  },
  unavailable: {
    label: "Unavailable",
    title: "This data source could not be loaded for this check."
  },
  conflicting: {
    label: "Conflicting signals",
    title: "Different sources disagree — treat with extra caution."
  }
};

export function dataConfidenceBadge(indicator: DataConfidenceIndicator): DataConfidenceBadgeModel {
  return { indicator, ...INDICATOR_COPY[indicator] };
}

/** Review channel → confidence badge (never invents ratings). */
export function reviewChannelConfidenceIndicator(channel: NormalizedReviewChannel): DataConfidenceIndicator {
  if (channel.displayState === "none") return "unavailable";
  if (channel.displayState === "low_confidence") return "conflicting";
  if (channel.displayState === "limited") return "limited";
  if (channel.usedInTrustScore && channel.showMetrics) return "verified";
  if (channel.found && channel.showMetrics) return "verified";
  if (channel.found) return "limited";
  return "unavailable";
}

export function domainAgeConfidenceIndicator(
  normalized: Pick<NormalizedTrustResult, "domainAge">
): DataConfidenceIndicator | null {
  if (normalized.domainAge.verified) return "verified";
  if (normalized.domainAge.display.toLowerCase().includes("not verified")) return "unavailable";
  return "limited";
}

export function scanCoverageConfidenceIndicator(
  normalized: Pick<NormalizedTrustResult, "raw" | "showLimitedPublicStrip">
): DataConfidenceIndicator | null {
  const level = normalized.raw.confidenceLevel ?? "medium";
  if (normalized.showLimitedPublicStrip || level === "low") return "limited";
  if (level === "high") return "verified";
  return null;
}

export function feedConfidenceIndicator(
  normalized: Pick<NormalizedTrustResult, "feeds">
): DataConfidenceIndicator | null {
  if (normalized.feeds.status === "hit") return "verified";
  if (normalized.feeds.status === "unknown") return "unavailable";
  return null;
}

/** Marks reputation block stale when snapshot checkedAt is older than threshold. */
export function reputationStaleIndicator(checkedAtIso: string | null, maxAgeMs = 7 * 24 * 60 * 60 * 1000): DataConfidenceIndicator | null {
  if (!checkedAtIso) return null;
  const t = Date.parse(checkedAtIso);
  if (Number.isNaN(t)) return null;
  if (Date.now() - t > maxAgeMs) return "stale";
  return null;
}

export function collectNormalizedDataConfidenceBadges(
  normalized: NormalizedTrustResult,
  options?: { checkedAtIso?: string | null }
): DataConfidenceBadgeModel[] {
  const badges: DataConfidenceBadgeModel[] = [];
  const seen = new Set<DataConfidenceIndicator>();

  function push(indicator: DataConfidenceIndicator | null) {
    if (!indicator || seen.has(indicator)) return;
    seen.add(indicator);
    badges.push(dataConfidenceBadge(indicator));
  }

  push(scanCoverageConfidenceIndicator(normalized));
  push(domainAgeConfidenceIndicator(normalized));
  push(feedConfidenceIndicator(normalized));
  push(reputationStaleIndicator(options?.checkedAtIso ?? normalized.checkedAt));

  const google = reviewChannelConfidenceIndicator(normalized.reputation.google);
  const trustpilot = reviewChannelConfidenceIndicator(normalized.reputation.trustpilot);
  if (google === trustpilot) {
    push(google);
  } else {
    push(google);
    push(trustpilot);
    if (google === "verified" && trustpilot === "unavailable") {
      // no extra
    } else if (google !== trustpilot && google !== "unavailable" && trustpilot !== "unavailable") {
      push("conflicting");
    }
  }

  return badges.slice(0, 4);
}
