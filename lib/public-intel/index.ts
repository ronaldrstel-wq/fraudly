import { normalizeDomain } from "@/lib/cache";
import { publicIntelConfig, type PublicIntelSourceKey } from "@/lib/public-intel/config";
import { collectDns } from "@/lib/public-intel/dns";
import { collectReddit } from "@/lib/public-intel/reddit";
import { collectIndexedReviewSnippets } from "@/lib/public-intel/reviews";
import { collectScamAdviser } from "@/lib/public-intel/scamadviser";
import { collectSsl } from "@/lib/public-intel/ssl";
import { clamp, settledWarning } from "@/lib/public-intel/shared";
import { collectTrustpilot } from "@/lib/public-intel/trustpilot";
import { collectWhois } from "@/lib/public-intel/whois";

export type PublicReputationSignals = {
  trustpilotScore: number | null;
  trustpilotReviewCount: number | null;
  redditWarnings: number;
  domainAgeDays: number | null;
  sslStatus: "valid" | "invalid" | "unavailable";
  mailSecurity: { mxConfigured: boolean; spf: boolean; dmarc: boolean } | null;
  confidence: "low" | "medium" | "high";
  warnings: string[];
  sourceStatus: Record<
    PublicIntelSourceKey | "outscraper" | "googlePlacesReviews" | "trustpilotPrivateApi",
    { enabled: boolean; attempted: boolean; ok: boolean; fromCache: boolean; warning?: string }
  >;
};

export type PublicIntelEnrichment = {
  normalizedDomain: string;
  signals: PublicReputationSignals;
  impactOnRisk: number;
  signalStatus: "Positive" | "Mixed" | "Weak" | "Missing";
};

function computeRiskImpact(input: {
  trustpilotRating: number | null;
  trustpilotReviewCount: number | null;
  scamAdviserScore: number | null;
  redditWarnings: number;
  domainAgeDays: number | null;
  sslValid: boolean | null;
  hasDmarc: boolean | null;
}): { impact: number; status: PublicIntelEnrichment["signalStatus"] } {
  let impact = 0;
  if (input.trustpilotRating != null && input.trustpilotReviewCount != null) {
    if (input.trustpilotRating >= 4.2 && input.trustpilotReviewCount >= 50) impact -= 8;
    if (input.trustpilotRating <= 2.8 && input.trustpilotReviewCount >= 20) impact += 10;
  }
  if (input.scamAdviserScore != null) {
    if (input.scamAdviserScore >= 80) impact -= 5;
    else if (input.scamAdviserScore <= 35) impact += 8;
  }
  if (input.redditWarnings >= 5) impact += 8;
  else if (input.redditWarnings >= 2) impact += 4;
  if (input.domainAgeDays != null && input.domainAgeDays <= 30) impact += 6;
  else if (input.domainAgeDays != null && input.domainAgeDays >= 365 * 3) impact -= 4;
  if (input.sslValid === false) impact += 5;
  if (input.hasDmarc === false) impact += 2;
  const bounded = clamp(impact, -15, 20);
  if (bounded <= -8) return { impact: bounded, status: "Positive" };
  if (bounded >= 10) return { impact: bounded, status: "Weak" };
  if (bounded === 0) return { impact: bounded, status: "Missing" };
  return { impact: bounded, status: "Mixed" };
}

