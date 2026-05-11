import { describe, expect, it } from "vitest";
import { resolveRedirectChain } from "@/lib/checks/redirectChain";

function makeResponse(status: number, location?: string): Response {
  return new Response(null, {
    status,
    headers: location ? { location } : undefined
  });
}

describe("resolveRedirectChain", () => {
  it("treats http->https on same registrable domain as non-cross-domain", async () => {
    const calls: string[] = [];
    const fetchImpl: typeof fetch = async (input) => {
      const u = String(input);
      calls.push(u);
      if (u === "http://example.com/") return makeResponse(301, "https://example.com/");
      return makeResponse(200);
    };
    const out = await resolveRedirectChain("http://example.com/", { fetchImpl });
    expect(out.redirectCount).toBe(1);
    expect(out.finalUrl).toBe("https://example.com/");
    expect(out.crossDomainRedirect).toBe(false);
    expect(calls.length).toBe(2);
  });

  it("flags cross-domain redirect", async () => {
    const fetchImpl: typeof fetch = async (input) => {
      const u = String(input);
      if (u === "https://brand-safe.example/") return makeResponse(302, "https://other-risky.example/login");
      return makeResponse(200);
    };
    const out = await resolveRedirectChain("https://brand-safe.example/", { fetchImpl });
    expect(out.redirectCount).toBe(1);
    expect(out.crossDomainRedirect).toBe(true);
    expect(out.finalDomain).toContain("other-risky.example");
  });

  it("stops on redirect limit", async () => {
    const fetchImpl: typeof fetch = async (input) => {
      const u = String(input);
      const n = Number(new URL(u).searchParams.get("n") ?? "0");
      return makeResponse(302, `https://loop.example/?n=${n + 1}`);
    };
    const out = await resolveRedirectChain("https://loop.example/?n=0", { fetchImpl, maxRedirects: 3 });
    expect(out.tooManyRedirects).toBe(true);
    expect(out.redirectCount).toBe(3);
  });
});
