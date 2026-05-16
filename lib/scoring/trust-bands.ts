import { clampScore } from "@/lib/clampScore";

/** Canonical trust band id (score-derived). */
export type TrustBandId = "likely-safe" | "mostly-safe" | "caution" | "suspicious" | "high-risk";

/** Semantic UI token — use for borders, pills, icons, and list-card chrome. */
export type SemanticTone = "safe" | "mostly-safe" | "caution" | "suspicious" | "danger";

/** Primary consumer verdict shown on results, lists, and normalized trust. */
export type ConsumerVerdictLabel =
  | "Likely Safe"
  | "Mostly Safe"
  | "Use Caution"
  | "Suspicious"
  | "High Risk";

/** @deprecated Prefer {@link ConsumerVerdictLabel} `"High Risk"`. Kept for snapshot/API migration helpers. */
export const LEGACY_HIGH_SCAM_RISK_VERDICT = "High Scam Risk" as const;

export type TrustBandColors = {
  border: string;
  borderLeft: string;
  icon: string;
  iconWrap: string;
  scorePill: string;
  scorePillDim: string;
  surfaceBg: string;
  surfaceGradient: string;
  headlineText: string;
  meterTrack: string;
  meterFill: string;
  meterMarker: string;
  progressBar: string;
  softBg: string;
  softBorder: string;
  toneText: string;
  cta: string;
  surfaceGlow: string;
  accentBar: string;
  articleBg: string;
  /** List/overview card shell (tinted surface + semantic border). */
  cardShell: string;
  cardShellHover: string;
  metaCta: string;
  metaCtaHover: string;
  mobileDivider: string;
  metricCard: string;
  metricScoreText: string;
};

export type OverviewCardChrome = {
  tone: SemanticTone;
  accentBar: string;
  surfaceGlow: string;
  iconWrap: string;
  icon: string;
  scorePill: string;
  scorePillDim: string;
  cta: string;
  headlineText: string;
  cardShell: string;
  cardShellHover: string;
  metaCta: string;
  metaCtaHover: string;
  mobileDivider: string;
};

export type TrustPresentation = {
  band: TrustBandId;
  verdict: ConsumerVerdictLabel;
  tone: SemanticTone;
  colors: TrustBandColors;
  /** Short friendly headline (may match verdict on consumer surfaces). */
  headline: string;
  description: string;
  minScore: number;
  maxScore: number;
};

type TrustBandDefinition = {
  band: TrustBandId;
  minScore: number;
  maxScore: number;
  verdict: ConsumerVerdictLabel;
  tone: SemanticTone;
  headline: string;
  description: string;
  colors: TrustBandColors;
};

const LIKELY_SAFE_COLORS: TrustBandColors = {
  border: "border-emerald-200/80",
  borderLeft: "before:bg-emerald-500",
  icon: "text-emerald-600",
  iconWrap: "border-emerald-200/70 bg-emerald-50/90 shadow-[0_6px_18px_rgba(16,185,129,0.15)]",
  scorePill:
    "border-emerald-200/80 bg-gradient-to-b from-emerald-50 to-white text-emerald-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_14px_rgba(16,185,129,0.12)]",
  scorePillDim: "text-emerald-700/80",
  surfaceBg: "bg-emerald-50/30",
  surfaceGradient: "border-emerald-200/80 bg-gradient-to-b from-emerald-50/30 to-white",
  headlineText: "text-emerald-900",
  meterTrack: "bg-emerald-100",
  meterFill: "bg-gradient-to-r from-emerald-500 via-emerald-500 to-emerald-600",
  meterMarker: "text-emerald-900",
  progressBar: "bg-emerald-500",
  softBg: "bg-emerald-50/90",
  softBorder: "border-emerald-200/80",
  toneText: "text-emerald-800",
  cta: "text-emerald-700 decoration-emerald-500/35 hover:text-emerald-800",
  surfaceGlow: "from-emerald-500/10 via-emerald-400/0 to-transparent",
  accentBar: "before:bg-emerald-500",
  articleBg: "border border-emerald-200/70 bg-emerald-50/50",
  cardShell:
    "relative min-h-0 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-white p-4 shadow-subtle transition-all duration-200",
  cardShellHover: "hover:border-emerald-300/90 hover:shadow-elevated hover:from-emerald-50/95",
  metaCta: "font-semibold text-emerald-700",
  metaCtaHover: "group-hover:text-emerald-800",
  mobileDivider: "border-emerald-200/55",
  metricCard: "rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 to-white p-4 shadow-sm",
  metricScoreText: "text-emerald-900"
};

