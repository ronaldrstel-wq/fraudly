import type { ReactNode } from "react";
import { URLInput } from "@/components/URLInput";
import { WebsiteScanProgress } from "@/components/WebsiteScanProgress";

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
  return (
    <section id="link-check" className="mx-auto w-full max-w-4xl scroll-mt-20 text-center">
      <div className="mx-auto mb-2.5 inline-flex items-center rounded-full border border-blue-100 bg-white px-3.5 py-1 text-xs font-semibold tracking-wide text-blue-700 shadow-sm sm:mb-3 sm:px-4">
        Free website trust &amp; scam signal check
      </div>

      <div className="mx-auto w-full max-w-[900px] px-3 sm:px-4">
        <h1 className="text-center font-extrabold leading-[1.08] tracking-tight text-slate-900 [font-size:clamp(1.625rem,calc(0.8rem+4vw),3.5rem)] sm:font-black">
          <span className="block">Scam website checker:</span>
          <span className="mt-[0.06em] block overflow-visible pb-[0.05em] leading-[1.1] font-extrabold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent sm:font-black">
            check if a website is legit
          </span>
        </h1>
      </div>

      <p className="mx-auto mt-2.5 max-w-2xl text-pretty text-base leading-relaxed text-slate-600 sm:mt-3.5 md:text-lg">
        Check websites for phishing risks, fake stores, suspicious patterns, and trust signals before you click or buy.
      </p>

      <div className="mx-auto mt-3.5 max-w-3xl sm:mt-4">
        <URLInput value={url} onChange={onUrlChange} onSubmit={onSubmit} disabled={disabled} loading={loading} />
        {extraBelowInput ? <div className="mt-4 text-left">{extraBelowInput}</div> : null}
        {authGate ? <div className="mt-2.5 sm:mt-3">{authGate}</div> : null}
        {loading ? (
          <WebsiteScanProgress progress={scanProgress} status={scanStatus} failed={scanFailed} />
        ) : null}
      </div>

      <p className="mx-auto mt-3.5 max-w-2xl px-1 text-pretty text-xs leading-relaxed text-slate-500 sm:mt-4.5 sm:text-sm">
        Fraudly combines technical checks, public threat intelligence, and on-page trust signals. Uses signals from domain
        records, SSL checks, and public phishing intelligence—where those sources are available for your link.
      </p>

      <div className="mx-auto mt-2.5 flex max-w-3xl flex-wrap items-center justify-center gap-2 sm:mt-3.5 sm:gap-2.5">
        <span className="rounded-full border border-slate-100 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm sm:text-sm">
          Domain age analysis
        </span>
        <span className="rounded-full border border-slate-100 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm sm:text-sm">
          Phishing database checks
        </span>
        <span className="rounded-full border border-slate-100 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm sm:text-sm">
          SSL &amp; trust signals
        </span>
      </div>
    </section>
  );
}
