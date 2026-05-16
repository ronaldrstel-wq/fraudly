import { EN_MESSAGES } from "@/lib/messages.en";
import { DomainAgeMetricValue } from "@/components/check/DomainAgeMetricValue";
import { formatSslHighlightValue } from "@/lib/signals/trustHighlightFacts";
import type { ScamCheckResult } from "@/types/scam";

export function CheckSummaryDl({
  trustScore,
  result
}: {
  trustScore: number | null;
  result: ScamCheckResult;
}) {
  return (
    <dl className="mt-8 grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trust-style score</dt>
        <dd className="mt-1 text-2xl font-bold text-slate-900">
          {trustScore === null ? EN_MESSAGES.siteOutcome.suppressedTrustMeter : `${trustScore} / 100`}
        </dd>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Domain age</dt>
        <DomainAgeMetricValue domainIntelligence={result.domainIntelligence} />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Secure connection</dt>
        <dd className="mt-1 text-base font-semibold text-slate-900">{formatSslHighlightValue(result.ssl)}</dd>
      </div>
    </dl>
  );
}
