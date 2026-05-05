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
    <section id="link-check" className="mx-auto w-full max-w-4xl scroll-mt-24 text-center">
      <div className="mx-auto mb-5 inline-flex items-center rounded-full border border-blue-100 bg-white px-4 py-1 text-xs font-semibold tracking-wide text-blue-700 shadow-sm">
        Free website trust &amp; scam signal check
      </div>

      <h1 className="text-balance text-4xl font-bold tracking-tight text-slate-900 md:text-6xl">
        Scam website checker:{" "}
        <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          check if a website is legit
        </span>
      </h1>

      <p className="mx-auto mt-5 max-w-2xl text-balance text-base text-slate-600 md:text-lg">
        A fast website safety checker for phishing links, fake webshops, and unknown online stores—clear risk indicators
        and trust signals before you click, log in, or pay.
      </p>

      <div className="mx-auto mt-8 max-w-3xl">
        <URLInput value={url} onChange={onUrlChange} onSubmit={onSubmit} disabled={disabled} loading={loading} />
        {authGate ? <div className="mt-4">{authGate}</div> : null}
        {loading && (
          <p className="mt-3 text-center text-sm text-slate-500" role="status" aria-live="polite">
            Checking website...
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-500">
        <span className="rounded-full bg-white px-3 py-1 shadow-sm">Website trust checker</span>
        <span className="rounded-full bg-white px-3 py-1 shadow-sm">Results in seconds</span>
        <span className="rounded-full bg-white px-3 py-1 shadow-sm">Evidence + optional summary</span>
      </div>
    </section>
  );
}
