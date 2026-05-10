/**
 * Lightweight CSS-only decorative visual for the homepage hero (no image assets).
 */

function ShieldGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21s-8-4.43-8-11c0-1.94 1.17-4.54 8-9 6.83 4.46 8 7.06 8 9 0 6.57-8 11-8 11z"
      />
      <path
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-5"
      />
    </svg>
  );
}

export function HeroTrustIllustration() {
  return (
    <div className="relative mx-auto hidden w-full max-w-md select-none lg:block" aria-hidden>
      {/* Soft logo-color glow */}
      <div className="pointer-events-none absolute -inset-12 bg-gradient-to-br from-cyan-400/25 via-blue-500/15 to-violet-500/25 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-8 h-44 w-44 rounded-full bg-gradient-to-tr from-cyan-300/30 to-transparent blur-2xl" />
      <div className="pointer-events-none absolute bottom-4 left-4 h-32 w-32 rounded-full bg-gradient-to-bl from-violet-400/25 to-transparent blur-2xl" />

      <div className="relative">
        {/* Decorative rings */}
        <div className="pointer-events-none absolute -right-6 -top-4 h-24 w-24 rounded-full border border-cyan-200/40" />
        <div className="pointer-events-none absolute -bottom-8 left-10 h-16 w-16 rounded-full border border-violet-200/35" />

        <div className="relative rounded-3xl border border-white/70 bg-white/65 p-6 shadow-elevated ring-1 ring-slate-200/40 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/15 via-blue-500/15 to-violet-500/20 text-blue-700 ring-1 ring-blue-200/40">
              <ShieldGlyph className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trust preview</p>
              <p className="text-lg font-bold tracking-tight text-slate-900">Safety signals</p>
            </div>
          </div>

          <div className="relative mt-5 rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-subtle backdrop-blur-sm">
            <div
              className="absolute -right-1 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-subtle shadow-emerald-500/25"
              aria-hidden
            >
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <span className="truncate text-sm font-semibold text-slate-700">preview.example.org</span>
              <span className="pill-trusted shrink-0">Trusted</span>
            </div>
            <p className="mt-3 bg-gradient-to-r from-cyan-600 via-blue-600 to-violet-600 bg-clip-text text-4xl font-black tabular-nums tracking-tight text-transparent">
              89<span className="text-lg font-semibold text-slate-400">/100</span>
            </p>
            <ul className="mt-3 space-y-1.5 text-xs font-medium text-slate-600">
              <li className="flex justify-between gap-2 border-t border-slate-100 pt-2">
                <span className="text-slate-500">Security</span>
                <span className="font-semibold text-emerald-700">Good</span>
              </li>
              <li className="flex justify-between gap-2">
                <span className="text-slate-500">Reputation</span>
                <span className="font-semibold text-blue-700">Positive</span>
              </li>
              <li className="flex justify-between gap-2">
                <span className="text-slate-500">Risk</span>
                <span className="font-semibold text-slate-800">Low</span>
              </li>
            </ul>
          </div>
          <p className="mt-4 text-center text-[11px] leading-snug text-slate-400">Illustrative preview — run a live check below.</p>
        </div>
      </div>
    </div>
  );
}
