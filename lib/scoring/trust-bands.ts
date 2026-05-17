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
  icon: "text-emerald-700",
  iconWrap:
    "border-2 border-emerald-300/90 bg-gradient-to-br from-emerald-100 to-emerald-50 shadow-[0_8px_22px_rgba(16,185,129,0.22)] ring-1 ring-emerald-200/70",
  scorePill:
    "border-2 border-emerald-300/95 bg-gradient-to-b from-emerald-100 via-emerald-50 to-white text-emerald-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_8px_24px_rgba(16,185,129,0.22)] ring-1 ring-emerald-200/80",
  scorePillDim: "text-emerald-700/90",
  surfaceBg: "bg-emerald-50/45",
  surfaceGradient:
    "border-2 border-emerald-300/90 bg-gradient-to-br from-emerald-50/95 via-emerald-50/40 to-white shadow-[0_12px_40px_-18px_rgba(16,185,129,0.35),inset_0_1px_0_rgba(255,255,255,0.9)]",
  headlineText: "text-emerald-950",
  meterTrack: "bg-emerald-100",
  meterFill: "bg-gradient-to-r from-emerald-500 via-emerald-500 to-emerald-600",
  meterMarker: "text-emerald-900",
  progressBar: "bg-emerald-500",
  softBg: "bg-emerald-50/95",
  softBorder: "border-emerald-300/85",
  toneText: "text-emerald-800",
  cta: "text-emerald-800 decoration-emerald-500/45 hover:text-emerald-950",
  surfaceGlow: "from-emerald-500/22 via-emerald-400/8 to-transparent",
  accentBar: "before:bg-emerald-500",
  articleBg: "border-2 border-emerald-300/85 bg-emerald-50/65",
  cardShell:
    "relative min-h-0 overflow-hidden rounded-2xl border-2 border-emerald-300/90 bg-gradient-to-br from-emerald-50/95 via-emerald-50/50 to-white p-4 pl-5 shadow-[0_10px_36px_-14px_rgba(16,185,129,0.28),inset_0_1px_0_rgba(255,255,255,0.92)] transition-all duration-200 sm:p-5 sm:pl-6",
  cardShellHover:
    "hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-[0_20px_48px_-16px_rgba(16,185,129,0.32)] hover:ring-2 hover:ring-emerald-400/25",
  metaCta: "font-bold text-emerald-800",
  metaCtaHover: "group-hover:text-emerald-950",
  metaCtaButton:
    "rounded-lg border-2 border-emerald-300/90 bg-emerald-50/95 px-3 py-1.5 text-emerald-900 shadow-[0_4px_12px_rgba(16,185,129,0.12)]",
  metaCtaButtonHover:
    "group-hover:border-emerald-400 group-hover:bg-emerald-100 group-hover:shadow-[0_6px_16px_rgba(16,185,129,0.18)]",
  mobileDivider: "border-emerald-300/70",
  metricCard: "rounded-xl border-2 border-emerald-300/85 bg-gradient-to-br from-emerald-50/90 to-white p-4 shadow-md",
  metricScoreText: "text-emerald-950",
  heroGlow: "from-emerald-400/35 via-emerald-300/10 to-transparent",
  heroIconWrap:
    "border-2 border-emerald-300/90 bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-800 shadow-[0_10px_28px_rgba(16,185,129,0.25)]",
  heroScoreRing:
    "border-[3px] border-emerald-400/90 bg-gradient-to-b from-emerald-100 via-white to-emerald-50/80 text-emerald-950 shadow-[0_12px_36px_rgba(16,185,129,0.28),inset_0_1px_0_rgba(255,255,255,0.95)]"
};

