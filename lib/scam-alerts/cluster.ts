import type { NormalizedScamSignal, ScamCluster, ScamRiskLevel } from "@/lib/scam-alerts/types";

const RISK_ORDER: Record<ScamRiskLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3
};

function topRiskLevel(levels: ScamRiskLevel[]): ScamRiskLevel {
  return levels.sort((a, b) => RISK_ORDER[b] - RISK_ORDER[a])[0] ?? "medium";
}

function keywordsFromSignal(signal: NormalizedScamSignal): string[] {
  const txt = `${signal.url ?? ""} ${signal.domain ?? ""} ${signal.scamType ?? ""}`.toLowerCase();
  return txt
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length >= 4)
    .slice(0, 16);
}

export function clusterSignals(signals: NormalizedScamSignal[]): ScamCluster[] {
  const groups = new Map<string, NormalizedScamSignal[]>();
  for (const signal of signals) {
    const key = `${signal.scamType ?? "unknown suspicious"}|${signal.affectedBrand ?? "generic"}`;
    const bucket = groups.get(key) ?? [];
    bucket.push(signal);
    groups.set(key, bucket);
  }

  return [...groups.entries()].map(([key, bucket]) => {
    const [scamType, affectedBrandRaw] = key.split("|");
    const affectedBrand = affectedBrandRaw === "generic" ? undefined : affectedBrandRaw;
    const repeatedKeywords = new Map<string, number>();
    const repeatedTlds = new Map<string, number>();
    for (const signal of bucket) {
      for (const token of keywordsFromSignal(signal)) {
        repeatedKeywords.set(token, (repeatedKeywords.get(token) ?? 0) + 1);
      }
      const tld = signal.normalizedDomain?.split(".").pop();
      if (tld) repeatedTlds.set(tld, (repeatedTlds.get(tld) ?? 0) + 1);
    }
    const repeatedKeywordList = [...repeatedKeywords.entries()]
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([k]) => k);
    const repeatedTldList = [...repeatedTlds.entries()]
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([tld]) => tld);

    return {
      clusterKey: key,
      scamType,
      affectedBrand,
      riskLevel: topRiskLevel(bucket.map((s) => s.riskLevel)),
      confidence: Math.max(...bucket.map((s) => s.confidence), 0.4),
      signals: bucket,
      repeatedKeywords: repeatedKeywordList,
      repeatedTlds: repeatedTldList
    };
  });
}