export async function getPublicIntelEnrichment(domain: string): Promise<PublicIntelEnrichment> {
  const normalized = normalizeDomain(domain);
  const sourceStatus: PublicReputationSignals["sourceStatus"] = {
    trustpilot: { enabled: publicIntelConfig.publicSources.trustpilot, attempted: false, ok: false, fromCache: false },
    reddit: { enabled: publicIntelConfig.publicSources.reddit, attempted: false, ok: false, fromCache: false },
    scamadviser: { enabled: publicIntelConfig.publicSources.scamadviser, attempted: false, ok: false, fromCache: false },
    googleIndexedReviews: {
      enabled: publicIntelConfig.publicSources.googleIndexedReviews,
      attempted: false,
      ok: false,
      fromCache: false
    },
    dns: { enabled: publicIntelConfig.publicSources.dns, attempted: false, ok: false, fromCache: false },
    ssl: { enabled: publicIntelConfig.publicSources.ssl, attempted: false, ok: false, fromCache: false },
    rdap: { enabled: publicIntelConfig.publicSources.rdap, attempted: false, ok: false, fromCache: false },
    outscraper: { enabled: publicIntelConfig.paidSources.outscraper, attempted: false, ok: false, fromCache: false },
    googlePlacesReviews: {
      enabled: publicIntelConfig.paidSources.googlePlacesReviews,
      attempted: false,
      ok: false,
      fromCache: false
    },
    trustpilotPrivateApi: {
      enabled: publicIntelConfig.paidSources.trustpilotPrivateApi,
      attempted: false,
      ok: false,
      fromCache: false
    }
  };

  const tasks: Array<Promise<unknown>> = [];
  const taskKeys: PublicIntelSourceKey[] = [];
  const pushTask = (key: PublicIntelSourceKey, task: Promise<unknown>) => {
    sourceStatus[key].attempted = true;
    taskKeys.push(key);
    tasks.push(task);
  };

  if (publicIntelConfig.publicSources.trustpilot) pushTask("trustpilot", collectTrustpilot(normalized));
  if (publicIntelConfig.publicSources.reddit) pushTask("reddit", collectReddit(normalized));
  if (publicIntelConfig.publicSources.scamadviser) pushTask("scamadviser", collectScamAdviser(normalized));
  if (publicIntelConfig.publicSources.googleIndexedReviews) {
    pushTask("googleIndexedReviews", collectIndexedReviewSnippets(normalized));
  }
  if (publicIntelConfig.publicSources.dns) pushTask("dns", collectDns(normalized));
  if (publicIntelConfig.publicSources.ssl) pushTask("ssl", collectSsl(normalized));
  if (publicIntelConfig.publicSources.rdap) pushTask("rdap", collectWhois(normalized));

  const settled = await Promise.allSettled(tasks);

  const warnings: string[] = [];
  const resultsByKey = new Map<PublicIntelSourceKey, unknown>();
  for (let i = 0; i < settled.length; i += 1) {
    const key = taskKeys[i];
    const row = settled[i];
    if (!key || !row) continue;
    if (row.status === "rejected") {
      const warning = settledWarning(row.reason);
      sourceStatus[key].warning = warning;
      warnings.push(`${key}: ${warning}`);
      continue;
    }
    resultsByKey.set(key, row.value);
    const value = row.value as { ok?: boolean; warning?: string; fromCache?: boolean; source?: string };
    sourceStatus[key].ok = value.ok === true;
    sourceStatus[key].fromCache = value.fromCache === true;
    if (value.ok !== true && value.warning) {
      sourceStatus[key].warning = value.warning;
      warnings.push(`${value.source ?? key}: ${value.warning}`);
    }
  }

  const trustpilot = (resultsByKey.get("trustpilot") as { data?: { rating?: number | null; reviewCount?: number | null } } | undefined)?.data ?? null;
  const reddit = (resultsByKey.get("reddit") as {
    data?: { scamMentions?: number; phishingMentions?: number; complaintMentions?: number };
  } | undefined)?.data ?? null;
  const scamadviser = (resultsByKey.get("scamadviser") as { data?: { trustScore?: number | null } } | undefined)?.data ?? null;
  const snippets = (resultsByKey.get("googleIndexedReviews") as {
    data?: { possibleRating?: number | null; possibleReviewCount?: number | null };
  } | undefined)?.data ?? null;
  const dns = (resultsByKey.get("dns") as { data?: { mxConfigured?: boolean; hasSpf?: boolean; hasDmarc?: boolean } } | undefined)?.data ?? null;
  const ssl = (resultsByKey.get("ssl") as { data?: { validCertificate?: boolean } } | undefined)?.data ?? null;
  const whois = (resultsByKey.get("rdap") as { data?: { ageDays?: number | null } } | undefined)?.data ?? null;

  const risk = computeRiskImpact({
    trustpilotRating: trustpilot?.rating ?? snippets?.possibleRating ?? null,
    trustpilotReviewCount: trustpilot?.reviewCount ?? snippets?.possibleReviewCount ?? null,
    scamAdviserScore: scamadviser?.trustScore ?? null,
    redditWarnings: (reddit?.scamMentions ?? 0) + (reddit?.phishingMentions ?? 0) + (reddit?.complaintMentions ?? 0),
    domainAgeDays: whois?.ageDays ?? null,
    sslValid: ssl?.validCertificate ?? null,
    hasDmarc: dns?.hasDmarc ?? null
  });

  const successful = Object.values(sourceStatus).filter((row) => row.attempted && row.ok).length;
  const confidence: PublicReputationSignals["confidence"] = successful >= 5 ? "high" : successful >= 3 ? "medium" : "low";
  return {
    normalizedDomain: normalized,
    signals: {
      trustpilotScore: trustpilot?.rating ?? snippets?.possibleRating ?? null,
      trustpilotReviewCount: trustpilot?.reviewCount ?? snippets?.possibleReviewCount ?? null,
      redditWarnings: (reddit?.scamMentions ?? 0) + (reddit?.phishingMentions ?? 0) + (reddit?.complaintMentions ?? 0),
      domainAgeDays: whois?.ageDays ?? null,
      sslStatus: ssl ? (ssl.validCertificate ? "valid" : "invalid") : "unavailable",
      mailSecurity: dns ? { mxConfigured: dns.mxConfigured ?? false, spf: dns.hasSpf ?? false, dmarc: dns.hasDmarc ?? false } : null,
      confidence,
      warnings,
      sourceStatus
    },
    impactOnRisk: risk.impact,
    signalStatus: risk.status
  };
}