const MOSTLY_SAFE_COLORS: TrustBandColors = {
  border: "border-teal-400/95",
  borderLeft: "before:bg-teal-500",
  icon: "text-teal-600",
  iconWrap:
    "border-teal-400/90 bg-gradient-to-br from-teal-50 to-cyan-50 text-teal-600 shadow-[0_6px_20px_rgba(20,184,166,0.22)] ring-1 ring-teal-400/25",
  scorePill:
    "border-teal-400/95 bg-gradient-to-b from-teal-50 via-cyan-50/90 to-white text-teal-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_4px_16px_rgba(6,182,212,0.16)]",
  scorePillDim: "text-teal-700",
  surfaceBg: "bg-teal-50/80",
  surfaceGradient: "border-teal-400/90 bg-gradient-to-b from-teal-50/95 via-cyan-50/55 to-white",
  headlineText: "text-teal-800",
  meterTrack: "bg-teal-100",
  meterFill: "bg-gradient-to-r from-teal-500 via-teal-500 to-cyan-500",
  meterMarker: "text-teal-800",
  progressBar: "bg-teal-500",
  softBg: "bg-teal-50/95",
  softBorder: "border-teal-400/90",
  toneText: "text-teal-800",
  cta: "text-teal-700 decoration-teal-500/55 hover:text-teal-800",
  surfaceGlow: "from-teal-500/18 via-cyan-400/10 to-transparent",
  accentBar: "before:bg-teal-500",
  articleBg: "border border-teal-400/85 bg-gradient-to-br from-teal-50/90 via-cyan-50/50 to-white",
  cardShell:
    "relative min-h-0 rounded-2xl border border-teal-400/90 bg-gradient-to-br from-teal-50/95 via-cyan-50/70 to-white p-4 shadow-[0_8px_28px_rgba(20,184,166,0.1)] transition-all duration-200",
  cardShellHover:
    "hover:border-teal-500 hover:shadow-[0_12px_32px_rgba(6,182,212,0.14)] hover:from-teal-50 hover:via-cyan-50/85",
  metaCta: "font-semibold text-teal-700",
  metaCtaHover: "group-hover:text-teal-800",
  mobileDivider: "border-teal-400/80",
  metricCard:
    "rounded-xl border border-teal-400/85 bg-gradient-to-b from-teal-50/95 via-cyan-50/60 to-white p-4 shadow-sm",
  metricScoreText: "text-teal-800"
};

const CAUTION_COLORS: TrustBandColors = {
  border: "border-amber-200/80",
  borderLeft: "before:bg-amber-500",
  icon: "text-amber-600",
  iconWrap: "border-amber-200/70 bg-amber-50/90 shadow-[0_6px_18px_rgba(245,158,11,0.16)]",
  scorePill:
    "border-amber-200/80 bg-gradient-to-b from-amber-50 to-white text-amber-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_14px_rgba(245,158,11,0.12)]",
  scorePillDim: "text-amber-700/80",
  surfaceBg: "bg-amber-50/35",
  surfaceGradient: "border-amber-200/80 bg-gradient-to-b from-amber-50/35 to-white",
  headlineText: "text-amber-950",
  meterTrack: "bg-amber-100",
  meterFill: "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600",
  meterMarker: "text-amber-900",
  progressBar: "bg-amber-500",
  softBg: "bg-amber-50/90",
  softBorder: "border-amber-300/80",
  toneText: "text-amber-900",
  cta: "text-amber-700 decoration-amber-500/35 hover:text-amber-800",
  surfaceGlow: "from-amber-500/10 via-amber-400/0 to-transparent",
  accentBar: "before:bg-amber-500",
  articleBg: "border border-amber-200/70 bg-amber-50/55",
  cardShell:
    "relative min-h-0 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/85 via-white to-white p-4 shadow-subtle transition-all duration-200",
  cardShellHover: "hover:border-amber-300/90 hover:shadow-elevated hover:from-amber-50/95",
  metaCta: "font-semibold text-amber-800",
  metaCtaHover: "group-hover:text-amber-900",
  mobileDivider: "border-amber-200/55",
  metricCard: "rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-white p-4 shadow-sm",
  metricScoreText: "text-amber-950"
};

