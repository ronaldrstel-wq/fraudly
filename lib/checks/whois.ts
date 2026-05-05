import { normalizeDomain } from "@/lib/cache";
import type { DomainIntelligence } from "@/lib/checks/types";
import { fetchJsonWithTimeout, fromCache, isEnabled, toCache } from "@/lib/checks/utils";

const SOURCE = "RDAP";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const TIMEOUT_MS = 5000;

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

export async function runDomainIntelligenceCheck(domain: string): Promise<DomainIntelligence> {
  if (!isEnabled("ENABLE_RDAP_CHECK", true)) {
    return { source: SOURCE, warnings: ["RDAP source disabled by configuration."] };
  }

  const normalizedDomain = normalizeDomain(domain);
  const cacheKey = `checks:rdap:${normalizedDomain}`;
  const cached = fromCache<DomainIntelligence>(cacheKey);
  if (cached) return cached;

  try {
    const rdap = await fetchJsonWithTimeout<RdapResponse>(`https://rdap.org/domain/${normalizedDomain}`, TIMEOUT_MS);
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

    const result: DomainIntelligence = {
      registrationDate: registrationDate?.toISOString(),
      ageDays,
      registrar,
      country: rdap.country,
      expirationDate: expirationDate?.toISOString(),
      hasPrivacyProtection,
      suspiciouslyShortRegistration:
        typeof registrationWindowDays === "number" ? registrationWindowDays > 0 && registrationWindowDays <= 400 : undefined,
      source: SOURCE,
      warnings: []
    };
    toCache(cacheKey, result, CACHE_TTL_MS);
    return result;
  } catch (error) {
    return {
      source: SOURCE,
      warnings: [error instanceof Error ? error.message : "RDAP unavailable"]
    };
  }
}
