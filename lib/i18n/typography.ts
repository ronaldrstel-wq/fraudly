import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";

/** NL / DE / FR copy tends to run longer than English. */
export function usesCompactCopy(locale: Locale): boolean {
  return locale !== DEFAULT_LOCALE;
}

/** Homepage hero lines (shared sizing for all three lines). */
export function marketingHeroTitleSizeClass(locale: Locale): string {
  if (!usesCompactCopy(locale)) {
    return "text-[50px] leading-[0.92] md:text-[64px] lg:text-[72px] xl:text-[88px]";
  }
  return [
    "text-[clamp(2rem,6.5vw,2.85rem)] leading-[0.96]",
    "sm:text-[clamp(2.25rem,5.5vw,3.25rem)] sm:leading-[0.95]",
    "md:text-[clamp(2.5rem,4.5vw,3.75rem)]",
    "lg:text-[clamp(2.85rem,3.8vw,4.25rem)]",
    "xl:text-[4.25rem]"
  ].join(" ");
}

/** Standard marketing page H1 (about, support, scam alerts, …). */
export function marketingPageH1Class(
  locale: Locale,
  emphasis: "default" | "large" = "default"
): string {
  const base = "text-balance font-bold tracking-tight text-slate-900";
  if (!usesCompactCopy(locale)) {
    return emphasis === "large"
      ? `${base} text-3xl md:text-5xl`
      : `${base} text-3xl md:text-4xl`;
  }
  return emphasis === "large"
    ? `${base} text-2xl sm:text-3xl md:text-4xl md:leading-[1.12]`
    : `${base} text-2xl sm:text-3xl md:text-[2rem] md:leading-tight`;
}

/** Desktop center nav link row. */
export function marketingNavRowClass(locale: Locale): string {
  return usesCompactCopy(locale)
    ? "hidden min-w-0 flex-1 items-center justify-center gap-x-4 text-xs font-medium text-slate-600 md:flex md:gap-x-5 lg:text-sm"
    : "hidden min-w-0 flex-1 items-center justify-center gap-6 text-sm font-medium text-slate-600 md:flex";
}

/** Navbar primary scan CTA — visually dominant beside auth controls. */
export function marketingNavScanCtaClass(locale: Locale): string {
  const shared =
    "fraudly-motion fraudly-focus-on-white inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:brightness-110 active:scale-[0.98]";
  return usesCompactCopy(locale)
    ? `${shared} max-w-[9.5rem] px-3 py-2 text-center text-xs leading-snug sm:max-w-none sm:px-4 sm:text-sm`
    : `${shared} px-4 py-2.5 text-sm`;
}

/** Navbar auth CTAs — tighter on NL/DE/FR to avoid overflow beside the language control. */
export function marketingAuthButtonClass(locale: Locale, variant: "secondary" | "primary"): string {
  const base = variant === "secondary" ? "btn-secondary" : "btn-primary";
  return usesCompactCopy(locale)
    ? `${base} fraudly-motion max-w-full px-2.5 py-2 text-center text-xs leading-snug sm:px-3 sm:text-sm`
    : `${base} fraudly-motion px-3 sm:px-4`;
}

export function marketingNavLinkClass(locale: Locale): string {
  return usesCompactCopy(locale) ? "fraudly-nav-link text-center leading-snug" : "fraudly-nav-link";
}

/** Hero / page eyebrow pill. */
export function marketingBadgeClass(locale: Locale): string {
  const shared =
    "inline-flex max-w-full items-center rounded-full border border-blue-100 bg-white font-semibold tracking-wide text-blue-700 shadow-sm";
  return usesCompactCopy(locale)
    ? `${shared} px-3.5 py-1.5 text-center text-[10px] leading-snug sm:text-xs`
    : `${shared} px-4 py-1 text-xs`;
}

/** Hero homepage badge (gradient pill). */
export function marketingHeroBadgeClass(locale: Locale): string {
  const shared =
    "inline-flex max-w-full items-center gap-1.5 rounded-full border border-violet-200/80 bg-gradient-to-r from-violet-100/95 via-cyan-100/85 to-blue-50/95 font-semibold text-slate-900 shadow-subtle";
  return usesCompactCopy(locale)
    ? `mb-5 ${shared} px-3 py-1.5 text-center text-[10px] leading-snug tracking-wide md:mb-7 md:px-4 md:text-[11px]`
    : `mb-5 ${shared} px-3 py-1 text-[11px] tracking-wide md:mb-7 md:px-4`;
}

/** Gradient primary CTA on marketing pages. */
export function marketingPrimaryCtaClass(locale: Locale): string {
  const shared =
    "rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 font-semibold text-white shadow-lg shadow-blue-500/25 transition duration-200 hover:brightness-110 active:scale-[0.98]";
  return usesCompactCopy(locale)
    ? `inline-flex max-w-full items-center justify-center ${shared} px-5 py-3 text-center text-sm leading-snug sm:px-6`
    : `inline-flex ${shared} px-6 py-3 text-sm hover:scale-[1.02]`;
}

/** Homepage scan card primary button. */
export function homeScanCtaButtonClass(locale: Locale): string {
  const base =
    "fraudly-motion fraudly-focus-on-white group inline-flex h-16 min-h-[4rem] w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 transition hover:scale-[1.01] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto";
  return usesCompactCopy(locale)
    ? `${base} max-w-full px-4 text-sm font-bold leading-snug sm:min-w-[10.5rem] sm:px-6 sm:text-base lg:min-w-[12.5rem]`
    : `${base} px-8 text-base font-bold sm:min-w-[220px]`;
}

/** Homepage trust-feature pills (longer copy on NL/DE/FR). */
export function marketingHeroTrustPillClass(locale: Locale): string {
  const shared =
    "fraudly-motion inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200/80 bg-white/95 text-left font-semibold text-slate-800 shadow-subtle hover:-translate-y-[1px] hover:shadow-elevated";
  return usesCompactCopy(locale)
    ? `${shared} px-3 py-2 text-[11px] leading-snug sm:px-3.5 sm:text-xs`
    : `${shared} px-3.5 py-2 text-xs`;
}

/** “How it works” section label on homepage hero. */
export function marketingSectionEyebrowClass(locale: Locale): string {
  return usesCompactCopy(locale)
    ? "mb-3 text-center text-[10px] font-semibold uppercase leading-snug tracking-[0.1em] text-violet-600/90 sm:text-xs sm:tracking-[0.11em]"
    : "mb-3 text-center text-xs font-semibold uppercase tracking-[0.11em] text-violet-600/90";
}

/** Footer link row — slightly tighter on localized locales. */
export function marketingFooterNavClass(locale: Locale): string {
  return usesCompactCopy(locale)
    ? "flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-sm"
    : "flex flex-wrap items-center justify-center gap-x-6 gap-y-2";
}
