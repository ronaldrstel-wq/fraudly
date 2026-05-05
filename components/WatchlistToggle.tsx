"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import type { ScamVerdict } from "@/types/scam";
import { EN_MESSAGES } from "@/lib/messages.en";
import type { WatchlistItemTypeSlug } from "@/lib/watchlist/types";

export type WatchlistToggleProps = {
  itemType: WatchlistItemTypeSlug;
  /** Lookup value (e.g. hostname for domains). */
  rawKey: string;
  title: string;
  detailPath: string;
  trustScore: number | null;
  verdict: ScamVerdict;
  className?: string;
};

function EyeIcon({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
      aria-hidden
    >
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" fill={active ? "white" : "none"} stroke="currentColor" />
    </svg>
  );
}

export function WatchlistToggle({ itemType, rawKey, title, detailPath, trustScore, verdict, className = "" }: WatchlistToggleProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const [hydrated, setHydrated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [watched, setWatched] = useState(false);
  const [itemId, setItemId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!isLoaded || !hydrated) return;
    if (!isSignedIn || !rawKey.trim()) {
      setChecking(false);
      setWatched(false);
      setItemId(null);
      return;
    }

    let cancelled = false;
    setChecking(true);

    const q = new URLSearchParams({
      itemType,
      externalKey: rawKey.trim()
    });

    fetch(`/api/watchlist/check?${q.toString()}`)
      .then(async (r) => {
        const data = (await r.json()) as { watched?: boolean; id?: string | null };
        if (!cancelled) {
          setWatched(Boolean(data.watched));
          setItemId(typeof data.id === "string" ? data.id : null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(EN_MESSAGES.watchlist.loadError);
        }
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, itemType, rawKey, hydrated]);

  const toggleWatched = useCallback(async () => {
    if (!isSignedIn || busy) return;

    if (watched) {
      if (!itemId) {
        setError(EN_MESSAGES.watchlist.removeError);
        return;
      }
      setBusy(true);
      setError(null);
      setWatched(false);
      const prevId = itemId;
      setItemId(null);
      try {
        const res = await fetch(`/api/watchlist?id=${encodeURIComponent(prevId)}`, { method: "DELETE" });
        if (!res.ok) {
          throw new Error("remove_failed");
        }
      } catch {
        setWatched(true);
        setItemId(prevId);
        setError(EN_MESSAGES.watchlist.removeError);
      } finally {
        setBusy(false);
      }
      return;
    }

    setBusy(true);
    setError(null);
    setWatched(true);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType,
          rawKey: rawKey.trim(),
          title: title.trim().slice(0, 512),
          detailPath,
          trustScore,
          verdict
        })
      });

      const payload = (await res.json().catch(() => null)) as { item?: { id: string } | null } | null;

      if (!res.ok) {
        throw new Error("save_failed");
      }

      const newId = payload?.item?.id;
      if (typeof newId === "string") setItemId(newId);
    } catch {
      setWatched(false);
      setItemId(null);
      setError(EN_MESSAGES.watchlist.saveError);
    } finally {
      setBusy(false);
    }
  }, [busy, detailPath, isSignedIn, itemType, rawKey, title, trustScore, verdict, watched, itemId]);

  const baseClasses =
    "inline-flex max-w-full items-center justify-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:text-sm";

  if (!hydrated || !isLoaded) {
    return (
      <span
        className={`${baseClasses} border-slate-200 bg-slate-50 text-slate-400 ${className}`}
        aria-hidden
      >
        <span className="h-4 w-4 shrink-0 animate-pulse rounded bg-slate-200" />
        <span className="truncate">…</span>
      </span>
    );
  }

  const label = watched ? EN_MESSAGES.watchlist.watching : EN_MESSAGES.watchlist.addToWatchlist;
  const ariaBusy = checking || busy;

  if (!isSignedIn) {
    return (
      <div className={`flex flex-col items-stretch gap-1 sm:items-end ${className}`}>
        <SignInButton mode="modal">
          <button
            type="button"
            className={`${baseClasses} border-slate-200 bg-white text-slate-600 shadow-sm hover:border-slate-300 hover:bg-slate-50`}
            aria-label={`${EN_MESSAGES.watchlist.addToWatchlist} — ${EN_MESSAGES.watchlist.loginToManage}`}
          >
            <EyeIcon active={false} />
            <span className="truncate">{EN_MESSAGES.watchlist.signedOutWatchHint}</span>
          </button>
        </SignInButton>
        {error ? <p className="text-right text-xs text-rose-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-stretch gap-1 sm:items-end ${className}`}>
      <button
        type="button"
        disabled={checking || ariaBusy}
        aria-pressed={watched}
        aria-busy={ariaBusy}
        aria-label={
          watched
            ? `${EN_MESSAGES.watchlist.removeFromWatchlist} (${title})`
            : `${EN_MESSAGES.watchlist.addToWatchlist}: ${title}`
        }
        onClick={() => void toggleWatched()}
        className={`${baseClasses} ${
          watched
            ? "border-purple-300 bg-purple-50 text-purple-900 shadow-sm hover:border-purple-400"
            : "border-slate-200 bg-white text-slate-600 shadow-sm hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        <EyeIcon active={watched} />
        <span className="truncate">
          {checking ? "…" : watched ? EN_MESSAGES.watchlist.watching : EN_MESSAGES.watchlist.addToWatchlist}
        </span>
      </button>
      {error ? <p className="text-right text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
