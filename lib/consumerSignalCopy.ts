/**
 * Plain-English summaries for trust/risk signals shown to consumers.
 * Copy depends on target section polarity — never infer risk from positive-only keywords alone.
 */

import { formatDomainAgeSignal } from "@/lib/format/domainAge";
import { FEED_HIT_SUMMARY } from "@/lib/signals/feedConsumerSignals";
import { formatSslConsumerLine } from "@/lib/signals/trustHighlightFacts";

export type ConsumerSignalPolarity = "positive" | "caution";

const INTERNAL_IMPLEMENTATION =
  /\b(enrichment (?:is )?not enabled|enrichment was not run|review enrichment|outscraper|parser unavailable|parse(?:r|ing) failure|rdap (?:failed|unavailable|disabled|lookup failed)|openphish disabled|tls check disabled|urlhaus unavailable|feed hit composite|composite signal|impact score|provider_error|cache bypassed|disabled by configuration|turned off|not run for this scan)\b/i;

const JARGON =
  /\b(tls|ssl|rdap|whois|dmarc|spf|mx|urlhaus|openphish|composite|parser|http\/\d|dns|ipv\d|outscraper)\b/i;

const POSITIVE_RULES: ReadonlyArray<{ pattern: RegExp; summary: string }> = [
  {
    pattern: /\b(https is available|valid certificate|tls valid|secure connection|certificate chain)\b/i,
    summary: "This website uses a valid secure connection."
  },
  {
    pattern: /\b(older domain|registered for roughly|age:?\s*\d{3,}|\d+\s+years)\b/i,
    summary: "This domain has existed for several years."
  },
  {
    pattern: /\b(registration data|domain age|rdap|whois|registrar)\b/i,
    summary: "Domain registration details were verified."
  },
  {
    pattern: /\b(no openphish|no urlhaus|no safe browsing|not flagged|clean snapshot)\b/i,
    summary: "No matches were found on major scam or phishing lists in this scan."
  },
  {
    pattern: /\b(review|trustpilot|google|rating|stars)\b/i,
    summary: "Public reputation data was found."
  },
  {
    pattern: /\b(dmarc|spf|mx|email security)\b/i,
    summary: "Email security settings for this domain were checked."
  }
];

const CAUTION_RULES: ReadonlyArray<{ pattern: RegExp; summary: string }> = [
  {
    pattern: /\b(listed in openphish|listed in urlhaus|google safe browsing match|appears in google safe browsing)\b/i,
    summary: FEED_HIT_SUMMARY
  },
  {
    pattern: /\b(very new domain|young domain|recently registered|short initial registration|only about \d+ days)\b/i,
    summary: "This domain was registered recently."
  },
  {
    pattern: /\b(limited|no |missing|unavailable).*(review|reputation|rating)|limited reputation\b/i,
    summary: "Limited public reputation information was found."
  },
  {
    pattern: /\b(https\/tls connection not established|certificate validation issue|not established|expired|self-signed)\b/i,
    summary: "The secure connection for this website could not be fully verified."
  },
  {
    pattern: /\b(privacy-protected|redacted ownership|suspicious)\b/i,
    summary: "This website shows suspicious trust patterns."
  },
  {
    pattern: /\b(redirect|cross.?domain)\b/i,
    summary: "This site redirects to another domain, which we also considered."
  }
];

export function isInternalImplementationSignal(blob: string): boolean {
  const text = blob.trim();
  if (!text) return true;
  return INTERNAL_IMPLEMENTATION.test(text);
}

function summaryFromDomainAgeBlob(blob: string, polarity: ConsumerSignalPolarity): string | null {
  const match =
    blob.match(/domain age:?\s*(\d+)\s*days/i) ??
    blob.match(/only about (\d+) days/i) ??
    blob.match(/(\d+)\s*days old/i) ??
    blob.match(/registered for roughly (\d+) days/i);
  if (!match) return null;

  const days = Number.parseInt(match[1] ?? "", 10);
  if (!Number.isFinite(days)) return null;

  return formatDomainAgeSignal(days);
}

function summaryFromSslBlob(blob: string): string | null {
  if (/\b(https is available|valid certificate|tls valid)\b/i.test(blob) && !/\b(not established|validation issue)\b/i.test(blob)) {
    return formatSslConsumerLine({ httpsEnabled: true, validCertificate: true, source: "tls", warnings: [] });
  }
  if (/\b(not established|validation issue|certificate)\b/i.test(blob)) {
    return formatSslConsumerLine({ httpsEnabled: true, validCertificate: false, source: "tls", warnings: [] });
  }
  return null;
}

export function consumerSignalSummary(
  title: string,
  description: string | undefined,
  polarity: ConsumerSignalPolarity
): string | null {
  const blob = `${title} ${description ?? ""}`.trim();
  if (!blob || isInternalImplementationSignal(blob)) return null;

  const domainAgeLine = summaryFromDomainAgeBlob(blob, polarity);
  if (domainAgeLine) return domainAgeLine;

  const sslLine = summaryFromSslBlob(blob);
  if (sslLine) {
    const isPositiveSsl = /valid secure connection/i.test(sslLine);
    if (polarity === "positive" && isPositiveSsl) return sslLine;
    if (polarity === "caution" && !isPositiveSsl) return sslLine;
  }

  const rules = polarity === "positive" ? POSITIVE_RULES : CAUTION_RULES;

  for (const { pattern, summary } of rules) {
    if (pattern.test(blob)) return summary;
  }

  if (polarity === "caution") {
    return "This website shows patterns worth a closer look before you pay or sign in.";
  }

  const desc = description?.trim();
  if (desc && desc.length <= 160 && !JARGON.test(desc) && !/[{}[\]<>]/.test(desc)) return desc;

  const cleanTitle = title.trim();
  if (cleanTitle.length <= 120 && !JARGON.test(cleanTitle)) return cleanTitle;

  return null;
}
