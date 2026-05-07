import type { ScamCluster, GeneratedAlertDraft } from "@/lib/scam-alerts/types";
import { summarizeAlertCluster } from "@/lib/scam-alerts/ai-summary";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function sourceCounts(cluster: ScamCluster): Array<{ source: GeneratedAlertDraft["sourceSummary"][number]["source"]; count: number }> {
  const counts = new Map<string, number>();
  for (const signal of cluster.signals) {
    counts.set(signal.source, (counts.get(signal.source) ?? 0) + 1);
  }
  return [...counts.entries()].map(([source, count]) => ({ source: source as any, count }));
}

function shouldGenerate(cluster: ScamCluster): boolean {
  const sources = new Set(cluster.signals.map((s) => s.source));
  const internalCount = cluster.signals.filter((s) => s.source === "internal").length;
  const verifiedExternal = cluster.signals.some((s) => s.source !== "internal" && s.confidence >= 0.9);
  return sources.size >= 2 || internalCount >= 3 || verifiedExternal;
}

function shouldPublish(cluster: ScamCluster): boolean {
  const sourceSet = new Set(cluster.signals.map((s) => s.source));
  const highConfidence = cluster.confidence >= 0.8;
  return highConfidence && (cluster.riskLevel === "critical" || sourceSet.size >= 2);
}

export async function generateAlertDrafts(clusters: ScamCluster[]): Promise<GeneratedAlertDraft[]> {
  const drafts: GeneratedAlertDraft[] = [];
  for (const cluster of clusters) {
    if (!shouldGenerate(cluster)) continue;
    const ai = await summarizeAlertCluster(cluster);
    const title = ai.title || `${cluster.scamType} alert`;
    const slug = slugify(`${cluster.scamType}-${cluster.affectedBrand ?? "generic"}-${cluster.clusterKey}`);
    drafts.push({
      slug,
      title,
      scamType: cluster.scamType,
      affectedBrand: cluster.affectedBrand,
      riskLevel: cluster.riskLevel,
      summary: ai.summary,
      safetyTips: ai.safetyTips,
      evidenceCount: cluster.signals.length,
      exampleDomains: [...new Set(cluster.signals.map((s) => s.normalizedDomain).filter(Boolean))].slice(0, 8) as string[],
      sourceSummary: sourceCounts(cluster),
      shouldPublish: shouldPublish(cluster)
    });
  }
  return drafts;
}
