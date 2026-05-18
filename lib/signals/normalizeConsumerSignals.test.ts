import { describe, expect, it } from "vitest";
import type { TrustSignal } from "@/lib/checks/types";
import {
  filterConsumerContextNotes,
  heroPreviewReasons,
  normalizeConsumerSignals,
  normalizeConsumerSignalsForResult,
  resolveConsumerBucket
} from "@/lib/signals/normalizeConsumerSignals";
import type { ScamCheckResult } from "@/types/scam";

function signal(partial: Partial<TrustSignal> & Pick<TrustSignal, "type" | "title">): TrustSignal {
  return {
    description: "",
    ...partial
  };
}

describe("normalizeConsumerSignals", () => {
  it("maps phishing report to Things to watch", () => {
    const { helpful, watch } = normalizeConsumerSignals([
      signal({
        type: "danger",
        title: "Listed in OpenPhish public feed",
        description: "This host appears on the OpenPhish feed."
      })
    ]);
    expect(watch.some((l) => /scam or phishing reports/i.test(l))).toBe(true);
    expect(helpful).toHaveLength(0);
  });

  it("maps valid SSL to Helpful signals", () => {
    const { helpful, watch } = normalizeConsumerSignals([
      signal({
        type: "info",
        title: "HTTPS is available",
        description: "HTTPS is available. Issuer: Let's Encrypt."
      })
    ]);
    expect(helpful.some((l) => /valid secure connection/i.test(l))).toBe(true);
    expect(watch).toHaveLength(0);
  });

  it("maps TLS validation issue to Things to watch, not helpful", () => {
    const { helpful, watch } = normalizeConsumerSignals([
      signal({
        type: "warning",
        title: "TLS certificate validation issue",
        description: "HTTPS is reachable but the certificate did not validate."
      })
    ]);
    expect(watch.some((l) => /secure connection.*could not/i.test(l))).toBe(true);
    expect(helpful.some((l) => /valid secure connection/i.test(l))).toBe(false);
  });

  it("maps no OpenPhish match to Helpful signals", () => {
    const { helpful, watch } = normalizeConsumerSignals([
      signal({
        type: "info",
        title: "No OpenPhish match found in this snapshot",
        description: "No overlapping entry was found in the fetched OpenPhish feed."
      })
    ]);
    expect(helpful.some((l) => /no matches were found|scam or phishing lists/i.test(l))).toBe(true);
    expect(watch.some((l) => /appears in known scam/i.test(l))).toBe(false);
  });

  it("hides review enrichment disabled implementation detail", () => {
    expect(
      filterConsumerContextNotes(["Review enrichment is not enabled.", "Some public reputation data was limited."])
    ).toEqual(["Some public reputation data was limited."]);
  });

  it("renders duplicate phishing summaries once only", () => {
    const rows = normalizeConsumerSignals([
      signal({
        type: "danger",
        title: "OpenPhish intelligence match",
        description: "Listed in feed."
      }),
      signal({
        type: "warning",
        title: "Google Safe Browsing match",
        description: "Flagged for phishing."
      })
    ]);
    const phishingLines = rows.watch.filter((l) => /scam or phishing reports/i.test(l));
    expect(phishingLines).toHaveLength(1);
  });

  it("dedupes hero preview reasons", () => {
    const preview = heroPreviewReasons({
      helpful: [],
      watch: [
        "This website appears in known scam or phishing reports.",
        "This website appears in known scam or phishing reports.",
        "This domain was registered recently."
      ]
    });
    expect(preview).toHaveLength(2);
  });
});

describe("normalizeConsumerSignalsForResult domain age", () => {
  it("surfaces young domain under Things to watch with formatted age, not raw days", () => {
    const result = {
      domainIntelligence: { source: "RDAP", warnings: [], ageDays: 12 },
      ssl: { httpsEnabled: true, validCertificate: true, source: "tls", warnings: [] },
      trustSignals: []
    } as Pick<ScamCheckResult, "trustSignals" | "domainIntelligence" | "ssl">;

    const { helpful, watch } = normalizeConsumerSignalsForResult(result);
    expect(watch.some((l) => /relatively new/i.test(l) && /limited public history/i.test(l))).toBe(true);
    expect([...helpful, ...watch].join(" ")).not.toMatch(/\b12\s*days\b(?!\s*old|\))/i);
  });

  it("surfaces established domain under Helpful signals", () => {
    const result = {
      domainIntelligence: { source: "RDAP", warnings: [], ageDays: 438 },
      ssl: { httpsEnabled: true, validCertificate: true, source: "tls", warnings: [] },
      trustSignals: []
    } as Pick<ScamCheckResult, "trustSignals" | "domainIntelligence" | "ssl">;

    const { helpful } = normalizeConsumerSignalsForResult(result);
    expect(helpful.some((l) => /existed for 1 year, 2 months, 13 days/i.test(l))).toBe(true);
  });
});

describe("resolveConsumerBucket", () => {
  it("hides RDAP unavailable internal rows", () => {
    expect(
      resolveConsumerBucket(
        signal({
          type: "info",
          title: "RDAP lookup failed",
          description: "timeout"
        })
      )
    ).toBeNull();
  });
});