const SUSPICIOUS_COLORS: TrustBandColors = {
  border: "border-orange-200/80",
  borderLeft: "before:bg-orange-500",
  icon: "text-orange-600",
  iconWrap: "border-orange-200/70 bg-orange-50/90 shadow-[0_6px_18px_rgba(249,115,22,0.16)]",
  scorePill:
    "border-orange-200/80 bg-gradient-to-b from-orange-50 to-white text-orange-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_14px_rgba(249,115,22,0.12)]",
  scorePillDim: "text-orange-800/80",
  surfaceBg: "bg-orange-50/40",
  surfaceGradient: "border-orange-200/80 bg-gradient-to-b from-orange-50/40 to-white",
  headlineText: "text-orange-950",
  meterTrack: "bg-orange-100",
  meterFill: "bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600",
  meterMarker: "text-orange-950",
  progressBar: "bg-orange-500",
  softBg: "bg-orange-50/90",
  softBorder: "border-orange-300/80",
  toneText: "text-orange-950",
  cta: "text-orange-700 decoration-orange-500/35 hover:text-orange-800",
  surfaceGlow: "from-orange-500/10 via-orange-400/0 to-transparent",
  accentBar: "before:bg-orange-500",
  articleBg: "border border-orange-200/70 bg-orange-50/55",
  cardShell:
    "relative min-h-0 rounded-2xl border border-orange-200/80 bg-gradient-to-br from-orange-50/85 via-white to-white p-4 shadow-subtle transition-all duration-200",
  cardShellHover: "hover:border-orange-300/90 hover:shadow-elevated hover:from-orange-50/95",
  metaCta: "font-semibold text-orange-800",
  metaCtaHover: "group-hover:text-orange-900",
  mobileDivider: "border-orange-200/55",
  metricCard: "rounded-xl border border-orange-200/80 bg-gradient-to-br from-orange-50/80 to-white p-4 shadow-sm",
  metricScoreText: "text-orange-950"
};

const DANGER_COLORS: TrustBandColors = {
  border: "border-rose-200/80",
  borderLeft: "before:bg-rose-500",
  icon: "text-rose-600",
  iconWrap: "border-rose-200/70 bg-rose-50/90 shadow-[0_6px_18px_rgba(244,63,94,0.18)]",
  scorePill:
    "border-rose-200/80 bg-gradient-to-b from-rose-50 to-white text-rose-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_14px_rgba(244,63,94,0.14)]",
  scorePillDim: "text-rose-700/80",
  surfaceBg: "bg-rose-50/35",
  surfaceGradient: "border-rose-200/80 bg-gradient-to-b from-rose-50/35 to-white",
  headlineText: "text-rose-900",
  meterTrack: "bg-rose-100",
  meterFill: "bg-gradient-to-r from-rose-500 via-rose-500 to-rose-600",
  meterMarker: "text-rose-900",
  progressBar: "bg-rose-600",
  softBg: "bg-rose-50/90",
  softBorder: "border-rose-300/80",
  toneText: "text-rose-900",
  cta: "text-rose-700 decoration-rose-500/35 hover:text-rose-800",
  surfaceGlow: "from-rose-500/10 via-rose-400/0 to-transparent",
  accentBar: "before:bg-rose-500",
  articleBg: "border border-rose-200/70 bg-rose-50/55",
  cardShell:
    "relative min-h-0 rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50/85 via-white to-white p-4 shadow-subtle transition-all duration-200",
  cardShellHover: "hover:border-rose-300/90 hover:shadow-elevated hover:from-rose-50/95",
  metaCta: "font-semibold text-rose-800",
  metaCtaHover: "group-hover:text-rose-900",
  mobileDivider: "border-rose-200/55",
  metricCard: "rounded-xl border border-rose-200/80 bg-gradient-to-br from-rose-50/80 to-white p-4 shadow-sm",
  metricScoreText: "text-rose-900"
};

