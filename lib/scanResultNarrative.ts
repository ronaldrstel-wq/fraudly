import type { ResultFlowMessages } from "@/lib/i18n/result-flow";
import { resultFlowOrDefault } from "@/lib/i18n/result-flow/messages";
import type { CriticalThreatKind } from "@/lib/scanPresentation";
import type { TrustLevel } from "@/lib/trustSystem";
import type { ConfidenceLevel, SiteStatus } from "@/types/site-outcome";

/**
 * Short, deterministic “why” line for the top of scan results (no AI).
 */
export function whyThisResultSummary(
  args: {
    threatActive: boolean;
    threatKind: CriticalThreatKind | null;
    siteStatus: SiteStatus;
    trustLevel: TrustLevel;
  },
  flow?: ResultFlowMessages
): string {
  const messages = resultFlowOrDefault(flow);
  const { threatActive, threatKind, siteStatus, trustLevel } = args;

  if (siteStatus === "nonexistent") return messages.scanResult.why.nonexistent;
  if (siteStatus === "inactive") return messages.scanResult.why.inactive;

  if (threatActive && threatKind) {
    const w = messages.scanResult.whyThreat;
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
    return messages.scanResult.why.confirmedMaliciousGeneric;
  }

  const b = messages.scanResult.whyTrustBand;
  switch (trustLevel) {
    case "trusted":
      return b.trusted;
    case "mostlySafe":
      return b.mostlySafe;
    case "caution":
      return b.caution;
    case "risky":
      return b.risky;
    case "highRisk":
      return b.highRisk;
    default:
      return b.mostlySafe;
  }
}

/** Action-oriented line beneath status / coverage. */
export function scanRecommendation(
  args: {
    threatActive: boolean;
    threatKind: CriticalThreatKind | null;
    siteStatus: SiteStatus;
    trustLevel: TrustLevel;
  },
  flow?: ResultFlowMessages
): string {
  const messages = resultFlowOrDefault(flow);
  const { threatActive, threatKind, siteStatus, trustLevel } = args;

  if (siteStatus === "nonexistent") {
    return messages.scanResult.recommend.nonexistent;
  }
  if (siteStatus === "inactive") {
    return messages.scanResult.recommend.inactive;
  }

  if (threatActive && threatKind) {
    const r = messages.scanResult.recommendThreat;
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
    return messages.scanResult.recommend.confirmedMalicious;
  }

  const t = messages.scanResult.recommendTrustBand;
  switch (trustLevel) {
    case "trusted":
      return t.trusted;
    case "mostlySafe":
      return t.mostlySafe;
    case "caution":
      return t.caution;
    case "risky":
      return t.risky;
    case "highRisk":
      return t.highRisk;
    default:
      return t.mostlySafe;
  }
}

/** Neutral contextual strip: unknown vs dangerous — not a warning, not red. */
export function shouldShowLimitedPublicStrip(args: {
  threatActive: boolean;
  confidenceLevel: ConfidenceLevel;
  siteStatus: SiteStatus;
}): boolean {
  if (args.threatActive) return false;
  if (args.siteStatus === "nonexistent" || args.siteStatus === "inactive") return false;
  if (args.siteStatus === "confirmed_malicious") return false;
  if (args.confidenceLevel === "low") return true;
  return false;
}
