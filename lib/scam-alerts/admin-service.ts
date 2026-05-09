import { ScamAlertStatus } from "@prisma/client";
import { db } from "@/lib/db";

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
  return db.scamAlert.update({
    where: { id },
    data: { status, updatedAt: new Date() }
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
