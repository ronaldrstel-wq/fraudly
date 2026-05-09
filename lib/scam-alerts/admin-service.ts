import { Prisma, ScamAlertStatus } from "@prisma/client";
import { db } from "@/lib/db";

const MS_DAY = 86_400_000;
const SCAM_ALERT_PUBLIC_VISIBILITY_DAYS = 90;

function expiresAtFromPublished(publishedAt: Date): Date {
  return new Date(publishedAt.getTime() + SCAM_ALERT_PUBLIC_VISIBILITY_DAYS * MS_DAY);
}

export type AdminScamAlertRow = {
  id: string;
  slug: string;
  title: string;
  scamType: string;
  affectedBrand: string | null;
  riskLevel: string;
  summary: string;
  safetyTips: string[];
  evidenceCount: number;
  sourceSummaryJson: unknown;
  exampleDomainsJson: unknown;
  status: ScamAlertStatus;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export async function listScamAlertsForAdmin(status: "all" | ScamAlertStatus, take = 100): Promise<AdminScamAlertRow[]> {
  return db.scamAlert.findMany({
    where: status === "all" ? undefined : { status },
    orderBy: { generatedAt: "desc" },
    take: Math.max(1, Math.min(300, take))
  });
}

export async function updateScamAlertStatus(id: string, status: ScamAlertStatus): Promise<AdminScamAlertRow> {
  const now = new Date();
  const row = await db.scamAlert.findUnique({ where: { id } });
  if (!row) {
    throw new Error("ScamAlert not found");
  }

  const data: Prisma.ScamAlertUpdateInput = {
    status,
    updatedAt: now
  };

  if (status === ScamAlertStatus.published) {
    const publishedAt = row.publishedAt ?? now;
    data.publishedAt = publishedAt;
    data.expiresAt = row.expiresAt ?? expiresAtFromPublished(publishedAt);
  }

  if (status === ScamAlertStatus.archived) {
    data.archivedAt = now;
  }

  return db.scamAlert.update({
    where: { id },
    data
  });
}

export async function updateScamAlertContent(input: {
  id: string;
  title?: string;
  summary?: string;
  safetyTips?: string[];
}): Promise<AdminScamAlertRow> {
  const data: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof input.title === "string") data.title = input.title.trim().slice(0, 256);
  if (typeof input.summary === "string") data.summary = input.summary.trim().slice(0, 4000);
  if (Array.isArray(input.safetyTips)) {
    data.safetyTips = input.safetyTips.map((tip) => tip.trim()).filter(Boolean).slice(0, 12);
  }
  return db.scamAlert.update({
    where: { id: input.id },
    data
  });
}
