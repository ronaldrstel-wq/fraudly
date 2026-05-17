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
  metaCtaButton: string;
  metaCtaButtonHover: string;
  mobileDivider: string;
  metricCard: string;
  metricScoreText: string;
  heroGlow: string;
  heroIconWrap: string;
  heroScoreRing: string;
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
  metaCtaButton: string;
  metaCtaButtonHover: string;
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
  border: "border-2 border-emerald-300/95",
  borderLeft: "before:bg-emerald-500",
  icon: "text-emerald-800",
  iconWrap:
    "border-2 border-emerald-300/95 bg-gradient-to-br from-emerald-200/60 via-emerald-100 to-emerald-50/95 text-emerald-800 shadow-[0_8px_20px_rgba(16,185,129,0.24),inset_0_1px_0_rgba(255,255,255,0.88)] ring-1 ring-emerald-200/85",
  scorePill:
    "border-2 border-emerald-300/95 bg-gradient-to-b from-emerald-200/55 via-emerald-100 to-emerald-50/95 text-emerald-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),inset_0_-10px_20px_-10px_rgba(16,185,129,0.14),0_8px_22px_rgba(16,185,129,0.28)] ring-1 ring-emerald-300/55",
  scorePillDim: "text-emerald-800/95",
  surfaceBg: "bg-emerald-50/70",
  surfaceGradient:
    "border-2 border-emerald-300/90 bg-gradient-to-br from-emerald-50/98 via-emerald-100/75 to-emerald-50/92 shadow-[0_12px_40px_-16px_rgba(16,185,129,0.32),inset_0_1px_0_rgba(255,255,255,0.9)]",
  headlineText: "text-emerald-950",
  meterTrack: "bg-emerald-100",
  meterFill: "bg-gradient-to-r from-emerald-500 via-emerald-500 to-emerald-600",
  meterMarker: "text-emerald-900",
  progressBar: "bg-emerald-500",
  softBg: "bg-emerald-100/80",
  softBorder: "border-emerald-300/85",
  toneText: "text-emerald-800",
  cta: "text-emerald-800 decoration-emerald-500/45 hover:text-emerald-950",
  surfaceGlow: "from-emerald-500/30 via-emerald-400/12 to-transparent",
  accentBar: "before:bg-emerald-500",
  articleBg: "border-2 border-emerald-300/85 bg-gradient-to-br from-emerald-50/95 via-emerald-100/70 to-emerald-50/90",
  cardShell:
    "relative min-h-0 overflow-hidden rounded-2xl border-2 border-emerald-300/90 bg-gradient-to-br from-emerald-50/98 via-emerald-100/72 to-emerald-50/90 p-4 pl-5 shadow-[0_12px_40px_-16px_rgba(16,185,129,0.3),0_4px_14px_-4px_rgba(16,185,129,0.14),inset_0_1px_0_rgba(255,255,255,0.88)] transition-all duration-200 sm:p-5 sm:pl-6",
  cardShellHover:
    "hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-[0_22px_52px_-18px_rgba(16,185,129,0.36),0_8px_20px_-8px_rgba(16,185,129,0.16)] hover:ring-2 hover:ring-emerald-400/30",
  metaCta: "font-bold text-emerald-900",
  metaCtaHover: "group-hover:text-emerald-950",
  metaCtaButton:
    "rounded-lg border-2 border-emerald-300/90 bg-emerald-100/85 px-3 py-1.5 text-emerald-950 shadow-[0_4px_14px_rgba(16,185,129,0.16)]",
  metaCtaButtonHover:
    "group-hover:border-emerald-400 group-hover:bg-emerald-200/70 group-hover:shadow-[0_6px_18px_rgba(16,185,129,0.22)]",
  mobileDivider: "border-emerald-300/70",
  metricCard:
    "rounded-xl border-2 border-emerald-300/85 bg-gradient-to-br from-emerald-50/95 via-emerald-100/70 to-emerald-50/90 p-4 shadow-md",
  metricScoreText: "text-emerald-950",
  heroGlow: "from-emerald-400/38 via-emerald-300/14 to-transparent",
  heroIconWrap:
    "border-2 border-emerald-300/90 bg-gradient-to-br from-emerald-200/55 via-emerald-100 to-emerald-50/95 text-emerald-800 shadow-[0_10px_28px_rgba(16,185,129,0.28)]",
  heroScoreRing:
    "border-[3px] border-emerald-400/90 bg-gradient-to-b from-emerald-200/50 via-emerald-100 to-emerald-50/95 text-emerald-950 shadow-[0_12px_36px_rgba(16,185,129,0.3),inset_0_1px_0_rgba(255,255,255,0.92)]"
};

