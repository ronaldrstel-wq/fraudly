import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { URLInput } from "@/components/URLInput";
import { WebsiteScanProgress } from "@/components/WebsiteScanProgress";
import { EN_MESSAGES } from "@/lib/messages.en";

const home = EN_MESSAGES.home;

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
  url: string;
  onUrlChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  disabled: boolean;
  scanProgress: number;
  scanStatus: string;
  scanFailed?: boolean;
  authGate?: ReactNode;
  extraBelowInput?: ReactNode;
}

export function Hero({
  url,
  onUrlChange,
  onSubmit,
  loading,
  disabled,
  scanProgress,
  scanStatus,
  scanFailed = false,
  authGate,
  extraBelowInput
}: HeroProps) {
  const {
    heroBadge,
    subhead,
    heroTrustFeatures,
    heroHowSteps,
    primaryCta,
    secondaryCta,
    secondaryCtaHref,
    heroSearchHelper
  } = home;

  return (
    <section id="link-check" className="relative scroll-mt-20 overflow-hidden pb-7 pt-6 sm:pb-9 sm:pt-8 md:pt-10">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 min-h-[17rem] bg-[radial-gradient(ellipse_76%_50%_at_52%_-10%,rgba(56,189,248,0.12),transparent_58%),radial-gradient(ellipse_38%_30%_at_88%_12%,rgba(139,92,246,0.08),transparent_56%)]"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-7xl px-4">
        <div className="grid items-center gap-6 md:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.88fr)] lg:gap-10 xl:gap-12">
          <div className="mx-auto w-full max-w-xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-violet-200/80 bg-gradient-to-r from-violet-100/95 via-cyan-100/85 to-blue-50/95 px-3 py-1 text-[11px] font-semibold tracking-wide text-slate-900 shadow-subtle sm:mb-5 sm:px-3.5 sm:text-xs">
              <SparkleGlyph className="h-3.5 w-3.5 shrink-0 text-violet-600" />
              {heroBadge}
            </div>

            <h1 className="max-w-[14ch] text-balance font-black leading-[0.95] tracking-tight">
              <span className="block text-[clamp(1.875rem,calc(1.18rem+2.5vw),2.65rem)] text-slate-950 sm:text-[clamp(2.05rem,calc(1.2rem+2vw),3rem)]">
                See it. Check it.
              </span>
              <span className="hero-gradient-trust-it block pt-0.5 text-[clamp(1.875rem,calc(1.18rem+2.5vw),2.65rem)] sm:text-[clamp(2.05rem,calc(1.2rem+2vw),3rem)]">
                Trust it.
              </span>
            </h1>

            <p className="mx-auto mt-3.5 max-w-xl text-pretty text-[15px] leading-relaxed text-slate-700 sm:mt-4 sm:text-[15px] md:text-[16px] lg:mx-0 lg:max-w-[35rem]">
              {subhead}
            </p>

            <ul
              className="mx-auto mt-5 flex max-w-2xl flex-wrap justify-center gap-1.5 sm:mt-6 sm:gap-2 lg:mx-0 lg:justify-start"
              aria-label="What Fraudly checks"
            >
              {heroTrustFeatures.map((label, i) => (
                <li
                  key={label}
                  className="fraudly-motion inline-flex max-w-[100%] items-center gap-1.5 rounded-full border border-slate-200/70 bg-white/90 px-2.5 py-1 text-left text-[11px] font-semibold text-slate-800 shadow-subtle hover:border-slate-300/85 hover:bg-white sm:text-[11px]"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100/95 to-cyan-100/90 text-blue-800 ring-1 ring-white/80">
                    {FEATURE_ICONS[i] ?? FEATURE_ICONS[0]}
                  </span>
                  <span className="leading-snug">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto hidden w-full max-w-[260px] justify-center sm:flex sm:max-w-[min(88vw,20rem)] md:max-w-[min(88vw,24rem)] lg:mx-0 lg:max-w-[min(100%,35rem)] lg:justify-end xl:max-w-[36rem]">
            {/* Soft halo — ties illustration into Fraudly cyan / violet */}
            <div
              className="pointer-events-none absolute -inset-3 rounded-[1.6rem] bg-[radial-gradient(ellipse_at_50%_40%,rgba(56,189,248,0.14),transparent_64%),radial-gradient(ellipse_at_80%_70%,rgba(139,92,246,0.12),transparent_58%)] blur-xl"
              aria-hidden
            />
            <div className="relative rounded-[1.65rem] bg-gradient-to-br from-white via-cyan-50/30 to-violet-50/35 p-1.5 shadow-[0_20px_52px_-34px_rgb(79_70_229_/_0.16),0_12px_28px_-22px_rgb(14_165_233_/_0.11)] ring-1 ring-slate-100/95 sm:p-2 lg:p-2.5">
              <div className="overflow-hidden rounded-[1.2rem] ring-1 ring-slate-200/65 shadow-[0_12px_28px_-20px_rgba(15,23,42,0.35)]">
                <Image
                  src="/images/fraudly-hero-trust-visual.png"
                  alt="Fraudly website trust analysis illustration"
                  width={1536}
                  height={1024}
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 600px"
                  className="h-auto w-full object-cover contrast-[1.04] saturate-[1.03]"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-6 w-full max-w-3xl sm:mt-7 lg:mt-8 lg:max-w-5xl xl:max-w-6xl">
          <URLInput
            value={url}
            onChange={onUrlChange}
            onSubmit={onSubmit}
            disabled={disabled}
            loading={loading}
            helperText={heroSearchHelper}
            primaryCtaLabel={primaryCta}
            loadingLabel={EN_MESSAGES.scanProgress.phaseStart}
            variant="hero"
          />
          <ol
            aria-label="How Fraudly analyzes a URL"
            className="mx-auto mt-4 flex list-none flex-wrap items-center justify-center gap-x-2 gap-y-1.5 p-0 lg:justify-start xl:gap-x-2.5"
          >
            {heroHowSteps.map((step, idx) => (
              <li key={step} className="flex items-center gap-1.5">
                <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white shadow-subtle ring-1 ring-slate-800/80 sm:text-[11px]">
                  {idx + 1}
                </span>
                <span className="text-[11px] font-semibold text-slate-700 sm:text-xs">{step}</span>
                {idx < heroHowSteps.length - 1 ? (
                  <span className="px-0.5 text-slate-300 sm:px-1" aria-hidden="true">
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>

          <div className="mt-3.5 flex justify-center sm:mt-4 lg:justify-start">
            <Link
              href={secondaryCtaHref}
              className="fraudly-motion inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 underline decoration-blue-600/35 underline-offset-4 hover:text-violet-800"
            >
              {secondaryCta}
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M4 10h11M11 6l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
          {extraBelowInput ? <div className="mt-3.5 max-w-none text-left">{extraBelowInput}</div> : null}
          {authGate ? <div className="mt-3.5 sm:mt-4">{authGate}</div> : null}
          {loading ? (
            <div className="mt-6">
              <WebsiteScanProgress progress={scanProgress} status={scanStatus} failed={scanFailed} />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
