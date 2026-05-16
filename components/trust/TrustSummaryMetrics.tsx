import { EN_MESSAGES } from "@/lib/messages.en";
import type { NormalizedTrustResult } from "@/lib/trust/types";

type TrustSummaryMetricsProps = {
  normalized: NormalizedTrustResult;
  variant?: "check" | "domain";
};

/** Shared trust-style score / domain age / SSL row — driven only by {@link NormalizedTrustResult}. */
export function TrustSummaryMetrics({ normalized, variant = "check" }: TrustSummaryMetricsProps) {
  const trustLabel =
    normalized.trustScore == null ? EN_MESSAGES.siteOutcome.suppressedTrustMeter : `${normalized.trustScore} / 100`;

  const cardClass =
    variant === "domain"
      ? "rounded-2xl border border-slate-200/85 bg-white p-4 shadow-subtle"
      : "rounded-xl border border-slate-200 bg-white p-4 shadow-sm";

  return (
    <dl className="mt-8 grid gap-3 sm:grid-cols-3">
      <div className={cardClass}>
        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trust-style score</dt>
        <dd className="mt-1 text-2xl font-bold text-slate-900">{trustLabel}</dd>
      </div>
      <div className={cardClass}>
        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Domain age</dt>
        <dd className="mt-1 text-lg font-bold leading-snug text-slate-900">{normalized.domainAge.display}</dd>
      </div>
      <div className={cardClass}>
        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Secure connection</dt>
        <dd className="mt-1 text-base font-semibold text-slate-900">{normalized.ssl.display}</dd>
      </div>
    </dl>
  );
}