const MOSTLY_SAFE_COLORS: TrustBandColors = {
  border: "border-2 border-teal-400/95",
  borderLeft: "before:bg-teal-500",
  icon: "text-teal-800",
  iconWrap:
    "border-2 border-teal-400/95 bg-gradient-to-br from-teal-200/55 via-teal-100 to-cyan-50/95 text-teal-800 shadow-[0_8px_20px_rgba(20,184,166,0.24),inset_0_1px_0_rgba(255,255,255,0.88)] ring-1 ring-teal-300/80",
  scorePill:
    "border-2 border-teal-400/95 bg-gradient-to-b from-teal-200/55 via-teal-100 to-cyan-50/95 text-teal-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),inset_0_-10px_20px_-10px_rgba(20,184,166,0.14),0_8px_22px_rgba(20,184,166,0.28)] ring-1 ring-teal-400/55",
  scorePillDim: "text-teal-800/95",
  surfaceBg: "bg-teal-50/85",
  surfaceGradient:
    "border-2 border-teal-400/90 bg-gradient-to-br from-teal-50/98 via-teal-100/70 to-cyan-50/88 shadow-[0_12px_40px_-16px_rgba(20,184,166,0.32),inset_0_1px_0_rgba(255,255,255,0.9)]",
  headlineText: "text-teal-950",
  meterTrack: "bg-teal-100",
  meterFill: "bg-gradient-to-r from-teal-500 via-teal-500 to-cyan-500",
  meterMarker: "text-teal-800",
  progressBar: "bg-teal-500",
  softBg: "bg-teal-100/80",
  softBorder: "border-teal-400/90",
  toneText: "text-teal-800",
  cta: "text-teal-800 decoration-teal-500/55 hover:text-teal-950",
  surfaceGlow: "from-teal-500/30 via-cyan-400/12 to-transparent",
  accentBar: "before:bg-teal-500",
  articleBg: "border-2 border-teal-400/90 bg-gradient-to-br from-teal-50/95 via-teal-100/65 to-cyan-50/88",
  cardShell:
    "relative min-h-0 overflow-hidden rounded-2xl border-2 border-teal-400/90 bg-gradient-to-br from-teal-50/98 via-teal-100/68 to-cyan-50/88 p-4 pl-5 shadow-[0_12px_40px_-16px_rgba(20,184,166,0.3),0_4px_14px_-4px_rgba(20,184,166,0.14),inset_0_1px_0_rgba(255,255,255,0.88)] transition-all duration-200 sm:p-5 sm:pl-6",
  cardShellHover:
    "hover:-translate-y-0.5 hover:border-teal-500 hover:shadow-[0_22px_52px_-18px_rgba(20,184,166,0.34),0_8px_20px_-8px_rgba(20,184,166,0.16)] hover:ring-2 hover:ring-teal-400/30",
  metaCta: "font-bold text-teal-900",
  metaCtaHover: "group-hover:text-teal-950",
  metaCtaButton:
    "rounded-lg border-2 border-teal-400/90 bg-teal-100/85 px-3 py-1.5 text-teal-950 shadow-[0_4px_14px_rgba(20,184,166,0.16)]",
  metaCtaButtonHover:
    "group-hover:border-teal-500 group-hover:bg-teal-200/65 group-hover:shadow-[0_6px_18px_rgba(20,184,166,0.22)]",
  mobileDivider: "border-teal-400/75",
  metricCard:
    "rounded-xl border-2 border-teal-400/90 bg-gradient-to-br from-teal-50/95 via-teal-100/65 to-cyan-50/88 p-4 shadow-md",
  metricScoreText: "text-teal-950",
  heroGlow: "from-teal-400/36 via-cyan-400/12 to-transparent",
  heroIconWrap:
    "border-2 border-teal-400/90 bg-gradient-to-br from-teal-200/55 via-teal-100 to-cyan-50/95 text-teal-800 shadow-[0_10px_28px_rgba(20,184,166,0.28)]",
  heroScoreRing:
    "border-[3px] border-teal-400/90 bg-gradient-to-b from-teal-200/50 via-teal-100 to-cyan-50/95 text-teal-950 shadow-[0_12px_36px_rgba(20,184,166,0.3),inset_0_1px_0_rgba(255,255,255,0.92)]"
};

