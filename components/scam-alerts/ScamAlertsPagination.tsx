import Link from "next/link";
import type { ListFilterKey } from "@/lib/scam-alerts/presentation";
import type { ScamAlertsTimeWindow } from "@/lib/scam-alerts/service";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizedScamAlertsHref } from "@/lib/i18n/scam-alerts-path";
import type { Locale } from "@/lib/i18n/locales";

type Props = {
  locale: Locale;
  filter: ListFilterKey;
  time: ScamAlertsTimeWindow;
  selectedType: string;
  page: number;
  maxPage: number;
};

export function ScamAlertsPagination({ locale, filter, time, selectedType, page, maxPage }: Props) {
  const { scamAlertsPage: ui } = getDictionary(locale);
  if (maxPage <= 1) return null;

  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < maxPage ? page + 1 : null;

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6" aria-label="Pagination">
      <div>
        {prevPage ? (
          <Link
            rel="prev"
            href={localizedScamAlertsHref({ locale, time, filter, type: selectedType, page: prevPage })}
            scroll={false}
            className="btn-secondary border-slate-200/90 px-4 py-2"
          >
            ← {ui.pagination.prev}
          </Link>
        ) : (
          <span className="inline-flex min-h-11 cursor-not-allowed items-center rounded-xl border border-slate-100 bg-slate-50/90 px-4 py-2 text-sm font-semibold text-slate-400">
            ← {ui.pagination.prevDisabled}
          </span>
        )}
      </div>
      <p className="text-sm text-slate-600">
        {ui.pagination.page} <span className="font-semibold text-slate-900">{page}</span> /{" "}
        <span className="font-semibold text-slate-900">{maxPage}</span>
      </p>
      <div>
        {nextPage ? (
          <Link
            rel="next"
            href={localizedScamAlertsHref({ locale, time, filter, type: selectedType, page: nextPage })}
            scroll={false}
            className="btn-secondary border-slate-200/90 px-4 py-2"
          >
            {ui.pagination.next} →
          </Link>
        ) : (
          <span className="inline-flex min-h-11 cursor-not-allowed items-center rounded-xl border border-slate-100 bg-slate-50/90 px-4 py-2 text-sm font-semibold text-slate-400">
            {ui.pagination.nextDisabled} →
          </span>
        )}
      </div>
    </nav>
  );
}
