"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  marketingHeroBadgeClass,
  marketingHeroTitleSizeClass,
  marketingHeroTrustPillClass,
  marketingSectionEyebrowClass
} from "@/lib/i18n/typography";
import type { Dictionary } from "@/lib/i18n/dictionary-types";
import type { Locale } from "@/lib/i18n/locales";
import type { HomeSearchCardState } from "@/lib/scan/homeScanProgress";
import type { CheckFlowSearchCopy } from "@/components/home/WebsiteScanSearchCard";

const WebsiteScanSearchCard = dynamic(
  () => import("@/components/home/WebsiteScanSearchCard").then((m) => ({ default: m.WebsiteScanSearchCard })),
  {
  loading: () => (
    <div
      className="mx-auto w-full max-w-6xl rounded-3xl border border-slate-200/70 bg-white p-5 shadow-lg shadow-slate-200/60 sm:p-6"
      aria-hidden
    >
      <div className="mb-3 h-4 max-w-md animate-pulse rounded bg-slate-100 sm:w-2/3" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <div className="h-16 min-h-[4rem] flex-1 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-16 min-h-[4rem] w-full shrink-0 animate-pulse rounded-2xl bg-slate-200/70 sm:min-w-[220px]" />
      </div>
    </div>
  )
  }
);

function SparkleGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10 2.5l1.05 4.74L15.79 10l-4.74 2.76L10 17.5l-1.05-4.74L4.21 10l4.74-2.76L10 2.5z" />
      <circle cx="14.75" cy="4.75" r="1.65" opacity="0.7" />
    </svg>
  );
}

const FEATURE_ICONS = [
  <svg key="s" className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 21s-8-4.43-8-11c0-1.94 1.17-4.54 8-9 6.83 4.46 8 7.06 8 9 0 6.57-8 11-8 11zm0-17v6l3 3"
    />
  </svg>,
  <svg key="r" className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21H3M18 21V12M12 21V8M6 21v-9"
    />
  </svg>,
  <svg key="d" className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
    <path stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" d="M12 8v5l3 3" />
  </svg>,
  <svg key="a" className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13 2 3 14h9l-1 10 10-12h-9l1-10z"
    />
  </svg>
] as const;

interface HeroProps {
  locale: Locale;
  homepage: Dictionary["homepage"];
  checkFlowSearch: CheckFlowSearchCopy;
  url: string;
  onUrlChange: (value: string) => void;
  onSubmit: () => void;
  searchState: HomeSearchCardState;
  disabled: boolean;
  scanProgress: number;
  scanStatus: string;
  scanFailed?: boolean;
  checkedLabel?: string | null;
  isAdmin?: boolean;
  authGate?: ReactNode;
  /** Renders directly under the search/progress card (e.g. scan result). */
  belowSearchCard?: ReactNode;
  extraBelowInput?: ReactNode;
}

