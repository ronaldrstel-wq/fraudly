import { resolveMx, resolveTxt } from "node:dns/promises";
import { normalizeDomain } from "@/lib/cache";
import { withCache, type PublicIntelResult } from "@/lib/public-intel/shared";

export type DnsIntel = {
  mxConfigured: boolean;
  hasSpf: boolean;
  hasDmarc: boolean;
};

const SOURCE = "Public DNS records";

export async function collectDns(domain: string): Promise<PublicIntelResult<DnsIntel> & { fromCache: boolean }> {
  const normalized = normalizeDomain(domain);
  return withCache(`public-intel:dns:${normalized}`, async () => {
    try {
      const [mxRes, txtRes, dmarcRes] = await Promise.allSettled([
        resolveMx(normalized),
        resolveTxt(normalized),
        resolveTxt(`_dmarc.${normalized}`)
      ]);
      const mxConfigured = mxRes.status === "fulfilled" && mxRes.value.length > 0;
      const txtRows = txtRes.status === "fulfilled" ? txtRes.value.map((row) => row.join(" ")).join("\n") : "";
      const dmarcRows = dmarcRes.status === "fulfilled" ? dmarcRes.value.map((row) => row.join(" ")).join("\n") : "";
      return {
        ok: true,
        source: SOURCE,
        data: {
          mxConfigured,
          hasSpf: /v=spf1/i.test(txtRows),
          hasDmarc: /v=dmarc1/i.test(dmarcRows)
        }
      };
    } catch (error) {
      return { ok: false, source: SOURCE, data: null, warning: error instanceof Error ? error.message : "DNS lookup failed" };
    }
  });
}
