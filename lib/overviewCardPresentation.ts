import { EN_MESSAGES } from "@/lib/messages.en";
import { verdictFromPublicSnapshotLabel } from "@/lib/latest-public-checks/status-label";
import {
  type HumanRecKind,
  humanRecGlyph,
  humanRecHeadline,
  humanRecHeadlineTone,
  humanRecKindFromTrustVerdict
} from "@/lib/scanResultDualLayer";
import { getTrustLabel } from "@/lib/trustScoreUi";
import { clampScore } from "@/lib/clampScore";
import type { ScamVerdict } from "@/lib/trustSystem";

/** Trust score (0–100) from stored risk snapshot. */
export function trustScoreFromRiskSnapshot(riskScoreSnapshot: number): number {
  return clampScore(100 - clampScore(Math.round(riskScoreSnapshot)));
}

export function isCriticalOverviewKind(kind: HumanRecKind): boolean {
  return kind === "avoidWebsite" || kind === "dangerousWebsite";
}

export function overviewOneLiner(kind: HumanRecKind): string {
  const o = EN_MESSAGES.scanResult.overviewOneLine;
  switch (kind) {
    case "trusted":
      return o.trusted;
    case "looksSafe":
      return o.looksSafe;
    case "looksMostlySafe":
      return o.looksMostlySafe;
    case "notEnoughInfo":
      return o.notEnoughInfo;
    case "beCareful":
      return o.beCareful;
    case "risky":
      return o.risky;
    case "highRisk":
      return o.highRisk;
    case "avoidWebsite":
      return o.avoidWebsite;
    case "dangerousWebsite":
      return o.dangerousWebsite;
    case "invalidDomain":
      return o.invalidDomain;
    case "unreachable":
      return o.unreachable;
    default:
      return o.notEnoughInfo;
  }
}

/**
 * Card chrome for list/overview surfaces — matches result-page emotional tiers without redesigning cards.
 */
export function overviewCardArticleClass(kind: HumanRecKind): string {
  if (kind === "avoidWebsite" || kind === "dangerousWebsite" || kind === "highRisk") {
    return "border border-slate-200 bg-rose-50/45";
  }
  if (kind === "risky") {
    return "border border-slate-200 bg-orange-50/40";
  }
  if (kind === "beCareful" || kind === "notEnoughInfo" || kind === "invalidDomain" || kind === "unreachable") {
    return "border border-slate-200 bg-amber-50/45";
  }
  if (kind === "trusted" || kind === "looksSafe" || kind === "looksMostlySafe") {
    return "border border-slate-200 bg-emerald-50/45";
  }
  return "border border-slate-200 bg-white";
}

export type OverviewCardModel = {
  humanKind: HumanRecKind;
  headline: string;
  glyph: string;
  tone: ReturnType<typeof humanRecHeadlineTone>;
  technicalLabel: string;
  oneLiner: string;
  trustScore: number;
  isCritical: boolean;
  articleClass: string;
};

export function buildOverviewFromTrustAndVerdict(trustScore: number, verdict: ScamVerdict | null): OverviewCardModel {
  const humanKind = humanRecKindFromTrustVerdict(trustScore, verdict);
  const isCritical = isCriticalOverviewKind(humanKind);
  return {
    humanKind,
    headline: humanRecHeadline(humanKind),
    glyph: humanRecGlyph(humanKind),
    tone: humanRecHeadlineTone(humanKind),
    technicalLabel: getTrustLabel(trustScore),
    oneLiner: overviewOneLiner(humanKind),
    trustScore: clampScore(trustScore),
    isCritical,
    articleClass: overviewCardArticleClass(humanKind)
  };
}

/** `/latest-checks` row: risk snapshot + persisted snapshot label → same UX model as full result (technical band from trust score). */
export function buildOverviewFromPublicCheck(row: { riskScoreSnapshot: number; statusLabel: string }): OverviewCardModel {
  const trustScore = trustScoreFromRiskSnapshot(row.riskScoreSnapshot);
  const verdict = verdictFromPublicSnapshotLabel(row.statusLabel);
  return buildOverviewFromTrustAndVerdict(trustScore, verdict);
}

/** Scam alert list: consumer headline from type; technical line stays severity/feed-oriented via presentation.ts elsewhere. */
export function humanRecKindFromScamAlertType(scamType: string): HumanRecKind {
  const t = scamType.toLowerCase();
  if (/\b(malware|trojan|virus|ransomware)\b/.test(t)) return "dangerousWebsite";
  return "avoidWebsite";
}
