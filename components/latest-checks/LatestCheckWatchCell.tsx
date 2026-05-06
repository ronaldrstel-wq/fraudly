"use client";

import type { ScamVerdict } from "@/types/scam";
import { WatchlistToggle } from "@/components/WatchlistToggle";
import { trustLevelFromScore, trustScoreFromRisk } from "@/lib/trustSystem";

function verdictFromTrustScore(trustScore: number): ScamVerdict {
  const level = trustLevelFromScore(trustScore);
  if (level === "trusted") return "safe";
  if (level === "caution") return "suspicious";
  return "scam";
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

  const trustStyle = trustScoreFromRisk(riskScoreSnapshot);
  const verdict = verdictFromTrustScore(trustStyle);

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
