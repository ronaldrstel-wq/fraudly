import { createHash } from "node:crypto";
import { Prisma, ScamAlertStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { applyScamAlertFeedQuality } from "@/lib/scam-alerts/feedQuality";

/** Public index filters (query param `filter`). */
export type ScamAlertsPublicFilter = "all" | "high" | "malware" | "phishing" | "new-today";

/** Time window for `/scam-alerts` (query param `time`). Default: today (UTC). */
export type ScamAlertsTimeWindow = "today" | "24h" | "7d" | "all";

export const SCAM_ALERTS_PAGE_SIZE = 24;

const MS_DAY = 86_400_000;
/** Days after first publish when a row stops appearing on public pages (before archival cron). */
const SCAM_ALERT_PUBLIC_VISIBILITY_DAYS = 90;

export type PublicScamAlertListItem = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  scamType: string;
  affectedBrand: string | null;
  domain: string | null;
  url: string | null;
  sourceName: string;
  sourceUrl: string | null;
  confidence: number;
  evidenceCount: number;
  status: ScamAlertStatus;
  publishedAt: Date | null;
  firstSeenAt: Date;
  lastSeenAt: Date;
};

export type PublicScamAlertDetail = PublicScamAlertListItem & {
  whyRisky: string | null;
  safetyTips: string[];
  sourceSummaryJson: unknown;
  exampleDomainsJson: unknown;
  signals: Array<{
    id: string;
    sourceName: string;
    sourceUrl: string | null;
    signalType: string;
    content: string;
    domain: string | null;
    url: string | null;
    confidence: number;
    firstSeenAt: Date;
    lastSeenAt: Date;
  }>;
};

export type IngestScamAlertInput = {
  title: string;
  summary: string;
  scamType: string;
  affectedBrand?: string | null;
  domain?: string | null;
  url?: string | null;
  sourceName: string;
  sourceUrl?: string | null;
  confidence: number;
  whyRisky?: string | null;
  signalType?: string;
  signalContent?: string;
};

export type ScamAlertCronSummary = {
  /** Raw rows returned from all feeds before in-run dedupe. */
  fetched: number;
  /** Rows after merging duplicate feed lines (same source/type/domain/url). */
  deduped: number;
  /** Same as `deduped` (kept for older clients). */
  scanned: number;
  created: number;
  updated: number;
  published: number;
  /** Rows moved to `archived` this run (published older than 90d or draft older than 14d). */
  archived: number;
  /** Hard-deleted archived rows past the retention window (see env). */
  deletedArchived: number;
  skippedDueToCap: number;
  statusCounts: { draft: number; published: number; archived: number };
  failedSources: Array<{ source: string; error: string }>;
};

/** Max new `ScamAlert` rows created per cron run (`SCAM_ALERTS_MAX_NEW_PER_RUN`, default 100). */
export function getScamAlertsMaxNewPerRun(): number {
  const raw = process.env.SCAM_ALERTS_MAX_NEW_PER_RUN?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 100;
  if (!Number.isFinite(n) || n < 1) return 100;
  return Math.min(10_000, n);
}

/**
 * Days after `archivedAt` before hard delete. Unset defaults to 180.
 * Set `SCAM_ALERTS_HARD_DELETE_ARCHIVED_AFTER_DAYS=0` or `never` to keep archived rows forever.
 */
export function getHardDeleteArchivedAfterDays(): number | null {
  const raw = process.env.SCAM_ALERTS_HARD_DELETE_ARCHIVED_AFTER_DAYS?.trim().toLowerCase();
  if (raw === "0" || raw === "never" || raw === "off" || raw === "false") return null;
  if (!raw) return 180;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return 180;
  return Math.min(n, 3650);
}

function addDaysUtc(base: Date, days: number): Date {
  return new Date(base.getTime() + days * MS_DAY);
}

/** Public listing: published, has `publishedAt`, and not past `expiresAt`. */
export function buildPublishedActiveScamAlertWhere(now: Date): Prisma.ScamAlertWhereInput {
  return {
    status: ScamAlertStatus.published,
    publishedAt: { not: null },
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }]
  };
}

function isDbUnavailable(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && (err.code === "P2021" || err.code === "P1001");
}

function clampConfidence(v: number): number {
  return Math.max(1, Math.min(100, Math.round(v)));
}

