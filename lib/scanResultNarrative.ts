import { EN_MESSAGES } from "@/lib/messages.en";
import type { CriticalThreatKind } from "@/lib/scanPresentation";
import type { TrustLevel } from "@/lib/trustSystem";
import type { ConfidenceLevel, SiteStatus } from "@/types/site-outcome";

/**
 * Short, deterministic “why” line for the top of scan results (no AI).
 */
export function whyThisResultSummary(args: {
  threatActive: boolean;
  threatKind: CriticalThreatKind | null;
  siteStatus: SiteStatus;
  trustLevel: TrustLevel;
}): string {
  const { threatActive, threatKind, siteStatus, trustLevel } = args;

  if (siteStatus === "nonexistent") return EN_MESSAGES.scanResult.why.nonexistent;
  if (siteStatus === "inactive") return EN_MESSAGES.scanResult.why.inactive;

  if (threatActive && threatKind) {
    const w = EN_MESSAGES.scanResult.whyThreat;
    switch (threatKind) {
      case "phishing_feed":
        return w.phishingFeed;
      case "malware_feed":
        return w.malwareFeed;
      case "government_warning":
        return w.government;
      case "safe_browsing_phishing":
        return w.safeBrowsingPhishing;
      case "safe_browsing_malware":
        return w.safeBrowsingMalware;
      case "intel_danger":
        return w.intelDanger;
      default:
        return w.generic;
    }
  }

  if (siteStatus === "confirmed_malicious") {
    return EN_MESSAGES.scanResult.why.confirmedMaliciousGeneric;
  }

  const b = EN_MESSAGES.scanResult.whyTrustBand;
  switch (trustLevel) {
    case "trusted":
      return b.trusted;
    case "likelyLegit":
      return b.likelyLegit;
    case "limitedEvidence":
      return b.limitedPublicData;
    case "suspicious":
      return b.suspicious;
    case "highRisk":
      return b.highRisk;
    default:
      return b.limitedPublicData;
  }
}

/** Action-oriented line beneath status / coverage. */
export function scanRecommendation(args: {
  threatActive: boolean;
  threatKind: CriticalThreatKind | null;
  siteStatus: SiteStatus;
  trustLevel: TrustLevel;
}): string {
  const { threatActive, threatKind, siteStatus, trustLevel } = args;

  if (siteStatus === "nonexistent") {
    return EN_MESSAGES.scanResult.recommend.nonexistent;
  }
  if (siteStatus === "inactive") {
    return EN_MESSAGES.scanResult.recommend.inactive;
  }

  if (threatActive && threatKind) {
    const r = EN_MESSAGES.scanResult.recommendThreat;
    switch (threatKind) {
      case "phishing_feed":
      case "safe_browsing_phishing":
        return r.phishing;
      case "malware_feed":
      case "safe_browsing_malware":
        return r.malware;
      case "government_warning":
        return r.government;
      case "intel_danger":
        return r.intelDanger;
      default:
        return r.generic;
    }
  }

  if (siteStatus === "confirmed_malicious") {
    return EN_MESSAGES.scanResult.recommend.confirmedMalicious;
  }

  const t = EN_MESSAGES.scanResult.recommendTrustBand;
  switch (trustLevel) {
    case "trusted":
      return t.trusted;
    case "likelyLegit":
      return t.likelyLegit;
    case "limitedEvidence":
      return t.limitedPublicData;
    case "suspicious":
      return t.suspicious;
    case "highRisk":
      return t.highRisk;
    default:
      return t.limitedPublicData;
  }
}

/** Neutral contextual strip: unknown vs dangerous — not a warning, not red. */
export function shouldShowLimitedPublicStrip(args: {
  threatActive: boolean;
  confidenceLevel: ConfidenceLevel;
  trustLevel: TrustLevel;
  siteStatus: SiteStatus;
}): boolean {
  if (args.threatActive) return false;
  if (args.siteStatus === "nonexistent" || args.siteStatus === "inactive") return false;
  if (args.siteStatus === "confirmed_malicious") return false;
  if (args.confidenceLevel === "low") return true;
  return false;
}
