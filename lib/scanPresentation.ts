import type { ExternalChecksResult } from "@/lib/checks/types";
import { EN_MESSAGES } from "@/lib/messages.en";
import type { ScamCheckResult } from "@/types/scam";
import { trustScoreFromRisk } from "@/lib/scoring/displayScore";
import { clampScore } from "@/lib/trustSystem";
import { collectMaliciousSignals, isConfirmedMalicious, type MaliciousSignals } from "@/lib/siteOutcome";

/** Max trust % when Tier‑1 threat intelligence confirms a match (min risk 80). */
export const CRITICAL_THREAT_MAX_TRUST = 20;

export type CriticalThreatKind =
  | "phishing_feed"
  | "malware_feed"
  | "government_warning"
  | "safe_browsing_phishing"
  | "safe_browsing_malware"
  | "intel_danger";

function safeBrowsingMalwareHints(threats: string[]): boolean {
  const t = threats.join(" ").toLowerCase();
  return /\b(malware|trojan|virus|evil\s*download|unwanted\s*software)\b/.test(t);
}

function hasTier1DangerIntel(providerEvidence: ScamCheckResult["providerEvidence"]): boolean {
  return providerEvidence.some((e) => e.severity === "danger" && e.matched);
}

/**
 * Detects Tier‑1 intelligence overrides: public feeds, police, Safe Browsing hits, or explicit danger-tier intel rows.
 */
export function assessCriticalThreat(result: Pick<ScamCheckResult, "openPhish" | "urlHaus" | "police" | "safeBrowsing" | "providerEvidence">): {
  active: boolean;
  /** Fine-grained label for UI; null if not active. */
  kind: CriticalThreatKind | null;
} {
  const m: MaliciousSignals = {
    policeListed: result.police.listedInPoliceScamDatabase,
    safeBrowsingFlagged: result.safeBrowsing.safeBrowsingStatus === "flagged",
    openPhishListed: result.openPhish.listed,
    urlHausListed: result.urlHaus.listed
  };

  if (!isConfirmedMalicious(m) && !hasTier1DangerIntel(result.providerEvidence)) {
    return { active: false, kind: null };
  }

  if (m.policeListed) return { active: true, kind: "government_warning" };
  if (m.openPhishListed) return { active: true, kind: "phishing_feed" };
  if (m.urlHausListed) return { active: true, kind: "malware_feed" };
  if (m.safeBrowsingFlagged) {
    if (safeBrowsingMalwareHints(result.safeBrowsing.safeBrowsingThreats)) {
      return { active: true, kind: "safe_browsing_malware" };
    }
    return { active: true, kind: "safe_browsing_phishing" };
  }
  if (hasTier1DangerIntel(result.providerEvidence)) return { active: true, kind: "intel_danger" };

  return { active: true, kind: "intel_danger" };
}

/** Primary user-facing reason line under a critical threat (English). */
export function primaryCriticalThreatReason(
  result: Pick<ScamCheckResult, "openPhish" | "urlHaus" | "police" | "safeBrowsing" | "providerEvidence">
): string {
  const { kind } = assessCriticalThreat(result);
  switch (kind) {
    case "phishing_feed":
      return "Listed in the OpenPhish public feed.";
    case "malware_feed":
      return "Listed in URLhaus malware URL intelligence.";
    case "government_warning":
      return result.police.policeWarningReason ?? "Overlap with a public police or government scam warning.";
    case "safe_browsing_phishing":
      return `Google Safe Browsing reported threats: ${result.safeBrowsing.safeBrowsingThreats.join(", ") || "phishing or deceptive content"}.`;
    case "safe_browsing_malware":
      return `Google Safe Browsing reported threats: ${result.safeBrowsing.safeBrowsingThreats.join(", ") || "malware or harmful software"}.`;
    case "intel_danger":
      return "One or more intelligence sources matched this host at danger severity.";
    default:
      return "Confirmed malicious or high-severity intelligence match.";
  }
}

/**
 * Trust score shown in the UI (0–100). When critical threat intel is active, clamps to {@link CRITICAL_THREAT_MAX_TRUST}.
 */
export function displayTrustScoreForResult(result: Pick<ScamCheckResult, "score" | "openPhish" | "urlHaus" | "police" | "safeBrowsing" | "providerEvidence" | "omitTrustScoreGauge">): number | null {
  if (result.omitTrustScoreGauge === true) return null;
  const raw = trustScoreFromRisk(result.score);
  const { active } = assessCriticalThreat(result);
  if (!active) return clampScore(raw);
  return Math.min(CRITICAL_THREAT_MAX_TRUST, clampScore(raw));
}

/** Bump stored risk so trust never reads above {@link CRITICAL_THREAT_MAX_TRUST} when Tier‑1 intel fires. */
export function requiresCriticalTrustClamp(checks: ExternalChecksResult): boolean {
  const m = collectMaliciousSignals(checks);
  if (isConfirmedMalicious(m)) return true;
  return hasTier1DangerIntel(checks.providerEvidence);
}

export function criticalThreatBannerTitle(kind: CriticalThreatKind | null): string {
  if (kind === "malware_feed" || kind === "safe_browsing_malware") return EN_MESSAGES.threatOverride.bannerTitleMalware;
  return EN_MESSAGES.threatOverride.bannerTitle;
}

/** User-facing line under threat status when Tier‑1 intel is active (overrides score-only labels). */
export function criticalThreatStatusHeadline(kind: CriticalThreatKind | null): string {
  switch (kind) {
    case "phishing_feed":
    case "safe_browsing_phishing":
      return EN_MESSAGES.threatOverride.confirmedPhishingRisk;
    case "malware_feed":
    case "safe_browsing_malware":
      return EN_MESSAGES.threatOverride.malwareDetected;
    case "government_warning":
    case "intel_danger":
      return EN_MESSAGES.threatOverride.confirmedMalicious;
    default:
      return EN_MESSAGES.siteOutcome.confirmedMalicious;
  }
}
