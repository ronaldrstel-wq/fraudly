import { db } from "@/lib/db";
import { normalizeDomain } from "@/lib/cache";
import type { NormalizedScamSignal } from "@/lib/scam-alerts/types";

const INTERNAL_LOOKBACK_HOURS = 48;

function classifyFromQuery(query: string): { scamType?: string; riskLevel: "medium" | "high" } {
  const q = query.toLowerCase();
  if (/(wallet|airdrop|seed|recovery)/.test(q)) return { scamType: "crypto wallet scam", riskLevel: "high" };
  if (/(login|verify|account|secure)/.test(q)) return { scamType: "fake login verification", riskLevel: "high" };
  if (/(refund|claim|payment)/.test(q)) return { scamType: "fake refund", riskLevel: "high" };
  if (/(delivery|fee|parcel|dhl)/.test(q)) return { scamType: "fake delivery fee", riskLevel: "medium" };
  return { scamType: "unknown suspicious", riskLevel: "medium" };
}

export async function fetchInternalFraudlySignals(): Promise<NormalizedScamSignal[]> {
  const since = new Date(Date.now() - INTERNAL_LOOKBACK_HOURS * 60 * 60 * 1000);
  const rows = await db.recentSearch.findMany({
    where: {
      createdAt: { gte: since },
      publicVisible: true,
      OR: [
        { verdictSnap: { in: ["suspicious", "scam"] } },
        { trustScoreSnap: { lte: 55 } }
      ]
    },
    orderBy: { createdAt: "desc" },
    take: 500
  });

  return rows.map((row) => {
    const normalized = normalizeDomain(row.normalizedQuery || row.originalQuery);
    const classification = classifyFromQuery(row.originalQuery);
    return {
      source: "internal",
      sourceRef: row.id,
      domain: normalized,
      normalizedDomain: normalized,
      scamType: classification.scamType,
      riskLevel: classification.riskLevel,
      confidence: row.verdictSnap === "scam" ? 0.9 : 0.7,
      firstSeenAt: row.createdAt,
      lastSeenAt: row.createdAt,
      evidence: {
        entityType: row.entityType,
        verdict: row.verdictSnap,
        trustScore: row.trustScoreSnap,
        resultPath: row.resultPath
      }
    } satisfies NormalizedScamSignal;
  });
}
