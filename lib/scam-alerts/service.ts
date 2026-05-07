import { ScamAlertStatus } from "@prisma/client";
import { db } from "@/lib/db";

export type PublicScamAlert = {
  slug: string;
  title: string;
  scamType: string;
  affectedBrand: string | null;
  riskLevel: string;
  summary: string;
  safetyTips: string[];
  evidenceCount: number;
  generatedAt: Date;
  updatedAt: Date;
  exampleDomains: string[];
};

function parseExampleDomains(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((v) => String(v)).filter(Boolean).slice(0, 8);
}

function toPublic(row: Awaited<ReturnType<typeof db.scamAlert.findFirst>>): PublicScamAlert | null {
  if (!row) return null;
  return {
    slug: row.slug,
    title: row.title,
    scamType: row.scamType,
    affectedBrand: row.affectedBrand,
    riskLevel: row.riskLevel,
    summary: row.summary,
    safetyTips: row.safetyTips,
    evidenceCount: row.evidenceCount,
    generatedAt: row.generatedAt,
    updatedAt: row.updatedAt,
    exampleDomains: parseExampleDomains(row.exampleDomainsJson)
  };
}

export async function listPublishedScamAlerts(limit = 50): Promise<PublicScamAlert[]> {
  const rows = await db.scamAlert.findMany({
    where: { status: ScamAlertStatus.published },
    orderBy: { generatedAt: "desc" },
    take: Math.max(1, Math.min(limit, 100))
  });
  return rows.map((row) => toPublic(row)!).filter(Boolean);
}

export async function getPublishedScamAlertBySlug(slug: string): Promise<PublicScamAlert | null> {
  const row = await db.scamAlert.findFirst({
    where: {
      slug,
      status: ScamAlertStatus.published
    }
  });
  return toPublic(row);
}