const MOSTLY_SAFE_COLORS: TrustBandColors = {
  border: "border-2 border-teal-400/95",
  borderLeft: "before:bg-teal-500",
  icon: "text-teal-700",
  iconWrap:
    "border-2 border-teal-400/95 bg-gradient-to-br from-teal-100 to-cyan-50 text-teal-700 shadow-[0_8px_22px_rgba(20,184,166,0.24)] ring-1 ring-teal-300/70",
  scorePill:
    "border-2 border-teal-400/95 bg-gradient-to-b from-teal-100 via-cyan-50 to-white text-teal-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_8px_24px_rgba(20,184,166,0.2)] ring-1 ring-teal-300/75",
  scorePillDim: "text-teal-700/90",
  surfaceBg: "bg-teal-50/85",
  surfaceGradient:
    "border-2 border-teal-400/90 bg-gradient-to-br from-teal-50/95 via-cyan-50/55 to-white shadow-[0_12px_40px_-18px_rgba(20,184,166,0.3),inset_0_1px_0_rgba(255,255,255,0.9)]",
  headlineText: "text-teal-950",
  meterTrack: "bg-teal-100",
  meterFill: "bg-gradient-to-r from-teal-500 via-teal-500 to-cyan-500",
  meterMarker: "text-teal-800",
  progressBar: "bg-teal-500",
  softBg: "bg-teal-50/95",
  softBorder: "border-teal-400/90",
  toneText: "text-teal-800",
  cta: "text-teal-800 decoration-teal-500/55 hover:text-teal-950",
  surfaceGlow: "from-teal-500/24 via-cyan-400/10 to-transparent",
  accentBar: "before:bg-teal-500",
  articleBg: "border-2 border-teal-400/90 bg-gradient-to-br from-teal-50/95 via-cyan-50/55 to-white",
  cardShell:
    "relative min-h-0 overflow-hidden rounded-2xl border-2 border-teal-400/90 bg-gradient-to-br from-teal-50/95 via-cyan-50/65 to-white p-4 pl-5 shadow-[0_10px_36px_-14px_rgba(20,184,166,0.26),inset_0_1px_0_rgba(255,255,255,0.92)] transition-all duration-200 sm:p-5 sm:pl-6",
  cardShellHover:
    "hover:-translate-y-0.5 hover:border-teal-500 hover:shadow-[0_20px_48px_-16px_rgba(20,184,166,0.3)] hover:ring-2 hover:ring-teal-400/25",
  metaCta: "font-bold text-teal-800",
  metaCtaHover: "group-hover:text-teal-950",
  metaCtaButton:
    "rounded-lg border-2 border-teal-400/90 bg-teal-50/95 px-3 py-1.5 text-teal-900 shadow-[0_4px_12px_rgba(20,184,166,0.14)]",
  metaCtaButtonHover:
    "group-hover:border-teal-500 group-hover:bg-teal-100 group-hover:shadow-[0_6px_16px_rgba(20,184,166,0.2)]",
  mobileDivider: "border-teal-400/75",
  metricCard:
    "rounded-xl border-2 border-teal-400/90 bg-gradient-to-b from-teal-50/95 via-cyan-50/60 to-white p-4 shadow-md",
  metricScoreText: "text-teal-950",
  heroGlow: "from-teal-400/32 via-cyan-400/10 to-transparent",
  heroIconWrap:
    "border-2 border-teal-400/90 bg-gradient-to-br from-teal-100 to-cyan-50 text-teal-800 shadow-[0_10px_28px_rgba(20,184,166,0.24)]",
  heroScoreRing:
    "border-[3px] border-teal-400/90 bg-gradient-to-b from-teal-100 via-white to-cyan-50/80 text-teal-950 shadow-[0_12px_36px_rgba(20,184,166,0.26),inset_0_1px_0_rgba(255,255,255,0.95)]"
};

