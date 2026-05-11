import type { ExternalChecksResult } from "@/lib/checks/types";
import type { ReviewSignals } from "@/lib/reviewSignals";
import { computeTrustAnchors, type ScoringIdentityContext } from "@/lib/scoringIdentityContext";
import type { SiteStatus } from "@/types/site-outcome";
import type { WebsiteSignals } from "@/lib/aiScamReasons";

export type MaliciousSignals = {
  policeListed: boolean;
  safeBrowsingFlagged: boolean;
  openPhishListed: boolean;
  urlHausListed: boolean;
};

export function collectMaliciousSignals(checks: ExternalChecksResult): MaliciousSignals {
  return {
    policeListed: checks.police.listedInPoliceScamDatabase,
    safeBrowsingFlagged: checks.safeBrowsing.safeBrowsingStatus === "flagged",
    openPhishListed: checks.openPhish.listed,
    urlHausListed: checks.urlHaus.listed
  };
}

export function isConfirmedMalicious(m: MaliciousSignals): boolean {
  return (
    m.policeListed ||
    m.safeBrowsingFlagged ||
    m.openPhishListed ||
    m.urlHausListed
  );
}

/**
 * Apex resolves and is not handled as nonexistent, but Fraudly fetched little or no public HTML/markup.
 * Typical: parked/for-sale placeholders, dormant projects, aggressive bot-blocking (conservative heuristic).
 */
export function isProbablyInactiveWebsite(args: {
  dnsResolvable: boolean;
  treatAsNonexistent: boolean;
  websiteSignals: WebsiteSignals | null;
  ssl: ExternalChecksResult["ssl"];
}): boolean {
  if (!args.dnsResolvable || args.treatAsNonexistent) return false;
  if (!args.websiteSignals?.availability) return false;
  return args.websiteSignals.availability.status === "unavailable";
}

export function deriveSiteStatus(args: {
  scoreRisk: number;
  malicious: MaliciousSignals;
  treatAsNonexistent: boolean;
  inactiveWebsite: boolean;
  ctx: ScoringIdentityContext | undefined;
  reviewSignals: ReviewSignals;
  /** Tier‑1 feed/police/Safe Browsing/danger-tier intel — same as `requiresCriticalTrustClamp` in scan pipeline. */
  tier1Threat?: boolean;
}): SiteStatus {
  if (args.treatAsNonexistent) return "nonexistent";
  if (args.tier1Threat || isConfirmedMalicious(args.malicious)) return "confirmed_malicious";
  if (args.inactiveWebsite) return "inactive";

  const trust = Math.max(0, Math.min(100, Math.round(100 - args.scoreRisk)));

  const anchors = args.ctx ? computeTrustAnchors(args.ctx.ageDaysKnown, args.reviewSignals) : computeTrustAnchors(undefined, args.reviewSignals);
  const anchorsPresent =
    anchors.hasAnchoredReputation ||
    anchors.hasStrongReputation ||
    (args.ctx?.domainPatterns.officialRegistrableExempt ?? false) ||
    (!args.ctx?.rdapFailed &&
      typeof args.ctx?.ageDaysKnown === "number" &&
      (args.ctx?.ageDaysKnown ?? 0) >= 730);

  /** Policy namespaces: high trust but may sit just under the 90 trust band from residual scoring noise. */
  if (
    args.ctx?.domainPatterns.officialRegistrableExempt &&
    trust >= 85 &&
    !args.ctx.domainPatterns.hasStrongLexicalSuspicion
  ) {
    return "trusted";
  }

  if (trust >= 90 && anchorsPresent && !args.ctx?.domainPatterns.hasStrongLexicalSuspicion) return "trusted";
  if (trust >= 90) return "unverified";
  /** Aligns with consumer trust presentation (80+ top band): further review until genuinely low trust. */
  if (trust >= 40) return "caution";
  return "high_risk";
}
