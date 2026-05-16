export function CheckSummarySkeleton({ trustScore }: { trustScore?: number | null }) {
  return (
    <dl className="mt-8 grid gap-3 sm:grid-cols-3" aria-busy="true" aria-label="Loading check summary">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trust-style score</dt>
        <dd className="mt-1 text-2xl font-bold text-slate-900">
          {trustScore != null ? (
            `${trustScore} / 100`
          ) : (
            <span className="inline-block h-8 w-24 animate-pulse rounded bg-slate-200" />
          )}
        </dd>
      </div>
      <SkeletonCell label="Domain age" />
      <SkeletonCell label="Secure connection" />
    </dl>
  );
}

function SkeletonCell({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-2 h-7 w-3/4 max-w-[12rem] animate-pulse rounded bg-slate-200" />
    </div>
  );
}

export function CheckResultCardSkeleton() {
  return (
    <div
      className="mt-8 max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      aria-busy="true"
      aria-label="Loading full check result"
    >
      <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-200" />
      <div className="mt-6 space-y-3">
        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
      </div>
      <p className="mt-6 text-sm text-slate-500">Loading detailed signals…</p>
    </div>
  );
}
