import { normalizeLastSeenAt } from "@/lib/latest-public-checks/normalizeLastSeenAt";
import { buildOverviewFromPublicCheck } from "@/lib/overviewCardPresentation";
import { feedListRowConfidenceBadges } from "@/lib/trust/feedConfidenceStrip";
import type { LatestPublicCheckListRow } from "@/lib/latest-public-checks/listPublicChecks";

export { normalizeLastSeenAt } from "@/lib/latest-public-checks/normalizeLastSeenAt";

export type LatestCheckRowSkipReason =
  | "missing_id"
  | "missing_domain"
  | "invalid_risk_score"
  | "invalid_last_seen_at"
  | "overview_build_failed"
  | "confidence_badges_failed";

export type LatestCheckRowRenderAssessment = {
  renderable: boolean;
  row: LatestPublicCheckListRow;
  reason?: LatestCheckRowSkipReason;
  detail?: string;
};

function normalizeRiskScore(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return 50;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function normalizeLatestCheckListRow(row: LatestPublicCheckListRow): LatestPublicCheckListRow {
  return {
    ...row,
    lastSeenAt: normalizeLastSeenAt(row.lastSeenAt),
    riskScoreSnapshot: normalizeRiskScore(row.riskScoreSnapshot),
    checkedValue: row.checkedValue?.trim() || row.normalizedValue?.trim() || "unknown",
    normalizedValue: row.normalizedValue?.trim() || row.checkedValue?.trim() || "unknown",
    statusLabel: row.statusLabel?.trim() || "Review snapshot",
    entityType: row.entityType?.trim() || "domain",
    publicResultPath: row.publicResultPath?.trim() || `/check/${encodeURIComponent(row.normalizedValue || "unknown")}`
  };
}

/** Determines whether a DB row can render as a latest-check card (never throws). */
export function assessLatestCheckRowRenderable(row: LatestPublicCheckListRow): LatestCheckRowRenderAssessment {
  if (!row.id?.trim()) {
    return { renderable: false, row, reason: "missing_id" };
  }
  const domain = row.normalizedValue?.trim() || row.checkedValue?.trim();
  if (!domain) {
    return { renderable: false, row, reason: "missing_domain" };
  }

  const normalized = normalizeLatestCheckListRow(row);

  try {
    buildOverviewFromPublicCheck(normalized);
  } catch (error) {
    return {
      renderable: false,
      row,
      reason: "overview_build_failed",
      detail: error instanceof Error ? error.message : String(error)
    };
  }

  try {
    feedListRowConfidenceBadges({
      normalizedTrustScore: normalized.normalizedTrustScore,
      consumerVerdictLabel: normalized.consumerVerdictLabel,
      lastSeenAt: normalized.lastSeenAt
    });
  } catch (error) {
    return {
      renderable: false,
      row,
      reason: "confidence_badges_failed",
      detail: error instanceof Error ? error.message : String(error)
    };
  }

  return { renderable: true, row: normalized };
}
