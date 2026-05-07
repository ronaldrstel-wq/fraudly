import OpenAI from "openai";
import type { ScamCluster } from "@/lib/scam-alerts/types";

const MODEL = "gpt-4o-mini";

export type AlertSummaryOutput = {
  title: string;
  summary: string;
  safetyTips: string[];
};

function fallbackSummary(cluster: ScamCluster): AlertSummaryOutput {
  const brandPart = cluster.affectedBrand ? ` targeting ${cluster.affectedBrand}` : "";
  return {
    title: `${cluster.scamType} alert${brandPart}`,
    summary: `Fraudly detected patterns associated with a possible ${cluster.scamType} campaign${brandPart}. This alert is evidence-based and may evolve as more data arrives.`,
    safetyTips: [
      "Do not enter passwords, payment details, or wallet keys unless independently verified.",
      "Verify the domain directly via official channels before taking action.",
      "Treat urgent payment, refund, or verification requests as suspicious."
    ]
  };
}

export async function summarizeAlertCluster(cluster: ScamCluster): Promise<AlertSummaryOutput> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return fallbackSummary(cluster);

  const client = new OpenAI({ apiKey, timeout: 6000, maxRetries: 0 });
  const evidence = {
    scamType: cluster.scamType,
    affectedBrand: cluster.affectedBrand,
    riskLevel: cluster.riskLevel,
    confidence: cluster.confidence,
    evidenceCount: cluster.signals.length,
    exampleDomains: cluster.signals.map((s) => s.normalizedDomain).filter(Boolean).slice(0, 6),
    repeatedKeywords: cluster.repeatedKeywords,
    repeatedTlds: cluster.repeatedTlds,
    sources: [...new Set(cluster.signals.map((s) => s.source))]
  };

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.1,
      max_completion_tokens: 240,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You summarize scam alerts from verified evidence only. Never invent domains, brands, incidents, dates, or statistics."
        },
        {
          role: "user",
          content: `Return JSON: {"title":"...","summary":"...","safetyTips":["...","...","..."]} using only this evidence:\n${JSON.stringify(
            evidence
          )}`
        }
      ]
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(raw) as Partial<AlertSummaryOutput>;
    if (!parsed.title || !parsed.summary || !Array.isArray(parsed.safetyTips) || parsed.safetyTips.length === 0) {
      return fallbackSummary(cluster);
    }
    return {
      title: parsed.title.slice(0, 120),
      summary: parsed.summary.slice(0, 700),
      safetyTips: parsed.safetyTips.map((tip) => String(tip).slice(0, 220)).slice(0, 5)
    };
  } catch {
    return fallbackSummary(cluster);
  }
}
