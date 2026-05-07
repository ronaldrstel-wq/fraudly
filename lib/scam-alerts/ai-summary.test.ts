import { describe, expect, it } from "vitest";
import { summarizeAlertCluster } from "@/lib/scam-alerts/ai-summary";

describe("ai summary fallback", () => {
  it("returns deterministic summary when OpenAI key missing", async () => {
    const original = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const out = await summarizeAlertCluster({
      clusterKey: "k",
      scamType: "phishing",
      riskLevel: "high",
      confidence: 0.8,
      signals: [
        {
          source: "internal",
          normalizedDomain: "verify-account-now.top",
          riskLevel: "high",
          confidence: 0.8,
          evidence: {}
        }
      ],
      repeatedKeywords: ["verify"],
      repeatedTlds: ["top"]
    });
    expect(out.summary.toLowerCase()).toContain("fraudly detected patterns");
    process.env.OPENAI_API_KEY = original;
  });
});
