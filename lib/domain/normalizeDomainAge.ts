import type { ProviderEvidenceResult } from "@/lib/checks/providers/types";
import type { TrustSignal } from "@/lib/checks/types";
import {
  DOMAIN_AGE_NOT_VERIFIED_LABEL,
  formatDomainAgeFromDays,
  resolveDomainAgeDays,
  type DomainAgeIntelSource
} from "@/lib/format/domainAge";
import type { ScamCheckResult } from "@/types/scam";

export type NormalizedDomainAge = {
  ageDays: number | null;
  registrationDate: string | null;
  displayAge: string | null;
  source: string | null;
};

export type NormalizeDomainAgeInput = {
  domainIntelligence?: ScamCheckResult["domainIntelligence"] | null;
  providerEvidence?: ScamCheckResult["providerEvidence"];
  trustSignals?: ScamCheckResult["trustSignals"];
  scoreResult?: ScamCheckResult["scoreResult"];
  /** Optional enrichment public-signals layer. */
  enrichment?: DomainAgeIntelSource | null;
};

const DAY_BLOB_PATTERNS: RegExp[] = [
  /approximate domain age:\s*(\d+)\s*days/i,
  /domain age[:\s≈]*(\d+)\s*days/i,
  /rdap-derived domain age\s*≈\s*(\d+)\s*days/i,
  /registered for roughly (\d+) days/i,
  /only about (\d+) days old/i,
  /(\d+)\s*days old/i
];

function extractDaysFromText(blob: string): number | null {
  const text = blob.trim();
  if (!text) return null;
  for (const pattern of DAY_BLOB_PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;
    const days = Number.parseInt(match[1] ?? "", 10);
    if (Number.isFinite(days) && days >= 0) return Math.round(days);
  }
  return null;
}

function ageFromProviderEvidence(evidence: ProviderEvidenceResult[]): {
  days: number | null;
  registrationDate: string | null;
  source: string | null;
} {
  for (const row of evidence) {
    if (row.category === "domain" || /rdap|registration|whois/i.test(row.source)) {
      if (row.raw && typeof row.raw === "object" && row.raw !== null) {
        const raw = row.raw as Record<string, unknown>;
        if (typeof raw.ageDays === "number" && Number.isFinite(raw.ageDays) && raw.ageDays >= 0) {
          return { days: Math.round(raw.ageDays), registrationDate: null, source: "providerEvidence.raw.ageDays" };
        }
      }
      const fromText = extractDaysFromText(`${row.title} ${row.description}`);
      if (fromText != null) {
        return { days: fromText, registrationDate: null, source: "providerEvidence.description" };
      }
    }
  }
  return { days: null, registrationDate: null, source: null };
}

function ageFromTrustSignals(signals: TrustSignal[]): { days: number | null; source: string | null } {
  for (const signal of signals) {
    const fromText = extractDaysFromText(`${signal.title} ${signal.description ?? ""}`);
    if (fromText != null) {
      return { days: fromText, source: "trustSignals.description" };
    }
  }
  return { days: null, source: null };
}

function ageFromScoreSignals(
  signals: ScamCheckResult["scoreResult"]["signals"] | undefined
): { days: number | null; source: string | null } {
  for (const signal of signals ?? []) {
    const fromText = extractDaysFromText(`${signal.label ?? ""} ${signal.reason ?? ""}`);
    if (fromText != null) {
      return { days: fromText, source: "scoreResult.signals" };
    }
  }
  return { days: null, source: null };
}

export type DomainAgeDebugContext = {
  route: string;
  domain: string;
};

/** Single resolver for metric cards, hero highlights, and safety-signal copy. */
export function normalizeDomainAge(
  input: NormalizeDomainAgeInput,
  debug?: DomainAgeDebugContext
): NormalizedDomainAge {
  const di = input.domainIntelligence;
  const registrationDate = di?.registrationDate ?? null;

  const candidates: Array<{ days: number | null; source: string }> = [];

  const diDays = resolveDomainAgeDays(di);
  if (diDays != null) {
    candidates.push({ days: diDays, source: "domainIntelligence.ageDays" });
  } else if (registrationDate) {
    const fromReg = resolveDomainAgeDays({ registrationDate });
    if (fromReg != null) {
      candidates.push({ days: fromReg, source: "domainIntelligence.registrationDate" });
    }
  }

  const enrichmentDays = resolveDomainAgeDays(input.enrichment ?? undefined);
  if (enrichmentDays != null) {
    candidates.push({ days: enrichmentDays, source: "enrichment.domainAgeDays" });
  }

  const fromEvidence = ageFromProviderEvidence(input.providerEvidence ?? []);
  if (fromEvidence.days != null && fromEvidence.source) {
    candidates.push({ days: fromEvidence.days, source: fromEvidence.source });
  }

  const fromTrust = ageFromTrustSignals(input.trustSignals ?? []);
  if (fromTrust.days != null && fromTrust.source) {
    candidates.push({ days: fromTrust.days, source: fromTrust.source });
  }

  const fromScore = ageFromScoreSignals(input.scoreResult?.signals);
  if (fromScore.days != null && fromScore.source) {
    candidates.push({ days: fromScore.days, source: fromScore.source });
  }

  const winner = candidates[0] ?? null;
  const ageDays = winner?.days ?? null;
  const displayAge = formatDomainAgeFromDays(ageDays);

  const normalized: NormalizedDomainAge = {
    ageDays,
    registrationDate,
    displayAge,
    source: winner?.source ?? null
  };

  if (process.env.NODE_ENV !== "production" && debug) {
    console.info("[domain-age]", {
      domain: debug.domain,
      route: debug.route,
      selectedSource: normalized.source,
      ageDays: normalized.ageDays,
      registrationDate: normalized.registrationDate,
      displayAge: normalized.displayAge ?? DOMAIN_AGE_NOT_VERIFIED_LABEL,
      candidates: candidates.map((c) => c.source),
      paths: {
        "domainIntelligence.ageDays": di?.ageDays ?? null,
        "domainIntelligence.registrationDate": registrationDate,
        "enrichment.domainAgeDays": input.enrichment?.domainAgeDays ?? input.enrichment?.ageDays ?? null
      }
    });
  }

  return normalized;
}

export function displayAgeFromNormalized(normalized: NormalizedDomainAge): string {
  return normalized.displayAge ?? DOMAIN_AGE_NOT_VERIFIED_LABEL;
}

/** Backfills `domainIntelligence.ageDays` when age exists elsewhere on the scan (no scoring impact). */
export function enrichScamCheckResultDomainAge(result: ScamCheckResult): ScamCheckResult {
  const normalized = normalizeDomainAge(result);
  if (normalized.ageDays == null) return result;

  const di = result.domainIntelligence;
  if (typeof di.ageDays === "number" && Number.isFinite(di.ageDays)) {
    return result;
  }

  return {
    ...result,
    domainIntelligence: {
      ...di,
      ageDays: normalized.ageDays,
      registrationDate: di.registrationDate ?? normalized.registrationDate ?? undefined
    }
  };
}