const CAUTION_COLORS: TrustBandColors = {
  border: "border-2 border-amber-300/95",
  borderLeft: "before:bg-amber-500",
  icon: "text-amber-800",
  iconWrap:
    "border-2 border-amber-300/95 bg-gradient-to-br from-amber-200/60 via-amber-100 to-amber-50/95 text-amber-900 shadow-[0_8px_20px_rgba(245,158,11,0.24),inset_0_1px_0_rgba(255,255,255,0.88)] ring-1 ring-amber-200/85",
  scorePill:
    "border-2 border-amber-300/95 bg-gradient-to-b from-amber-200/55 via-amber-100 to-amber-50/95 text-amber-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),inset_0_-10px_20px_-10px_rgba(245,158,11,0.14),0_8px_22px_rgba(245,158,11,0.28)] ring-1 ring-amber-300/55",
  scorePillDim: "text-amber-800/95",
  surfaceBg: "bg-amber-50/65",
  surfaceGradient:
    "border-2 border-amber-300/90 bg-gradient-to-br from-amber-50/98 via-amber-100/72 to-amber-50/90 shadow-[0_12px_40px_-16px_rgba(245,158,11,0.32),inset_0_1px_0_rgba(255,255,255,0.9)]",
  headlineText: "text-amber-950",
  meterTrack: "bg-amber-100",
  meterFill: "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600",
  meterMarker: "text-amber-900",
  progressBar: "bg-amber-500",
  softBg: "bg-amber-100/80",
  softBorder: "border-amber-300/85",
  toneText: "text-amber-900",
  cta: "text-amber-800 decoration-amber-500/45 hover:text-amber-950",
  surfaceGlow: "from-amber-500/30 via-orange-400/12 to-transparent",
  accentBar: "before:bg-amber-500",
  articleBg: "border-2 border-amber-300/85 bg-gradient-to-br from-amber-50/95 via-amber-100/70 to-amber-50/90",
  cardShell:
    "relative min-h-0 overflow-hidden rounded-2xl border-2 border-amber-300/90 bg-gradient-to-br from-amber-50/98 via-amber-100/72 to-amber-50/90 p-4 pl-5 shadow-[0_12px_40px_-16px_rgba(245,158,11,0.3),0_4px_14px_-4px_rgba(245,158,11,0.14),inset_0_1px_0_rgba(255,255,255,0.88)] transition-all duration-200 sm:p-5 sm:pl-6",
  cardShellHover:
    "hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-[0_22px_52px_-18px_rgba(245,158,11,0.34),0_8px_20px_-8px_rgba(245,158,11,0.16)] hover:ring-2 hover:ring-amber-400/30",
  metaCta: "font-bold text-amber-900",
  metaCtaHover: "group-hover:text-amber-950",
  metaCtaButton:
    "rounded-lg border-2 border-amber-300/90 bg-amber-100/85 px-3 py-1.5 text-amber-950 shadow-[0_4px_14px_rgba(245,158,11,0.16)]",
  metaCtaButtonHover:
    "group-hover:border-amber-400 group-hover:bg-amber-200/70 group-hover:shadow-[0_6px_18px_rgba(245,158,11,0.22)]",
  mobileDivider: "border-amber-300/70",
  metricCard:
    "rounded-xl border-2 border-amber-300/85 bg-gradient-to-br from-amber-50/95 via-amber-100/70 to-amber-50/90 p-4 shadow-md",
  metricScoreText: "text-amber-950",
  heroGlow: "from-amber-400/38 via-orange-300/12 to-transparent",
  heroIconWrap:
    "border-2 border-amber-300/90 bg-gradient-to-br from-amber-200/55 via-amber-100 to-amber-50/95 text-amber-900 shadow-[0_10px_28px_rgba(245,158,11,0.28)]",
  heroScoreRing:
    "border-[3px] border-amber-400/90 bg-gradient-to-b from-amber-200/50 via-amber-100 to-amber-50/95 text-amber-950 shadow-[0_12px_36px_rgba(245,158,11,0.3),inset_0_1px_0_rgba(255,255,255,0.92)]"
};

