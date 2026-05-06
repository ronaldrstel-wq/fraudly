"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { EN_MESSAGES } from "@/lib/messages.en";
import type { WatchlistApiItem } from "@/lib/watchlist/types";

function formatVerdictSentence(verdict: string | null): string {
  if (!verdict) return "—";
  const v = verdict as keyof typeof EN_MESSAGES.watchlist.verdictLabels;
  const label = EN_MESSAGES.watchlist.verdictLabels[v];
  return label ?? verdict;
}

function formatAdded(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en", { dateStyle: "medium" });
  } catch {
    return "—";
  }
}

export function WatchlistDashboard({
  initialItems,
  signedIn
}: {
  initialItems: WatchlistApiItem[];
  signedIn: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<WatchlistApiItem[]>(initialItems);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const refetchList = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  const sorted = useMemo(
    () => [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [items]
  );

  async function remove(id: string) {
    setRemoveError(null);
    const snapshot = items;
    setItems((prev) => prev.filter((x) => x.id !== id));
    setRemovingId(id);
    try {
      const res = await fetch(`/api/watchlist?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "same-origin"
      });
      if (!res.ok) {
        throw new Error("fail");
      }
      refetchList();
    } catch {
      setItems(snapshot);
      setRemoveError(EN_MESSAGES.watchlist.removeError);
    } finally {
      setRemovingId(null);
    }
  }

  if (!signedIn) {
    return (
      <>
        <header className="text-center sm:text-left">
          <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{EN_MESSAGES.watchlist.pageTitle}</h1>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-sm text-slate-600 sm:mx-0 md:text-base">{EN_MESSAGES.watchlist.pageIntro}</p>
        </header>
        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-slate-700">{EN_MESSAGES.watchlist.loginToView}</p>
          <p className="mt-4 text-sm text-slate-500">
            <Link href="/sign-in" className="font-semibold text-blue-600 underline decoration-blue-600/30 underline-offset-2">
              {EN_MESSAGES.auth.loginCta}
            </Link>{" "}
            ·{" "}
            <Link href="/sign-up" className="font-semibold text-blue-600 underline decoration-blue-600/30 underline-offset-2">
              {EN_MESSAGES.auth.signUpCta}
            </Link>
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <header className="text-center sm:text-left">
        <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{EN_MESSAGES.watchlist.pageTitle}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm text-slate-600 sm:mx-0 md:text-base">{EN_MESSAGES.watchlist.pageIntro}</p>
      </header>

      {removeError ? <p className="mt-4 text-center text-sm text-rose-600 sm:text-left">{removeError}</p> : null}

      {isPending ? (
        <p className="mt-6 text-center text-xs text-slate-500 sm:text-left" role="status" aria-live="polite">
          {EN_MESSAGES.watchlist.updatingList}
        </p>
      ) : null}

      {sorted.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-white/80 p-10 text-center shadow-sm">
          <p className="mx-auto max-w-md text-pretty text-sm leading-relaxed text-slate-600">{EN_MESSAGES.watchlist.emptyState}</p>
          <p className="mt-5 text-sm">
            <Link href="/#link-check" className="font-semibold text-blue-600 underline decoration-blue-600/30 underline-offset-2">
              Check a website
            </Link>
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          <div className="hidden md:grid md:grid-cols-[minmax(0,1.35fr)_0.55fr_1fr_0.65fr_auto_auto] md:gap-3 md:rounded-lg md:bg-slate-100/80 md:px-4 md:py-2 md:text-xs md:font-semibold md:uppercase md:tracking-wide md:text-slate-500">
            <span>{EN_MESSAGES.watchlist.columns.item}</span>
            <span>{EN_MESSAGES.watchlist.columns.type}</span>
            <span>{EN_MESSAGES.watchlist.columns.status}</span>
            <span>{EN_MESSAGES.watchlist.columns.added}</span>
            <span className="text-right">{EN_MESSAGES.watchlist.openItem}</span>
            <span className="text-right">{EN_MESSAGES.watchlist.columns.actions}</span>
          </div>

          {sorted.map((row) => {
            const typeLabel = EN_MESSAGES.watchlist.itemTypeLabels[row.itemType];
            const busy = removingId === row.id;
            return (
              <article
                key={row.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid md:grid-cols-[minmax(0,1.35fr)_0.55fr_1fr_0.65fr_auto_auto] md:items-center md:gap-3 md:rounded-xl md:p-4"
              >
                <div className="min-w-0 md:pr-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 md:hidden">{EN_MESSAGES.watchlist.columns.item}</p>
                  <p className="mt-0.5 break-words text-sm font-semibold text-slate-900 md:mt-0">{row.title}</p>
                </div>
                <div className="mt-3 md:mt-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 md:hidden">{EN_MESSAGES.watchlist.columns.type}</p>
                  <p className="mt-0.5 text-sm text-slate-800 md:mt-0">{typeLabel}</p>
                </div>
                <div className="mt-3 md:mt-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 md:hidden">
                    {EN_MESSAGES.watchlist.columns.status}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-800 md:mt-0">
                    {row.trustScore !== null ? (
                      <>
                        <span className="font-semibold tabular-nums">{row.trustScore}</span>/100 trust-style ·{" "}
                        {formatVerdictSentence(row.verdict)}
                      </>
                    ) : (
                      <span>{formatVerdictSentence(row.verdict)}</span>
                    )}
                  </p>
                </div>
                <div className="mt-3 md:mt-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 md:hidden">{EN_MESSAGES.watchlist.columns.added}</p>
                  <p className="mt-0.5 text-sm text-slate-600 md:mt-0">{formatAdded(row.createdAt)}</p>
                </div>
                <div className="mt-3 flex justify-end md:mt-0 md:justify-end">
                  <Link
                    href={row.detailPath}
                    className="inline-flex rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1.5 text-xs font-semibold text-blue-800 transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    {EN_MESSAGES.watchlist.openItem}
                  </Link>
                </div>
                <div className="mt-3 flex justify-end border-t border-slate-100 pt-3 md:mt-0 md:border-t-0 md:pt-0">
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={busy}
                    onClick={() => void remove(row.id)}
                    aria-label={`${EN_MESSAGES.watchlist.removeFromWatchlist}: ${row.title}`}
                  >
                    {busy ? EN_MESSAGES.watchlist.stateLoading : EN_MESSAGES.watchlist.removeFromWatchlist}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
