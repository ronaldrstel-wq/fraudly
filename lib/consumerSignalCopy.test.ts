import { describe, expect, it } from "vitest";
import { consumerSignalSummary, isInternalImplementationSignal } from "@/lib/consumerSignalCopy";

describe("consumerSignalCopy", () => {
  it("rewrites TLS jargon for helpful section", () => {
    expect(consumerSignalSummary("TLS valid", "Certificate chain OK", "positive")).toMatch(/valid secure connection/i);
  });

  it("does not put TLS valid copy in caution section", () => {
    expect(consumerSignalSummary("TLS valid", "Certificate chain OK", "caution")).not.toMatch(/valid secure connection/i);
  });

  it("rewrites domain age for helpful section", () => {
    expect(consumerSignalSummary("Older domain registration", "Registered 800 days ago", "positive")).toMatch(
      /several years|verified/i
    );
  });

  it("rewrites young domain for caution section", () => {
    expect(consumerSignalSummary("Very new domain registration", "12 days old", "caution")).toMatch(
      /relatively new|limited public history/i
    );
  });

  it("rewrites limited review data for caution section", () => {
    expect(consumerSignalSummary("No Google reviews found", "Limited review coverage", "caution")).toMatch(
      /limited public reputation/i
    );
  });

  it("hides feed composite jargon", () => {
    expect(consumerSignalSummary("Feed hit composite", "", "caution")).toBeNull();
    expect(isInternalImplementationSignal("Feed hit composite")).toBe(true);
  });

  it("hides enrichment disabled wording", () => {
    expect(isInternalImplementationSignal("Review enrichment is not enabled.")).toBe(true);
  });
});
