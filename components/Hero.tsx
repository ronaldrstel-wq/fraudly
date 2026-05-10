import type { ReactNode } from "react";
import Link from "next/link";
import { URLInput } from "@/components/URLInput";
import { WebsiteScanProgress } from "@/components/WebsiteScanProgress";
import { EN_MESSAGES } from "@/lib/messages.en";

const home = EN_MESSAGES.home;

interface HeroProps {
  url: string;
  onUrlChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  disabled: boolean;
  /** 0–100 while a check is in progress (or 100 briefly at completion). */
  scanProgress: number;
  scanStatus: string;
  scanFailed?: boolean;
  /** Shown when the user must sign in before running a check (e.g. Clerk gate). */
  authGate?: ReactNode;
  /** Optional controls below the URL field (e.g. screenshot / ad context). */
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
  const { heroBadge, headline, subhead, trustBullets, primaryCta, secondaryCta, secondaryCtaHref, trustHelperBelowSearch } = home;

  return (
    <section id="link-check" className="mx-auto w-full max-w-4xl scroll-mt-20 text-center">
      <div className="mx-auto mb-2.5 inline-flex items-center rounded-full border border-blue-100 bg-white px-3.5 py-1 text-xs font-semibold tracking-wide text-blue-700 shadow-sm sm:mb-3 sm:px-4">
        {heroBadge}
      </div>

      <div className="mx-auto w-full max-w-[900px] px-3 sm:px-4">
        <h1 className="text-balance text-center font-black leading-[1.12] tracking-tight text-slate-900 [font-size:clamp(1.625rem,calc(0.95rem+3.2vw),2.625rem)] sm:leading-[1.1]">
          {headline}
        </h1>
      </div>

      <p className="mx-auto mt-3 max-w-2xl text-pretty text-[15px] leading-relaxed text-slate-600 sm:mt-4 md:text-[17px]">
        {subhead}
      </p>

      <ul className="mx-auto mt-4 grid max-w-lg gap-2 text-left text-sm leading-snug text-slate-700 sm:mt-5 sm:text-[15px]">
        {trustBullets.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="mt-[3px] shrink-0 text-emerald-600" aria-hidden>
              ✓
            </span>
            <span className="leading-relaxed">{line}</span>
          </li>
        ))}
      </ul>

      <div className="mx-auto mt-4 max-w-3xl sm:mt-5">
        <URLInput
          value={url}
          onChange={onUrlChange}
          onSubmit={onSubmit}
          disabled={disabled}
          loading={loading}
          helperText={EN_MESSAGES.check.urlInputHelper}
          primaryCtaLabel={primaryCta}
          loadingLabel={EN_MESSAGES.scanProgress.phaseStart}
        />
        <div className="mt-2.5 flex justify-center sm:mt-3">
          <Link
            href={secondaryCtaHref}
            className="text-sm font-semibold text-blue-700 underline decoration-blue-600/35 underline-offset-2 transition hover:text-blue-900"
          >
            {secondaryCta}
          </Link>
        </div>
        {extraBelowInput ? <div className="mt-3.5 text-left">{extraBelowInput}</div> : null}
        {authGate ? <div className="mt-2.5 sm:mt-3">{authGate}</div> : null}
        {loading ? (
          <WebsiteScanProgress progress={scanProgress} status={scanStatus} failed={scanFailed} />
        ) : null}
      </div>

      <p className="mx-auto mt-3.5 max-w-xl px-1 text-pretty text-xs leading-relaxed text-slate-500 sm:mt-4.5 sm:text-sm">
        {trustHelperBelowSearch}
      </p>
    </section>
  );
}
