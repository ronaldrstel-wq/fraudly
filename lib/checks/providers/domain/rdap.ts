import { normalizeDomain } from "@/lib/cache";
import { checksConfig } from "@/lib/checks/config";
import type { DomainIntelligence } from "@/lib/checks/types";
import { fetchJsonWithTimeout, fromCache, toCache } from "@/lib/checks/utils";
import type { ProviderEvidenceResult, ProviderRun } from "@/lib/checks/providers/types";
import { wrapEvidence } from "@/lib/checks/providers/shared";

const SOURCE = "RDAP (rdap.org)";

type RdapEvent = { eventAction?: string; eventDate?: string };
type RdapEntity = { vcardArray?: [string, Array<[string, unknown, unknown, string]>] };
type RdapResponse = {
  events?: RdapEvent[];
  entities?: RdapEntity[];
  country?: string;
};

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function runRdapProvider(domain: string): Promise<ProviderRun<DomainIntelligence>> {
  const timeoutMs = checksConfig.fetchTimeoutMs;
  const ttl = checksConfig.cacheTtlMs.rdap;
  const normalizedDomain = normalizeDomain(domain);

  if (!checksConfig.rdap) {
    return {
      evidence: [
        wrapEvidence(SOURCE, "domain", "info", false, "RDAP disabled", "Domain registration lookup was turned off.", "high")
      ],
      result: { source: SOURCE, warnings: ["RDAP source disabled by configuration."] }
    };
  }

  const cacheKey = `checks:rdap:v2:${normalizedDomain}`;
  const cached = fromCache<{ check: DomainIntelligence; evidence: ProviderEvidenceResult[] }>(cacheKey);
  if (cached) return { evidence: cached.evidence, result: cached.check };

  try {
    const rdap = await fetchJsonWithTimeout<RdapResponse>(`https://rdap.org/domain/${normalizedDomain}`, timeoutMs);
    const registrationEvent = rdap.events?.find((event) => event.eventAction === "registration");
    const expiryEvent = rdap.events?.find((event) => event.eventAction === "expiration");
    const registrationDate = parseDate(registrationEvent?.eventDate);
    const expirationDate = parseDate(expiryEvent?.eventDate);
    const now = new Date();
    const ageDays = registrationDate ? Math.max(0, Math.floor((now.getTime() - registrationDate.getTime()) / 86400000)) : undefined;
    const registrationWindowDays =
      registrationDate && expirationDate
        ? Math.floor((expirationDate.getTime() - registrationDate.getTime()) / 86400000)
        : undefined;

    let registrar: string | undefined;
    let hasPrivacyProtection = false;
    for (const entity of rdap.entities ?? []) {
      const cards = entity.vcardArray?.[1] ?? [];
      for (const card of cards) {
        if (card[0] === "fn" && typeof card[3] === "string" && !registrar) {
          registrar = card[3];
        }
        if (card[0] === "org" && typeof card[3] === "string" && !registrar) {
          registrar = card[3];
        }
        if (typeof card[3] === "string" && /privacy|redacted|whoisguard/i.test(card[3])) {
          hasPrivacyProtection = true;
        }
      }
    }

    const suspiciouslyShortRegistration =
      typeof registrationWindowDays === "number" ? registrationWindowDays > 0 && registrationWindowDays <= 400 : undefined;

    const result: DomainIntelligence = {
      registrationDate: registrationDate?.toISOString(),
      ageDays,
      registrar,
      country: rdap.country,
      expirationDate: expirationDate?.toISOString(),
      hasPrivacyProtection,
      suspiciouslyShortRegistration,
      source: SOURCE,
      warnings: []
    };

    const evidence: ProviderEvidenceResult[] = [
      wrapEvidence(
        SOURCE,
        "domain",
        "info",
        false,
        "Registration data (RDAP)",
        [
          typeof ageDays === "number" ? `Approximate domain age: ${ageDays} days.` : "Domain age could not be derived.",
          registrar ? `Registrar: ${registrar}.` : "Registrar: not parsed.",
          rdap.country ? `Country field: ${rdap.country}.` : "Country: not provided.",
          expirationDate ? `Expiration: ${expirationDate.toISOString()}.` : "Expiration: not parsed.",
          hasPrivacyProtection ? "Privacy or redacted registration details were detected in RDAP entities." : "No obvious privacy-service marker in parsed RDAP cards."
        ].join(" "),
        "high",
        { ageDays, registrar, country: rdap.country }
      )
    ];

    if (typeof ageDays === "number" && ageDays <= 30) {
      evidence.push(
        wrapEvidence(
          SOURCE,
          "domain",
          "warning",
          true,
          "Very new domain registration",
          `The registration date implies the domain is only about ${ageDays} days old, which is a common risk context signal.`,
          "high",
          { ageDays }
        )
      );
    } else if (typeof ageDays === "number" && ageDays >= 365 * 3) {
      evidence.push(
        wrapEvidence(
          SOURCE,
          "domain",
          "positive",
          false,
          "Older domain registration",
          `The domain has been registered for roughly ${Math.floor(ageDays / 365)} years, which can be a modest positive context signal.`,
          "medium",
          { ageDays }
        )
      );
    }

    if (suspiciouslyShortRegistration) {
      evidence.push(
        wrapEvidence(
          SOURCE,
          "domain",
          "warning",
          true,
          "Short initial registration window",
          "The gap between registration and expiration in RDAP looks shorter than many long-lived business domains.",
          "medium"
        )
      );
    }

    if (hasPrivacyProtection) {
      evidence.push(
        wrapEvidence(
          SOURCE,
          "domain",
          "warning",
          true,
          "Privacy-protected or redacted ownership",
          "RDAP entity fields suggest privacy or redaction. This is common and not proof of abuse.",
          "low"
        )
      );
    }

    toCache(cacheKey, { check: result, evidence }, ttl);
    return { evidence, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "RDAP unavailable";
    const result: DomainIntelligence = {
      source: SOURCE,
      warnings: [message]
    };
    return {
      evidence: [
        wrapEvidence(SOURCE, "domain", "info", false, "RDAP lookup failed", message, "low", { error: message })
      ],
      result
    };
  }
}
