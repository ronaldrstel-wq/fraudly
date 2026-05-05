function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 1.5H8A2.25 2.25 0 0 0 5.75 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h8a2.25 2.25 0 0 0 2.25-2.25V3.75A2.25 2.25 0 0 0 16 1.5h-2.25M10.5 1.5v3.75M10.5 18.75v.75"
      />
    </svg>
  );
}

export function PostScanAppPromo() {
  return (
    <div className="rounded-xl border border-slate-200/90 bg-gradient-to-br from-slate-50 to-white p-5 shadow-md shadow-slate-200/40 transition hover:shadow-lg hover:shadow-slate-200/50">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200/80"
          aria-hidden
        >
          <PhoneIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-slate-900">Check links faster next time</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            The Fraudly iOS app (coming soon) will help you run website checks straight from TikTok or Instagram links.
          </p>
          <a
            href="#"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Download the app
          </a>
        </div>
      </div>
    </div>
  );
}
