"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { RecentSearchCard } from "@/components/recent/RecentSearchCard";
import { CLEAR_ALL_CONFIRM_BODY } from "@/lib/recent-search/constants";
import type { RecentSearchPublic } from "@/lib/recent-search/service";
import { useLocale } from "@/components/i18n/LocaleProvider";

export function RecentSearchesDashboard({ initialItems }: { initialItems: RecentSearchPublic[] }) {
  const { dict } = useLocale();
  const ui = dict.recentSearchesUi;
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
          {ui.pageTitle}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm text-slate-600 sm:mx-0 md:text-base">
          {ui.pageIntroPrivatelyStored}
        </p>
      </header>

      {loadError ? (
        <p className="mt-4 text-center text-sm text-rose-600 sm:text-left">{ui.loadError}</p>
      ) : null}

      {rows.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            className="fraudly-focus-on-white inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-subtle hover:bg-slate-50"
            onClick={() => setShowClearModal(true)}
          >
            {ui.clearAll}
          </button>
          <p className="text-xs text-slate-500">{ui.privateDeleteNote}</p>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-white/90 p-8 text-center shadow-subtle sm:p-10">
          <p className="mx-auto max-w-lg text-pretty text-sm leading-relaxed text-slate-600">{ui.emptyState}</p>
          <p className="mt-5 text-sm">
            <Link href="/#link-check" className="font-semibold text-blue-600 underline decoration-blue-600/30 underline-offset-2">
              {ui.emptyStateCta}
            </Link>
          </p>
        </div>
      ) : (
        <ol className="mt-8 list-none space-y-3 md:space-y-4">
          {rows.map((row) => (
            <li key={row.id}>
              <RecentSearchCard row={row} busy={pendingId === row.id} onDelete={() => void removeRow(row.id)} />
            </li>
          ))}
        </ol>
      )}

      {showClearModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            aria-label="Close dialog backdrop"
            onClick={() => (clearBusy ? null : setShowClearModal(false))}
          />
          <div role="dialog" aria-modal="true" aria-labelledby="recent-clear-title" className="fraudly-modal">
            <h2 id="recent-clear-title" className="text-lg font-semibold text-slate-900">
              {ui.clearModalTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{ui.clearModalBody}</p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={clearBusy}
                className="btn-secondary px-5 disabled:opacity-50"
                onClick={() => setShowClearModal(false)}
              >
                {ui.clearModalCancel}
              </button>
              <button
                type="button"
                disabled={clearBusy}
                className="btn-danger px-5 disabled:opacity-50"
                onClick={() => void clearAll()}
              >
                {clearBusy ? ui.clearing : ui.clearModalConfirm}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