export function Hero({
  locale,
  homepage: hp,
  checkFlowSearch,
  url,
  onUrlChange,
  onSubmit,
  searchState,
  disabled,
  scanProgress,
  scanStatus,
  scanFailed = false,
  checkedLabel = null,
  isAdmin = false,
  authGate,
  belowSearchCard,
  extraBelowInput
}: HeroProps) {
  const heroTitleSize = marketingHeroTitleSizeClass(locale);
  const {
    heroBadge,
    subhead,
    heroTrustFeatures,
    primaryCta,
    heroSearchHelper
  } = {
    heroBadge: hp.heroBadge,
    subhead: hp.heroSubtitle,
    heroTrustFeatures: hp.heroTrustFeatures,
    primaryCta: hp.primaryCta,
    heroSearchHelper: hp.heroSearchHelper
  };
  const howSteps = hp.howItWorksSteps;

  return (
    <section id="link-check" className="relative scroll-mt-20 overflow-hidden pb-16 pt-2 lg:pb-20 lg:pt-3">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_66%_52%_at_23%_15%,rgba(139,92,246,0.09),transparent_65%),radial-gradient(ellipse_58%_50%_at_79%_19%,rgba(56,189,248,0.1),transparent_67%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-[8%] top-[10%] h-52 w-52 rounded-full bg-violet-400/10 blur-3xl md:h-64 md:w-64"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-[9%] top-[4%] h-48 w-48 rounded-full bg-cyan-300/10 blur-3xl md:h-56 md:w-56"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-[1400px] px-6 md:px-10">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 xl:gap-20">
          <div className="w-full text-center lg:text-left">
            <div className={marketingHeroBadgeClass(locale)}>
              <SparkleGlyph className="h-3.5 w-3.5 shrink-0 text-violet-600" />
              {heroBadge}
            </div>

            <h1 className="mx-auto -mt-1 max-w-[760px] text-balance font-black tracking-[-0.04em] lg:-mt-2 lg:mx-0">
              <span className={`block text-slate-950 ${heroTitleSize}`}>
                {hp.heroTitleLine1} {hp.heroTitleLine2}
              </span>
              <span className={`hero-gradient-trust-it block pt-1 ${heroTitleSize}`}>
                {hp.heroTitleLine3}
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-[620px] text-pretty text-base leading-relaxed text-slate-600 md:text-lg lg:mx-0">
              {subhead}
            </p>

          </div>

          <div className="relative mx-auto mt-0 hidden w-full max-w-[620px] sm:flex lg:-mt-4 lg:w-full lg:max-w-[620px] lg:translate-x-4 lg:justify-end">
            <div
              className="pointer-events-none absolute -inset-8 bg-[radial-gradient(ellipse_at_50%_40%,rgba(56,189,248,0.2),transparent_62%),radial-gradient(ellipse_at_75%_70%,rgba(139,92,246,0.17),transparent_60%)] blur-2xl"
              aria-hidden
            />
            <div className="relative w-full max-w-[620px]">
              <div className="overflow-hidden rounded-[30px] shadow-[0_36px_70px_-36px_rgba(79,70,229,0.42),0_20px_44px_-32px_rgba(14,165,233,0.34)]">
                <Image
                  src="/images/fraudly-hero-trust-visual.png"
                  alt="Fraudly website trust analysis illustration"
                  width={1536}
                  height={1024}
                  sizes="(max-width: 640px) 88vw, (max-width: 1024px) 52vw, 640px"
                  className="h-auto w-full object-cover contrast-[1.07] saturate-[1.05]"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        <ul
          className="mx-auto mt-6 grid w-full max-w-6xl grid-cols-1 justify-items-center gap-3 sm:mt-7 md:mt-8 md:grid-cols-2 md:justify-items-stretch md:gap-4 lg:mt-9 lg:grid-cols-4 lg:gap-4 xl:max-w-[1200px] xl:gap-5"
          aria-label="What Fraudly checks"
        >
          {heroTrustFeatures.map((label, i) => (
            <li key={label} className={`w-full max-w-md md:max-w-none ${marketingHeroTrustPillClass(locale)}`}>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-cyan-100 text-blue-800 ring-1 ring-slate-100/80">
                {FEATURE_ICONS[i] ?? FEATURE_ICONS[0]}
              </span>
              <span className="leading-snug">{label}</span>
            </li>
          ))}
        </ul>

        <div className="mx-auto mt-10 w-full md:mt-11">
          <WebsiteScanSearchCard
            checkFlowSearch={checkFlowSearch}
            state={searchState}
            value={url}
            onChange={onUrlChange}
            onSubmit={onSubmit}
            disabled={disabled}
            primaryCtaLabel={primaryCta}
            compactCta={locale !== "en"}
            scanProgress={scanProgress}
            scanStatus={scanStatus}
            scanFailed={scanFailed}
            checkedLabel={checkedLabel}
          />

          {belowSearchCard ? (
            <div id="home-scan-results" className="mt-5 w-full sm:mt-6">
              {belowSearchCard}
            </div>
          ) : null}

          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500 sm:text-sm">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M10 2.5l5.5 2.5V9c0 3.3-2 6.3-5.5 7.5C6.5 15.3 4.5 12.3 4.5 9V5l5.5-2.5z" stroke="currentColor" strokeWidth="1.6" />
                <path d="m7.7 10 1.6 1.6 3-3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span>{heroSearchHelper}</span>
            {isAdmin ? (
              <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                Admin
              </span>
            ) : null}
          </div>

          {extraBelowInput ? <div className="mt-3 max-w-none text-left">{extraBelowInput}</div> : null}
          {authGate ? <div className="mt-3 sm:mt-3.5">{authGate}</div> : null}
        </div>

        <div className="mx-auto mt-8 max-w-6xl">
          <p className={marketingSectionEyebrowClass(locale)}>{hp.howItWorksTitle}</p>
          <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {howSteps.map((step, idx) => (
              <li
                key={step.title}
                className="relative rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-subtle ring-1 ring-white/80"
              >
                <div className="flex items-start gap-2.5">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-cyan-100 text-xs font-bold text-blue-700 ring-1 ring-slate-100">
                    {idx + 1}
                  </span>
                  <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-slate-900">{step.title}</p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
