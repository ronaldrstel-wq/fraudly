import { resolve4, resolve6 } from "node:dns/promises";

import type { DomainIntelligence, SslCheck } from "@/lib/checks/types";
import type { DomainInfrastructure } from "@/types/domain-infrastructure";

/** True when warnings look like an HTTP 404 from the RDAP bootstrap, not a generic timeout. */
export function rdapWarningsIndicateNotFound(warnings: string[]): boolean {
  return warnings.some((w) => /\b404\b|http\s*404|not\s+found|no\s+(?:matching\s+)?(?:object|domain)/i.test(w));
}

export async function probeApexDnsResolution(hostname: string): Promise<{ ipv4: boolean; ipv6: boolean }> {
  const [v4, v6] = await Promise.allSettled([resolve4(hostname), resolve6(hostname)]);
  return {
    ipv4: v4.status === "fulfilled" && v4.value.length > 0,
    ipv6: v6.status === "fulfilled" && v6.value.length > 0
  };
}

export function buildDomainInfrastructure(args: {
  dnsResolvable: boolean;
  domainIntelligence: DomainIntelligence;
  ssl: SslCheck;
}): DomainInfrastructure {
  const rdapIndicatesNotFound = rdapWarningsIndicateNotFound(args.domainIntelligence.warnings);

  /** No A/AAAA ⇒ the hostname does not resolve in public DNS (typo, unregistered, etc.). */
  const noDns = !args.dnsResolvable;

  /**
   * RDAP 404 with no TLS session still observed: registration system has no object and we could not
   * complete port 443 — treat as invalid / non-existent for consumer messaging.
   */
  const rdapEmptyAndNoHttps = rdapIndicatesNotFound && !args.ssl.httpsEnabled;

  const treatAsNonExistentHost = noDns || rdapEmptyAndNoHttps;

  return {
    dnsResolvable: args.dnsResolvable,
    rdapIndicatesNotFound,
    treatAsNonExistentHost
  };
}
