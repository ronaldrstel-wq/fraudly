import type { DomainOverrideVerdict, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { normalizeDomain } from "@/lib/cache";
import { getReputationEnrichment } from "@/lib/outscraper/reputation";
import { publicStatusLabelForVerdict, verdictFromPublicSnapshotLabel } from "@/lib/latest-public-checks/status-label";
import { verdictFromAssessment } from "@/lib/trustSystem";

type AdminIdentity = { userId: string | null; email: string | null };

function toSafeDomain(input: string): string {
  return normalizeDomain(input).slice(0, 2048);
}

async function logAdminAction(
  identity: AdminIdentity,
  actionType: string,
  domain?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const payload = metadata ? (JSON.parse(JSON.stringify(metadata)) as Prisma.InputJsonValue) : undefined;
  await db.scanAdminActionLog.create({
    data: {
      actionType,
      domain: domain ? toSafeDomain(domain) : null,
      metadata: payload,
      createdByUserId: identity.userId,
      createdByEmail: identity.email
    }
  });
}

function overrideToSnapshot(override: DomainOverrideVerdict): { risk: number; verdict: "safe" | "suspicious" | "scam" } {
  if (override === "trusted") return { risk: 15, verdict: "safe" };
  if (override === "suspicious") return { risk: 45, verdict: "suspicious" };
  if (override === "high_risk") return { risk: 80, verdict: "scam" };
  return { risk: 35, verdict: "safe" };
}

export async function setDomainOverride(input: {
  identity: AdminIdentity;
  domain: string;
  overrideVerdict: DomainOverrideVerdict;
  note?: string | null;
}) {
  const domain = toSafeDomain(input.domain);
  const row = await db.domainAdminOverride.upsert({
    where: { domain },
    update: {
      overrideVerdict: input.overrideVerdict,
      note: input.note?.trim() ? input.note.trim().slice(0, 5000) : null,
      createdByUserId: input.identity.userId,
      createdByEmail: input.identity.email
    },
    create: {
      domain,
      overrideVerdict: input.overrideVerdict,
      note: input.note?.trim() ? input.note.trim().slice(0, 5000) : null,
      createdByUserId: input.identity.userId,
      createdByEmail: input.identity.email
    }
  });
  await logAdminAction(input.identity, "set_override", domain, {
    overrideVerdict: row.overrideVerdict
  });
  return row;
}

export async function getDomainOverride(domain: string) {
  return db.domainAdminOverride.findUnique({ where: { domain: toSafeDomain(domain) } });
}

export async function clearReputationCacheForDomain(identity: AdminIdentity, domain: string) {
  const normalized = toSafeDomain(domain);
  const deleted = await db.reputationEnrichmentCache.deleteMany({ where: { normalizedDomain: normalized } });
  await logAdminAction(identity, "clear_reputation_cache", normalized, { deleted: deleted.count });
  return deleted.count;
}

export async function forceRefreshReputationForDomain(identity: AdminIdentity, domain: string) {
  const normalized = toSafeDomain(domain);
  const latest = await db.latestPublicCheck.findUnique({ where: { normalizedValue: normalized } });
  const baseRiskScore = latest?.riskScoreSnapshot ?? 50;
  const enrichment = await getReputationEnrichment({
    domain: normalized,
    baseRiskScore,
    deepScan: true,
    confidenceLevel: "low",
    missingReviewSignals: true,
    bypassCache: true
  });
  await logAdminAction(identity, "force_refresh_reputation", normalized, {
    providerStatus: enrichment.reputationStatus,
    cacheStatus: enrichment.cacheStatus
  });
  return enrichment;
}

export async function hideLatestCheckForDomain(identity: AdminIdentity, domain: string) {
  const normalized = toSafeDomain(domain);
  const deleted = await db.latestPublicCheck.deleteMany({ where: { normalizedValue: normalized } });
  await logAdminAction(identity, "hide_latest_check", normalized, { deleted: deleted.count });
  return deleted.count;
}

export async function recalculateSingleDomain(identity: AdminIdentity, domain: string) {
  const normalized = toSafeDomain(domain);
  const override = await getDomainOverride(normalized);
  const latest = await db.latestPublicCheck.findUnique({ where: { normalizedValue: normalized } });
  const recent = await db.recentSearch.findMany({
    where: { normalizedQuery: normalized },
    orderBy: { createdAt: "desc" },
    take: 50
  });
  let latestUpdated = 0;
  let recentUpdated = 0;

  if (latest) {
    const baseVerdict = verdictFromPublicSnapshotLabel(latest.statusLabel) ?? verdictFromAssessment({ riskScore: latest.riskScoreSnapshot, confirmedMalicious: false });
    const effective = override && override.overrideVerdict !== "none" ? overrideToSnapshot(override.overrideVerdict) : { risk: latest.riskScoreSnapshot, verdict: baseVerdict };
    await db.latestPublicCheck.update({
      where: { id: latest.id },
      data: {
        riskScoreSnapshot: effective.risk,
        statusLabel: publicStatusLabelForVerdict(effective.verdict)
      }
    });
    latestUpdated = 1;
  }

  for (const row of recent) {
    const trust = row.trustScoreSnap ?? 50;
    const derivedVerdict = verdictFromAssessment({ riskScore: 100 - trust, confirmedMalicious: false });
    const finalVerdict =
      override && override.overrideVerdict !== "none"
        ? overrideToSnapshot(override.overrideVerdict).verdict
        : derivedVerdict;
    await db.recentSearch.update({
      where: { id: row.id },
      data: {
        trustScoreSnap: trust,
        verdictSnap: finalVerdict
      }
    });
    recentUpdated += 1;
  }

  await logAdminAction(identity, "recalculate_single_domain", normalized, {
    latestUpdated,
    recentUpdated,
    override: override?.overrideVerdict ?? "none"
  });

  return { latestUpdated, recentUpdated, override: override?.overrideVerdict ?? "none" };
}

export async function recalculateRecentLatestChecks(identity: AdminIdentity, limit = 100) {
  const rows = await db.latestPublicCheck.findMany({
    orderBy: { lastSeenAt: "desc" },
    take: Math.max(1, Math.min(500, Math.floor(limit)))
  });
  let updated = 0;
  for (const row of rows) {
    const override = await getDomainOverride(row.normalizedValue);
    const baseVerdict = verdictFromPublicSnapshotLabel(row.statusLabel) ?? verdictFromAssessment({ riskScore: row.riskScoreSnapshot, confirmedMalicious: false });
    const effective = override && override.overrideVerdict !== "none" ? overrideToSnapshot(override.overrideVerdict) : { risk: row.riskScoreSnapshot, verdict: baseVerdict };
    await db.latestPublicCheck.update({
      where: { id: row.id },
      data: {
        riskScoreSnapshot: effective.risk,
        statusLabel: publicStatusLabelForVerdict(effective.verdict)
      }
    });
    updated += 1;
  }
  await logAdminAction(identity, "recalculate_recent", undefined, { updated, scanned: rows.length });
  return { scanned: rows.length, updated };
}

export async function getDomainDebugDetails(domain: string) {
  const normalized = toSafeDomain(domain);
  const [override, latest, recent, reputationCache, actions] = await Promise.all([
    getDomainOverride(normalized),
    db.latestPublicCheck.findUnique({ where: { normalizedValue: normalized } }),
    db.recentSearch.findMany({
      where: { normalizedQuery: normalized },
      orderBy: { createdAt: "desc" },
      take: 10
    }),
    db.reputationEnrichmentCache.findUnique({ where: { normalizedDomain: normalized } }),
    db.scanAdminActionLog.findMany({
      where: { domain: normalized },
      orderBy: { createdAt: "desc" },
      take: 20
    })
  ]);
  return {
    domain: normalized,
    override,
    latest,
    recent,
    reputationCache,
    actions
  };
}
