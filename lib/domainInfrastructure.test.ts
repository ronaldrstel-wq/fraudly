import { describe, expect, it } from "vitest";
import { buildDomainInfrastructure, rdapWarningsIndicateNotFound } from "@/lib/domainInfrastructure";
import type { DomainIntelligence, SslCheck } from "@/lib/checks/types";

const di = (w: string[]): DomainIntelligence => ({ source: "RDAP test", warnings: w });
const tls = (https: boolean): SslCheck =>
  ({ httpsEnabled: https, validCertificate: false, source: "TLS", warnings: [] } as SslCheck);

describe("buildDomainInfrastructure", () => {
  it("flags hosts with no DNS apex records", () => {
    const out = buildDomainInfrastructure({
      dnsResolvable: false,
      domainIntelligence: di([]),
      ssl: tls(false)
    });
    expect(out.treatAsNonExistentHost).toBe(true);
    expect(out.dnsResolvable).toBe(false);
  });

  it("does not flag healthy DNS + working HTTPS when RDAP 404", () => {
    const out = buildDomainInfrastructure({
      dnsResolvable: true,
      domainIntelligence: di(["HTTP 404"]),
      ssl: tls(true)
    });
    expect(out.treatAsNonExistentHost).toBe(false);
    expect(out.rdapIndicatesNotFound).toBe(true);
  });

  it("flags RDAP not-found when HTTPS never came up", () => {
    const out = buildDomainInfrastructure({
      dnsResolvable: true,
      domainIntelligence: di(["HTTP 404"]),
      ssl: tls(false)
    });
    expect(out.treatAsNonExistentHost).toBe(true);
  });
});

describe("rdapWarningsIndicateNotFound", () => {
  it("matches HTTP 404 style warnings", () => {
    expect(rdapWarningsIndicateNotFound(["HTTP 404"])).toBe(true);
    expect(rdapWarningsIndicateNotFound(["Something timed out"])).toBe(false);
  });
});
