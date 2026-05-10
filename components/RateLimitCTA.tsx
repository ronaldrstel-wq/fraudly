"use client";

function LightningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5 14.25 2.25 12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

export function RateLimitCTA() {
  function scrollToCheck() {
    document.getElementById("link-check")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="rounded-2xl border border-amber-200/65 bg-gradient-to-br from-amber-50/90 via-white to-indigo-50/40 p-6 shadow-subtle shadow-amber-950/10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 shadow-sm ring-1 ring-amber-200/60"
          aria-hidden
        >
          <LightningIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold tracking-tight text-slate-900">
            You&apos;ve reached your free checks for today.
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Free website checks reset daily. When the Fraudly app launches, you&apos;ll be able to run checks faster
            from social links.
          </p>
          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={scrollToCheck}
              className="btn-secondary flex-1 border-slate-200/90 px-5 sm:flex-initial sm:min-w-[11rem]"
            >
              Try again tomorrow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