const CAUTION_COLORS: TrustBandColors = {
  border: "border-2 border-amber-300/95",
  borderLeft: "before:bg-amber-500",
  icon: "text-amber-700",
  iconWrap:
    "border-2 border-amber-300/90 bg-gradient-to-br from-amber-100 to-amber-50 shadow-[0_8px_22px_rgba(245,158,11,0.22)] ring-1 ring-amber-200/70",
  scorePill:
    "border-2 border-amber-300/95 bg-gradient-to-b from-amber-100 via-amber-50 to-white text-amber-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_8px_24px_rgba(245,158,11,0.2)] ring-1 ring-amber-200/80",
  scorePillDim: "text-amber-800/90",
  surfaceBg: "bg-amber-50/50",
  surfaceGradient:
    "border-2 border-amber-300/90 bg-gradient-to-br from-amber-50/95 via-amber-50/45 to-white shadow-[0_12px_40px_-18px_rgba(245,158,11,0.32),inset_0_1px_0_rgba(255,255,255,0.9)]",
  headlineText: "text-amber-950",
  meterTrack: "bg-amber-100",
  meterFill: "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600",
  meterMarker: "text-amber-900",
  progressBar: "bg-amber-500",
  softBg: "bg-amber-50/95",
  softBorder: "border-amber-300/85",
  toneText: "text-amber-900",
  cta: "text-amber-800 decoration-amber-500/45 hover:text-amber-950",
  surfaceGlow: "from-amber-500/22 via-orange-400/8 to-transparent",
  accentBar: "before:bg-amber-500",
  articleBg: "border-2 border-amber-300/85 bg-amber-50/65",
  cardShell:
    "relative min-h-0 overflow-hidden rounded-2xl border-2 border-amber-300/90 bg-gradient-to-br from-amber-50/95 via-amber-50/55 to-white p-4 pl-5 shadow-[0_10px_36px_-14px_rgba(245,158,11,0.26),inset_0_1px_0_rgba(255,255,255,0.92)] transition-all duration-200 sm:p-5 sm:pl-6",
  cardShellHover:
    "hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-[0_20px_48px_-16px_rgba(245,158,11,0.3)] hover:ring-2 hover:ring-amber-400/25",
  metaCta: "font-bold text-amber-900",
  metaCtaHover: "group-hover:text-amber-950",
  metaCtaButton:
    "rounded-lg border-2 border-amber-300/90 bg-amber-50/95 px-3 py-1.5 text-amber-950 shadow-[0_4px_12px_rgba(245,158,11,0.14)]",
  metaCtaButtonHover:
    "group-hover:border-amber-400 group-hover:bg-amber-100 group-hover:shadow-[0_6px_16px_rgba(245,158,11,0.2)]",
  mobileDivider: "border-amber-300/70",
  metricCard: "rounded-xl border-2 border-amber-300/85 bg-gradient-to-br from-amber-50/90 to-white p-4 shadow-md",
  metricScoreText: "text-amber-950",
  heroGlow: "from-amber-400/35 via-orange-300/10 to-transparent",
  heroIconWrap:
    "border-2 border-amber-300/90 bg-gradient-to-br from-amber-100 to-amber-50 text-amber-900 shadow-[0_10px_28px_rgba(245,158,11,0.24)]",
  heroScoreRing:
    "border-[3px] border-amber-400/90 bg-gradient-to-b from-amber-100 via-white to-amber-50/80 text-amber-950 shadow-[0_12px_36px_rgba(245,158,11,0.26),inset_0_1px_0_rgba(255,255,255,0.95)]"
};

