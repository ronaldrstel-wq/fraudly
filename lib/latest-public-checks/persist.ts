import { checkResultHref } from "@/lib/check/checkResultHref";
import { db } from "@/lib/db";
import { classifyWebsiteCheckForPublication } from "@/lib/latest-public-checks/filter";
import { publicStatusLabelForVerdict } from "@/lib/latest-public-checks/status-label";
import { normalizeRiskScore } from "@/lib/scoring/displayScore";
import type { ScamCheckResult } from "@/types/scam";
import { Prisma } from "@prisma/client";

/** Fire-and-forget–safe caller should catch errors; never attaches user/session ids. */
export async function upsertLatestPublicCheckFromCompletedScan(options: {
  parsedUrl: URL;
  originalInput: string;
  result: ScamCheckResult;
}): Promise<void> {
  const gate = classifyWebsiteCheckForPublication(options.parsedUrl, options.originalInput);
  if (!gate.publish) return;

  const domain = options.result.domain;
  const risk = normalizeRiskScore(
    Number.isFinite(options.result.score) ? options.result.score : 35
  );
  const statusLabel = publicStatusLabelForVerdict(options.result.verdict);
  const payload = options.result as unknown as Prisma.InputJsonValue;
  const baseData = {
    checkedValue: gate.checkedValueForDisplay.slice(0, 4096),
    entityType: gate.entityType,
    riskScoreSnapshot: risk,
    statusLabel
  };

  let row: { id: string };
  try {
    row = await db.latestPublicCheck.upsert({
      where: { normalizedValue: gate.normalizedValue },
      create: {
        normalizedValue: gate.normalizedValue,
        ...baseData,
        publicResultPath: `/check/${encodeURIComponent(domain)}`,
        publicResultPayload: payload
      },
      update: { ...baseData, publicResultPayload: payload },
      select: { id: true }
    });
  } catch (err) {
    if (!(err instanceof Prisma.PrismaClientKnownRequestError)) throw err;
    row = await db.latestPublicCheck.upsert({
      where: { normalizedValue: gate.normalizedValue },
      create: {
        normalizedValue: gate.normalizedValue,
        ...baseData,
        publicResultPath: `/check/${encodeURIComponent(domain)}`
      },
      update: baseData,
      select: { id: true }
    });
  }

  try {
    const publicResultPath = checkResultHref(domain, { scanId: row.id, from: "latest-card" });
    await db.latestPublicCheck.update({
      where: { id: row.id },
      data: { publicResultPath }
    });
  } catch {
    // Non-fatal if path update fails
  }
}
