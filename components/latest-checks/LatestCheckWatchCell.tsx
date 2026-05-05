"use client";

import type { ScamVerdict } from "@/types/scam";
import { WatchlistToggle } from "@/components/WatchlistToggle";

function verdictFromRiskSnapshot(risk: number): ScamVerdict {
  if (risk >= 72) return "scam";
  if (risk >= 38) return "suspicious";
  return "safe";
}

type Props = {
  entityType: string;
  normalizedKey: string;
  checkedValue: string;
  publicResultPath: string;
  riskScoreSnapshot: number;
};

/** Watch control for public latest-check rows (domains only for now). */
export function LatestCheckWatchCell({ entityType, normalizedKey, checkedValue, publicResultPath, riskScoreSnapshot }: Props) {
  if (entityType !== "domain" || !normalizedKey.trim()) return null;

  const trustStyle = Math.max(0, Math.min(100, Math.round(100 - riskScoreSnapshot)));
  const verdict = verdictFromRiskSnapshot(riskScoreSnapshot);

  return (
    <WatchlistToggle
      variant="compact"
      itemType="domain"
      rawKey={normalizedKey}
      title={checkedValue}
      detailPath={publicResultPath}
      trustScore={trustStyle}
      verdict={verdict}
      className="w-full sm:w-auto"
    />
  );
}
