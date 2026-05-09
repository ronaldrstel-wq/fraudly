"use client";

import type { TrustEvidenceSection } from "@/lib/evidence/types";

function impactBadge(level: TrustEvidenceSection["impactLevel"]): { label: string; className: string } {
  switch (level) {
    case "high":
      return { label: "Risk impact: High", className: "border-rose-200 bg-rose-50 text-rose-900" };
    case "medium":
      return { label: "Risk impact: Medium", className: "border-amber-200 bg-amber-50 text-amber-950" };
    default:
      return { label: "Risk impact: Low", className: "border-slate-200 bg-slate-50 text-slate-800" };
  }
}

function chipTone(sev: "low" | "medium" | "high"): string {
  switch (sev) {
    case "high":
      return "border-rose-200 bg-rose-50 text-rose-900";
    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-950";
    default:
      return "border-slate-200 bg-white text-slate-700";
  }
}

export function EvidenceSignalsCard({ section }: { section: TrustEvidenceSection }) {
  const badge = impactBadge(section.impactLevel);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900">{section.title}</h3>
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">{section.summary}</p>
      {section.signals.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {section.signals.map((s) => (
            <span
              key={s.id}
              title={s.explanation}
              className={`inline-flex max-w-full cursor-default truncate rounded-full border px-2.5 py-1 text-xs font-medium ${chipTone(s.severity)}`}
            >
              {s.label}
            </span>
          ))}
        </div>
      ) : null}
      {section.notes ? <p className="mt-2 text-xs text-slate-600">{section.notes}</p> : null}
      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        These signals do not prove fraud, but they can help you decide whether to trust the site.
      </p>
      {section.signals.length > 0 ? (
        <details className="mt-2">
          <summary className="cursor-pointer text-sm font-semibold text-blue-700 hover:text-blue-900">Details</summary>
          <ul className="mt-2 space-y-2 border-t border-slate-100 pt-2 text-sm text-slate-700">
            {section.signals.map((s) => (
              <li key={`d-${s.id}`} className="rounded-lg bg-slate-50/80 px-3 py-2">
                <p className="font-medium text-slate-900">{s.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{s.explanation}</p>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
