import { EN_MESSAGES } from "@/lib/messages.en";
import { scamVerdictFromConsumerLabel } from "@/lib/scoring/consumerVerdictMap";
import {
  type HumanRecKind,
  humanRecGlyph,
  humanRecHeadline,
  humanRecHeadlineTone,
  humanRecKindFromTrustVerdict
} from "@/lib/scanResultDualLayer";
import {
  publicDisplayScoreFromRiskAndVerdict,
  standardVerdictLabel,
  trustScoreFromRisk
} from "@/lib/scoring/displayScore";
import { getTrustPresentation, type SemanticTone } from "@/lib/scoring/trust-bands";
import { clampScore } from "@/lib/clampScore";
import { resolveCanonicalFromPersistedColumns } from "@/lib/trust/resolveCanonicalDisplay";
import type { ScamVerdict } from "@/types/scam";
import type { ConsumerVerdictLabel, NormalizedTrustResult } from "@/lib/trust/types";

/** Trust score (0–100) from stored risk snapshot — delegates to {@link trustScoreFromRisk}. */
export function trustScoreFromRiskSnapshot(riskScoreSnapshot: number): number {
  return trustScoreFromRisk(riskScoreSnapshot);
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

/** Tinted article surface — score is the source of truth for semantic color. */
export function overviewCardArticleClass(_kind: HumanRecKind, trustScore: number): string {
  return getTrustPresentation(trustScore).colors.articleBg;
}

export type OverviewCardModel = {
  humanKind: HumanRecKind;
  headline: string;
  verdictLabel: string;
  glyph: string;
  tone: ReturnType<typeof humanRecHeadlineTone>;
  presentationTone: SemanticTone;
  oneLiner: string;
  trustScore: number;
  isCritical: boolean;
  articleClass: string;
};

export function buildOverviewFromTrustAndVerdict(trustScore: number, verdict: ScamVerdict | null): OverviewCardModel {
  const normalizedTrust = clampScore(trustScore);
  const humanKind = humanRecKindFromTrustVerdict(normalizedTrust, verdict);
  const isCritical = isCriticalOverviewKind(humanKind);
  const verdictLabel = standardVerdictLabel(normalizedTrust);
  const presentation = getTrustPresentation(normalizedTrust);
  const presentationTone = isCritical ? "danger" : presentation.tone;

  return {
    humanKind,
    verdictLabel,
    headline: isCritical ? "High Risk" : verdictLabel,
    glyph: humanRecGlyph(humanKind),
    tone: humanRecHeadlineTone(humanKind, normalizedTrust),
    presentationTone,
    oneLiner: overviewOneLiner(humanKind),
    trustScore: normalizedTrust,
    isCritical,
    articleClass: overviewCardArticleClass(humanKind, normalizedTrust)
  };
}

const FALLBACK_OVERVIEW_RISK = 50;
const FALLBACK_OVERVIEW_TRUST = 50;

/** Overview cards from canonical normalized trust — same score/verdict as result surfaces. */
export function buildOverviewFromNormalized(normalized: NormalizedTrustResult): OverviewCardModel {
  const trustScore = clampScore(normalized.trustScore ?? FALLBACK_OVERVIEW_TRUST);
  const base = buildOverviewFromTrustAndVerdict(trustScore, scamVerdictFromConsumerLabel(normalized.verdict));
  return {
    ...base,
    verdictLabel: normalized.verdict,
    headline: base.isCritical ? "High Risk" : normalized.verdict
  };
}

/** Trust score for a stored recent-search row (snap is authoritative). */
export function resolveRecentSearchTrustScore(input: {
  trustScoreSnap: number | null;
  verdictSnap: string | null;
}): number {
  if (input.trustScoreSnap != null && Number.isFinite(input.trustScoreSnap)) {
    return clampScore(input.trustScoreSnap);
  }
  const verdict = input.verdictSnap as ScamVerdict | null;
  if (verdict === "scam") return 15;
  if (verdict === "suspicious") return 55;
  if (verdict === "safe") return 90;
  return FALLBACK_OVERVIEW_TRUST;
}

/** Recent searches list — same overview model + colors as latest-checks. */
export function buildOverviewFromRecentSearch(input: {
  trustScoreSnap: number | null;
  verdictSnap: string | null;
}): OverviewCardModel {
  const trustScore = resolveRecentSearchTrustScore(input);
  return buildOverviewFromTrustAndVerdict(trustScore, input.verdictSnap as ScamVerdict | null);
}

export function buildOverviewFromPublicCheck(row: {
  riskScoreSnapshot?: number | null;
  statusLabel?: string | null;
  normalizedTrustScore?: number | null;
  normalizedRiskScore?: number | null;
  consumerVerdictLabel?: string | null;
  consumerVerdictBand?: string | null;
  consumerVerdict?: string | null;
}): OverviewCardModel {
  void row.statusLabel;
  const riskSnap = Number.isFinite(row.riskScoreSnapshot) ? Number(row.riskScoreSnapshot) : FALLBACK_OVERVIEW_RISK;
  const canonical = resolveCanonicalFromPersistedColumns({
    riskScoreSnapshot: riskSnap,
    normalizedTrustScore: row.normalizedTrustScore,
    normalizedRiskScore: row.normalizedRiskScore,
    consumerVerdictLabel: row.consumerVerdictLabel,
    consumerVerdictBand: row.consumerVerdictBand,
    consumerVerdict: row.consumerVerdict as ScamVerdict | null
  });
  const trustScore = canonical.trustScore;
  const consumerLabel =
    canonical.consumerVerdictLabel ??
    (row.consumerVerdictLabel as ConsumerVerdictLabel | null | undefined) ??
    standardVerdictLabel(trustScore);
  const legacyVerdict = scamVerdictFromConsumerLabel(consumerLabel);
  return buildOverviewFromTrustAndVerdict(trustScore, legacyVerdict);
}

/** Scam alert list: consumer headline from type; technical line stays severity/feed-oriented via presentation.ts elsewhere. */
export function humanRecKindFromScamAlertType(scamType: string): HumanRecKind {
  const t = scamType.toLowerCase();
  if (/\b(malware|trojan|virus|ransomware)\b/.test(t)) return "dangerousWebsite";
  return "avoidWebsite";
}
