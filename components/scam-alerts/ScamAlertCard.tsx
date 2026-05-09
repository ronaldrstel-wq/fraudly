import Link from "next/link";
import type { PublicScamAlertListItem } from "@/lib/scam-alerts/service";
import {
  clusterDomainKey,
  consumerAlertTitle,
  deriveAlertSeverity,
  formatRelativeTimeEn,
  whyThisMattersLine
} from "@/lib/scam-alerts/presentation";

type ScamAlertCardProps = {
  alert: PublicScamAlertListItem;
  now: Date;
  /** Shown when another card above shares the same normalized domain. */
  showRelatedHint?: boolean;
};

export function ScamAlertCard({ alert, now, showRelatedHint }: ScamAlertCardProps) {
  const severity = deriveAlertSeverity(alert, now);
  const title = consumerAlertTitle(alert);
  const why = whyThisMattersLine(alert);
  const published = alert.publishedAt ?? alert.lastSeenAt;
  const relative = formatRelativeTimeEn(published, now);
  const domainKey = clusterDomainKey(alert.domain);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4">
      {showRelatedHint && domainKey ? (
        <p className="mb-2 text-xs font-medium text-slate-500" role="note">
          Related alert · same domain
        </p>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <span
            className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${severity.badgeClass}`}
            title={severity.accessibleDescription}
            aria-label={severity.accessibleDescription}
          >
            <span className="sr-only">Severity: </span>
            {severity.badge}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
            {alert.scamType}
          </span>
        </div>
      </div>

      <h2 className="mt-2 text-base font-semibold leading-snug text-slate-900 sm:text-lg">{title}</h2>

      {domainKey ? (
        <p className="mt-1.5 font-mono text-xs text-slate-600">
          <span className="sr-only">Domain: </span>
          <span className="inline-block max-w-full truncate rounded-md bg-slate-100 px-2 py-0.5 text-slate-800 ring-1 ring-slate-200/80">
            {domainKey}
          </span>
        </p>
      ) : null}

      <p className="mt-2 text-sm leading-relaxed text-slate-700">{why}</p>

      <p className="mt-1.5 line-clamp-2 text-xs text-slate-600">{alert.summary}</p>

      <p className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
        <span>
          Source: <span className="font-medium text-slate-700">{alert.sourceName}</span>
        </span>
        <span>
          Updated{" "}
          <time dateTime={published.toISOString()} title={relative.title}>
            {relative.label}
          </time>
        </span>
      </p>

      <details className="mt-2.5 rounded-lg border border-slate-200 bg-slate-50/90 text-left text-sm text-slate-800 open:bg-slate-50">
        <summary className="cursor-pointer select-none px-3 py-2 font-medium text-slate-800 outline-none hover:bg-slate-100/80">
          Technical details
        </summary>
        <dl className="space-y-2 border-t border-slate-200 px-3 py-2.5 text-xs text-slate-700">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
            <dt className="shrink-0 font-semibold text-slate-800">Domain</dt>
            <dd className="min-w-0 break-all font-mono">{alert.domain ?? "—"}</dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
            <dt className="shrink-0 font-semibold text-slate-800">Source</dt>
            <dd className="min-w-0 break-words">
              {alert.sourceUrl ? (
                <a href={alert.sourceUrl} className="text-blue-700 underline-offset-2 hover:underline" target="_blank" rel="noreferrer">
                  {alert.sourceName}
                </a>
              ) : (
                alert.sourceName
              )}
            </dd>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <div>
              <dt className="font-semibold text-slate-800">Confidence</dt>
              <dd>{alert.confidence}%</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-800">Signals</dt>
              <dd>{alert.evidenceCount}</dd>
            </div>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
            <dt className="shrink-0 font-semibold text-slate-800">Published</dt>
            <dd title={published.toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" })}>
              {alert.publishedAt ? alert.publishedAt.toLocaleString("en-GB") : "—"}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
            <dt className="shrink-0 font-semibold text-slate-800">Raw type</dt>
            <dd className="break-words">{alert.scamType}</dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
            <dt className="shrink-0 font-semibold text-slate-800">Original title</dt>
            <dd className="break-words text-slate-600">{alert.title}</dd>
          </div>
        </dl>
      </details>

      <Link
        href={`/scam-alerts/${alert.slug}`}
        className="mt-2.5 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-900"
      >
        Read full alert →
      </Link>
    </article>
  );
}
