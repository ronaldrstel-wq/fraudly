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

  const row = await db.latestPublicCheck.upsert({
    where: { normalizedValue: gate.normalizedValue },
    create: {
      normalizedValue: gate.normalizedValue,
      checkedValue: gate.checkedValueForDisplay.slice(0, 4096),
      entityType: gate.entityType,
      riskScoreSnapshot: risk,
      statusLabel,
      publicResultPath: `/check/${encodeURIComponent(domain)}`,
      publicResultPayload: payload
    },
    update: {
      checkedValue: gate.checkedValueForDisplay.slice(0, 4096),
      entityType: gate.entityType,
      riskScoreSnapshot: risk,
      statusLabel,
      publicResultPayload: payload
    },
    select: { id: true }
  });

  const publicResultPath = checkResultHref(domain, { scanId: row.id, from: "latest-card" });
  await db.latestPublicCheck.update({
    where: { id: row.id },
    data: { publicResultPath }
  });
}
