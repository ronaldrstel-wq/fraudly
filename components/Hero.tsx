import { URLInput } from "@/components/URLInput";

interface HeroProps {
  url: string;
  onUrlChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  disabled: boolean;
}

export function Hero({ url, onUrlChange, onSubmit, loading, disabled }: HeroProps) {
  return (
    <section id="link-check" className="mx-auto w-full max-w-4xl scroll-mt-24 text-center">
      <div className="mx-auto mb-5 inline-flex items-center rounded-full border border-blue-100 bg-white px-4 py-1 text-xs font-semibold tracking-wide text-blue-700 shadow-sm">
        AI-Powered Scam Detection
      </div>

      <h1 className="text-balance text-4xl font-bold tracking-tight text-slate-900 md:text-6xl">
        Know{" "}
        <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">before</span>{" "}
        you click.
      </h1>

      <p className="mx-auto mt-5 max-w-2xl text-balance text-base text-slate-600 md:text-lg">
        Fraudly analyzes links in seconds and helps you avoid scams, fake stores, and phishing sites.
      </p>

      <div className="mx-auto mt-8 max-w-3xl">
        <URLInput value={url} onChange={onUrlChange} onSubmit={onSubmit} disabled={disabled} loading={loading} />
        {loading && (
          <p className="mt-3 text-center text-sm text-slate-500" role="status" aria-live="polite">
            Analyzing link...
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-500">
        <span className="rounded-full bg-white px-3 py-1 shadow-sm">No sign-up required</span>
        <span className="rounded-full bg-white px-3 py-1 shadow-sm">Checks in seconds</span>
        <span className="rounded-full bg-white px-3 py-1 shadow-sm">Powered by AI</span>
      </div>
    </section>
  );
}
