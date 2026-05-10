import type { ReactNode } from "react";
import Link from "next/link";
import { URLInput } from "@/components/URLInput";
import { WebsiteScanProgress } from "@/components/WebsiteScanProgress";
import { HeroTrustIllustration } from "@/components/HeroTrustIllustration";
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
    <section id="link-check" className="relative scroll-mt-20 overflow-hidden pb-10 pt-8 sm:pb-12 sm:pt-10 md:pt-14">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 min-h-[22rem] bg-[radial-gradient(ellipse_85%_55%_at_50%_-8%,rgba(56,189,248,0.14),transparent_58%),radial-gradient(ellipse_55%_40%_at_92%_12%,rgba(139,92,246,0.1),transparent_52%),radial-gradient(ellipse_50%_36%_at_8%_28%,rgba(59,130,246,0.09),transparent_48%)]"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-7xl px-4">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] lg:gap-14 xl:gap-16">
          <div className="mx-auto w-full max-w-xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200/70 bg-gradient-to-r from-violet-100/85 via-cyan-100/65 to-blue-50/90 px-3.5 py-1 text-xs font-semibold tracking-wide text-blue-950 shadow-subtle backdrop-blur-sm sm:mb-6 sm:px-4">
              <SparkleGlyph className="h-4 w-4 shrink-0 text-violet-600" />
              {heroBadge}
            </div>

            <h1 className="text-balance font-black leading-[1.08] tracking-tight">
              <span className="block text-[clamp(1.875rem,calc(1.1rem+3.8vw),3.125rem)] text-slate-900 sm:inline sm:text-[clamp(2.125rem,calc(1.2rem+3.5vw),3.375rem)]">
                See it. Check it.{" "}
              </span>
              <span className="block pt-1 text-[clamp(1.875rem,calc(1.1rem+3.8vw),3.125rem)] hero-gradient-trust-it sm:inline sm:pt-0 sm:text-[clamp(2.125rem,calc(1.2rem+3.5vw),3.375rem)]">
                Trust it.
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-slate-600 sm:mt-5 sm:text-[16px] md:text-[17px] lg:mx-0 lg:max-w-[28rem]">
              {subhead}
            </p>

            <ul
              className="mx-auto mt-6 flex max-w-xl flex-wrap justify-center gap-2 sm:mt-8 sm:gap-2.5 lg:mx-0 lg:max-w-none lg:justify-start"
              aria-label="What Fraudly checks"
            >
              {heroTrustFeatures.map((label, i) => (
                <li
                  key={label}
                  className="inline-flex max-w-[100%] items-center gap-2 rounded-full border border-slate-200/60 bg-white/80 px-3 py-1.5 text-left text-[11px] font-semibold text-slate-800 shadow-subtle backdrop-blur-sm sm:text-xs"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100/90 to-cyan-100/80 text-blue-800 ring-1 ring-white/70">
                    {FEATURE_ICONS[i] ?? FEATURE_ICONS[0]}
                  </span>
                  <span className="leading-snug">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <HeroTrustIllustration />
        </div>

        <div className="mx-auto mt-10 w-full max-w-3xl sm:mt-11 lg:-mt-2 lg:max-w-5xl xl:max-w-6xl xl:mt-12">
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
            className="mx-auto mt-5 flex list-none flex-wrap items-center justify-center gap-x-2 gap-y-2 p-0 lg:justify-start xl:gap-x-3"
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

          <div className="mt-4 flex justify-center sm:mt-5 lg:justify-start">
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
          {extraBelowInput ? <div className="mt-4 max-w-none text-left">{extraBelowInput}</div> : null}
          {authGate ? <div className="mt-4 sm:mt-5">{authGate}</div> : null}
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
