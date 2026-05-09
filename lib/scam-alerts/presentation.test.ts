import { describe, expect, it } from "vitest";
import type { PublicScamAlertListItem } from "@/lib/scam-alerts/service";
import {
  alertMatchesListFilter,
  buildScamAlertsQuery,
  clusterDomainKey,
  computeSeverityScore,
  consumerAlertTitle,
  filterPublishedAlerts,
  parseListFilterKey,
  severityFromScore,
  whyThisMattersLine
} from "@/lib/scam-alerts/presentation";

const fixedNow = new Date("2026-05-10T12:00:00.000Z");

function baseAlert(over: Partial<PublicScamAlertListItem> = {}): PublicScamAlertListItem {
  return {
    id: "1",
    title: "Malicious URL reported for base.docsbed.pics",
    slug: "slug-1",
    summary: "Summary text",
    scamType: "phishing",
    affectedBrand: null,
    domain: "evil.example",
    url: "https://evil.example/x",
    sourceName: "OpenPhish",
    sourceUrl: "https://openphish.com",
    confidence: 80,
    evidenceCount: 3,
    status: "published",
    publishedAt: new Date("2026-05-10T10:00:00.000Z"),
    firstSeenAt: new Date("2026-05-09T10:00:00.000Z"),
    lastSeenAt: new Date("2026-05-10T10:00:00.000Z"),
    ...over
  };
}

describe("severity", () => {
  it("maps score thresholds", () => {
    expect(severityFromScore(95)).toBe("critical");
    expect(severityFromScore(80)).toBe("high");
    expect(severityFromScore(60)).toBe("suspicious");
    expect(severityFromScore(40)).toBe("monitoring");
  });

  it("can elevate with evidence and recency", () => {
    const score = computeSeverityScore(baseAlert({ confidence: 86, evidenceCount: 20 }), fixedNow);
    expect(score).toBeGreaterThanOrEqual(90);
  });
});

describe("consumerAlertTitle", () => {
  it("prefers friendly title over raw feed title", () => {
    const t = consumerAlertTitle(baseAlert({ scamType: "phishing", title: "Malicious URL reported for x" }));
    expect(t).toBe("Possible phishing page found");
  });
});

describe("filters", () => {
  it("parses filter query", () => {
    expect(parseListFilterKey(undefined)).toBe("all");
    expect(parseListFilterKey("critical")).toBe("critical");
    expect(parseListFilterKey("nope")).toBe("all");
  });

  it("matches critical by derived severity", () => {
    const a = baseAlert({ confidence: 95, evidenceCount: 0 });
    expect(alertMatchesListFilter(a, "critical", fixedNow)).toBe(true);
    expect(alertMatchesListFilter(a, "high", fixedNow)).toBe(false);
  });

  it("matches new-today on UTC boundary", () => {
    const a = baseAlert({
      publishedAt: new Date("2026-05-10T08:00:00.000Z"),
      lastSeenAt: new Date("2026-05-10T08:00:00.000Z")
    });
    expect(alertMatchesListFilter(a, "new-today", fixedNow)).toBe(true);
  });

  it("filterPublishedAlerts combines type and filter", () => {
    const alerts = [baseAlert({ id: "1", scamType: "phishing" }), baseAlert({ id: "2", scamType: "malware" })];
    const out = filterPublishedAlerts(alerts, { type: "phishing", filter: "all", now: fixedNow });
    expect(out).toHaveLength(1);
    expect(out[0]!.id).toBe("1");
  });
});

describe("buildScamAlertsQuery", () => {
  it("builds query string", () => {
    expect(buildScamAlertsQuery({})).toBe("");
    expect(buildScamAlertsQuery({ filter: "critical" })).toBe("?filter=critical");
    expect(buildScamAlertsQuery({ filter: "high", type: "phishing" })).toBe("?filter=high&type=phishing");
  });
});

describe("clusterDomainKey", () => {
  it("normalizes hostname", () => {
    expect(clusterDomainKey("WWW.EXAMPLE.COM")).toBe("example.com");
  });
});

describe("whyThisMattersLine", () => {
  it("returns plain language", () => {
    const w = whyThisMattersLine(baseAlert());
    expect(w.length).toBeGreaterThan(40);
    expect(w).toMatch(/phishing|credentials/i);
    expect(whyThisMattersLine(baseAlert({ scamType: "other", domain: null }))).toContain("OpenPhish");
  });
});
