import { createHash } from "node:crypto";
import { Prisma, ScamAlertStatus } from "@prisma/client";
import { db } from "@/lib/db";

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
  scanned: number;
  created: number;
  updated: number;
  published: number;
  statusCounts: { draft: number; published: number; archived: number };
  failedSources: Array<{ source: string; error: string }>;
};

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
  return {
    scamType: input.scamType,
    sourceName: input.sourceName,
    domain: normalizeDomain(input.domain),
    url: input.url ?? null
  };
}

function riskLevelForConfidence(confidence: number): string {
  if (confidence >= 85) return "critical";
  if (confidence >= 70) return "high";
  if (confidence >= 50) return "medium";
  return "low";
}

export async function listPublishedScamAlerts(params?: { scamType?: string; take?: number }): Promise<PublicScamAlertListItem[]> {
  const take = Math.max(1, Math.min(200, params?.take ?? 50));
  try {
    return await db.scamAlert.findMany({
      where: {
        status: ScamAlertStatus.published,
        ...(params?.scamType ? { scamType: params.scamType } : {})
      },
      orderBy: [{ publishedAt: "desc" }, { lastSeenAt: "desc" }],
      take
    });
  } catch (err) {
    if (isDbUnavailable(err)) return [];
    throw err;
  }
}

export async function listPublishedScamTypes(): Promise<string[]> {
  try {
    const rows = await db.scamAlert.findMany({
      where: { status: ScamAlertStatus.published },
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

export async function getPublishedScamAlertBySlug(slug: string): Promise<PublicScamAlertDetail | null> {
  try {
    return await db.scamAlert.findFirst({
      where: { slug, status: ScamAlertStatus.published },
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

async function ingestSingleAlert(input: IngestScamAlertInput): Promise<"created" | "updated" | "published"> {
  const now = new Date();
  const confidence = clampConfidence(input.confidence);
  const domain = normalizeDomain(input.domain);
  const forcePublishForTesting = process.env.SCAM_ALERTS_FORCE_PUBLISH === "true";
  const publishedByDefault = forcePublishForTesting || confidence >= 75;
  const summary = input.summary.trim().slice(0, 4000);
  const title = input.title.trim().slice(0, 256);
  const sourceName = input.sourceName.trim().slice(0, 128);

  const existing = await db.scamAlert.findFirst({
    where: dedupeMatch(input),
    orderBy: { createdAt: "desc" }
  });

  if (!existing) {
    const created = await db.scamAlert.create({
      data: {
        title,
        slug: buildSlug(input),
        summary,
        scamType: input.scamType.trim().slice(0, 64),
        affectedBrand: input.affectedBrand?.trim() || null,
        domain,
        url: input.url ?? null,
        sourceName,
        sourceUrl: input.sourceUrl ?? null,
        confidence,
        riskLevel: riskLevelForConfidence(confidence),
        status: publishedByDefault ? ScamAlertStatus.published : ScamAlertStatus.draft,
        publishedAt: publishedByDefault ? now : null,
        firstSeenAt: now,
        lastSeenAt: now,
        generatedAt: now,
        evidenceCount: 1,
        sourceSummaryJson: {
          source: sourceName,
          sourceUrl: input.sourceUrl ?? null
        },
        exampleDomainsJson: domain ? [domain] : [],
        whyRisky: input.whyRisky ?? null,
        safetyTips: [
          "Do not share personal or payment data before independent verification.",
          "Verify domains and sender identity via official channels."
        ]
      }
    });

    if (input.signalContent) {
      await db.scamSignal.create({
        data: {
          alertId: created.id,
          sourceName,
          sourceUrl: input.sourceUrl ?? null,
          signalType: input.signalType ?? input.scamType,
          content: input.signalContent.slice(0, 4000),
          domain,
          url: input.url ?? null,
          confidence
        }
      });
    }
    return publishedByDefault ? "published" : "created";
  }

  const shouldPublish = existing.status !== ScamAlertStatus.published && (forcePublishForTesting || confidence >= 75);
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
      confidence: Math.max(existing.confidence, confidence),
      riskLevel: riskLevelForConfidence(Math.max(existing.confidence, confidence)),
      lastSeenAt: now,
      sourceUrl: input.sourceUrl ?? existing.sourceUrl,
      whyRisky: input.whyRisky ?? existing.whyRisky,
      evidenceCount: existing.evidenceCount + 1,
      status: shouldPublish ? ScamAlertStatus.published : existing.status,
      publishedAt: shouldPublish ? now : existing.publishedAt,
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
          sourceUrl: input.sourceUrl ?? null,
          signalType: input.signalType ?? input.scamType,
          content: input.signalContent.slice(0, 4000),
          domain,
          url: input.url ?? null,
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

export async function runScamAlertsIngestion(): Promise<ScamAlertCronSummary> {
  const summary: ScamAlertCronSummary = {
    scanned: 0,
    created: 0,
    updated: 0,
    published: 0,
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

  const deduped = new Map<string, IngestScamAlertInput>();
  for (const item of allItems) {
    const key = `${item.sourceName}|${item.scamType}|${normalizeDomain(item.domain) ?? ""}|${item.url ?? ""}`;
    if (!deduped.has(key)) deduped.set(key, item);
  }

  const uniqueItems = [...deduped.values()];
  summary.scanned = uniqueItems.length;
  console.info("[scam-alerts][cron] fetched feed rows", {
    fetchedBySource,
    totalFetched: allItems.length,
    deduped: uniqueItems.length
  });
  for (const item of uniqueItems) {
    try {
      const state = await ingestSingleAlert(item);
      if (state === "created") summary.created += 1;
      if (state === "updated") summary.updated += 1;
      if (state === "published") summary.published += 1;
    } catch (err) {
      summary.failedSources.push({
        source: item.sourceName,
        error: err instanceof Error ? err.message : "ingest failure"
      });
    }
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
