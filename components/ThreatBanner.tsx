import type { ReactNode } from "react";

type Variant = "critical" | "neutral";

function WarningGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C11.59 2 11.25 2.23 11.1 2.58L2.24 19.52C2.09 19.87 2.25 20.27 2.6 20.46C2.71 20.51 2.84 20.55 3 20.55H21C21.41 20.55 21.75 20.19 21.75 19.75C21.75 19.6 21.71 19.46 21.65 19.33L12.9 2.58C12.75 2.23 12.41 2 12 2ZM12 7C12.41 7 12.75 7.34 12.75 7.75V12.75C12.75 13.16 12.41 13.5 12 13.5C11.59 13.5 11.25 13.16 11.25 12.75V7.75C11.25 7.34 11.59 7 12 7ZM12 17C11.45 17 11 16.55 11 16C11 15.45 11.45 15 12 15C12.55 15 13 15.45 13 16C13 16.55 12.55 17 12 17Z" />
    </svg>
  );
}

/**
 * Prominent security-style banner for Tier‑1 threat overrides (`critical`)
 * or a calm contextual strip for limited public data (`neutral`).
 */
export function ThreatBanner({
  title,
  body,
  variant = "critical",
  footer
}: {
  title: string;
  body: string;
  variant?: Variant;
  footer?: ReactNode;
}) {
  if (variant === "critical") {
    return (
      <div
        className="relative overflow-hidden rounded-xl border-2 border-red-700 bg-gradient-to-br from-red-50 via-rose-50 to-rose-100 px-4 py-4 shadow-xl shadow-red-300/40 ring-2 ring-red-400/50"
        role="alert"
      >
        <div className="flex gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-700 text-white shadow-lg shadow-red-500/30">
            <WarningGlyph className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold leading-snug tracking-tight text-red-950">{title}</p>
            <p className="mt-1.5 text-sm font-medium leading-relaxed text-red-950/95">{body}</p>
            {footer ? <div className="mt-2">{footer}</div> : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-sm ring-1 ring-slate-100">
      <div className="flex gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200/80 text-slate-600">
          <WarningGlyph className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{body}</p>
          {footer ? <div className="mt-2">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
