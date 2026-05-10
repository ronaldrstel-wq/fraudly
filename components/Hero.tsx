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
  const stepDescriptions = [
    "Enter any website URL to get started.",
    "We scan signals, blacklists, and data sources.",
    "Our AI evaluates risk and explains findings.",
    "Get a trust score and clear, actionable insights."
  ] as const;

  return (
    <section id="link-check" className="relative scroll-mt-20 overflow-hidden py-16 md:py-24">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_68%_55%_at_21%_12%,rgba(139,92,246,0.13),transparent_62%),radial-gradient(ellipse_62%_56%_at_78%_18%,rgba(56,189,248,0.12),transparent_64%),radial-gradient(ellipse_54%_46%_at_68%_58%,rgba(59,130,246,0.08),transparent_70%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-[5%] top-[9%] h-64 w-64 rounded-full bg-violet-400/15 blur-3xl md:h-80 md:w-80"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-[8%] top-[2%] h-56 w-56 rounded-full bg-cyan-300/12 blur-3xl md:h-72 md:w-72"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-[1400px] px-6 md:px-10">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14 xl:gap-16">
          <div className="w-full text-center lg:text-left">
            <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-violet-200/80 bg-gradient-to-r from-violet-100/95 via-cyan-100/85 to-blue-50/95 px-3 py-1 text-[11px] font-semibold tracking-wide text-slate-900 shadow-subtle md:mb-7 md:px-4">
              <SparkleGlyph className="h-3.5 w-3.5 shrink-0 text-violet-600" />
              {heroBadge}
            </div>

            <h1 className="mx-auto max-w-[12ch] text-balance font-black leading-[0.92] tracking-tight lg:mx-0 lg:max-w-[13ch]">
              <span className="block text-[clamp(2.55rem,6.2vw,4.55rem)] text-slate-950">
                See it. Check it.
              </span>
              <span className="hero-gradient-trust-it block pt-1 text-[clamp(2.55rem,6.2vw,4.55rem)]">
                Trust it.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-[620px] text-pretty text-base leading-relaxed text-slate-600 md:text-lg lg:mx-0">
              {subhead}
            </p>

            <ul
              className="mx-auto mt-7 grid max-w-[620px] grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:mx-0"
              aria-label="What Fraudly checks"
            >
              {heroTrustFeatures.map((label, i) => (
                <li
                  key={label}
                  className="fraudly-motion inline-flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/95 px-3 py-2 text-left text-xs font-semibold text-slate-800 shadow-subtle hover:-translate-y-[1px] hover:shadow-elevated"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-cyan-100 text-blue-800 ring-1 ring-slate-100/80">
                    {FEATURE_ICONS[i] ?? FEATURE_ICONS[0]}
                  </span>
                  <span className="leading-snug">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto mt-2 hidden w-full max-w-[640px] sm:flex lg:mt-0 lg:justify-end">
            <div
              className="pointer-events-none absolute -inset-12 bg-[radial-gradient(ellipse_at_50%_40%,rgba(56,189,248,0.24),transparent_62%),radial-gradient(ellipse_at_75%_70%,rgba(139,92,246,0.22),transparent_58%)] blur-3xl"
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

        <div className="mx-auto mt-10 w-full max-w-5xl md:mt-12">
          <URLInput
            value={url}
            onChange={onUrlChange}
            onSubmit={onSubmit}
            disabled={disabled}
            loading={loading}
            helperText={EN_MESSAGES.check.urlInputHelper}
            primaryCtaLabel={primaryCta}
            loadingLabel={EN_MESSAGES.scanProgress.phaseStart}
            variant="hero"
          />

          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500 sm:text-sm">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M10 2.5l5.5 2.5V9c0 3.3-2 6.3-5.5 7.5C6.5 15.3 4.5 12.3 4.5 9V5l5.5-2.5z" stroke="currentColor" strokeWidth="1.6" />
                <path d="m7.7 10 1.6 1.6 3-3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span>{heroSearchHelper}</span>
          </div>

          <div className="mt-4 flex justify-center">
            <Link
              href={secondaryCtaHref}
              className="fraudly-motion inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700 underline decoration-violet-500/35 underline-offset-4 hover:text-blue-700"
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

        <div className="mx-auto mt-8 max-w-6xl">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.11em] text-violet-600/90">How Fraudly Works</p>
          <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {heroHowSteps.map((step, idx) => (
              <li
                key={step}
                className="relative rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-subtle ring-1 ring-white/80"
              >
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-cyan-100 text-xs font-bold text-blue-700 ring-1 ring-slate-100">
                    {idx + 1}
                  </span>
                  <p className="text-sm font-semibold text-slate-900">{step}</p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{stepDescriptions[idx]}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
