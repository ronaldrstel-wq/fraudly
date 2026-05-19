import type { ResultFlowMessages } from "@/lib/i18n/result-flow";
import { resultFlowOrDefault } from "@/lib/i18n/result-flow/messages";
import type { CriticalThreatKind } from "@/lib/scanPresentation";
import { criticalThreatStatusHeadline } from "@/lib/scanPresentation";
import { clampScore } from "@/lib/clampScore";
import { getTrustDescription } from "@/lib/trustScoreUi";
import { getTrustBandFromScore } from "@/lib/scoring/trust-bands";
import { headlineToneFromScore } from "@/lib/scoring/trust-bands";
import { trustLevelFromScore, trustPresentationFromScore } from "@/lib/trustSystem";
import type { TrustLevel } from "@/lib/trustSystem";
import type { ScamVerdict } from "@/lib/trustSystem";
import type { ConfidenceLevel, SiteStatus } from "@/types/site-outcome";

function siteStatusUserLabel(status: SiteStatus, flow: ResultFlowMessages): string {
  const o = flow.siteOutcome;
  switch (status) {
    case "nonexistent":
      return o.nonexistent;
    case "inactive":
      return o.inactive;
    case "trusted":
      return o.trusted;
    case "unverified":
      return o.unverified;
    case "caution":
      return o.caution;
    case "high_risk":
      return o.highRisk;
    case "confirmed_malicious":
      return o.confirmedMalicious;
  }
}

export type HumanRecKind =
  | "trusted"
  | "looksSafe"
  | "looksMostlySafe"
  | "risky"
  | "notEnoughInfo"
  | "beCareful"
  | "highRisk"
  | "avoidWebsite"
  | "dangerousWebsite"
  | "invalidDomain"
  | "unreachable";

function isMalwareThreatKind(kind: CriticalThreatKind | null): boolean {
  return kind === "malware_feed" || kind === "safe_browsing_malware";
}

/**
 * Primary consumer-facing recommendation tier (one headline per result).
 */
export function resolveHumanRecKind(args: {
  threatActive: boolean;
  threatKind: CriticalThreatKind | null;
  siteStatus: SiteStatus;
  trustLevel: TrustLevel;
  hasActualRiskIndicators?: boolean;
}): HumanRecKind {
  const { threatActive, threatKind, siteStatus, trustLevel, hasActualRiskIndicators = true } = args;

  if (siteStatus === "nonexistent") return "invalidDomain";
  if (siteStatus === "inactive") return "unreachable";

  if (threatActive && threatKind) {
    return isMalwareThreatKind(threatKind) ? "dangerousWebsite" : "avoidWebsite";
  }

  if (siteStatus === "confirmed_malicious") {
    return "avoidWebsite";
  }

  switch (trustLevel) {
    case "trusted":
      return "trusted";
    case "mostlySafe":
      return "looksMostlySafe";
    case "caution":
      return "beCareful";
    case "risky":
      return "risky";
    case "highRisk":
      return "highRisk";
    default:
      return "notEnoughInfo";
  }
}

export function humanRecHeadline(kind: HumanRecKind, flow?: ResultFlowMessages): string {
  const h = resultFlowOrDefault(flow).scanResult.humanRec.headlines;
  switch (kind) {
    case "trusted":
      return h.trusted;
    case "looksSafe":
      return h.looksSafe;
    case "looksMostlySafe":
      return h.looksMostlySafe;
    case "risky":
      return h.risky;
    case "notEnoughInfo":
      return h.notEnoughInfo;
    case "beCareful":
      return h.beCareful;
    case "highRisk":
      return h.highRisk;
    case "avoidWebsite":
      return h.avoidWebsite;
    case "dangerousWebsite":
      return h.dangerousWebsite;
    case "invalidDomain":
      return h.invalidDomain;
    case "unreachable":
      return h.unreachable;
    default:
      return h.notEnoughInfo;
  }
}

/**
 * Technical classification (secondary line): trust band label, threat intel label, or site-outcome label.
 */
export function technicalStatusText(
  args: {
    threatActive: boolean;
    threatKind: CriticalThreatKind | null;
    displayTrust: number | null;
    siteStatus: SiteStatus;
  },
  flow?: ResultFlowMessages
): string {
  const messages = resultFlowOrDefault(flow);
  const { threatActive, threatKind, displayTrust, siteStatus } = args;

  if (siteStatus === "nonexistent" || siteStatus === "inactive") {
    return siteStatusUserLabel(siteStatus, messages);
  }

  if (threatActive && threatKind) {
    return criticalThreatStatusHeadline(threatKind, messages);
  }

  if (siteStatus === "confirmed_malicious") {
    return messages.siteOutcome.confirmedMalicious;
  }

  const trustScore = displayTrust ?? 0;
  return trustPresentationFromScore(trustScore).label;
}