function normalizeDomain(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const u = value.startsWith("http://") || value.startsWith("https://") ? new URL(value) : new URL(`https://${value}`);
    return u.hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  } catch {
    return value.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function buildSlug(input: IngestScamAlertInput): string {
  const base = [input.scamType, input.affectedBrand ?? "", normalizeDomain(input.domain) ?? "", input.sourceName]
    .filter(Boolean)
    .join(" ");
  const digest = createHash("sha1")
    .update(`${input.sourceName}|${input.scamType}|${normalizeDomain(input.domain) ?? ""}|${input.url ?? ""}`)
    .digest("hex")
    .slice(0, 8);
  return `${slugify(base || input.title)}-${digest}`;
}

function dedupeMatch(input: IngestScamAlertInput): Prisma.ScamAlertWhereInput {
  const scamType = input.scamType.trim().toLowerCase().slice(0, 64);
  const sourceName = input.sourceName.trim().slice(0, 128);
  const url = input.url?.trim() || null;
  return {
    scamType: { equals: scamType, mode: "insensitive" },
    sourceName: { equals: sourceName, mode: "insensitive" },
    domain: normalizeDomain(input.domain),
    url
  };
}

function riskLevelForConfidence(confidence: number): string {
  if (confidence >= 85) return "critical";
  if (confidence >= 70) return "high";
  if (confidence >= 50) return "medium";
  return "low";
}

export async function listPublishedScamAlerts(params?: { scamType?: string; take?: number; now?: Date }): Promise<PublicScamAlertListItem[]> {
  const take = Math.max(1, Math.min(500, params?.take ?? 50));
  const now = params?.now ?? new Date();
  const active = buildPublishedActiveScamAlertWhere(now);
  try {
    return await db.scamAlert.findMany({
      where: {
        AND: [active, ...(params?.scamType ? [{ scamType: params.scamType }] : [])]
      },
      orderBy: [{ publishedAt: "desc" }, { lastSeenAt: "desc" }],
      take
    });
  } catch (err) {
    if (isDbUnavailable(err)) return [];
    throw err;
  }
}

function utcStartOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

/** Extra `publishedAt` lower bound for feed time tabs (merged with public active where). */
export function buildPublishedScamTimeWindowWhere(
  window: ScamAlertsTimeWindow,
  now: Date
): Prisma.ScamAlertWhereInput | null {
  if (window === "all") return null;
  if (window === "today") {
    return { publishedAt: { gte: utcStartOfDay(now) } };
  }
  if (window === "24h") {
    return { publishedAt: { gte: new Date(now.getTime() - MS_DAY) } };
  }
  if (window === "7d") {
    return { publishedAt: { gte: new Date(now.getTime() - 7 * MS_DAY) } };
  }
  return null;
}

/**
 * Prisma `where` for published alerts on the public index (filter + optional exact `scamType` chip).
 * “High risk” ≈ confidence ≥ 75 (aligns with elevated summary and UI high/critical tiers).
 */
export function buildPublishedScamAlertsWhere(
  filter: ScamAlertsPublicFilter,
  exactScamType: string | undefined,
  now: Date
): Prisma.ScamAlertWhereInput {
  const trimmedType = exactScamType?.trim();
  const publishedRoot: Prisma.ScamAlertWhereInput =
    trimmedType !== undefined && trimmedType.length > 0
      ? { AND: [buildPublishedActiveScamAlertWhere(now), { scamType: trimmedType }] }
      : buildPublishedActiveScamAlertWhere(now);

  if (filter === "all") return publishedRoot;

  const start = utcStartOfDay(now);

  if (filter === "high") {
    return { AND: [publishedRoot, { confidence: { gte: 75 } }] };
  }

  if (filter === "malware") {
    return {
      AND: [
        publishedRoot,
        {
          OR: [
            { scamType: { contains: "malware", mode: "insensitive" } },
            { scamType: { contains: "trojan", mode: "insensitive" } },
            { scamType: { contains: "virus", mode: "insensitive" } }
          ]
        }
      ]
    };
  }

  if (filter === "phishing") {
    return { AND: [publishedRoot, { scamType: { contains: "phish", mode: "insensitive" } }] };
  }

  if (filter === "new-today") {
    return { AND: [publishedRoot, { publishedAt: { gte: start } }] };
  }

  return publishedRoot;
}

/** Public feed: newest publication first, then confidence for ties. */
const scamAlertsListOrderBy: Prisma.ScamAlertOrderByWithRelationInput[] = [
  { publishedAt: "desc" },
  { lastSeenAt: "desc" },
  { confidence: "desc" },
  { evidenceCount: "desc" }
];

const SCAM_ALERTS_FEED_RAW_CAP = 4000;

export type PublishedScamAlertsPageResult = {
  alerts: PublicScamAlertListItem[];
  total: number;
  page: number;
  pageSize: number;
  maxPage: number;
};

export async function getPublishedScamAlertsPageResult(params: {
  filter: ScamAlertsPublicFilter;
  exactScamType?: string;
  page: number;
  pageSize?: number;
  now?: Date;
  timeWindow?: ScamAlertsTimeWindow;
}): Promise<PublishedScamAlertsPageResult> {
  const now = params.now ?? new Date();
  const pageSize = Math.max(1, Math.min(48, params.pageSize ?? SCAM_ALERTS_PAGE_SIZE));
  const timeWindow = params.timeWindow ?? "today";
  const baseWhere = buildPublishedScamAlertsWhere(params.filter, params.exactScamType, now);
  const tw = buildPublishedScamTimeWindowWhere(timeWindow, now);
  const where: Prisma.ScamAlertWhereInput = tw ? { AND: [baseWhere, tw] } : baseWhere;

  try {
    const raw = await db.scamAlert.findMany({
      where,
      orderBy: scamAlertsListOrderBy,
      take: SCAM_ALERTS_FEED_RAW_CAP
    });

    const deduped = applyScamAlertFeedQuality(raw);
    const total = deduped.length;
    const maxPage = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(Math.max(1, params.page), maxPage);
    const skip = (page - 1) * pageSize;
    const alerts = deduped.slice(skip, skip + pageSize);

    return { alerts, total, page, pageSize, maxPage };
  } catch (err) {
    if (isDbUnavailable(err)) {
      return { alerts: [], total: 0, page: 1, pageSize, maxPage: 1 };
    }
    throw err;
  }
}

export type ScamAlertsIndexStats = {
  total: number;
  /** Count with confidence ≥ 75 (aligns with “high” tier and above in the public list). */
  elevatedConfidenceCount: number;
  /** Published or first activity timestamp today (UTC day). */
  newTodayCount: number;
  topScamType: string | null;
};

export async function getScamAlertsIndexStats(now: Date = new Date()): Promise<ScamAlertsIndexStats> {
  const start = utcStartOfDay(now);
  const published = buildPublishedActiveScamAlertWhere(now);
  try {
    const [total, elevatedConfidenceCount, newTodayCount, typeGroups] = await Promise.all([
      db.scamAlert.count({ where: published }),
      db.scamAlert.count({
        where: { AND: [published, { confidence: { gte: 75 } }] }
      }),
      db.scamAlert.count({
        where: { AND: [published, { publishedAt: { gte: start } }] }
      }),
      db.scamAlert.groupBy({
        by: ["scamType"],
        where: published,
        _count: { _all: true }
      })
    ]);
    const topScamType =
      typeGroups.length === 0
        ? null
        : [...typeGroups].sort((a, b) => b._count._all - a._count._all)[0]!.scamType;
    return {
      total,
      elevatedConfidenceCount,
      newTodayCount,
      topScamType
    };
  } catch (err) {
    if (isDbUnavailable(err)) {
      return { total: 0, elevatedConfidenceCount: 0, newTodayCount: 0, topScamType: null };
    }
    throw err;
  }
}

export async function listPublishedScamTypes(now: Date = new Date()): Promise<string[]> {
  try {
    const rows = await db.scamAlert.findMany({
      where: buildPublishedActiveScamAlertWhere(now),
      select: { scamType: true },
      distinct: ["scamType"],
      orderBy: { scamType: "asc" }
    });
    return rows.map((r) => r.scamType);
  } catch (err) {
    if (isDbUnavailable(err)) return [];
    throw err;
  }
}

export async function getPublishedScamAlertBySlug(slug: string, now: Date = new Date()): Promise<PublicScamAlertDetail | null> {
  try {
    return await db.scamAlert.findFirst({
      where: { AND: [{ slug }, buildPublishedActiveScamAlertWhere(now)] },
      include: {
        signals: {
          orderBy: { confidence: "desc" },
          take: 30
        }
      }
    });
  } catch (err) {
    if (isDbUnavailable(err)) return null;
    throw err;
  }
}

type IngestSingleOutcome = "created" | "updated" | "published" | "skipped_cap";

async function ingestSingleAlert(
  rawInput: IngestScamAlertInput,
  opts?: { createBudget?: { used: number; max: number } }
): Promise<IngestSingleOutcome> {
  const input: IngestScamAlertInput = {
    ...rawInput,
    title: rawInput.title.trim(),
    summary: rawInput.summary.trim(),
    scamType: rawInput.scamType.trim().toLowerCase().slice(0, 64),
    sourceName: rawInput.sourceName.trim().slice(0, 128),
    url: rawInput.url?.trim() || null,
    affectedBrand: rawInput.affectedBrand?.trim() || null,
    sourceUrl: rawInput.sourceUrl?.trim() || null,
    whyRisky: rawInput.whyRisky?.trim() || null
  };

  const now = new Date();
  const confidence = clampConfidence(input.confidence);
  const domain = normalizeDomain(input.domain);
  const forcePublishForTesting = process.env.SCAM_ALERTS_FORCE_PUBLISH === "true";
  const publishedByDefault = forcePublishForTesting || confidence >= 75;
  const summary = input.summary.slice(0, 4000);
  const title = input.title.slice(0, 256);
  const sourceName = input.sourceName;

  const existing = await db.scamAlert.findFirst({
    where: dedupeMatch(input),
    orderBy: { createdAt: "desc" }
  });

  if (!existing) {
    if (opts?.createBudget && opts.createBudget.used >= opts.createBudget.max) {
      return "skipped_cap";
    }
    const publishTime = publishedByDefault ? now : null;
    const created = await db.scamAlert.create({
      data: {
        title,
        slug: buildSlug(input),
        summary,
        scamType: input.scamType,
        affectedBrand: input.affectedBrand,
        domain,
        url: input.url,
        sourceName,
        sourceUrl: input.sourceUrl,
        confidence,
        riskLevel: riskLevelForConfidence(confidence),
        status: publishedByDefault ? ScamAlertStatus.published : ScamAlertStatus.draft,
        publishedAt: publishTime,
        expiresAt: publishTime ? addDaysUtc(publishTime, SCAM_ALERT_PUBLIC_VISIBILITY_DAYS) : null,
        firstSeenAt: now,
        lastSeenAt: now,
        generatedAt: now,
        evidenceCount: 1,
        sourceSummaryJson: {
          source: sourceName,
          sourceUrl: input.sourceUrl
        },
        exampleDomainsJson: domain ? [domain] : [],
        whyRisky: input.whyRisky,
        safetyTips: [
          "Do not share personal or payment data before independent verification.",
          "Verify domains and sender identity via official channels."
        ]
      }
    });

    if (opts?.createBudget) opts.createBudget.used += 1;

    if (input.signalContent) {
      await db.scamSignal.create({
        data: {
          alertId: created.id,
          sourceName,
          sourceUrl: input.sourceUrl,
          signalType: input.signalType ?? input.scamType,
          content: input.signalContent.slice(0, 4000),
          domain,
          url: input.url,
          confidence
        }
      });
    }
    return publishedByDefault ? "published" : "created";
  }

  const shouldPublish = existing.status !== ScamAlertStatus.published && (forcePublishForTesting || confidence >= 75);
  const expiresAtNext = shouldPublish
    ? addDaysUtc(now, SCAM_ALERT_PUBLIC_VISIBILITY_DAYS)
    : existing.status === ScamAlertStatus.published
      ? existing.expiresAt ??
        (existing.publishedAt ? addDaysUtc(existing.publishedAt, SCAM_ALERT_PUBLIC_VISIBILITY_DAYS) : null)
      : null;

  const exampleDomainsNext = domain
    ? Array.from(
        new Set([...(Array.isArray(existing.exampleDomainsJson) ? (existing.exampleDomainsJson as string[]) : []), domain])
      ).slice(0, 20)
    : null;
  const updated = await db.scamAlert.update({
    where: { id: existing.id },
    data: {
      title,
      summary,
      scamType: input.scamType,
      confidence: Math.max(existing.confidence, confidence),
      riskLevel: riskLevelForConfidence(Math.max(existing.confidence, confidence)),
      lastSeenAt: now,
      sourceUrl: input.sourceUrl ?? existing.sourceUrl,
      whyRisky: input.whyRisky ?? existing.whyRisky,
      evidenceCount: existing.evidenceCount + 1,
      status: shouldPublish ? ScamAlertStatus.published : existing.status,
      publishedAt: shouldPublish ? now : existing.publishedAt,
      expiresAt: expiresAtNext,
      ...(exampleDomainsNext ? { exampleDomainsJson: exampleDomainsNext as Prisma.InputJsonValue } : {})
    }
  });

  if (input.signalContent) {
    const signalExists = await db.scamSignal.findFirst({
      where: {
        alertId: updated.id,
        sourceName,
        content: input.signalContent.slice(0, 4000)
      },
      select: { id: true }
    });
    if (!signalExists) {
      await db.scamSignal.create({
        data: {
          alertId: updated.id,
          sourceName,
          sourceUrl: input.sourceUrl,
          signalType: input.signalType ?? input.scamType,
          content: input.signalContent.slice(0, 4000),
          domain,
          url: input.url,
          confidence
        }
      });
    }
  }

  return shouldPublish ? "published" : "updated";
}

async function fetchOpenPhishFeed(): Promise<IngestScamAlertInput[]> {
  const response = await fetch("https://openphish.com/feed.txt", { headers: { "user-agent": "FraudlyScamAlertsBot/1.0" } });
  if (!response.ok) throw new Error(`OpenPhish HTTP ${response.status}`);
  const rows = (await response.text())
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 200);
  return rows.map((url) => {
    const domain = normalizeDomain(url);
    return {
      title: `Phishing URL detected for ${domain ?? "unknown domain"}`,
      summary: "Public phishing feed reported this URL as suspicious.",
      scamType: "phishing",
      domain,
      url,
      sourceName: "OpenPhish",
      sourceUrl: "https://openphish.com/feed.txt",
      confidence: 88,
      whyRisky: "URL was listed in a public phishing intelligence feed.",
      signalType: "phishing_feed",
      signalContent: url
    };
  });
}

