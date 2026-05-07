import { Prisma, ScamAlertStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { classifySignals } from "@/lib/scam-alerts/classify";
import { clusterSignals } from "@/lib/scam-alerts/cluster";
import { fetchAllScamSignals } from "@/lib/scam-alerts/fetch-signals";
import { generateAlertDrafts } from "@/lib/scam-alerts/generate-alerts";
import { dedupeSignals } from "@/lib/scam-alerts/normalize";

export type ScamAlertsJobResult = {
  sourcesFetched: Array<{ source: string; count: number; error?: string }>;
  signalsStored: number;
  alertsGenerated: number;
  alertsPublished: number;
  errors: string[];
};

export async function runScamAlertsJob(): Promise<ScamAlertsJobResult> {
  const errors: string[] = [];
  const fetched = await fetchAllScamSignals();
  const normalized = dedupeSignals(fetched.signals);
  const classified = classifySignals(normalized);

  let signalsStored = 0;
  for (const signal of classified) {
    try {
      await db.scamSignal.upsert({
        where: {
          source_sourceRef: {
            source: signal.source,
            sourceRef: signal.sourceRef ?? `${signal.normalizedDomain ?? signal.url ?? "unknown"}`
          }
        },
        update: {
          url: signal.url,
          domain: signal.domain,
          normalizedDomain: signal.normalizedDomain,
          scamType: signal.scamType,
          affectedBrand: signal.affectedBrand,
          riskLevel: signal.riskLevel,
          confidence: signal.confidence,
          firstSeenAt: signal.firstSeenAt,
          lastSeenAt: signal.lastSeenAt,
          evidenceJson: signal.evidence as Prisma.InputJsonValue
        },
        create: {
          source: signal.source,
          sourceRef: signal.sourceRef ?? `${signal.normalizedDomain ?? signal.url ?? "unknown"}`,
          url: signal.url,
          domain: signal.domain,
          normalizedDomain: signal.normalizedDomain,
          scamType: signal.scamType,
          affectedBrand: signal.affectedBrand,
          riskLevel: signal.riskLevel,
          confidence: signal.confidence,
          firstSeenAt: signal.firstSeenAt,
          lastSeenAt: signal.lastSeenAt,
          evidenceJson: signal.evidence as Prisma.InputJsonValue
        }
      });
      signalsStored += 1;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "signal upsert failed");
    }
  }

  const clusters = clusterSignals(classified);
  const drafts = await generateAlertDrafts(clusters);
  let alertsGenerated = 0;
  let alertsPublished = 0;
  for (const draft of drafts) {
    try {
      const row = await db.scamAlert.upsert({
        where: { slug: draft.slug },
        update: {
          title: draft.title,
          scamType: draft.scamType,
          affectedBrand: draft.affectedBrand,
          riskLevel: draft.riskLevel,
          summary: draft.summary,
          safetyTips: draft.safetyTips,
          evidenceCount: draft.evidenceCount,
          exampleDomainsJson: draft.exampleDomains,
          sourceSummaryJson: draft.sourceSummary,
          status: draft.shouldPublish ? ScamAlertStatus.published : ScamAlertStatus.draft,
          generatedAt: new Date()
        },
        create: {
          slug: draft.slug,
          title: draft.title,
          scamType: draft.scamType,
          affectedBrand: draft.affectedBrand,
          riskLevel: draft.riskLevel,
          summary: draft.summary,
          safetyTips: draft.safetyTips,
          evidenceCount: draft.evidenceCount,
          exampleDomainsJson: draft.exampleDomains,
          sourceSummaryJson: draft.sourceSummary,
          status: draft.shouldPublish ? ScamAlertStatus.published : ScamAlertStatus.draft,
          generatedAt: new Date()
        }
      });
      alertsGenerated += 1;
      if (row.status === ScamAlertStatus.published) alertsPublished += 1;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "alert upsert failed");
    }
  }

  return {
    sourcesFetched: fetched.summary,
    signalsStored,
    alertsGenerated,
    alertsPublished,
    errors
  };
}