/**
 * Short, plain explanation (layer 2 narrative — deterministic, not AI).
 */
export function shortScanExplanation(
  args: {
    threatActive: boolean;
    threatKind: CriticalThreatKind | null;
    siteStatus: SiteStatus;
    /** Display trust score 0–100 (same basis as the gauge). */
    displayTrust: number;
    confidenceLevel: ConfidenceLevel;
    hasActualRiskIndicators?: boolean;
  },
  flow?: ResultFlowMessages
): string {
  const messages = resultFlowOrDefault(flow);
  const { threatActive, threatKind, siteStatus, displayTrust, confidenceLevel, hasActualRiskIndicators = true } = args;
  const s = messages.scanResult.shortExplain;

  if (siteStatus === "nonexistent") return s.invalidDomain;
  if (siteStatus === "inactive") return s.unreachable;

  if (threatActive && threatKind) {
    const t = messages.scanResult.whyThreat;
    switch (threatKind) {
      case "phishing_feed":
      case "safe_browsing_phishing":
        return s.avoidPhishing;
      case "malware_feed":
      case "safe_browsing_malware":
        return s.dangerousMalware;
      case "government_warning":
        return t.government;
      case "intel_danger":
        return t.intelDanger;
      default:
        return s.avoidGeneric;
    }
  }

  if (siteStatus === "confirmed_malicious") {
    return s.confirmedMalicious;
  }

  const t = clampScore(displayTrust);
  const lowCoverage = confidenceLevel === "low";
  if (lowCoverage && getTrustBandFromScore(t) !== "likely-safe" && hasActualRiskIndicators) {
    return s.notEnoughInfoLowCoverage;
  }

  return getTrustDescription(t);
}

export function humanRecGlyph(kind: HumanRecKind, flow?: ResultFlowMessages): string {
  const g = resultFlowOrDefault(flow).scanResult.humanRec.glyphs;
  switch (kind) {
    case "trusted":
    case "looksSafe":
    case "looksMostlySafe":
      return g.positive;
    case "risky":
      return g.warning;
    case "notEnoughInfo":
    case "invalidDomain":
    case "unreachable":
      return g.info;
    case "beCareful":
      return g.warning;
    case "highRisk":
      return g.warning;
    case "avoidWebsite":
    case "dangerousWebsite":
      return g.critical;
    default:
      return g.info;
  }
}

/** Tailwind classes for the primary human recommendation headline. */
/**
 * Basic (freemium) check has no site status or threat tier — derive a human headline from verdict + trust.
 */
export function resolveHumanRecKindForBasicCheck(verdict: ScamVerdict, riskScore: number): HumanRecKind {
  const trust = clampScore(100 - riskScore);
  const level = trustLevelFromScore(trust);
  /** Overview + basic checks: scam verdict maps to the same consumer headline as feed-confirmed risk. */
  if (verdict === "scam") return "avoidWebsite";
  if (verdict === "suspicious") return "beCareful";
  return resolveHumanRecKind({
    threatActive: false,
    threatKind: null,
    siteStatus: "unverified",
    trustLevel: level
  });
}

/** When only trust % and verdict are available (recent history, public lists). */
export function humanRecKindFromTrustVerdict(trustScore: number, verdict: ScamVerdict | null): HumanRecKind {
  const risk = clampScore(100 - clampScore(trustScore));
  const v = (verdict ?? "safe") as ScamVerdict;
  return resolveHumanRecKindForBasicCheck(v, risk);
}

export function shortExplainForBasic(verdict: ScamVerdict, riskScore: number, flow?: ResultFlowMessages): string {
  const s = resultFlowOrDefault(flow).scanResult.shortExplain;
  if (verdict === "scam") return s.avoidGeneric;
  if (verdict === "suspicious") return s.beCareful;
  return getTrustDescription(clampScore(100 - riskScore));
}

function humanRecKindRepresentativeScore(kind: HumanRecKind): number {
  switch (kind) {
    case "trusted":
    case "looksSafe":
      return 90;
    case "looksMostlySafe":
      return 77;
    case "beCareful":
    case "notEnoughInfo":
      return 60;
    case "risky":
      return 40;
    case "highRisk":
    case "avoidWebsite":
    case "dangerousWebsite":
      return 15;
    case "invalidDomain":
    case "unreachable":
    default:
      return 50;
  }
}

/** Semantic headline/icon colors — prefers live trust score when provided. */
export function humanRecHeadlineTone(
  kind: HumanRecKind,
  trustScore?: number | null
): { text: string; icon: string } {
  const score =
    typeof trustScore === "number" && Number.isFinite(trustScore)
      ? Math.max(0, Math.min(100, Math.round(trustScore)))
      : humanRecKindRepresentativeScore(kind);
  return headlineToneFromScore(score);
}
