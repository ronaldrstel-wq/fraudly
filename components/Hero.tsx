import type { ReactNode } from "react";
import { URLInput } from "@/components/URLInput";

interface HeroProps {
  url: string;
  onUrlChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  disabled: boolean;
  /** Shown when the user must sign in before running a check (e.g. Clerk gate). */
  authGate?: ReactNode;
}

export function Hero({ url, onUrlChange, onSubmit, loading, disabled, authGate }: HeroProps) {
  return (
    <section id="link-check" className="mx-auto w-full max-w-4xl scroll-mt-20 text-center">
      <div className="mx-auto mb-3 inline-flex items-center rounded-full border border-blue-100 bg-white px-3.5 py-1 text-xs font-semibold tracking-wide text-blue-700 shadow-sm sm:mb-4 sm:px-4">
        Free website trust &amp; scam signal check
      </div>

      <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl md:text-5xl lg:text-6xl">
        Scam website checker:{" "}
        <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          check if a website is legit
        </span>
      </h1>

      <p className="mx-auto mt-3 max-w-2xl text-pretty text-base leading-relaxed text-slate-600 sm:mt-4 md:text-lg">
        Check websites for phishing risks, fake stores, suspicious patterns, and trust signals before you click or buy.
      </p>

      <div className="mx-auto mt-4 max-w-3xl sm:mt-5">
        <URLInput value={url} onChange={onUrlChange} onSubmit={onSubmit} disabled={disabled} loading={loading} />
        {authGate ? <div className="mt-2.5 sm:mt-3">{authGate}</div> : null}
        {loading && (
          <p className="mt-2 text-center text-sm text-slate-500" role="status" aria-live="polite">
            Checking website...
          </p>
        )}
      </div>

      <p className="mx-auto mt-4 max-w-2xl text-pretty px-1 text-xs leading-relaxed text-slate-500 sm:mt-5 sm:text-sm">
        Fraudly combines technical checks, public threat intelligence, and on-page trust signals. Uses signals from domain
        records, SSL checks, and public phishing intelligence—where those sources are available for your link.
      </p>

      <div className="mx-auto mt-3 flex max-w-3xl flex-wrap items-center justify-center gap-2 sm:mt-4 sm:gap-2.5">
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