const SUSPICIOUS_COLORS: TrustBandColors = {
  border: "border-2 border-orange-300/95",
  borderLeft: "before:bg-orange-500",
  icon: "text-orange-700",
  iconWrap:
    "border-2 border-orange-300/90 bg-gradient-to-br from-orange-100 to-orange-50 shadow-[0_8px_22px_rgba(249,115,22,0.22)] ring-1 ring-orange-200/70",
  scorePill:
    "border-2 border-orange-300/95 bg-gradient-to-b from-orange-100 via-orange-50 to-white text-orange-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_8px_24px_rgba(249,115,22,0.2)] ring-1 ring-orange-200/80",
  scorePillDim: "text-orange-800/90",
  surfaceBg: "bg-orange-50/50",
  surfaceGradient:
    "border-2 border-orange-300/90 bg-gradient-to-br from-orange-50/95 via-orange-50/45 to-white shadow-[0_12px_40px_-18px_rgba(249,115,22,0.3),inset_0_1px_0_rgba(255,255,255,0.9)]",
  headlineText: "text-orange-950",
  meterTrack: "bg-orange-100",
  meterFill: "bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600",
  meterMarker: "text-orange-950",
  progressBar: "bg-orange-500",
  softBg: "bg-orange-50/95",
  softBorder: "border-orange-300/85",
  toneText: "text-orange-950",
  cta: "text-orange-800 decoration-orange-500/45 hover:text-orange-950",
  surfaceGlow: "from-orange-500/22 via-orange-400/8 to-transparent",
  accentBar: "before:bg-orange-500",
  articleBg: "border-2 border-orange-300/85 bg-orange-50/65",
  cardShell:
    "relative min-h-0 overflow-hidden rounded-2xl border-2 border-orange-300/90 bg-gradient-to-br from-orange-50/95 via-orange-50/55 to-white p-4 pl-5 shadow-[0_10px_36px_-14px_rgba(249,115,22,0.26),inset_0_1px_0_rgba(255,255,255,0.92)] transition-all duration-200 sm:p-5 sm:pl-6",
  cardShellHover:
    "hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-[0_20px_48px_-16px_rgba(249,115,22,0.3)] hover:ring-2 hover:ring-orange-400/25",
  metaCta: "font-bold text-orange-900",
  metaCtaHover: "group-hover:text-orange-950",
  metaCtaButton:
    "rounded-lg border-2 border-orange-300/90 bg-orange-50/95 px-3 py-1.5 text-orange-950 shadow-[0_4px_12px_rgba(249,115,22,0.14)]",
  metaCtaButtonHover:
    "group-hover:border-orange-400 group-hover:bg-orange-100 group-hover:shadow-[0_6px_16px_rgba(249,115,22,0.2)]",
  mobileDivider: "border-orange-300/70",
  metricCard: "rounded-xl border-2 border-orange-300/85 bg-gradient-to-br from-orange-50/90 to-white p-4 shadow-md",
  metricScoreText: "text-orange-950",
  heroGlow: "from-orange-400/35 via-orange-300/10 to-transparent",
  heroIconWrap:
    "border-2 border-orange-300/90 bg-gradient-to-br from-orange-100 to-orange-50 text-orange-900 shadow-[0_10px_28px_rgba(249,115,22,0.24)]",
  heroScoreRing:
    "border-[3px] border-orange-400/90 bg-gradient-to-b from-orange-100 via-white to-orange-50/80 text-orange-950 shadow-[0_12px_36px_rgba(249,115,22,0.26),inset_0_1px_0_rgba(255,255,255,0.95)]"
};