async function fetchUrlHausFeed(): Promise<IngestScamAlertInput[]> {
  const response = await fetch("https://urlhaus.abuse.ch/downloads/csv_recent/", {
    headers: { "user-agent": "FraudlyScamAlertsBot/1.0" }
  });
  if (!response.ok) throw new Error(`URLhaus HTTP ${response.status}`);
  const lines = (await response.text())
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#"))
    .slice(0, 200);

  const out: IngestScamAlertInput[] = [];
  for (const line of lines) {
    const parts = line.split('","').map((p) => p.replace(/^"/, "").replace(/"$/, ""));
    const url = parts[2];
    if (!url) continue;
    const domain = normalizeDomain(url);
    out.push({
      title: `Malicious URL reported for ${domain ?? "unknown domain"}`,
      summary: "Public malware feed listed this URL as potentially malicious.",
      scamType: "malware",
      domain,
      url,
      sourceName: "URLhaus",
      sourceUrl: "https://urlhaus.abuse.ch/",
      confidence: 84,
      whyRisky: "URL was listed in URLhaus malicious URL intelligence.",
      signalType: "malware_feed",
      signalContent: url
    });
  }
  return out;
}

export async function runScamAlertsRetention(now: Date = new Date()): Promise<{
  archivedPublished: number;
  archivedDrafts: number;
  deletedArchived: number;
}> {
  const publishedCut = new Date(now.getTime() - 90 * MS_DAY);
  const draftCut = new Date(now.getTime() - 14 * MS_DAY);
  const hardDeleteDays = getHardDeleteArchivedAfterDays();
  const deleteCut =
    hardDeleteDays !== null ? new Date(now.getTime() - hardDeleteDays * MS_DAY) : null;

  const [pubRes, draftRes] = await Promise.all([
    db.scamAlert.updateMany({
      where: {
        status: ScamAlertStatus.published,
        publishedAt: { not: null, lt: publishedCut }
      },
      data: { status: ScamAlertStatus.archived, archivedAt: now }
    }),
    db.scamAlert.updateMany({
      where: {
        status: ScamAlertStatus.draft,
        createdAt: { lt: draftCut }
      },
      data: { status: ScamAlertStatus.archived, archivedAt: now }
    })
  ]);

  let deletedArchived = 0;
  if (deleteCut) {
    const del = await db.scamAlert.deleteMany({
      where: {
        status: ScamAlertStatus.archived,
        archivedAt: { not: null, lt: deleteCut }
      }
    });
    deletedArchived = del.count;
  }

  return {
    archivedPublished: pubRes.count,
    archivedDrafts: draftRes.count,
    deletedArchived
  };
}

