import { describe, expect, it } from "vitest";
import { parseDomainParts } from "@/lib/domain/parseDomain";

describe("parseDomainParts", () => {
  it("extracts registrable domain from deep subdomain", () => {
    const out = parseDomainParts("billing-meta.program-ads-agency.com");
    expect(out.normalizedHostname).toBe("billing-meta.program-ads-agency.com");
    expect(out.registrableDomain).toBe("program-ads-agency.com");
    expect(out.subdomain).toBe("billing-meta");
    expect(out.isSubdomain).toBe(true);
    expect(out.suspiciousSubdomainTerms).toContain("billing-meta");
  });

  it("keeps complex subdomain and root split", () => {
    const out = parseDomainParts("login.paypal.example.com");
    expect(out.registrableDomain).toBe("example.com");
    expect(out.subdomain).toBe("login.paypal");
    expect(out.suspiciousSubdomainTerms).toContain("login");
  });

  it("handles public suffix correctly for co.uk", () => {
    const out = parseDomainParts("shop.example.co.uk");
    expect(out.registrableDomain).toBe("example.co.uk");
    expect(out.subdomain).toBe("shop");
  });

  it("normalizes www hostnames", () => {
    const out = parseDomainParts("www.apple.com");
    expect(out.normalizedHostname).toBe("apple.com");
    expect(out.registrableDomain).toBe("apple.com");
    expect(out.isSubdomain).toBe(false);
  });

  it("handles apex domain input", () => {
    const out = parseDomainParts("apple.com");
    expect(out.registrableDomain).toBe("apple.com");
    expect(out.subdomain).toBeNull();
    expect(out.isSubdomain).toBe(false);
  });
});

