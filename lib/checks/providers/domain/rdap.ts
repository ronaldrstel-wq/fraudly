import { normalizeDomain } from "@/lib/cache";
import { checksConfig } from "@/lib/checks/config";
import type { DomainIntelligence } from "@/lib/checks/types";
import { fetchJsonWithTimeout, fromCache, toCache } from "@/lib/checks/utils";
import type { ProviderEvidenceResult, ProviderRun } from "@/lib/checks/providers/types";
import { wrapEvidence } from "@/lib/checks/providers/shared";
import { parseRdapDate, registrationDateFromRdapEvents } from "@/lib/checks/providers/domain/rdapRegistration";

const SOURCE = "RDAP (rdap.org)";

type RdapEvent = { eventAction?: string; eventDate?: string };
type RdapEntity = { vcardArray?: [string, Array<[string, unknown, unknown, string]>] };
type RdapResponse = {
  events?: RdapEvent[];
  entities?: RdapEntity[];
  country?: string;
};

async function fetchRdapDocument(domain: string, timeoutMs: number): Promise<{ json: RdapResponse; sourceLabel: string }> {
  try {
    const json = await fetchJsonWithTimeout<RdapResponse>(`https://rdap.org/domain/${domain}`, timeoutMs);
    return { json, sourceLabel: SOURCE };
  } catch (primaryError) {
    if (!domain.endsWith(".nl")) throw primaryError;
    const json = await fetchJsonWithTimeout<RdapResponse>(`https://rdap.sidn.nl/domain/${domain}`, timeoutMs);
    return { json, sourceLabel: "RDAP (SIDN)" };
  }
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
    let { json: rdap, sourceLabel } = await fetchRdapDocument(normalizedDomain, timeoutMs);
    let registrationDate = registrationDateFromRdapEvents(rdap.events);
    if (!registrationDate && normalizedDomain.endsWith(".nl")) {
      try {
        const sidn = await fetchJsonWithTimeout<RdapResponse>(`https://rdap.sidn.nl/domain/${normalizedDomain}`, timeoutMs);
        const sidnRegistration = registrationDateFromRdapEvents(sidn.events);
        if (sidnRegistration) {
          rdap = sidn;
          registrationDate = sidnRegistration;
          sourceLabel = "RDAP (SIDN)";
        }
      } catch {
        // Keep rdap.org payload when SIDN fallback fails.
      }
    }
    const expiryEvent = rdap.events?.find((event) => event.eventAction === "expiration");
    const expirationDate = parseRdapDate(expiryEvent?.eventDate);
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
      source: sourceLabel,
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
          `RDAP target (registrable/root domain): ${normalizedDomain}.`,
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
