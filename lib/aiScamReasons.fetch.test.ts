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
    expect(out?.availability?.httpStatus).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("treats 403 as limited but responded", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 403 }))
      .mockResolvedValueOnce(new Response("", { status: 403, headers: { "content-type": "text/html" } }));

    const out = await fetchWebsiteSignals("https://blocked.example");
    expect(out?.availability?.status).toBe("limited");
    expect(out?.availability?.httpStatus).toBe(403);
  });
});
