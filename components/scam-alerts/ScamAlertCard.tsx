import Link from "next/link";
import type { PublicScamAlertListItem } from "@/lib/scam-alerts/service";
import {
  clusterDomainKey,
  consumerAlertTitle,
  deriveAlertSeverity,
  formatPublishedDateLongEn,
  formatRelativeTimeEn,
  whyThisMattersLine
} from "@/lib/scam-alerts/presentation";
import { EN_MESSAGES } from "@/lib/messages.en";
import { humanRecGlyph, humanRecHeadline, humanRecHeadlineTone } from "@/lib/scanResultDualLayer";
import { humanRecKindFromScamAlertType, isCriticalOverviewKind } from "@/lib/overviewCardPresentation";

type ScamAlertCardProps = {
  alert: PublicScamAlertListItem;
  now: Date;
  /** Shown when another card above shares the same normalized domain. */
  showRelatedHint?: boolean;
};

export function ScamAlertCard({ alert, now, showRelatedHint }: ScamAlertCardProps) {
  const severity = deriveAlertSeverity(alert, now);
  const humanKind = humanRecKindFromScamAlertType(alert.scamType);
  const humanHeadline = humanRecHeadline(humanKind);
  const humanTone = humanRecHeadlineTone(humanKind);
  const feedCritical = isCriticalOverviewKind(humanKind);
  const title = consumerAlertTitle(alert);
  const why = whyThisMattersLine(alert);
  const publishedAt = alert.publishedAt;
  const publishedLong = publishedAt ? formatPublishedDateLongEn(publishedAt) : null;
  const publishedRelative = publishedAt ? formatRelativeTimeEn(publishedAt, now) : null;
  const lastSeenRelative = formatRelativeTimeEn(alert.lastSeenAt, now);
  const domainKey = clusterDomainKey(alert.domain);

  return (
    <article
      className={`fraudly-motion flex flex-col overflow-hidden rounded-2xl border p-4 shadow-subtle sm:p-5 ${
        feedCritical
          ? "border-red-600/95 bg-gradient-to-b from-red-50/90 to-white ring-1 ring-red-300/35 hover:shadow-elevated"
          : "border-slate-200/85 bg-white hover:border-slate-300/90 hover:shadow-elevated"
      }`}
    >
      {showRelatedHint && domainKey ? (
        <p className="mb-2 text-xs font-medium text-slate-500" role="note">
          Related alert · same domain
        </p>
      ) : null}

      <div
        className={`mb-2 flex items-start gap-2.5 rounded-lg border px-3 py-2 ${
          feedCritical ? "border-red-200 bg-white/70" : "border-slate-200 bg-slate-50/90"
        }`}
      >
        <span className={`select-none text-xl leading-none ${humanTone.icon}`} aria-hidden>
          {humanRecGlyph(humanKind)}
        </span>
        <div className="min-w-0">
          <p className={`text-base font-bold leading-tight md:text-[17px] ${humanTone.text}`}>{humanHeadline}</p>
          <p className="mt-0.5 text-[13px] font-medium text-slate-700">
            {EN_MESSAGES.scanResult.technicalStatusHeading}: {severity.label}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <span
            className={`inline-flex max-w-full shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${severity.badgeClass}`}
            title={severity.accessibleDescription}
            aria-label={severity.accessibleDescription}
          >
            <span className="sr-only">Severity: </span>
            <span className="truncate">{severity.badge}</span>
          </span>
          <span className="max-w-full truncate rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
            {alert.scamType}
          </span>
        </div>
      </div>

      <h2 className="mt-2 line-clamp-3 text-[17px] font-semibold leading-snug tracking-tight text-slate-900 sm:text-lg">
        {title}
      </h2>

      {domainKey ? (
        <p className="mt-2 min-w-0 max-w-full font-mono text-xs leading-snug text-slate-600">
          <span className="sr-only">Domain: </span>
          <span
            className="block max-w-full rounded-md bg-slate-100 px-2 py-1 font-mono text-xs leading-snug break-all text-slate-800 ring-1 ring-slate-200/80 line-clamp-2 sm:line-clamp-1 sm:truncate sm:break-normal"
            title={domainKey}
          >
            {domainKey}
          </span>
        </p>
      ) : null}

      <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-slate-600 sm:line-clamp-3">{why}</p>

      <p className="mt-1.5 line-clamp-4 text-xs leading-relaxed text-slate-500 sm:line-clamp-3">{alert.summary}</p>

      <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <p className="break-words">
          <span className="font-medium text-slate-500">Source</span>{" "}
          <span className="font-semibold text-slate-800">{alert.sourceName}</span>
        </p>
        {publishedAt && publishedLong ? (
          <p className="break-words">
            <span className="font-medium text-slate-500">Published</span>{" "}
            <time className="font-semibold text-slate-800" dateTime={publishedAt.toISOString()} title={publishedRelative?.title}>
              {publishedLong}
            </time>
            {publishedRelative ? (
              <span className="font-normal text-slate-500" title={publishedRelative.title}>
                {" "}
                · {publishedRelative.label}
              </span>
            ) : null}
          </p>
        ) : (
          <p className="text-slate-500">
            <span className="font-medium">Published</span> —
          </p>
        )}
        <p className="break-words text-slate-500">
          <span className="font-medium text-slate-500">Updated</span>{" "}
          <time dateTime={alert.lastSeenAt.toISOString()} title={lastSeenRelative.title}>
            {lastSeenRelative.label}
          </time>
        </p>
      </div>

      <details className="mt-3 min-w-0 flex-shrink-0 rounded-lg border border-slate-200 bg-slate-50/90 text-left text-sm text-slate-800 open:bg-slate-50">
        <summary className="cursor-pointer select-none px-3 py-2.5 text-sm font-medium text-slate-800 outline-none hover:bg-slate-100/80">
          Technical details
        </summary>
        <dl className="max-w-full space-y-2 overflow-x-hidden border-t border-slate-200 px-3 py-3 text-xs text-slate-700">
          <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:gap-2">
            <dt className="shrink-0 font-semibold text-slate-800">Domain</dt>
            <dd className="min-w-0 whitespace-pre-wrap break-all font-mono">{alert.domain ?? "—"}</dd>
          </div>
          {alert.url ? (
            <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:gap-2">
              <dt className="shrink-0 font-semibold text-slate-800">URL</dt>
              <dd className="min-w-0 whitespace-pre-wrap break-all font-mono">
                <a href={alert.url} className="text-blue-700 underline-offset-2 hover:underline" target="_blank" rel="noreferrer">
                  {alert.url}
                </a>
              </dd>
            </div>
          ) : null}
          <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:gap-2">
            <dt className="shrink-0 font-semibold text-slate-800">Source</dt>
            <dd className="min-w-0 break-words">
              {alert.sourceUrl ? (
                <a href={alert.sourceUrl} className="break-all text-blue-700 underline-offset-2 hover:underline" target="_blank" rel="noreferrer">
                  {alert.sourceName}
                </a>
              ) : (
                alert.sourceName
              )}
            </dd>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <div>
              <dt className="font-semibold text-slate-800">{EN_MESSAGES.scamAlertsUi.technicalMatchStrength}</dt>
              <dd>{alert.confidence}%</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-800">{EN_MESSAGES.scamAlertsUi.technicalSignals}</dt>
              <dd>{alert.evidenceCount}</dd>
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:gap-2">
            <dt className="shrink-0 font-semibold text-slate-800">Published (exact)</dt>
            <dd className="min-w-0 whitespace-pre-wrap break-all">
              {alert.publishedAt ? (
                <time dateTime={alert.publishedAt.toISOString()} title={alert.publishedAt.toISOString()}>
                  {alert.publishedAt.toLocaleString("en-GB", { dateStyle: "full", timeStyle: "medium" })}
                </time>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:gap-2">
            <dt className="shrink-0 font-semibold text-slate-800">Raw type</dt>
            <dd className="min-w-0 break-all">{alert.scamType}</dd>
          </div>
          <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:gap-2">
            <dt className="shrink-0 font-semibold text-slate-800">Original title</dt>
            <dd className="min-w-0 whitespace-pre-wrap break-words text-slate-600">{alert.title}</dd>
          </div>
        </dl>
      </details>

      <div className="mt-auto border-t border-transparent pt-3">
        <Link
          href={`/scam-alerts/${alert.slug}`}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-blue-700 transition-colors hover:text-blue-900"
        >
          Read full alert →
        </Link>
      </div>
    </article>
  );
}