const SUSPICIOUS_COLORS: TrustBandColors = {
  border: "border-2 border-orange-300/95",
  borderLeft: "before:bg-orange-500",
  icon: "text-orange-800",
  iconWrap:
    "border-2 border-orange-300/95 bg-gradient-to-br from-orange-200/60 via-orange-100 to-orange-50/95 text-orange-900 shadow-[0_8px_20px_rgba(249,115,22,0.24),inset_0_1px_0_rgba(255,255,255,0.88)] ring-1 ring-orange-200/85",
  scorePill:
    "border-2 border-orange-300/95 bg-gradient-to-b from-orange-200/55 via-orange-100 to-orange-50/95 text-orange-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),inset_0_-10px_20px_-10px_rgba(249,115,22,0.14),0_8px_22px_rgba(249,115,22,0.28)] ring-1 ring-orange-300/55",
  scorePillDim: "text-orange-800/95",
  surfaceBg: "bg-orange-50/65",
  surfaceGradient:
    "border-2 border-orange-300/90 bg-gradient-to-br from-orange-50/98 via-orange-100/72 to-orange-50/90 shadow-[0_12px_40px_-16px_rgba(249,115,22,0.32),inset_0_1px_0_rgba(255,255,255,0.9)]",
  headlineText: "text-orange-950",
  meterTrack: "bg-orange-100",
  meterFill: "bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600",
  meterMarker: "text-orange-950",
  progressBar: "bg-orange-500",
  softBg: "bg-orange-100/80",
  softBorder: "border-orange-300/85",
  toneText: "text-orange-950",
  cta: "text-orange-800 decoration-orange-500/45 hover:text-orange-950",
  surfaceGlow: "from-orange-500/30 via-orange-400/12 to-transparent",
  accentBar: "before:bg-orange-500",
  articleBg: "border-2 border-orange-300/85 bg-gradient-to-br from-orange-50/95 via-orange-100/70 to-orange-50/90",
  cardShell:
    "relative min-h-0 overflow-hidden rounded-2xl border-2 border-orange-300/90 bg-gradient-to-br from-orange-50/98 via-orange-100/72 to-orange-50/90 p-4 pl-5 shadow-[0_12px_40px_-16px_rgba(249,115,22,0.3),0_4px_14px_-4px_rgba(249,115,22,0.14),inset_0_1px_0_rgba(255,255,255,0.88)] transition-all duration-200 sm:p-5 sm:pl-6",
  cardShellHover:
    "hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-[0_22px_52px_-18px_rgba(249,115,22,0.34),0_8px_20px_-8px_rgba(249,115,22,0.16)] hover:ring-2 hover:ring-orange-400/30",
  metaCta: "font-bold text-orange-900",
  metaCtaHover: "group-hover:text-orange-950",
  metaCtaButton:
    "rounded-lg border-2 border-orange-300/90 bg-orange-100/85 px-3 py-1.5 text-orange-950 shadow-[0_4px_14px_rgba(249,115,22,0.16)]",
  metaCtaButtonHover:
    "group-hover:border-orange-400 group-hover:bg-orange-200/70 group-hover:shadow-[0_6px_18px_rgba(249,115,22,0.22)]",
  mobileDivider: "border-orange-300/70",
  metricCard:
    "rounded-xl border-2 border-orange-300/85 bg-gradient-to-br from-orange-50/95 via-orange-100/70 to-orange-50/90 p-4 shadow-md",
  metricScoreText: "text-orange-950",
  heroGlow: "from-orange-400/38 via-orange-300/12 to-transparent",
  heroIconWrap:
    "border-2 border-orange-300/90 bg-gradient-to-br from-orange-200/55 via-orange-100 to-orange-50/95 text-orange-900 shadow-[0_10px_28px_rgba(249,115,22,0.28)]",
  heroScoreRing:
    "border-[3px] border-orange-400/90 bg-gradient-to-b from-orange-200/50 via-orange-100 to-orange-50/95 text-orange-950 shadow-[0_12px_36px_rgba(249,115,22,0.3),inset_0_1px_0_rgba(255,255,255,0.92)]"
};

