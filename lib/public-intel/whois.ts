import { normalizeDomain } from "@/lib/cache";
import { fetchWithTimeout, withCache, type PublicIntelResult } from "@/lib/public-intel/shared";

type RdapEvent = { eventAction?: string; eventDate?: string };
type RdapResponse = { events?: RdapEvent[]; entities?: unknown[] };

export type WhoisIntel = {
  ageDays: number | null;
  hasPrivacyIndicators: boolean;
};

const SOURCE = "RDAP (public WHOIS)";

export async function collectWhois(domain: string): Promise<PublicIntelResult<WhoisIntel> & { fromCache: boolean }> {
  const normalized = normalizeDomain(domain);
  return withCache(`public-intel:whois:${normalized}`, async () => {
    try {
      const response = await fetchWithTimeout(`https://rdap.org/domain/${normalized}`);
      if (!response.ok) {
        return { ok: false, source: SOURCE, data: null, warning: `HTTP ${response.status}` };
      }
      const json = (await response.json()) as RdapResponse;
      const regEvent = (json.events ?? []).find((e) => e.eventAction === "registration");
      const regDate = regEvent?.eventDate ? new Date(regEvent.eventDate) : null;
      const ageDays = regDate && !Number.isNaN(regDate.getTime()) ? Math.floor((Date.now() - regDate.getTime()) / 86400000) : null;
      const blob = JSON.stringify(json.entities ?? []).toLowerCase();
      return {
        ok: true,
        source: SOURCE,
        data: {
          ageDays: ageDays != null && ageDays >= 0 ? ageDays : null,
          hasPrivacyIndicators: /privacy|redacted|whoisguard/.test(blob)
        }
      };
    } catch (error) {
      return { ok: false, source: SOURCE, data: null, warning: error instanceof Error ? error.message : "WHOIS lookup failed" };
    }
  });
}
