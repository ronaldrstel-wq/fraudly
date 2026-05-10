"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CLEAR_ALL_CONFIRM_BODY } from "@/lib/recent-search/constants";
import type { RecentSearchPublic } from "@/lib/recent-search/service";
import { EN_MESSAGES } from "@/lib/messages.en";
import { buildOverviewFromTrustAndVerdict } from "@/lib/overviewCardPresentation";
import type { ScamVerdict } from "@/lib/trustSystem";

function formatSearched(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  } catch {
    return "—";
  }
}

function normalizeScore(score: number): number {
  return Math.max(0, Math.min(100, Number(score) || 0));
}

function getScoreColor(score: number): string {
  const normalized = normalizeScore(score);
  if (normalized >= 90) return "#22c55e";
  if (normalized >= 70) return "#0d9488";
  if (normalized >= 40) return "#64748b";
  if (normalized >= 20) return "#f97316";
  return "#ef4444";
}

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
        <div className="mt-8 space-y-3">
          <div className="hidden lg:grid lg:grid-cols-[minmax(0,1.2fr)_0.45fr_0.38fr_minmax(0,1.15fr)_minmax(0,0.85fr)_auto] lg:gap-3 lg:rounded-lg lg:bg-slate-100/80 lg:px-4 lg:py-2 lg:text-[11px] lg:font-semibold lg:uppercase lg:tracking-wide lg:text-slate-500">
            <span>{EN_MESSAGES.recentSearches.columns.status}</span>
            <span>{EN_MESSAGES.recentSearches.columns.entity}</span>
            <span>{EN_MESSAGES.recentSearches.columns.score}</span>
            <span>{EN_MESSAGES.recentSearches.columns.query}</span>
            <span>{EN_MESSAGES.recentSearches.columns.searchedAt}</span>
            <span className="text-right">Actions</span>
          </div>

          {rows.map((row) => {
            const entity =
              EN_MESSAGES.recentSearches.entityLabels[row.entityType as keyof typeof EN_MESSAGES.recentSearches.entityLabels] ??
              row.entityType;
            const busyRow = pendingId === row.id;
            const displayScore = row.trustScoreSnap ?? fallbackScoreFromVerdict(row.verdictSnap);
            const verdict = row.verdictSnap as ScamVerdict | null;
            const m = buildOverviewFromTrustAndVerdict(displayScore, verdict);
            const normalizedScore = normalizeScore(m.trustScore);
            const fillColor = getScoreColor(normalizedScore);
            return (
              <article
                key={row.id}
                className={`rounded-2xl p-4 shadow-sm lg:grid lg:grid-cols-[minmax(0,1.2fr)_0.45fr_0.38fr_minmax(0,1.15fr)_minmax(0,0.85fr)_auto] lg:items-start lg:gap-3 lg:p-4 ${m.articleClass}`}
              >
                <div className="min-w-0 lg:pr-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 lg:hidden">
                    {EN_MESSAGES.recentSearches.columns.status}
                  </p>
                  <div className="mt-1 flex flex-wrap items-start gap-2">
                    <span className={`select-none text-xl ${m.tone.icon}`} aria-hidden>
                      {m.glyph}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-sm font-bold leading-snug sm:text-base ${m.tone.text}`}>{m.headline}</p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-700">{m.technicalLabel}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{m.oneLiner}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 lg:mt-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 lg:hidden">
                    {EN_MESSAGES.recentSearches.columns.entity}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-800">{entity}</p>
                </div>
                <div className="mt-3 lg:mt-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 lg:hidden">
                    {EN_MESSAGES.recentSearches.columns.score}
                  </p>
                  <p className="mt-0.5 text-xs tabular-nums text-slate-500">
                    <span className={m.isCritical ? "font-medium text-slate-600" : "font-semibold text-slate-700"}>
                      {m.trustScore}
                    </span>
                    <span className="text-slate-400"> / 100</span>
                  </p>
                </div>
                <div className="mt-3 min-w-0 lg:mt-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 lg:hidden">
                    {EN_MESSAGES.recentSearches.columns.query}
                  </p>
                  <p className="mt-0.5 break-all font-medium text-slate-900">{row.originalQuery}</p>
                  <p className="mt-1 truncate text-[11px] text-slate-500">{row.normalizedQuery}</p>
                </div>
                <div className="mt-3 lg:mt-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 lg:hidden">
                    {EN_MESSAGES.recentSearches.columns.searchedAt}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-600">{formatSearched(row.createdAt)}</p>
                </div>
                <div className="mt-3 lg:col-span-6 lg:mt-2">
                  <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200/85">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${normalizedScore}%`,
                        backgroundColor: fillColor
                      }}
                    />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 pt-1 lg:col-span-6 lg:mt-0 lg:justify-self-end lg:pt-0">
                  <Link
                    href={row.resultPath}
                    className="inline-flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-center text-xs font-semibold text-white shadow-md hover:brightness-110 sm:flex-none lg:min-w-[7.5rem]"
                  >
                    {EN_MESSAGES.recentSearches.reopenResult}
                  </Link>
                  <button
                    type="button"
                    disabled={busyRow}
                    className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:flex-none lg:min-w-[7rem]"
                    onClick={() => void removeRow(row.id)}
                  >
                    {busyRow ? EN_MESSAGES.recentSearches.clearing : EN_MESSAGES.recentSearches.deleteOne}
                  </button>
                </div>
              </article>
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