/** Neutral chrome only when trust score is unknown — never for scored bands. */
const MISSING_SCORE_CHROME: OverviewCardChrome = {
  tone: "caution",
  accentBar: "before:bg-slate-300/80",
  surfaceGlow: "from-slate-400/5 to-transparent",
  iconWrap: "border-slate-200/80 bg-slate-50/95",
  icon: "text-slate-500",
  scorePill: "border-slate-200/80 bg-slate-50 text-slate-800",
  scorePillDim: "text-slate-500",
  cta: "text-slate-700 decoration-slate-400/35 hover:text-slate-900",
  headlineText: "text-slate-900",
  cardShell:
    "relative min-h-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-subtle transition-all duration-200",
  cardShellHover: "hover:border-slate-300/90 hover:shadow-elevated",
  metaCta: "text-slate-700",
  metaCtaHover: "group-hover:text-slate-900",
  mobileDivider: "border-slate-200/60"
};

const TRUST_BANDS: readonly TrustBandDefinition[] = [
  {
    band: "likely-safe",
    minScore: 85,
    maxScore: 100,
    verdict: "Likely Safe",
    tone: "safe",
    headline: "Likely Safe",
    description: "No major risk indicators detected.",
    colors: LIKELY_SAFE_COLORS
  },
  {
    band: "mostly-safe",
    minScore: 70,
    maxScore: 84,
    verdict: "Mostly Safe",
    tone: "mostly-safe",
    headline: "Mostly Safe",
    description: "Mostly positive signals detected, but some checks were limited or unavailable.",
    colors: MOSTLY_SAFE_COLORS
  },
  {
    band: "caution",
    minScore: 50,
    maxScore: 69,
    verdict: "Use Caution",
    tone: "caution",
    headline: "Use Caution",
    description: "Some risk indicators or missing trust signals were detected.",
    colors: CAUTION_COLORS
  },
  {
    band: "suspicious",
    minScore: 30,
    maxScore: 49,
    verdict: "Suspicious",
    tone: "suspicious",
    headline: "Suspicious",
    description: "Multiple warning signals were detected.",
    colors: SUSPICIOUS_COLORS
  },
  {
    band: "high-risk",
    minScore: 0,
    maxScore: 29,
    verdict: "High Risk",
    tone: "danger",
    headline: "High Risk",
    description: "High-risk indicators strongly suggest caution.",
    colors: DANGER_COLORS
  }
] as const;

export function getTrustBandFromScore(score: number): TrustBandId {
  const t = clampScore(score);
  if (t >= 85) return "likely-safe";
  if (t >= 70) return "mostly-safe";
  if (t >= 50) return "caution";
  if (t >= 30) return "suspicious";
  return "high-risk";
}

export function getTrustPresentation(score: number): TrustPresentation {
  const band = getTrustBandFromScore(score);
  const def = TRUST_BANDS.find((row) => row.band === band) ?? TRUST_BANDS[0];
  return {
    band: def.band,
    verdict: def.verdict,
    tone: def.tone,
    colors: def.colors,
    headline: def.headline,
    description: def.description,
    minScore: def.minScore,
    maxScore: def.maxScore
  };
}

export function standardVerdictLabel(trustScore: number): ConsumerVerdictLabel {
  return getTrustPresentation(trustScore).verdict;
}

/** Maps new consumer verdict to legacy API string where needed. */
export function legacyVerdictLabel(label: ConsumerVerdictLabel): string {
  if (label === "High Risk") return LEGACY_HIGH_SCAM_RISK_VERDICT;
  return label;
}

export function parseConsumerVerdictLabel(raw: string): ConsumerVerdictLabel | null {
  const normalized = raw.trim();
  if (normalized === LEGACY_HIGH_SCAM_RISK_VERDICT) return "High Risk";
  for (const row of TRUST_BANDS) {
    if (row.verdict === normalized) return row.verdict;
  }
  return null;
}

/** Legacy three-band grouping for secondary labels. */
export type ConsumerDisplayBand = "trusted" | "caution" | "highRisk";

export function consumerDisplayBand(trustScore: number): ConsumerDisplayBand {
  const band = getTrustBandFromScore(trustScore);
  if (band === "likely-safe" || band === "mostly-safe") return "trusted";
  if (band === "caution" || band === "suspicious") return "caution";
  return "highRisk";
}

export function consumerDisplayLabel(trustScore: number): string {
  switch (consumerDisplayBand(trustScore)) {
    case "trusted":
      return "Trusted";
    case "caution":
      return "Caution";
    case "highRisk":
    default:
      return "High Risk";
  }
}