const DANGER_COLORS: TrustBandColors = {
  border: "border-2 border-rose-300/95",
  borderLeft: "before:bg-rose-500",
  icon: "text-rose-700",
  iconWrap:
    "border-2 border-rose-300/90 bg-gradient-to-br from-rose-100 to-rose-50 shadow-[0_8px_22px_rgba(244,63,94,0.24)] ring-1 ring-rose-200/70",
  scorePill:
    "border-2 border-rose-300/95 bg-gradient-to-b from-rose-100 via-rose-50 to-white text-rose-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_8px_24px_rgba(244,63,94,0.22)] ring-1 ring-rose-200/80",
  scorePillDim: "text-rose-700/90",
  surfaceBg: "bg-rose-50/50",
  surfaceGradient:
    "border-2 border-rose-300/90 bg-gradient-to-br from-rose-50/95 via-rose-50/45 to-white shadow-[0_12px_40px_-18px_rgba(244,63,94,0.32),inset_0_1px_0_rgba(255,255,255,0.9)]",
  headlineText: "text-rose-950",
  meterTrack: "bg-rose-100",
  meterFill: "bg-gradient-to-r from-rose-500 via-rose-500 to-rose-600",
  meterMarker: "text-rose-900",
  progressBar: "bg-rose-600",
  softBg: "bg-rose-50/95",
  softBorder: "border-rose-300/85",
  toneText: "text-rose-900",
  cta: "text-rose-800 decoration-rose-500/45 hover:text-rose-950",
  surfaceGlow: "from-rose-500/24 via-rose-400/8 to-transparent",
  accentBar: "before:bg-rose-500",
  articleBg: "border-2 border-rose-300/85 bg-rose-50/65",
  cardShell:
    "relative min-h-0 overflow-hidden rounded-2xl border-2 border-rose-300/90 bg-gradient-to-br from-rose-50/95 via-rose-50/55 to-white p-4 pl-5 shadow-[0_10px_36px_-14px_rgba(244,63,94,0.28),inset_0_1px_0_rgba(255,255,255,0.92)] transition-all duration-200 sm:p-5 sm:pl-6",
  cardShellHover:
    "hover:-translate-y-0.5 hover:border-rose-400 hover:shadow-[0_20px_48px_-16px_rgba(244,63,94,0.32)] hover:ring-2 hover:ring-rose-400/25",
  metaCta: "font-bold text-rose-900",
  metaCtaHover: "group-hover:text-rose-950",
  metaCtaButton:
    "rounded-lg border-2 border-rose-300/90 bg-rose-50/95 px-3 py-1.5 text-rose-950 shadow-[0_4px_12px_rgba(244,63,94,0.16)]",
  metaCtaButtonHover:
    "group-hover:border-rose-400 group-hover:bg-rose-100 group-hover:shadow-[0_6px_16px_rgba(244,63,94,0.22)]",
  mobileDivider: "border-rose-300/70",
  metricCard: "rounded-xl border-2 border-rose-300/85 bg-gradient-to-br from-rose-50/90 to-white p-4 shadow-md",
  metricScoreText: "text-rose-950",
  heroGlow: "from-rose-400/38 via-rose-300/10 to-transparent",
  heroIconWrap:
    "border-2 border-rose-300/90 bg-gradient-to-br from-rose-100 to-rose-50 text-rose-900 shadow-[0_10px_28px_rgba(244,63,94,0.26)]",
  heroScoreRing:
    "border-[3px] border-rose-400/90 bg-gradient-to-b from-rose-100 via-white to-rose-50/80 text-rose-950 shadow-[0_12px_36px_rgba(244,63,94,0.28),inset_0_1px_0_rgba(255,255,255,0.95)]"
};

/** Neutral chrome only when trust score is unknown — never for scored bands. */
const MISSING_SCORE_CHROME: OverviewCardChrome = {
  tone: "caution",
  accentBar: "before:bg-slate-400",
  surfaceGlow: "from-slate-400/12 via-blue-400/5 to-transparent",
  iconWrap: "border-2 border-slate-300/90 bg-gradient-to-br from-slate-100 to-slate-50 shadow-[0_6px_18px_rgba(100,116,139,0.16)]",
  icon: "text-slate-600",
  scorePill:
    "border-2 border-slate-300/90 bg-gradient-to-b from-slate-100 to-white text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_6px_18px_rgba(100,116,139,0.12)]",
  scorePillDim: "text-slate-500",
  cta: "text-slate-800 decoration-slate-400/45 hover:text-slate-950",
  headlineText: "text-slate-950",
  cardShell:
    "relative min-h-0 overflow-hidden rounded-2xl border-2 border-slate-300/85 bg-gradient-to-br from-slate-50/95 via-blue-50/25 to-white p-4 pl-5 shadow-[0_10px_32px_-14px_rgba(100,116,139,0.18),inset_0_1px_0_rgba(255,255,255,0.92)] transition-all duration-200 sm:p-5 sm:pl-6",
  cardShellHover:
    "hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-[0_18px_44px_-16px_rgba(100,116,139,0.22)] hover:ring-2 hover:ring-slate-300/30",
  metaCta: "font-bold text-slate-800",
  metaCtaHover: "group-hover:text-slate-950",
  metaCtaButton:
    "rounded-lg border-2 border-slate-300/90 bg-slate-50/95 px-3 py-1.5 text-slate-800 shadow-[0_4px_12px_rgba(100,116,139,0.1)]",
  metaCtaButtonHover:
    "group-hover:border-slate-400 group-hover:bg-slate-100 group-hover:shadow-[0_6px_16px_rgba(100,116,139,0.14)]",
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
