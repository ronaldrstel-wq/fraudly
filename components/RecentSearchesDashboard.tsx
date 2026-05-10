"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CompactOverviewFeedArticleCard } from "@/components/overview/CompactOverviewFeedCard";
import { CLEAR_ALL_CONFIRM_BODY } from "@/lib/recent-search/constants";
import type { RecentSearchPublic } from "@/lib/recent-search/service";
import { formatPublicCheckRelativeTime } from "@/lib/latest-public-checks/relative-time";
import { EN_MESSAGES } from "@/lib/messages.en";
import { overviewFeedPrimaryLine } from "@/lib/overviewFeedDisplay";
import { buildOverviewFromTrustAndVerdict } from "@/lib/overviewCardPresentation";
import type { ScamVerdict } from "@/lib/trustSystem";

function fallbackScoreFromVerdict(verdict: string | null): number {
  if (verdict === "safe") return 85;
  if (verdict === "suspicious") return 55;
  if (verdict === "scam") return 25;
  return 50;
}

export function RecentSearchesDashboard({ initialItems }: { initialItems: RecentSearchPublic[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<RecentSearchPublic[]>(initialItems);
  const [loadError, setLoadError] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [clearBusy, setClearBusy] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    setRows(initialItems);
  }, [initialItems]);

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  async function removeRow(id: string) {
    setPendingId(id);
    try {
      const res = await fetch(`/api/recent-searches/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "same-origin"
      });
      if (!res.ok) throw new Error();
      setRows((prev) => prev.filter((r) => r.id !== id));
      refresh();
    } catch {
      setLoadError(true);
    } finally {
      setPendingId(null);
    }
  }

  async function clearAll() {
    setClearBusy(true);
    setLoadError(false);
    try {
      const res = await fetch("/api/recent-searches/clear", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: CLEAR_ALL_CONFIRM_BODY })
      });
      if (!res.ok) throw new Error();
      setRows([]);
      setShowClearModal(false);
      refresh();
    } catch {
      setLoadError(true);
    } finally {
      setClearBusy(false);
    }
  }

  return (
    <>
      <header className="text-center sm:text-left">
        <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          {EN_MESSAGES.recentSearches.pageTitle}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm text-slate-600 sm:mx-0 md:text-base">
          {EN_MESSAGES.recentSearches.pageIntroPrivatelyStored}
        </p>
      </header>

      {loadError ? (
        <p className="mt-4 text-center text-sm text-rose-600 sm:text-left">{EN_MESSAGES.recentSearches.loadError}</p>
      ) : null}

      {rows.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
            onClick={() => setShowClearModal(true)}
          >
            {EN_MESSAGES.recentSearches.clearAll}
          </button>
          <p className="text-xs text-slate-500">Private—you can delete snapshots anytime.</p>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-white/80 p-10 text-center shadow-sm">
          <p className="mx-auto max-w-lg text-pretty text-sm leading-relaxed text-slate-600">{EN_MESSAGES.recentSearches.emptyState}</p>
          <p className="mt-5 text-sm">
            <Link href="/#link-check" className="font-semibold text-blue-600 underline decoration-blue-600/30 underline-offset-2">
              Run a check
            </Link>
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-3 md:space-y-4">
          {rows.map((row) => {
            const entity =
              EN_MESSAGES.recentSearches.entityLabels[row.entityType as keyof typeof EN_MESSAGES.recentSearches.entityLabels] ??
              row.entityType;
            const busyRow = pendingId === row.id;
            const displayScore = row.trustScoreSnap ?? fallbackScoreFromVerdict(row.verdictSnap);
            const verdict = row.verdictSnap as ScamVerdict | null;
            const m = buildOverviewFromTrustAndVerdict(displayScore, verdict);
            const iso = row.createdAt;
            const primaryLine = overviewFeedPrimaryLine(row.originalQuery.trim());
            const domainFullTitle =
              row.normalizedQuery && row.normalizedQuery.trim() !== row.originalQuery.trim()
                ? `${row.originalQuery.trim()} · ${row.normalizedQuery.trim()}`
                : primaryLine.fullTitle;
            return (
              <CompactOverviewFeedArticleCard
                key={row.id}
                model={m}
                headlineId={`recent-search-headline-${row.id}`}
                domainLine={primaryLine.primary || row.originalQuery}
                domainFullTitle={domainFullTitle}
                href={row.resultPath}
                viewLabel={EN_MESSAGES.recentSearches.reopenResultArrow}
                timeIso={iso}
                timeRelative={formatPublicCheckRelativeTime(iso)}
                timeTitle={new Date(iso).toUTCString()}
                entityBadge={entity}
                trailingActions={
                  <button
                    type="button"
                    disabled={busyRow}
                    className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                    onClick={() => void removeRow(row.id)}
                  >
                    {busyRow ? EN_MESSAGES.recentSearches.clearing : EN_MESSAGES.recentSearches.deleteOne}
                  </button>
                }
              />
            );
          })}
        </div>
      )}

      {showClearModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            aria-label="Close dialog backdrop"
            onClick={() => (clearBusy ? null : setShowClearModal(false))}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="recent-clear-title"
            className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <h2 id="recent-clear-title" className="text-lg font-semibold text-slate-900">
              {EN_MESSAGES.recentSearches.clearModalTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{EN_MESSAGES.recentSearches.clearModalBody}</p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={clearBusy}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
                onClick={() => setShowClearModal(false)}
              >
                {EN_MESSAGES.recentSearches.clearModalCancel}
              </button>
              <button
                type="button"
                disabled={clearBusy}
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
                onClick={() => void clearAll()}
              >
                {clearBusy ? EN_MESSAGES.recentSearches.clearing : EN_MESSAGES.recentSearches.clearModalConfirm}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
