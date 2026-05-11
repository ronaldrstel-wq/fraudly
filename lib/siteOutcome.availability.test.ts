import { describe, expect, it } from "vitest";
import { isProbablyInactiveWebsite } from "@/lib/siteOutcome";

const sslOk = {
  httpsEnabled: true,
  validCertificate: true,
  source: "test",
  warnings: []
};

describe("availability classification", () => {
  it("does not mark inactive for normal reachable site", () => {
    expect(
      isProbablyInactiveWebsite({
        dnsResolvable: true,
        treatAsNonexistent: false,
        websiteSignals: {
          title: "Example",
          metaDescription: "Example desc",
          bodySnippet: "Hello",
          text: "Hello",
          availability: {
            status: "reachable",
            methodTried: "HEAD+GET",
            httpStatus: 200,
            finalUrl: "https://example.com",
            timedOut: false,
            errorCode: null,
            reason: "Website responded."
          }
        },
        ssl: sslOk
      })
    ).toBe(false);
  });

  it("does not mark inactive for 403 bot protection", () => {
    expect(
      isProbablyInactiveWebsite({
        dnsResolvable: true,
        treatAsNonexistent: false,
        websiteSignals: {
          title: "",
          metaDescription: "",
          bodySnippet: "",
          text: "",
          availability: {
            status: "limited",
            methodTried: "HEAD+GET",
            httpStatus: 403,
            finalUrl: "https://protected.example",
            timedOut: false,
            errorCode: null,
            reason: "Website responded, but some page details could not be inspected."
          }
        },
        ssl: sslOk
      })
    ).toBe(false);
  });

  it("marks inactive only when unreachable", () => {
    expect(
      isProbablyInactiveWebsite({
        dnsResolvable: true,
        treatAsNonexistent: false,
        websiteSignals: {
          title: "",
          metaDescription: "",
          bodySnippet: "",
          text: "",
          availability: {
            status: "unreachable",
            methodTried: "HEAD+GET",
            httpStatus: null,
            finalUrl: null,
            timedOut: true,
            errorCode: "timeout",
            reason: "No response from website after retry."
          }
        },
        ssl: sslOk
      })
    ).toBe(true);
  });
});
