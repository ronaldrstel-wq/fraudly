import { describe, expect, it } from "vitest";
import { consumerSignalSummary } from "@/lib/consumerSignalCopy";

describe("consumerSignalCopy", () => {
  it("rewrites TLS jargon", () => {
    expect(consumerSignalSummary("TLS valid", "Certificate chain OK")).toMatch(/valid secure connection/i);
  });

  it("rewrites domain age jargon", () => {
    expect(consumerSignalSummary("RDAP age > 365d", "")).toMatch(/registration/i);
  });

  it("rewrites young domain jargon", () => {
    expect(consumerSignalSummary("Young domain", "Registered 12 days ago")).toMatch(/registered recently/i);
  });

  it("rewrites limited review data", () => {
    expect(consumerSignalSummary("No Google reviews found", "Limited review coverage")).toMatch(
      /limited public reputation/i
    );
  });

  it("rewrites feed composite jargon", () => {
    expect(consumerSignalSummary("Feed hit composite", "")).toMatch(/automated risk checks/i);
  });

  it("avoids raw jargon in fallback", () => {
    expect(consumerSignalSummary("RDAP parser timeout", "dns failure")).not.toMatch(/rdap/i);
  });
});