const DANGER_COLORS: TrustBandColors = {
  border: "border-2 border-rose-300/95",
  borderLeft: "before:bg-rose-500",
  icon: "text-rose-800",
  iconWrap:
    "border-2 border-rose-300/95 bg-gradient-to-br from-rose-200/60 via-rose-100 to-rose-50/95 text-rose-900 shadow-[0_8px_20px_rgba(244,63,94,0.26),inset_0_1px_0_rgba(255,255,255,0.88)] ring-1 ring-rose-200/85",
  scorePill:
    "border-2 border-rose-300/95 bg-gradient-to-b from-rose-200/55 via-rose-100 to-rose-50/95 text-rose-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),inset_0_-10px_20px_-10px_rgba(244,63,94,0.16),0_8px_22px_rgba(244,63,94,0.3)] ring-1 ring-rose-300/55",
  scorePillDim: "text-rose-800/95",
  surfaceBg: "bg-rose-50/65",
  surfaceGradient:
    "border-2 border-rose-300/90 bg-gradient-to-br from-rose-50/98 via-rose-100/72 to-rose-50/90 shadow-[0_12px_40px_-16px_rgba(244,63,94,0.34),inset_0_1px_0_rgba(255,255,255,0.9)]",
  headlineText: "text-rose-950",
  meterTrack: "bg-rose-100",
  meterFill: "bg-gradient-to-r from-rose-500 via-rose-500 to-rose-600",
  meterMarker: "text-rose-900",
  progressBar: "bg-rose-600",
  softBg: "bg-rose-100/80",
  softBorder: "border-rose-300/85",
  toneText: "text-rose-900",
  cta: "text-rose-800 decoration-rose-500/45 hover:text-rose-950",
  surfaceGlow: "from-rose-500/32 via-rose-400/12 to-transparent",
  accentBar: "before:bg-rose-500",
  articleBg: "border-2 border-rose-300/85 bg-gradient-to-br from-rose-50/95 via-rose-100/70 to-rose-50/90",
  cardShell:
    "relative min-h-0 overflow-hidden rounded-2xl border-2 border-rose-300/90 bg-gradient-to-br from-rose-50/98 via-rose-100/72 to-rose-50/90 p-4 pl-5 shadow-[0_12px_40px_-16px_rgba(244,63,94,0.32),0_4px_14px_-4px_rgba(244,63,94,0.16),inset_0_1px_0_rgba(255,255,255,0.88)] transition-all duration-200 sm:p-5 sm:pl-6",
  cardShellHover:
    "hover:-translate-y-0.5 hover:border-rose-400 hover:shadow-[0_22px_52px_-18px_rgba(244,63,94,0.38),0_8px_20px_-8px_rgba(244,63,94,0.18)] hover:ring-2 hover:ring-rose-400/30",
  metaCta: "font-bold text-rose-900",
  metaCtaHover: "group-hover:text-rose-950",
  metaCtaButton:
    "rounded-lg border-2 border-rose-300/90 bg-rose-100/85 px-3 py-1.5 text-rose-950 shadow-[0_4px_14px_rgba(244,63,94,0.18)]",
  metaCtaButtonHover:
    "group-hover:border-rose-400 group-hover:bg-rose-200/70 group-hover:shadow-[0_6px_18px_rgba(244,63,94,0.24)]",
  mobileDivider: "border-rose-300/70",
  metricCard:
    "rounded-xl border-2 border-rose-300/85 bg-gradient-to-br from-rose-50/95 via-rose-100/70 to-rose-50/90 p-4 shadow-md",
  metricScoreText: "text-rose-950",
  heroGlow: "from-rose-400/40 via-rose-300/14 to-transparent",
  heroIconWrap:
    "border-2 border-rose-300/90 bg-gradient-to-br from-rose-200/55 via-rose-100 to-rose-50/95 text-rose-900 shadow-[0_10px_28px_rgba(244,63,94,0.3)]",
  heroScoreRing:
    "border-[3px] border-rose-400/90 bg-gradient-to-b from-rose-200/50 via-rose-100 to-rose-50/95 text-rose-950 shadow-[0_12px_36px_rgba(244,63,94,0.32),inset_0_1px_0_rgba(255,255,255,0.92)]"
};