export async function runScamAlertsIngestion(): Promise<ScamAlertCronSummary> {
  const summary: ScamAlertCronSummary = {
    fetched: 0,
    deduped: 0,
    scanned: 0,
    created: 0,
    updated: 0,
    published: 0,
    archived: 0,
    deletedArchived: 0,
    skippedDueToCap: 0,
    statusCounts: { draft: 0, published: 0, archived: 0 },
    failedSources: []
  };

  const feedResults = await Promise.allSettled([fetchOpenPhishFeed(), fetchUrlHausFeed()]);
  const allItems: IngestScamAlertInput[] = [];
  const fetchedBySource: Record<string, number> = { OpenPhish: 0, URLhaus: 0 };
  for (let i = 0; i < feedResults.length; i += 1) {
    const source = i === 0 ? "OpenPhish" : "URLhaus";
    const row = feedResults[i];
    if (!row) continue;
    if (row.status === "rejected") {
      summary.failedSources.push({
        source,
        error: row.reason instanceof Error ? row.reason.message : String(row.reason)
      });
      continue;
    }
    fetchedBySource[source] = row.value.length;
    allItems.push(...row.value);
  }

  summary.fetched = allItems.length;

  const dedupedMap = new Map<string, IngestScamAlertInput>();
  for (const item of allItems) {
    const st = item.scamType.trim().toLowerCase().slice(0, 64);
    const sn = item.sourceName.trim().slice(0, 128);
    const key = `${sn}|${st}|${normalizeDomain(item.domain) ?? ""}|${item.url?.trim() ?? ""}`;
    if (!dedupedMap.has(key)) dedupedMap.set(key, item);
  }

  const uniqueItems = [...dedupedMap.values()];
  summary.deduped = uniqueItems.length;
  summary.scanned = uniqueItems.length;

  console.info("[scam-alerts][cron] fetched feed rows", {
    fetchedBySource,
    fetched: summary.fetched,
    deduped: summary.deduped
  });

  const createBudget = { used: 0, max: getScamAlertsMaxNewPerRun() };
  for (const item of uniqueItems) {
    try {
      const state = await ingestSingleAlert(item, { createBudget });
      if (state === "created") summary.created += 1;
      if (state === "updated") summary.updated += 1;
      if (state === "published") summary.published += 1;
      if (state === "skipped_cap") summary.skippedDueToCap += 1;
    } catch (err) {
      summary.failedSources.push({
        source: item.sourceName,
        error: err instanceof Error ? err.message : "ingest failure"
      });
    }
  }

  try {
    const retention = await runScamAlertsRetention();
    summary.archived = retention.archivedPublished + retention.archivedDrafts;
    summary.deletedArchived = retention.deletedArchived;
  } catch (err) {
    summary.failedSources.push({
      source: "retention",
      error: err instanceof Error ? err.message : "retention failure"
    });
  }

  try {
    const grouped = await db.scamAlert.groupBy({
      by: ["status"],
      _count: { _all: true }
    });
    for (const row of grouped) {
      if (row.status === ScamAlertStatus.draft) summary.statusCounts.draft = row._count._all;
      if (row.status === ScamAlertStatus.published) summary.statusCounts.published = row._count._all;
      if (row.status === ScamAlertStatus.archived) summary.statusCounts.archived = row._count._all;
    }
  } catch (err) {
    summary.failedSources.push({
      source: "status-counts",
      error: err instanceof Error ? err.message : "failed"
    });
  }
  console.info("[scam-alerts][cron] ingestion summary", summary);
  return summary;
}