export function trustMeterColors(score: number, threatActive = false): Pick<TrustBandColors, "meterTrack" | "meterFill" | "meterMarker"> {
  if (threatActive) {
    return {
      meterTrack: DANGER_COLORS.meterTrack,
      meterFill: DANGER_COLORS.meterFill,
      meterMarker: DANGER_COLORS.meterMarker
    };
  }
  const { colors } = getTrustPresentation(score);
  return {
    meterTrack: colors.meterTrack,
    meterFill: colors.meterFill,
    meterMarker: colors.meterMarker
  };
}

export function verdictSurfaceClass(verdict: ConsumerVerdictLabel): string {
  const parsed = parseConsumerVerdictLabel(verdict);
  if (!parsed) return getTrustPresentation(50).colors.surfaceGradient;
  return getTrustPresentation(verdictToRepresentativeScore(parsed)).colors.surfaceGradient;
}

export function verdictHeadlineClass(verdict: ConsumerVerdictLabel): string {
  const parsed = parseConsumerVerdictLabel(verdict);
  if (!parsed) return getTrustPresentation(50).colors.headlineText;
  return getTrustPresentation(verdictToRepresentativeScore(parsed)).colors.headlineText;
}

/** Full semantic palette for a trust score (0–100). */
export function getTrustColors(trustScore: number): TrustBandColors {
  return getTrustPresentation(trustScore).colors;
}

/** Prefer live score; fall back to verdict representative score when score is absent. */
export function getTrustColorsForDisplay(
  trustScore: number | null | undefined,
  verdict?: ConsumerVerdictLabel | string | null
): TrustBandColors {
  if (typeof trustScore === "number" && Number.isFinite(trustScore)) {
    return getTrustColors(clampScore(trustScore));
  }
  const parsed =
    typeof verdict === "string" ? parseConsumerVerdictLabel(verdict) : (verdict as ConsumerVerdictLabel | null);
  return getTrustColors(parsed ? verdictToRepresentativeScore(parsed) : 50);
}

function overviewChromeFromColors(tone: SemanticTone, colors: TrustBandColors): OverviewCardChrome {
  return {
    tone,
    accentBar: colors.accentBar,
    surfaceGlow: colors.surfaceGlow,
    iconWrap: colors.iconWrap,
    icon: colors.icon,
    scorePill: colors.scorePill,
    scorePillDim: colors.scorePillDim,
    cta: colors.cta,
    headlineText: colors.headlineText,
    cardShell: colors.cardShell,
    cardShellHover: colors.cardShellHover,
    metaCta: colors.metaCta,
    metaCtaHover: colors.metaCtaHover,
    mobileDivider: colors.mobileDivider
  };
}

/** Premium semantic chrome for latest-checks, recent searches, pulse list cards. */
export function getOverviewCardChrome(trustScore: number | null | undefined): OverviewCardChrome {
  if (trustScore == null || !Number.isFinite(trustScore)) {
    return MISSING_SCORE_CHROME;
  }
  const presentation = getTrustPresentation(clampScore(trustScore));
  return overviewChromeFromColors(presentation.tone, presentation.colors);
}

/** Alias — same chrome helper for any trust card surface. */
export const getTrustCardChrome = getOverviewCardChrome;

export function headlineToneFromSemantic(tone: SemanticTone): { text: string; icon: string } {
  const colors = getTrustColors(toneToRepresentativeScore(tone));
  return { text: colors.headlineText, icon: colors.icon };
}

export function headlineToneFromScore(trustScore: number): { text: string; icon: string } {
  const colors = getTrustColors(trustScore);
  return { text: colors.headlineText, icon: colors.icon };
}

function toneToRepresentativeScore(tone: SemanticTone): number {
  switch (tone) {
    case "safe":
      return 90;
    case "mostly-safe":
      return 77;
    case "caution":
      return 60;
    case "suspicious":
      return 40;
    case "danger":
    default:
      return 15;
  }
}

function verdictToRepresentativeScore(verdict: ConsumerVerdictLabel): number {
  switch (verdict) {
    case "Likely Safe":
      return 90;
    case "Mostly Safe":
      return 77;
    case "Use Caution":
      return 60;
    case "Suspicious":
      return 40;
    case "High Risk":
    default:
      return 15;
  }
}