/** Neutral chrome only when trust score is unknown — never for scored bands. */
const MISSING_SCORE_CHROME: OverviewCardChrome = {
  tone: "caution",
  accentBar: "before:bg-blue-400",
  surfaceGlow: "from-blue-400/22 via-slate-400/10 to-transparent",
  iconWrap:
    "border-2 border-blue-300/90 bg-gradient-to-br from-blue-200/50 via-slate-100 to-blue-50/95 text-slate-700 shadow-[0_8px_20px_rgba(59,130,246,0.18),inset_0_1px_0_rgba(255,255,255,0.88)] ring-1 ring-blue-200/80",
  icon: "text-slate-700",
  scorePill:
    "border-2 border-blue-300/90 bg-gradient-to-b from-blue-200/50 via-slate-100 to-blue-50/95 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),inset_0_-10px_20px_-10px_rgba(59,130,246,0.1),0_8px_22px_rgba(100,116,139,0.2)] ring-1 ring-blue-300/50",
  scorePillDim: "text-slate-600",
  cta: "text-slate-800 decoration-slate-400/45 hover:text-slate-950",
  headlineText: "text-slate-950",
  cardShell:
    "relative min-h-0 overflow-hidden rounded-2xl border-2 border-slate-300/85 bg-gradient-to-br from-slate-50/98 via-blue-100/55 to-slate-50/90 p-4 pl-5 shadow-[0_12px_40px_-16px_rgba(100,116,139,0.22),0_4px_14px_-4px_rgba(59,130,246,0.1),inset_0_1px_0_rgba(255,255,255,0.88)] transition-all duration-200 sm:p-5 sm:pl-6",
  cardShellHover:
    "hover:-translate-y-0.5 hover:border-blue-400/80 hover:shadow-[0_22px_52px_-18px_rgba(59,130,246,0.2),0_8px_20px_-8px_rgba(100,116,139,0.14)] hover:ring-2 hover:ring-blue-300/35",
  metaCta: "font-bold text-slate-800",
  metaCtaHover: "group-hover:text-slate-950",
  metaCtaButton:
    "rounded-lg border-2 border-blue-300/85 bg-blue-100/80 px-3 py-1.5 text-slate-900 shadow-[0_4px_14px_rgba(59,130,246,0.14)]",
  metaCtaButtonHover:
    "group-hover:border-blue-400 group-hover:bg-blue-200/65 group-hover:shadow-[0_6px_18px_rgba(59,130,246,0.18)]",
  mobileDivider: "border-slate-300/70"
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
    metaCtaButton: colors.metaCtaButton,
    metaCtaButtonHover: colors.metaCtaButtonHover,
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

export type OverviewFeedIconKind = "trusted" | "caution" | "danger" | "unknown";

/** Reference-style latest-check / feed row — thick stripe, tinted shell, solid CTA. */
export type OverviewFeedCardVisual = {
  tone: SemanticTone;
  iconKind: OverviewFeedIconKind;
  stripe: string;
  card: string;
  cardHover: string;
  iconCircle: string;
  iconInk: string;
  headline: string;
  scorePill: string;
  scoreSlash: string;
  cta: string;
  ctaHover: string;
  /** Text “View result →” link on feed rows */
  ctaText: string;
  ctaTextHover: string;
  /** Right-side grouped meta box (time, score, CTA) */
  metaBox: string;
  /** Compact score pill inside meta capsule */
  metaScorePill: string;
  metaScoreSlash: string;
  /** Compact “View →” control inside meta capsule */
  metaViewBtn: string;
};

const FEED_MOTION = "transition-all duration-200 ease-out";
/** Integrated meta rail — flush with card (no floating widget). */
const FEED_META_BOX =
  "border border-[rgba(15,23,42,0.06)] bg-[rgba(255,255,255,0.72)] shadow-none";
const FEED_META_VIEW_BTN =
  "inline-flex h-[34px] shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full border border-slate-200/80 bg-white/90 px-3.5 text-[13px] font-semibold leading-none text-slate-700 shadow-none hover:bg-white";
const FEED_META_SCORE_SLASH = "text-[11px] font-normal text-slate-500";
const FEED_HEADLINE_BASE =
  "text-[calc(1.85rem+2px)] font-bold leading-[1.05] tracking-[-0.025em] sm:text-[calc(2rem+2px)]";
const FEED_STRIPE_SAFE = "border-l-4 border-solid border-l-[#14b86a] rounded-l-[22px]";
const FEED_STRIPE_CAUTION = "border-l-4 border-solid border-l-[#f2a93b] rounded-l-[22px]";
const FEED_STRIPE_SUSPICIOUS = "border-l-4 border-solid border-l-[#f2a93b] rounded-l-[22px]";
const FEED_STRIPE_DANGER = "border-l-4 border-solid border-l-[#ef4444] rounded-l-[22px]";
const FEED_STRIPE_INFO = "border-l-4 border-solid border-l-blue-500 rounded-l-[22px]";
const FEED_CARD_SHELL =
  "relative flex w-full overflow-hidden rounded-[22px] border border-[rgba(15,23,42,0.08)]";
const FEED_META_SCORE_PILL =
  "inline-flex h-[32px] w-[88px] shrink-0 items-baseline justify-center gap-0.5 rounded-full border border-slate-200/75 bg-white/90 px-3 text-[14px] leading-none tabular-nums text-slate-800 shadow-none";

const FEED_TRUSTED: OverviewFeedCardVisual = {
  tone: "safe",
  iconKind: "trusted",
  stripe: FEED_STRIPE_SAFE,
  card: `${FEED_CARD_SHELL} bg-[#f3fbf7] shadow-[0_6px_24px_-10px_rgba(16,185,129,0.14)] ${FEED_MOTION}`,
  cardHover:
    "hover:-translate-y-0.5 hover:border-[rgba(20,184,106,0.25)] hover:shadow-[0_8px_28px_-10px_rgba(16,185,129,0.2)]",
  iconCircle:
    "flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border-2 border-[#14b86a]/35 bg-white/90 shadow-[0_2px_8px_rgba(16,185,129,0.12)]",
  iconInk: "text-[#067647]",
  headline: `${FEED_HEADLINE_BASE} text-[#067647]`,
  scorePill:
    "inline-flex min-w-[5.5rem] items-baseline justify-center gap-0.5 rounded-full border-2 border-emerald-300/90 bg-gradient-to-b from-emerald-100 to-emerald-50/95 px-4 py-2 text-xl font-bold tabular-nums text-emerald-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_4px_14px_rgba(16,185,129,0.16)]",
  scoreSlash: "text-sm font-semibold text-emerald-700/85",
  cta: "inline-flex items-center justify-center gap-1 rounded-xl bg-gradient-to-b from-emerald-600 to-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_18px_-4px_rgba(16,185,129,0.45)]",
  ctaHover: "group-hover:from-emerald-700 group-hover:to-emerald-800 group-hover:shadow-[0_8px_22px_-4px_rgba(16,185,129,0.5)]",
  ctaText: "text-emerald-700",
  ctaTextHover: "group-hover:text-emerald-900",
  metaBox: FEED_META_BOX,
  metaScorePill: FEED_META_SCORE_PILL,
  metaScoreSlash: FEED_META_SCORE_SLASH,
  metaViewBtn: FEED_META_VIEW_BTN
};

const FEED_MOSTLY_SAFE: OverviewFeedCardVisual = {
  ...FEED_TRUSTED,
  tone: "mostly-safe",
  stripe: FEED_STRIPE_SAFE,
  headline: `${FEED_HEADLINE_BASE} text-[#067647]`
};

const FEED_CAUTION: OverviewFeedCardVisual = {
  tone: "caution",
  iconKind: "caution",
  stripe: FEED_STRIPE_CAUTION,
  card: `${FEED_CARD_SHELL} bg-[#fff8eb] shadow-[0_6px_24px_-10px_rgba(245,158,11,0.12)] ${FEED_MOTION}`,
  cardHover:
    "hover:-translate-y-0.5 hover:border-[rgba(242,169,59,0.28)] hover:shadow-[0_8px_28px_-10px_rgba(245,158,11,0.18)]",
  iconCircle:
    "flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border-2 border-[#f2a93b]/35 bg-white/90 shadow-[0_2px_8px_rgba(245,158,11,0.12)]",
  iconInk: "text-[#b45309]",
  headline: `${FEED_HEADLINE_BASE} text-[#b45309]`,
  scorePill:
    "inline-flex min-w-[5.5rem] items-baseline justify-center gap-0.5 rounded-full border-2 border-amber-300/90 bg-gradient-to-b from-amber-100 to-amber-50/95 px-4 py-2 text-xl font-bold tabular-nums text-amber-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_4px_14px_rgba(245,158,11,0.16)]",
  scoreSlash: "text-sm font-semibold text-amber-800/85",
  cta: "inline-flex items-center justify-center gap-1 rounded-xl bg-gradient-to-b from-amber-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_18px_-4px_rgba(245,158,11,0.4)]",
  ctaHover: "group-hover:from-amber-600 group-hover:to-orange-700 group-hover:shadow-[0_8px_22px_-4px_rgba(245,158,11,0.48)]",
  ctaText: "text-amber-800",
  ctaTextHover: "group-hover:text-amber-950",
  metaBox: FEED_META_BOX,
  metaScorePill: FEED_META_SCORE_PILL,
  metaScoreSlash: FEED_META_SCORE_SLASH,
  metaViewBtn: FEED_META_VIEW_BTN
};

const FEED_SUSPICIOUS: OverviewFeedCardVisual = {
  ...FEED_CAUTION,
  tone: "suspicious",
  iconKind: "caution",
  stripe: FEED_STRIPE_SUSPICIOUS,
  headline: `${FEED_HEADLINE_BASE} text-[#b45309]`,
  iconInk: "text-[#b45309]",
  ctaText: "text-[#b45309]",
  ctaTextHover: "group-hover:text-[#92400e]"
};

const FEED_DANGER: OverviewFeedCardVisual = {
  tone: "danger",
  iconKind: "danger",
  stripe: FEED_STRIPE_DANGER,
  card: `${FEED_CARD_SHELL} bg-[#fff1f1] shadow-[0_6px_24px_-10px_rgba(239,68,68,0.12)] ${FEED_MOTION}`,
  cardHover:
    "hover:-translate-y-0.5 hover:border-[rgba(239,68,68,0.25)] hover:shadow-[0_8px_28px_-10px_rgba(244,63,94,0.18)]",
  iconCircle:
    "flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border-2 border-[#ef4444]/35 bg-white/90 shadow-[0_2px_8px_rgba(239,68,68,0.12)]",
  iconInk: "text-[#dc2626]",
  headline: `${FEED_HEADLINE_BASE} text-[#dc2626]`,
  scorePill:
    "inline-flex min-w-[5.5rem] items-baseline justify-center gap-0.5 rounded-full border-2 border-rose-300/90 bg-gradient-to-b from-rose-100 to-rose-50/95 px-4 py-2 text-xl font-bold tabular-nums text-rose-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_4px_14px_rgba(244,63,94,0.18)]",
  scoreSlash: "text-sm font-semibold text-rose-800/85",
  cta: "inline-flex items-center justify-center gap-1 rounded-xl bg-gradient-to-b from-rose-600 to-rose-700 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_18px_-4px_rgba(244,63,94,0.42)]",
  ctaHover: "group-hover:from-rose-700 group-hover:to-rose-800 group-hover:shadow-[0_8px_22px_-4px_rgba(244,63,94,0.48)]",
  ctaText: "text-rose-700",
  ctaTextHover: "group-hover:text-rose-900",
  metaBox: FEED_META_BOX,
  metaScorePill: FEED_META_SCORE_PILL,
  metaScoreSlash: FEED_META_SCORE_SLASH,
  metaViewBtn: FEED_META_VIEW_BTN
};

const FEED_UNKNOWN: OverviewFeedCardVisual = {
  tone: "caution",
  iconKind: "unknown",
  stripe: FEED_STRIPE_INFO,
  card: `${FEED_CARD_SHELL} bg-[#fff8eb] shadow-[0_6px_24px_-10px_rgba(59,130,246,0.1)] ${FEED_MOTION}`,
  cardHover:
    "hover:-translate-y-0.5 hover:border-blue-400/80 hover:shadow-[0_12px_36px_-10px_rgba(59,130,246,0.28)]",
  iconCircle:
    "flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border-2 border-blue-500/85 bg-blue-50/95 shadow-[0_2px_8px_rgba(59,130,246,0.18)]",
  iconInk: "text-blue-800",
  headline: `${FEED_HEADLINE_BASE} text-slate-800`,
  scorePill:
    "inline-flex min-w-[5.5rem] items-baseline justify-center gap-0.5 rounded-full border-2 border-blue-300/85 bg-gradient-to-b from-blue-100 to-slate-50/95 px-4 py-2 text-xl font-bold tabular-nums text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_4px_14px_rgba(59,130,246,0.12)]",
  scoreSlash: "text-sm font-semibold text-slate-600",
  cta: "inline-flex items-center justify-center gap-1 rounded-xl bg-gradient-to-b from-slate-600 to-slate-700 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_18px_-4px_rgba(71,85,105,0.35)]",
  ctaHover: "group-hover:from-slate-700 group-hover:to-slate-800 group-hover:shadow-[0_8px_22px_-4px_rgba(71,85,105,0.42)]",
  ctaText: "text-blue-600",
  ctaTextHover: "group-hover:text-blue-800",
  metaBox: FEED_META_BOX,
  metaScorePill: FEED_META_SCORE_PILL,
  metaScoreSlash: FEED_META_SCORE_SLASH,
  metaViewBtn: FEED_META_VIEW_BTN
};

export function getOverviewFeedCardVisual(trustScore: number | null | undefined): OverviewFeedCardVisual {
  if (trustScore == null || !Number.isFinite(trustScore)) {
    return FEED_UNKNOWN;
  }
  const band = getTrustBandFromScore(clampScore(trustScore));
  switch (band) {
    case "likely-safe":
      return FEED_TRUSTED;
    case "mostly-safe":
      return FEED_MOSTLY_SAFE;
    case "caution":
      return FEED_CAUTION;
    case "suspicious":
      return FEED_SUSPICIOUS;
    case "high-risk":
    default:
      return FEED_DANGER;
  }
}

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
