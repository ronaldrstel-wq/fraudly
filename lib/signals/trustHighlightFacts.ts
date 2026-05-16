import { formatDomainAgeFromDays } from "@/lib/format/domainAge";
import type { SslCheck } from "@/lib/checks/types";
import type { ScamCheckResult } from "@/types/scam";

export type TrustHighlightBucket = "positive" | "caution";

export type TrustHighlightFact = {
  id: "domain_age" | "ssl";
  label: string;
  value: string;
  consumerLine: string;
  bucket: TrustHighlightBucket;
};

const YOUNG_DOMAIN_DAYS = 30;
const ESTABLISHED_DOMAIN_DAYS = 365;

export function formatSslHighlightValue(ssl: SslCheck | null | undefined): string {
  if (!ssl || typeof ssl !== "object") return "Could not be verified";
  if (ssl.httpsEnabled && ssl.validCertificate) return "Valid SSL certificate";
  if (ssl.httpsEnabled) return "Certificate issue detected";
  return "Could not be verified";
}

export function formatSslConsumerLine(ssl: SslCheck): string {
  if (ssl.httpsEnabled && ssl.validCertificate) {
    return "This website uses a valid secure connection.";
  }
  if (ssl.httpsEnabled) {
    return "Secure connection could not be fully verified.";
  }
  return "Secure connection could not be verified.";
}

export function formatDomainAgeConsumerLine(ageDays?: number | null): string {
  const formatted = formatDomainAgeFromDays(ageDays);
  if (formatted == null) return "Domain age could not be verified.";

  const days = Math.max(0, Math.round(ageDays ?? 0));
  if (days <= YOUNG_DOMAIN_DAYS) {
    return `This domain is only ${formatted} old.`;
  }
  if (days >= ESTABLISHED_DOMAIN_DAYS) {
    return `This domain has existed for ${formatted}.`;
  }
  return `Domain age: ${formatted}.`;
}

export function domainAgeHighlightBucket(ageDays?: number | null): TrustHighlightBucket {
  if (ageDays == null || !Number.isFinite(ageDays)) return "caution";
  const days = Math.max(0, Math.round(ageDays));
  if (days <= YOUNG_DOMAIN_DAYS) return "caution";
  if (days >= ESTABLISHED_DOMAIN_DAYS) return "positive";
  return "caution";
}

export function sslHighlightBucket(ssl: SslCheck): TrustHighlightBucket {
  return ssl.httpsEnabled && ssl.validCertificate ? "positive" : "caution";
}

export function extractTrustHighlightFacts(result: Pick<ScamCheckResult, "domainIntelligence" | "ssl">): TrustHighlightFact[] {
  const facts: TrustHighlightFact[] = [];
  const ageDays = result.domainIntelligence.ageDays;

  facts.push({
    id: "domain_age",
    label: "Domain age",
    value: formatDomainAgeFromDays(ageDays) ?? "Could not be verified",
    consumerLine: formatDomainAgeConsumerLine(ageDays),
    bucket: domainAgeHighlightBucket(ageDays)
  });

  facts.push({
    id: "ssl",
    label: "Secure connection",
    value: formatSslHighlightValue(result.ssl),
    consumerLine: formatSslConsumerLine(result.ssl),
    bucket: sslHighlightBucket(result.ssl)
  });

  return facts;
}

/** Compact rows for VerdictHero (domain age + SSL). */
export function trustHighlightsForHero(
  result: Pick<ScamCheckResult, "domainIntelligence" | "ssl">
): Array<{ label: string; value: string; bucket: TrustHighlightBucket }> {
  return extractTrustHighlightFacts(result).map(({ label, value, bucket }) => ({
    label,
    value,
    bucket
  }));
}
