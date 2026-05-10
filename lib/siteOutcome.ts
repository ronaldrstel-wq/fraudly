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

  const textLen = args.websiteSignals?.text?.trim().length ?? 0;
  const substantial = textLen >= 400;
  if (substantial) return false;

  if (args.websiteSignals === null) return true;

  const thinParkedBand = textLen < 260;
  if (!thinParkedBand) return false;

  /* Valid TLS plus a modest scrape often still means something is reachable; avoid “inactive” for borderline SPA shells. */
  if (args.ssl.httpsEnabled && args.ssl.validCertificate && textLen >= 140) return false;

  return true;
}

export function deriveSiteStatus(args: {
  scoreRisk: number;
  malicious: MaliciousSignals;
  treatAsNonexistent: boolean;
  inactiveWebsite: boolean;
  ctx: ScoringIdentityContext | undefined;
  reviewSignals: ReviewSignals;
}): SiteStatus {
  if (args.treatAsNonexistent) return "nonexistent";
  if (isConfirmedMalicious(args.malicious)) return "confirmed_malicious";
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

  if (trust >= 80 && anchorsPresent && !args.ctx?.domainPatterns.hasStrongLexicalSuspicion) return "trusted";
  if (trust >= 80) return "unverified";
  /** Aligns with trust bands: “Likely Legit” through “Limited Evidence” stay in caution-style messaging, not high_risk. */
  if (trust >= 40) return "caution";
  return "high_risk";
}
