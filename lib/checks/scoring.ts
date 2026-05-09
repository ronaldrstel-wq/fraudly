import type { ExternalChecksResult, TrustSignal } from "@/lib/checks/types";
import type { ProviderEvidenceResult } from "@/lib/checks/providers/types";
import type { ScoreEvidenceTier, ScoreSignal } from "@/lib/scoringEngine";

export type IntelScoreBreakdownEntry = {
  id: string;
  source?: string;
  label: string;
  impact: number;
  category: ScoreSignal["category"];
  confidence: ScoreSignal["confidence"];
  rationale: string;
  evidenceTier?: ScoreEvidenceTier;
};

export function inferIntelEvidenceTier(row: IntelScoreBreakdownEntry): ScoreEvidenceTier {
  if (row.evidenceTier) return row.evidenceTier;
  if (row.impact > 0) return "risk_indicator";
  if (row.impact < 0) return "positive_trust";
  return "neutral_observation";
}

const severityOrder: Record<ProviderEvidenceResult["severity"], number> = {
  danger: 0,
  warning: 1,
  info: 2,
  positive: 3
};

export function buildTrustSignalsFromEvidence(evidence: ProviderEvidenceResult[]): TrustSignal[] {
  return [...evidence]
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    .map((row) => ({
      type: row.severity,
      title: row.title,
      description: row.description,
      source: row.source,
      confidence: row.confidence
    }));
}

function pushContribution(
  signals: ScoreSignal[],
  breakdown: IntelScoreBreakdownEntry[],
  contribution: {
    id: string;
    source?: string;
    label: string;
    impact: number;
    category: ScoreSignal["category"];
    confidence: ScoreSignal["confidence"];
    reason: string;
    evidenceTier?: ScoreEvidenceTier;
  }
) {
  signals.push({
    id: contribution.id,
    label: contribution.label,
    category: contribution.category,
    impact: contribution.impact,
    confidence: contribution.confidence,
    reason: contribution.reason,
    evidenceTier: contribution.evidenceTier
  });
  breakdown.push({
    id: contribution.id,
    source: contribution.source,
    label: contribution.label,
    impact: contribution.impact,
    category: contribution.category,
    confidence: contribution.confidence,
    rationale: contribution.reason,
    evidenceTier: contribution.evidenceTier
  });
}

/** Weighted, explainable intel contributions mirrored into {@link ScoreSignal} for `calculateScamScore`. */
export function buildIntelScoring(checks: ExternalChecksResult): {
  scoreSignals: ScoreSignal[];
  breakdown: IntelScoreBreakdownEntry[];
} {
  const signals: ScoreSignal[] = [];
  const breakdown: IntelScoreBreakdownEntry[] = [];

  if (checks.police.listedInPoliceScamDatabase) {
    pushContribution(signals, breakdown, {
      id: "intel-police-match",
      source: checks.police.source,
      label: "Public police reference overlap (heuristic)",
      category: "website_quality",
      impact: 34,
      confidence: "medium",
      evidenceTier: "confirmed_malicious",
      reason:
        checks.police.policeWarningReason ??
        "Heuristic overlap with Dutch Police public guidance pages surfaced the same domain string."
    });
  }

  if (checks.safeBrowsing.safeBrowsingStatus === "flagged") {
    pushContribution(signals, breakdown, {
      id: "intel-safe-browsing-flagged",
      source: checks.safeBrowsing.source,
      label: "Google Safe Browsing match",
      category: "website_quality",
      impact: 32,
      confidence: "high",
      evidenceTier: "confirmed_malicious",
      reason: `Google Safe Browsing reported threat categories: ${checks.safeBrowsing.safeBrowsingThreats.join(", ") || "unknown"}.`
    });
  }

  if (checks.openPhish.listed) {
    pushContribution(signals, breakdown, {
      id: "intel-openphish-listed",
      source: checks.openPhish.source,
      label: "OpenPhish intelligence match",
      category: "website_quality",
      impact: 28,
      confidence: "high",
      evidenceTier: "confirmed_malicious",
      reason: "The URL/domain appears in the fetched OpenPhish feed."
    });
  }

  if (checks.urlHaus.listed) {
    pushContribution(signals, breakdown, {
      id: "intel-urlhaus-listed",
      source: checks.urlHaus.source,
      label: "URLhaus intelligence match",
      category: "website_quality",
      impact: 28,
      confidence: "high",
      evidenceTier: "confirmed_malicious",
      reason: checks.urlHaus.matches[0]
        ? `URLhaus returned malicious URL entries referencing this host (sample: ${checks.urlHaus.matches[0]}).`
        : "URLhaus returned malicious URL entries referencing this host."
    });
  }

  if (typeof checks.domainIntelligence.ageDays === "number" && checks.domainIntelligence.ageDays <= 14) {
    pushContribution(signals, breakdown, {
      id: "intel-domain-very-new",
      source: checks.domainIntelligence.source,
      label: "Very new registration (RDAP)",
      category: "domain",
      impact: 12,
      confidence: "high",
      evidenceTier: "risk_indicator",
      reason: `RDAP-derived domain age ≈ ${checks.domainIntelligence.ageDays} days.`
    });
  } else if (typeof checks.domainIntelligence.ageDays === "number" && checks.domainIntelligence.ageDays <= 45) {
    pushContribution(signals, breakdown, {
      id: "intel-domain-young",
      source: checks.domainIntelligence.source,
      label: "Young domain registration",
      category: "domain",
      impact: 5,
      confidence: "medium",
      evidenceTier: "risk_indicator",
      reason: `RDAP-derived domain age ≈ ${checks.domainIntelligence.ageDays} days.`
    });
  }

  if (checks.domainIntelligence.suspiciouslyShortRegistration) {
    pushContribution(signals, breakdown, {
      id: "intel-short-registration",
      source: checks.domainIntelligence.source,
      label: "Short RDAP registration window",
      category: "domain",
      impact: 10,
      confidence: "medium",
      evidenceTier: "risk_indicator",
      reason: "Registration horizon between creation and expiry looks shorter than many established domains."
    });
  }

  if (checks.domainIntelligence.hasPrivacyProtection) {
    pushContribution(signals, breakdown, {
      id: "intel-hidden-ownership",
      source: checks.domainIntelligence.source,
      label: "Privacy-protected WHOIS/RDAP data",
      category: "domain",
      impact: 3,
      confidence: "low",
      evidenceTier: "missing_data",
      reason: "Registrar or RDAP hints suggest privacy/redaction on ownership fields."
    });
  }

  /** Valid HTTPS is intentionally excluded from weighted scoring — see TLS providerEvidence copy instead. */

  if (!checks.ssl.httpsEnabled) {
    pushContribution(signals, breakdown, {
      id: "intel-no-tls",
      source: checks.ssl.source,
      label: "No reliable HTTPS endpoint",
      category: "website_quality",
      impact: 22,
      confidence: "high",
      evidenceTier: "risk_indicator",
      reason: "Port 443 probe did not complete a TLS session."
    });
  } else if (!checks.ssl.validCertificate) {
    pushContribution(signals, breakdown, {
      id: "intel-tls-issue",
      source: checks.ssl.source,
      label: "TLS certificate validation issue",
      category: "website_quality",
      impact: 12,
      confidence: "medium",
      evidenceTier: "risk_indicator",
      reason: checks.ssl.selfSigned ? "Likely untrusted / self-signed material." : "Certificate failed validation against trust anchors."
    });
  }

  return { scoreSignals: signals, breakdown };
}
