import type { ExternalChecksResult, TrustSignal } from "@/lib/checks/types";
import type { ScoreSignal } from "@/lib/scoringEngine";

export function buildTrustSignalsFromChecks(checks: ExternalChecksResult): TrustSignal[] {
  const trustSignals: TrustSignal[] = [];

  if (checks.police.listedInPoliceScamDatabase) {
    trustSignals.push({
      type: "danger",
      title: "Matched Dutch police scam reference",
      description: checks.police.policeWarningReason ?? "This domain appears in public Dutch police scam references.",
      source: checks.police.source
    });
  }

  if (checks.safeBrowsing.safeBrowsingStatus === "flagged") {
    trustSignals.push({
      type: "danger",
      title: "Flagged by Safe Browsing",
      description: `Threats: ${checks.safeBrowsing.safeBrowsingThreats.join(", ") || "unknown type"}.`,
      source: checks.safeBrowsing.source
    });
  } else if (checks.safeBrowsing.safeBrowsingStatus === "safe") {
    trustSignals.push({
      type: "positive",
      title: "No Safe Browsing hit",
      description: "No malware or phishing listing found for this URL in this check.",
      source: checks.safeBrowsing.source
    });
  }

  if (checks.openPhish.listed) {
    trustSignals.push({
      type: "danger",
      title: "Listed in OpenPhish feed",
      description: "This URL/domain appears in a public phishing feed.",
      source: checks.openPhish.source
    });
  }

  if (checks.urlHaus.listed) {
    trustSignals.push({
      type: "danger",
      title: "Listed in URLHaus feed",
      description: "This host appears in a public malware/phishing URL feed.",
      source: checks.urlHaus.source
    });
  }

  if (typeof checks.domainIntelligence.ageDays === "number" && checks.domainIntelligence.ageDays <= 30) {
    trustSignals.push({
      type: "warning",
      title: "Very new domain",
      description: `Domain age is about ${checks.domainIntelligence.ageDays} days.`,
      source: checks.domainIntelligence.source
    });
  } else if (typeof checks.domainIntelligence.ageDays === "number" && checks.domainIntelligence.ageDays >= 365 * 3) {
    trustSignals.push({
      type: "positive",
      title: "Established domain age",
      description: `Domain has existed for about ${Math.floor(checks.domainIntelligence.ageDays / 365)} years.`,
      source: checks.domainIntelligence.source
    });
  }

  if (checks.domainIntelligence.suspiciouslyShortRegistration) {
    trustSignals.push({
      type: "warning",
      title: "Short registration period",
      description: "The registration lifecycle looks short, which can indicate disposable setup.",
      source: checks.domainIntelligence.source
    });
  }

  if (checks.domainIntelligence.hasPrivacyProtection) {
    trustSignals.push({
      type: "warning",
      title: "Ownership privacy protection detected",
      description: "Ownership data appears privacy-protected or redacted.",
      source: checks.domainIntelligence.source
    });
  }

  if (!checks.ssl.httpsEnabled) {
    trustSignals.push({
      type: "danger",
      title: "HTTPS/TLS not available",
      description: "Could not establish a secure TLS connection.",
      source: checks.ssl.source
    });
  } else if (!checks.ssl.validCertificate) {
    trustSignals.push({
      type: "warning",
      title: "TLS certificate issue",
      description: "The certificate is invalid, expired, or not fully trusted.",
      source: checks.ssl.source
    });
  } else {
    trustSignals.push({
      type: "positive",
      title: "Valid TLS certificate",
      description: "HTTPS is enabled and the certificate looks valid.",
      source: checks.ssl.source
    });
  }

  return trustSignals;
}

export function buildScoreSignalsFromChecks(checks: ExternalChecksResult): ScoreSignal[] {
  const signals: ScoreSignal[] = [];

  if (checks.police.listedInPoliceScamDatabase) {
    signals.push({
      id: "intel-police-match",
      label: "Police scam reference match",
      category: "website_quality",
      impact: 35,
      confidence: "high",
      reason: "Domain matched public Dutch police scam references."
    });
  }

  if (checks.safeBrowsing.safeBrowsingStatus === "flagged") {
    signals.push({
      id: "intel-safe-browsing-flagged",
      label: "Safe Browsing threat match",
      category: "website_quality",
      impact: 30,
      confidence: "high",
      reason: `Google Safe Browsing flagged this URL (${checks.safeBrowsing.safeBrowsingThreats.join(", ") || "unknown"}).`
    });
  }

  if (checks.openPhish.listed) {
    signals.push({
      id: "intel-openphish-listed",
      label: "OpenPhish feed match",
      category: "website_quality",
      impact: 28,
      confidence: "high",
      reason: "URL/domain appears in OpenPhish feed."
    });
  }

  if (checks.urlHaus.listed) {
    signals.push({
      id: "intel-urlhaus-listed",
      label: "URLHaus feed match",
      category: "website_quality",
      impact: 28,
      confidence: "high",
      reason: "Domain appears in URLHaus feed."
    });
  }

  if (typeof checks.domainIntelligence.ageDays === "number" && checks.domainIntelligence.ageDays <= 14) {
    signals.push({
      id: "intel-domain-very-new",
      label: "Very new domain intelligence",
      category: "domain",
      impact: 20,
      confidence: "high",
      reason: `Domain age is ${checks.domainIntelligence.ageDays} days.`
    });
  }

  if (checks.domainIntelligence.suspiciouslyShortRegistration) {
    signals.push({
      id: "intel-short-registration",
      label: "Short registration period",
      category: "domain",
      impact: 10,
      confidence: "medium",
      reason: "Registration period appears shorter than typical long-term domains."
    });
  }

  if (checks.domainIntelligence.hasPrivacyProtection) {
    signals.push({
      id: "intel-hidden-ownership",
      label: "Ownership details protected",
      category: "domain",
      impact: 8,
      confidence: "low",
      reason: "Ownership records appear privacy-protected."
    });
  }

  if (checks.ssl.httpsEnabled && checks.ssl.validCertificate) {
    signals.push({
      id: "intel-valid-ssl",
      label: "Valid SSL/TLS certificate",
      category: "website_quality",
      impact: -10,
      confidence: "high",
      reason: "HTTPS is active with a valid certificate."
    });
  } else if (!checks.ssl.httpsEnabled) {
    signals.push({
      id: "intel-no-ssl",
      label: "No valid HTTPS/TLS",
      category: "website_quality",
      impact: 22,
      confidence: "high",
      reason: "Secure TLS connection could not be established."
    });
  } else {
    signals.push({
      id: "intel-invalid-ssl",
      label: "Certificate validation issue",
      category: "website_quality",
      impact: 12,
      confidence: "medium",
      reason: "Certificate appears invalid or expired."
    });
  }

  return signals;
}
