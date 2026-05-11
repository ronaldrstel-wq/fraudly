import { EN_MESSAGES } from "@/lib/messages.en";
import type { CriticalThreatKind } from "@/lib/scanPresentation";
import { criticalThreatStatusHeadline } from "@/lib/scanPresentation";
import { clampScore, trustLevelFromScore, trustPresentationFromScore } from "@/lib/trustSystem";
import type { TrustLevel } from "@/lib/trustSystem";
import type { ScamVerdict } from "@/lib/trustSystem";
import type { ConfidenceLevel, SiteStatus } from "@/types/site-outcome";

function siteStatusUserLabel(status: SiteStatus): string {
  switch (status) {
    case "nonexistent":
      return EN_MESSAGES.siteOutcome.nonexistent;
    case "inactive":
      return EN_MESSAGES.siteOutcome.inactive;
    case "trusted":
      return EN_MESSAGES.siteOutcome.trusted;
    case "unverified":
      return EN_MESSAGES.siteOutcome.unverified;
    case "caution":
      return EN_MESSAGES.siteOutcome.caution;
    case "high_risk":
      return EN_MESSAGES.siteOutcome.highRisk;
    case "confirmed_malicious":
      return EN_MESSAGES.siteOutcome.confirmedMalicious;
  }
}

export type HumanRecKind =
  | "trusted"
  | "looksSafe"
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
}): HumanRecKind {
  const { threatActive, threatKind, siteStatus, trustLevel } = args;

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
    case "likelyLegit":
      return "looksSafe";
    case "limitedEvidence":
      return "notEnoughInfo";
    case "suspicious":
      return "beCareful";
    case "highRisk":
      return "highRisk";
    default:
      return "notEnoughInfo";
  }
}

export function humanRecHeadline(kind: HumanRecKind): string {
  const h = EN_MESSAGES.scanResult.humanRec.headlines;
  switch (kind) {
    case "trusted":
      return h.trusted;
    case "looksSafe":
      return h.looksSafe;
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
export function technicalStatusText(args: {
  threatActive: boolean;
  threatKind: CriticalThreatKind | null;
  displayTrust: number | null;
  siteStatus: SiteStatus;
}): string {
  const { threatActive, threatKind, displayTrust, siteStatus } = args;

  if (siteStatus === "nonexistent" || siteStatus === "inactive") {
    return siteStatusUserLabel(siteStatus);
  }

  if (threatActive && threatKind) {
    return criticalThreatStatusHeadline(threatKind);
  }

  if (siteStatus === "confirmed_malicious") {
    return EN_MESSAGES.siteOutcome.confirmedMalicious;
  }

  const trustScore = displayTrust ?? 0;
  return trustPresentationFromScore(trustScore).label;
}

/**
 * Short, plain explanation (layer 2 narrative — deterministic, not AI).
 */
export function shortScanExplanation(args: {
  threatActive: boolean;
  threatKind: CriticalThreatKind | null;
  siteStatus: SiteStatus;
  trustLevel: TrustLevel;
  confidenceLevel: ConfidenceLevel;
}): string {
  const { threatActive, threatKind, siteStatus, trustLevel, confidenceLevel } = args;
  const s = EN_MESSAGES.scanResult.shortExplain;

  if (siteStatus === "nonexistent") return s.invalidDomain;
  if (siteStatus === "inactive") return s.unreachable;

  if (threatActive && threatKind) {
    const t = EN_MESSAGES.scanResult.whyThreat;
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

  const lowCoverage = confidenceLevel === "low";
  if (lowCoverage && trustLevel !== "trusted") {
    return s.notEnoughInfoLowCoverage;
  }

  switch (trustLevel) {
    case "trusted":
      return s.trusted;
    case "likelyLegit":
      return s.looksSafe;
    case "limitedEvidence":
      return s.notEnoughInfo;
    case "suspicious":
      return s.beCareful;
    case "highRisk":
      return s.highRisk;
    default:
      return s.notEnoughInfo;
  }
}

export function humanRecGlyph(kind: HumanRecKind): string {
  const g = EN_MESSAGES.scanResult.humanRec.glyphs;
  switch (kind) {
    case "trusted":
    case "looksSafe":
      return g.positive;
    case "notEnoughInfo":
    case "invalidDomain":
    case "unreachable":
      return g.info;
    case "beCareful":
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

export function shortExplainForBasic(verdict: ScamVerdict, riskScore: number): string {
  const kind = resolveHumanRecKindForBasicCheck(verdict, riskScore);
  const s = EN_MESSAGES.scanResult.shortExplain;
  if (verdict === "scam") return s.avoidGeneric;
  if (verdict === "suspicious") return s.beCareful;
  switch (kind) {
    case "trusted":
      return s.trusted;
    case "looksSafe":
      return s.looksSafe;
    case "notEnoughInfo":
      return s.notEnoughInfo;
    default:
      return s.looksSafe;
  }
}

export function humanRecHeadlineTone(kind: HumanRecKind): { text: string; icon: string } {
  switch (kind) {
    case "trusted":
      return { text: "text-emerald-800", icon: "text-emerald-600" };
    case "looksSafe":
      return { text: "text-teal-900", icon: "text-teal-600" };
    case "notEnoughInfo":
      return { text: "text-slate-700", icon: "text-slate-500" };
    case "beCareful":
      return { text: "text-amber-900", icon: "text-amber-600" };
    case "highRisk":
      return { text: "text-rose-800", icon: "text-rose-600" };
    case "avoidWebsite":
    case "dangerousWebsite":
      return { text: "text-red-950", icon: "text-red-600" };
    case "invalidDomain":
    case "unreachable":
      return { text: "text-slate-700", icon: "text-slate-500" };
    default:
      return { text: "text-slate-800", icon: "text-slate-500" };
  }
}
