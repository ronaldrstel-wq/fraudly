import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWebsiteSignals } from "@/lib/aiScamReasons";

describe("fetchWebsiteSignals availability behavior", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("treats HEAD blocked but GET works as reachable", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(null, { status: 405, headers: { "content-type": "text/html" } })
      )
      .mockResolvedValueOnce(
        new Response("<html><title>OK</title><body>Hello</body></html>", {
          status: 200,
          headers: { "content-type": "text/html" }
        })
      );

    const out = await fetchWebsiteSignals("https://example.com");
    expect(out?.availability?.status).toBe("reachable");
    expect(out?.availability?.contentInspectionStatus).toBe("full");
    expect(out?.availability?.httpStatus).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("treats 403 as limited but responded", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 403 }))
      .mockResolvedValueOnce(new Response("", { status: 403, headers: { "content-type": "text/html" } }));

    const out = await fetchWebsiteSignals("https://blocked.example");
    expect(out?.availability?.status).toBe("limited_inspection");
    expect(out?.availability?.contentInspectionStatus).toBe("blocked");
    expect(out?.availability?.httpStatus).toBe(403);
  });

  it("detects cloudflare challenge as limited inspection", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 403, headers: { server: "cloudflare" } }))
      .mockResolvedValueOnce(
        new Response("<html><title>Just a moment...</title><body>Attention Required! Cloudflare</body></html>", {
          status: 403,
          headers: { "content-type": "text/html", server: "cloudflare" }
        })
      );

    const out = await fetchWebsiteSignals("https://challenge.example");
    expect(out?.availability?.status).toBe("limited_inspection");
    expect(out?.availability?.botProtectionDetected).toBe(true);
    expect(out?.availability?.contentInspectionStatus).toBe("blocked");
  });

  it("marks parser failure as limited inspection instead of unavailable", async () => {
    const brokenResponse = {
      status: 200,
      url: "https://parser.example",
      headers: new Headers({ "content-type": "text/html" }),
      text: vi.fn(async () => {
        throw new Error("parser exploded");
      })
    } as unknown as Response;

    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(brokenResponse);

    const out = await fetchWebsiteSignals("https://parser.example");
    expect(out?.availability?.status).toBe("limited_inspection");
    expect(out?.availability?.contentInspectionStatus).toBe("failed");
    expect(out?.availability?.parserFailure).toBe(true);
  });

  it("marks DNS/network failure as unavailable", async () => {
    const dnsError = Object.assign(new Error("ENOTFOUND"), { code: "ENOTFOUND" });
    vi.spyOn(globalThis, "fetch").mockRejectedValue(dnsError);

    const out = await fetchWebsiteSignals("https://missing-host.invalid");
    expect(out?.availability?.status).toBe("unavailable");
    expect(out?.availability?.errorCode).toBe("enotfound");
  });
});
